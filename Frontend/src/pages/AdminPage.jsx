import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPage.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

const AdminPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const [formData, setFormData] = useState({
    studentName: '',
    rollNo: '',
    semester: '',
    photo: '',
    subjects: [
      { code: '', name: '', internalMarks: '', externalMarks: '' }
    ],
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e, index = null) => {
    if (index !== null) {
      const newSubjects = [...formData.subjects];
      newSubjects[index][e.target.name] = e.target.value;
      setFormData({ ...formData, subjects: newSubjects });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const addSubject = () => {
    setFormData({
      ...formData,
      subjects: [...formData.subjects, { code: '', name: '', internalMarks: '', externalMarks: '' }]
    });
  };

  // ✅ Form validation
  const validateForm = () => {
    const errors = {};

    if (!formData.studentName.trim()) {
      errors.studentName = "Name is required";
    }

    if (!formData.rollNo.trim()) {
      errors.rollNo = "Roll number is required";
    } else if (!/^[A-Z0-9]+$/i.test(formData.rollNo)) {
      errors.rollNo = "Invalid roll number format";
    }

    if (!formData.semester || isNaN(formData.semester) || formData.semester < 1 || formData.semester > 8) {
      errors.semester = "Enter a valid semester (1–8)";
    }

    if (!formData.photo.trim()) {
      errors.photo = "Photo URL is required";
    }

    formData.subjects.forEach((subject, index) => {
      if (!subject.code.trim()) {
        errors[`subjectCode-${index}`] = "Code required";
      }
      if (!subject.name.trim()) {
        errors[`subjectName-${index}`] = "Name required";
      }
      if (subject.internalMarks === '' || isNaN(subject.internalMarks) || subject.internalMarks < 0 || subject.internalMarks > 50) {
        errors[`internalMarks-${index}`] = "0–50 only";
      }
      if (subject.externalMarks === '' || isNaN(subject.externalMarks) || subject.externalMarks < 0 || subject.externalMarks > 50) {
        errors[`externalMarks-${index}`] = "0–50 only";
      }
    });

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem("token");

    try {
      const res = await axios.post('http://localhost:3000/submit-result', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Result submitted successfully!');
      setFormData({
        studentName: '',
        rollNo: '',
        semester: '',
        photo: '',
        subjects: [{ code: '', name: '', internalMarks: '', externalMarks: '' }]
      });
      setErrors({});
    } catch (error) {
      toast.error('Result exists for a same Roll no');
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = Object.keys(validateForm()).length === 0;

  return (
    <>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px',
        backgroundColor: '#1e1e2f',
        color: 'white'
      }}>
        <button onClick={handleLogout} style={{
          padding: '8px 16px',
          backgroundColor: '#ff4d4d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          Logout
        </button>
        <h3 style={{ margin: 0 }}>Admin Dashboard</h3>
      </div>

      <div className="admin-page-wrapper">
        <div className="admin-container">
          <h2>Admin Panel: Enter Student Result</h2>
          <form onSubmit={handleSubmit}>
            <input name="studentName" placeholder="Student Name" value={formData.studentName} onChange={handleChange} />
            {errors.studentName && <p style={{ color: 'red' }}>{errors.studentName}</p>}

            <input name="rollNo" placeholder="Roll Number" value={formData.rollNo} onChange={handleChange} />
            {errors.rollNo && <p style={{ color: 'red' }}>{errors.rollNo}</p>}

            <input name="semester" placeholder="Semester" value={formData.semester} onChange={handleChange} />
            {errors.semester && <p style={{ color: 'red' }}>{errors.semester}</p>}

            <input name="photo" placeholder="Photo URL" value={formData.photo} onChange={handleChange} />
            {errors.photo && <p style={{ color: 'red' }}>{errors.photo}</p>}

            <h4>Subjects</h4>
            <div className="subject-group">
              {formData.subjects.map((subject, index) => (
                <div key={index}>
                  <input name="code" placeholder="Subject Code" value={subject.code} onChange={(e) => handleChange(e, index)} />
                  {errors[`subjectCode-${index}`] && <p style={{ color: 'red' }}>{errors[`subjectCode-${index}`]}</p>}

                  <input name="name" placeholder="Subject Name" value={subject.name} onChange={(e) => handleChange(e, index)} />
                  {errors[`subjectName-${index}`] && <p style={{ color: 'red' }}>{errors[`subjectName-${index}`]}</p>}

                  <input name="internalMarks" placeholder="Internal Marks" value={subject.internalMarks} onChange={(e) => handleChange(e, index)} />
                  {errors[`internalMarks-${index}`] && <p style={{ color: 'red' }}>{errors[`internalMarks-${index}`]}</p>}

                  <input name="externalMarks" placeholder="External Marks" value={subject.externalMarks} onChange={(e) => handleChange(e, index)} />
                  {errors[`externalMarks-${index}`] && <p style={{ color: 'red' }}>{errors[`externalMarks-${index}`]}</p>}
                </div>
              ))}
            </div>

            <button type="button" onClick={addSubject}>+ Add Subject</button><br /><br />
            <button type="submit" disabled={ isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Result'}
            </button>
          </form>
        </div>
        <ToastContainer position="top-center" autoClose={3000} />
      </div>
    </>
  );
};

export default AdminPage;

