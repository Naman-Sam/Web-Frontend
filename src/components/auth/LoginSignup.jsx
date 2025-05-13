import '../styles/LoginSignup.css';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UsernameCheck from './UsernameCheck';
import { useNotification } from '../shared/NotificationContext';
import '../styles/Responsive/LoginSignup.responsive.css';
import { wrapperFetch } from '../../utils/wrapperfetch';

const LoginSignup = ({
  BASE_URL,
  currentForm,
  setCurrentForm,
  email,
  setEmail,
  password,
  setPassword,
  username,
  setUsername
}) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [popup, setPopup] = useState(null); // State for popup messages
  const navigate = useNavigate();

  // Global notification function from context
  const { showNotification } = useNotification();

  // Close popup
  const closePopup = () => {
    setPopup(null);
  };

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await wrapperFetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok) {
        // Handle specific error messages with popups where necessary
        if (data.error === 'User does not exist. Please register first.') {
          setPopup({
            message: 'User does not exist. Would you like to sign up instead?',
            actionText: 'Sign Up',
            action: () => {
              setCurrentForm('signup'); // Redirect to the signup form
              closePopup();
            },
          });
        } else if (data.error === 'Email not verified. Please verify your email to log in.') {
          setPopup({
            message: 'Email not verified. Please verify your email to log in.',
            actionText: 'Verify Email',
            action: () => {
              setCurrentForm('request-email-verification'); // Redirect to Request Email Verification page
              closePopup();
            },
          });
        } else {
          throw new Error(data.error || 'Login failed.');
        }
      } else {
        // Store user information on successful login
        localStorage.setItem('token', data.publicAuthToken);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('username', data.user.username);        

        showNotification(data.message, 'success');
        navigate('/'); // Redirect on successful login
      }
    } catch (error) {
      showNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Signup with Username Validation
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check username availability before signup
      const usernameResponse = await wrapperFetch(`${BASE_URL}/api/info/check-username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const usernameData = await usernameResponse.json();
      if (!usernameResponse.ok || !usernameData.isAvailable) {
        throw new Error('Username is already taken. Please choose another.');
      }

      showNotification('Username is available! 🎉', 'success');

      // Proceed with signup
      const signupResponse = await wrapperFetch(`${BASE_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username }),
      });

      const signupData = await signupResponse.json();

      if (!signupResponse.ok) {
        // Handle specific error messages with popup if needed
        if (signupData.error === 'Email already exists. Please use a different email address.') {
          setPopup({
            message: 'Email already exists. Please log in instead.',
            actionText: 'Login',
            action: () => {
              setCurrentForm('login'); // Redirect to login form
              closePopup();
            },
          });
        } else {
          throw new Error(signupData.error || 'Signup failed.');
        }
      } else {
        showNotification(signupData.message, 'success');
        setCurrentForm('verify-email'); // Redirect to Email Verification after successful signup
      }
    } catch (error) {
      showNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-signup-wrapper">
      {/* Popup Component */}
      {popup && (
        <div className="popup-overlay">
          <div className="popup">
            <p>{popup.message}</p>
            <button onClick={popup.action} className="popup-button">
              {popup.actionText}
            </button>
            <button onClick={closePopup} className="popup-close">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Login Form */}
      {currentForm === 'login' && (
        <form onSubmit={handleLogin} className="login-signup-form login-form">
          <h1 className="login-signup-title">Login</h1>
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
          <div className="login-signup-helper-links">
            <span onClick={() => setCurrentForm('signup')}>Sign Up</span>
            <span onClick={() => setCurrentForm('request-email-verification')}>Verify Email</span>
            <span onClick={() => setCurrentForm('request-password-reset')}>Forgot Password?</span>
          </div>
        </form>
      )}

      {/* Signup Form */}
      {currentForm === 'signup' && (
        <form onSubmit={handleSignup} className="login-signup-form signup-form">
          <h1 className="login-signup-title">Sign Up</h1>
          <UsernameCheck
            BASE_URL={BASE_URL}
            username={username}
            setUsername={setUsername}
            setErrorMessage={(msg) => showNotification(msg, 'error')}
          />
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
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
          <div className="login-signup-helper-links">
            <span onClick={() => setCurrentForm('login')}>Already have an account? Login</span>
            <span onClick={() => setCurrentForm('request-email-verification')}>Verify Email</span>
          </div>
        </form>
      )}
    </div>
  );
};

export default LoginSignup;
