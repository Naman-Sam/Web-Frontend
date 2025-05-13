import React, { useState } from 'react';
import { useNotification } from '../shared/NotificationContext';
import '../styles/RequestPasswordReset.css';
import '../styles/Responsive/RequestPasswordReset.responsive.css';
import { wrapperFetch } from '../../utils/wrapperfetch';

const RequestPasswordReset = ({
  BASE_URL,
  email,
  setEmail,
  setCurrentForm,
}) => {
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  // Handle Request Password Reset OTP
  const handleRequestPasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      const response = await wrapperFetch(`${BASE_URL}/request-password-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP.');
      }
  
      showNotification(data.message, 'success');
      setCurrentForm('password-reset'); // Move to Reset Password form
    } catch (error) {
      showNotification(error.message || 'An unexpected error occurred.', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="password-reset-container">
      <form onSubmit={handleRequestPasswordReset} className="password-reset-form">
        <h1 className="reset-title">Request Password Reset</h1>
  
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="email-input"
        />
  
        <button type="submit" disabled={loading} className="submit-button-reset-boss">
          {loading ? 'Requesting...' : 'Request OTP'}
        </button>
  
        <div className="helper-links">
          <span onClick={() => setCurrentForm('login')} className="back-to-login">
            Go Back
          </span>
        </div>
      </form>
    </div>
  );
};

export default RequestPasswordReset;
