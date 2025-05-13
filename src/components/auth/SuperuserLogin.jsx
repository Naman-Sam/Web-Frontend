import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaExclamationTriangle } from 'react-icons/fa';
import { useNotification } from '../shared/NotificationContext';
import '../styles/LoginSignup.css';
import '../styles/Responsive/LoginSignup.responsive.css';
import { wrapperFetch } from '../../utils/wrapperfetch';

const SuperuserLogin = ({ BASE_URL }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showMobileWarning, setShowMobileWarning] = useState(false);

  const navigate = useNavigate();
  const { showNotification } = useNotification();

  // Function to detect if the user is on a mobile device
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  };

  const handleSuperuserLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await wrapperFetch(`${BASE_URL}/superuser-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Superuser login failed.');
      }

      // On successful login, store token and user details in localStorage.
      localStorage.setItem('superuserToken', data.publicAuthToken);
      localStorage.setItem('superuserId', data.user.id);
      localStorage.setItem('username', data.user.username);
      showNotification(data.message, 'success');

      // Check whether the user is using a mobile device.
      if (isMobileDevice()) {
        // Show a warning modal if on mobile device.
        setShowMobileWarning(true);
      } else {
        // Directly navigate to dashboard.
        navigate('/superdashboard');
      }
    } catch (error) {
      showNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handler for the "Go Back" button in the mobile warning modal.
  const handleGoBack = () => {
    localStorage.clear();
    navigate('/');
  };

  const handlesuperforClick = () => {
    navigate('/super-article');
  };

  const handlehowtoeditClick = () => {
    navigate('/contact');
  };

  // Handler for the "Continue Anyway" button.
  const handleContinueAnyway = () => {
    setShowMobileWarning(false);
    navigate('/superdashboard');
  };

  return (
    <div className="login-signup-wrapper">
      <form onSubmit={handleSuperuserLogin} className="login-signup-form login-form">
        <h1 className="login-signup-title">Superuser Login</h1>
        <input
          type="email"
          className="login-signup-input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="login-signup-password-container">
          <input
            type={showPassword ? 'text' : 'password'}
            className="login-signup-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="login-signup-password-toggle"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        <button type="submit" className="login-signup-button" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <p className="redirect-note-for-me">
          Note: If you want access to the superuser dashboard, you can request{' '}
          <span className="redirect-note-for-me-click" onClick={handlehowtoeditClick}>
            here
          </span>. To know more about the functions of a superuser, click{' '}
          <span className="redirect-note-for-me-click" onClick={handlesuperforClick}>
            more
          </span>.
        </p>
      </form>

      {/* Mobile Warning Modal */}
      {showMobileWarning && (
        <div className="mobile-warning-modal">
          <div className="mobile-warning-content">
            <FaExclamationTriangle className="warning-icon" />
            <h2>Warning</h2>
            <p>
              You are trying to access the dashboard on a tab/mobile device, which is not optimized for tab/mobile.
            </p>
            <div className="mobile-warning-buttons">
              <button className="go-back-button" onClick={handleGoBack}>
                Go Back
              </button>
              <button className="continue-anyway-button" onClick={handleContinueAnyway}>
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperuserLogin;
