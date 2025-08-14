import React from 'react';
import { useParams } from 'react-router-dom';
import './ViewResult.css'; // Import the separate CSS file

const ViewResult = () => {
  const { id } = useParams();

  return (
    <div className="result-container">
      <div className="result-card">
        <iframe
          title="result"
          src={`http://localhost:3000/student/${id}/result`}
          className="result-iframe"
        />
      </div>
    </div>
  );
};

export default ViewResult;
