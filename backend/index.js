const express = require("express");
const app = express();
const mongoose = require('mongoose');
const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
const sha256 = require('js-sha256');
const cors = require('cors');

//authentication
const Admin = require('./models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Middleware setup
app.use(cors());
app.use(express.json());


// EJS setup
app.set('view engine', 'ejs');
app.set('views', './views');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/studentResults')
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });

// Model import
const Result = require('./models/result.js');

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  jwt.verify(token, 'secret_key', (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.adminId = decoded.adminId;
    next();
  });
};

// Submit result and generate PDF
app.post('/submit-result',verifyToken, async (req, res) => {
  try {
    const rollNo = req.body.rollNo.trim().toUpperCase();
    const studentName = req.body.studentName.trim();
    const semester = parseInt(req.body.semester);
    const subjects = req.body.subjects;
    const photo = req.body.photo;

    const existing = await Result.findOne({ rollNo, semester });
    if (existing) {
      return res.status(409).json({
        message: 'Result already exists for this student and semester.'
      });
    }

    const student = new Result({rollNo,studentName,semester,subjects,photo});
    

    // Render EJS to HTML
    const html = await ejs.renderFile(path.join(__dirname, 'views', 'result.ejs'), {
      student,
      universityName: 'Your University Name'
    });

    // Generate PDF
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    // Generate PDF hash
    const pdfHash = sha256(pdfBuffer);
    student.pdfHash = pdfHash;

    await student.save();
    

    // Save PDF locally
    const filePath = path.join(__dirname, `results/result-${student._id}.pdf`);
    fs.writeFileSync(filePath, pdfBuffer);

    // Respond to client
    res.status(200).json({
      message: 'Result saved and PDF + hash generated successfully',
      studentId: student._id,
      hash: pdfHash
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating PDF');
  }
});

// View HTML result
app.get('/student/:id/result', async (req, res) => {
  try {
    const student = await Result.findById(req.params.id);
    if (!student) return res.status(404).send('Student not found');

    res.render('result', {
      student,
      universityName: 'Your University Name'
    });
  } catch (err) {
    res.status(500).send('Error loading result');
  }
});

// Download PDF
app.get('/download-pdf/:id', async (req, res) => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const resultUrl = `http://localhost:3000/student/${req.params.id}/result`;
    await page.goto(resultUrl, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true
    });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="result-${req.params.id}.pdf"`,
    });

    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF generation failed:', err);
    res.status(500).send('Failed to generate PDF');
  }
});

// Search student by name and roll number
app.post('/find-student', async (req, res) => {
  try {
    const rollNo = req.body.rollNo.trim().toUpperCase();
    const studentName = req.body.studentName.trim();

    const student = await Result.findOne({
      rollNo,
      studentName: { $regex: new RegExp(studentName, 'i') }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.status(200).json({ studentId: student._id });
  } catch (err) {
    console.error("Error in /find-student:", err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start server
app.listen(3000, () => {
  console.log('app is listening at port 3000');
});

//Auntentication reister and login route
app.post('/register', async (req, res) => {
  const { email, password } = req.body;

  const existing = await Admin.findOne({ email });
  if (existing) return res.status(409).json({ message: 'Admin already exists' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const newAdmin = new Admin({ email, password: hashedPassword });

  await newAdmin.save();
  res.status(201).json({ message: 'Admin registered' });
});

// Login route
const loginAttempts = {};
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Initialize if not exists
  if (!loginAttempts[email]) {
    loginAttempts[email] = { count: 0, lastAttempt: Date.now() };
  }

  // Check if attempts exceeded
  if (loginAttempts[email].count >= 3) {
    // console.log("too many attempts");
    return res.status(429).json({ message: 'Too many failed attempts. Try again later.' });
  }

  const admin = await Admin.findOne({ email });
  if (!admin){
    loginAttempts[email].count += 1;
    return res.status(401).json({ message: 'Invalid credentials' });
  } 

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch){
    loginAttempts[email].count += 1;
    return res.status(401).json({ message: 'Invalid credentials' });
  } 

   // ✅ Success: reset counter
  loginAttempts[email].count = 0;

  const token = jwt.sign({ adminId: admin._id }, 'secret_key', { expiresIn: '1h' });

  res.status(200).json({ token });
  
});