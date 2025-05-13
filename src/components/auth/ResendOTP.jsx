import React, { useState } from 'react';
import { useNotification } from '../shared/NotificationContext';
import '../styles/PasswordReset.css';
import '../styles/Responsive/LoginSignup.responsive.css';
import { wrapperFetch } from '../../utils/wrapperfetch';

const PasswordReset = ({ BASE_URL, email, otp, setOtp }) => {
  const [loading, setLoading] = useState(false); // State for loading during reset
  const [resendLoading, setResendLoading] = useState(false); // State for loading during OTP resend
  const { showNotification } = useNotification();

  // Function to reset the password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await wrapperFetch(`${BASE_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed.');
      }

      showNotification(
        'Password reset successful. You can now log in with your new password.',
        'success'
      );
    } catch (error) {
      showNotification(
        error.message || 'Unable to reset password. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Function to resend OTP
  const handleResendOtp = async () => {
    setResendLoading(true);

    try {
      const response = await wrapperFetch(`${BASE_URL}/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP.');
      }

      showNotification('OTP resent successfully. Please check your email.', 'success');
    } catch (error) {
      showNotification(
        error.message || 'Unable to resend OTP. Please try again.',
        'error'
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <form onSubmit={handleResetPassword} className="password-reset-form">
      <h1 className="password-reset-title">Reset Password</h1>
      <input
        type="text"
        placeholder="Enter OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        className="password-reset-input"
        required
      />
      <button type="submit" className="password-reset-button" disabled={loading}>
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
      <button
        type="button"
        className="resend-otp-button"
        onClick={handleResendOtp}
        disabled={resendLoading}
      >
        {resendLoading ? 'Resending...' : 'Resend OTP'}
      </button>
    </form>
  );
};

export default PasswordReset;
