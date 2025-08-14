import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminPage from './pages/AdminPage';
import CheckResult from './pages/CheckResult';
import ViewResult from './pages/ViewResult';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    
      
      <Router>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/check-result" element={<CheckResult />} />
        <Route path="/result/:id" element={<ViewResult />} />
        <Route path="/login" element={<LoginPage/>}/>
      </Routes>
    </Router>
    
    
    
  );
}

export default App;

