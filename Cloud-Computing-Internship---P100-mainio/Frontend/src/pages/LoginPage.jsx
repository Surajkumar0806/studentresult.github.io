import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post('http://localhost:3000/login', {
        email,
        password
      });

      localStorage.setItem('token', res.data.token);

      toast.success("Login successful 🎉");
      setTimeout(() => {
        navigate('/admin');
      }, 1000);
    }  catch (error) {
        if (error.response?.status === 401) {
        toast.error("Invalid credentials");
        setErrorMessage("Invalid email or password.");
        setLoading(false);
        } else if (error.response?.status === 429) {
        toast.error("Too many failed attempts. Try again later");
        setErrorMessage("Too many failed login attempts. Please try again later.");
        } else {
        toast.error("Login failed. Please try again.");
        setErrorMessage("Something went wrong. Please try again.");
        }
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-container">
        <h2>Admin Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          /><br />
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          /><br />
          {errorMessage && (
          <div style={{ color: 'red', marginBottom: '10px' }}>
          {errorMessage}
          </div>
          )}
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <ToastContainer position="top-center" autoClose={3000} />
      </div>
    </div>
  );
};

export default LoginPage;
