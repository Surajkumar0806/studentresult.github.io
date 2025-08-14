const mongoose = require('mongoose');


const ResultSchema = new mongoose.Schema({
  studentName: String,
  rollNo: String,
  semester: Number,
  photo: String,
 
  subjects: [
    {
      code: String,
      name: String,
      internalMarks: Number,
      externalMarks: Number,
    }
  ],
  
});

const Result = mongoose.model('Result', ResultSchema);
module.exports = Result;
