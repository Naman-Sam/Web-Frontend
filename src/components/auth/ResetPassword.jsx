import React, { useState } from 'react';
import { useNotification } from '../shared/NotificationContext';
import '../styles/PasswordReset.css';
import '../styles/Responsive/LoginSignup.responsive.css';
import { wrapperFetch } from '../../utils/wrapperfetch';

const ResetPassword = ({
  BASE_URL,
  email,
  otp,
  setOtp,
  setCurrentForm,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false); // Loading for reset process
  const [resendLoading, setResendLoading] = useState(false); // Loading for OTP resend process
  const [showPassword, setShowPassword] = useState(false); // Toggle visibility for new password
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Toggle visibility for confirm password

  const { showNotification } = useNotification();

  // Handle Password Reset with OTP
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      showNotification("Passwords don't match!", 'error');
      setLoading(false);
      return;
    }

    try {
      const response = await wrapperFetch(`${BASE_URL}/reset-password-with-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, new_password: newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Password reset failed.');
      }

      showNotification(data.message || 'Password reset successful!', 'success');
      setCurrentForm('login'); // Redirect to login after success
    } catch (error) {
      showNotification(
        error.message || 'An error occurred during password reset.',
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
        body: JSON.stringify({ email, purpose: 'password_reset' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend OTP.');
      }

      showNotification(
        data.message || 'OTP has been resent successfully! Please check your email.',
        'success'
      );
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
    <div className="password-reset-container">
      <form onSubmit={handlePasswordReset} className="password-reset-form">
        <h1 className="reset-title">Reset Password</h1>

        <input
          type="text"
          placeholder="OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
          className="otp-input"
        />

        <div className="password-container">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="password-input"
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        <div className="password-container">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="password-input"
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        <button type="submit" disabled={loading} className="submit-button-reset-back">
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
        <button
          type="button"
          onClick={handleResendOtp}
          disabled={resendLoading}
          className="resend-otp-button"
        >
          {resendLoading ? 'Resending...' : 'Resend OTP'}
        </button>
        <p className="otp-reminder">
          Didn't receive the OTP? Please check your spam folder or click{' '}
          <span className="resend-link" onClick={handleResendOtp}>
            Resend OTP
          </span>.
        </p>
        <div className="helper-links">
          <span onClick={() => setCurrentForm('request-password-reset')} className="back-to-request">
            Back to Request OTP
          </span>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;
