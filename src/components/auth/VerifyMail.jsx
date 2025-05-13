import React, { useState } from 'react';
import { useNotification } from '../shared/NotificationContext';
import '../styles/VerifyEmail.css';
import '../styles/Responsive/VerifyEmail.responsive.css';
import { wrapperFetch } from '../../utils/wrapperfetch';

const VerifyMail = ({
  BASE_URL,
  email,
  otp,
  setOtp,
  setCurrentForm,
}) => {
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const { showNotification } = useNotification();

  // Handle Email Verification
  const handleEmailVerification = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await wrapperFetch(`${BASE_URL}/verify-email-with-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Email verification failed.');

      showNotification(data.message, 'success');
      setCurrentForm('login'); // Move to login after verification
    } catch (error) {
      showNotification(
        error.message || 'An error occurred during email verification.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    setResendLoading(true);

    try {
      const response = await wrapperFetch(`${BASE_URL}/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'email_verification' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to resend OTP.');

      showNotification(data.message, 'success');
    } catch (error) {
      showNotification(
        error.message || 'An error occurred while resending OTP.',
        'error'
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="verify-email-container">
      <form onSubmit={handleEmailVerification} className="verify-email-form">
        <h1 className="verify-title">Verify Email</h1>
        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
          className="otp-input"
        />
        <button type="submit" disabled={loading} className="verify-button">
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>
        <p className="otp-reminder">
          Didn't receive the OTP? Please check your spam folder or click{' '}
          <span className="resend-link" onClick={handleResendOtp}>
            Resend OTP
          </span>.
        </p>
        <div className="helper-links">
          <span onClick={() => setCurrentForm('signup')} className="back-to-signup">
            Back to Signup
          </span>
        </div>
      </form>
    </div>
  );
};

export default VerifyMail;
