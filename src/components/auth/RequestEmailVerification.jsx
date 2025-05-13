import React, { useState } from 'react';
import { useNotification } from '../shared/NotificationContext';
import '../styles/RequestEmailVerification.css';
import '../styles/Responsive/RequestEmailVerification.responsive.css';
import { wrapperFetch } from '../../utils/wrapperfetch';

const RequestEmailVerification = ({
  BASE_URL,
  email,
  setEmail,
  setCurrentForm,
}) => {
  const [localEmail, setLocalEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      const response = await wrapperFetch(`${BASE_URL}/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: localEmail, purpose: 'email_verification' }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        if (data.error === 'This email is already verified.') {
          // Notify the user that their email is already verified
          showNotification('Email is already verified. No further action needed.', 'success');
          return;
        }
  
        throw new Error(data.error || 'Failed to send OTP.');
      }
  
      // If OTP is successfully sent
      showNotification('OTP has been sent! Please check your email.', 'success');
      setEmail(localEmail); // Synchronize email state with parent
      setCurrentForm('email-verification'); // Transition to the verification form
    } catch (error) {
      showNotification(error.message || 'An error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="email-verification-container">
      <form onSubmit={handleRequestOtp} className="email-verification-form">
        <h1 className="email-verification-title">Verify Your Email</h1>
        <input
          type="email"
          placeholder="Enter your email"
          value={localEmail}
          onChange={(e) => setLocalEmail(e.target.value)}
          required
          className="email-input"
        />
        <button type="submit" disabled={loading} className="submit-button-Email-court">
          {loading ? 'Sending...' : 'Send OTP'}
        </button>
        <div className="helper-links">
          <span
            className="back-to-login"
            onClick={() => {
              if (setCurrentForm) {
                setCurrentForm('login'); // Return to login
              } else {
                console.error('setCurrentForm is not defined');
              }
            }}
          >
            Go Back
          </span>
        </div>
      </form>
    </div>
  );
};

export default RequestEmailVerification;
