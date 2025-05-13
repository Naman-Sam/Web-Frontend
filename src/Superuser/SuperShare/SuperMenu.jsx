import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../components/imgs/logo.png';
import '../../components/styles/Menu.css';
import '../../components/styles/Responsive/Menu.responsive.css';
import { wrapperFetch } from '../../utils/wrapperfetch';

const SuperMenu = ({ isMenuOpen, toggleMenu }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState(localStorage.getItem('username'));
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Logout handler: clears localStorage and updates state.
  const handleLogout = () => {
    localStorage.clear();
    setUsername(null);
    navigate('/');// Close the dropdown
  };

  // For protected routes, show login prompt if user is not logged in.
  const handleProtectedNavigation = (path) => {
    if (username) {
      navigate(path);
    } else {
      setShowLoginPrompt(true);
    }
  };

  return (
    <div className={`menu-container-yets ${isMenuOpen ? 'open' : ''}`}>
      <button className="close-button-bets" onClick={toggleMenu}>
        <i className="fas fa-times"></i>
      </button>

      <ul className="menu-items-yets">
        <li>
          <a onClick={() => navigate('/superdashboard')}>Home</a>
        </li>
        <li>
          <a onClick={() => handleProtectedNavigation('/super-order-messages')}>Orders</a>
        </li>
        <li>
          <a onClick={() => handleProtectedNavigation('/super-message')}>Messages</a>
        </li>
        <li>
          <a onClick={() => handleProtectedNavigation('/info')}>User Info</a>
        </li>
        <li>
          <a onClick={() => navigate('/feedback')}>Feedback</a>
        </li>
        <li>
          <a onClick={() => navigate('/super-service')}>Service</a>
        </li>
        <li>
          <a onClick={() => navigate('/super-about')}>About Us</a>
        </li>
        <li>
          <a onClick={() => navigate('/')}>Main Web</a>
        </li>
      </ul>

      {/* Login / Logout Section with 3D Flip Card */}
      <div className="login-container-make">
        <div className="login-flip-card">
          {/* Front Side */}
          <div className="login-flip-card-front">
            <i className="fas fa-user-circle login-profile"></i>
            <span className="login-link">Login / Logout</span>
            <i className="fas fa-chevron-right login-arrow"></i>
          </div>
          {/* Back Side */}
          <div className="login-flip-card-back">
            {username ? (
              <div className="user-info-container">
                <p className="user-greeting">Hi, {username}!</p>
                <button className="action-button" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            ) : (
              <div className="user-info-container">
                <p className="user-greeting">Hi, Guest!</p>
                <button
                  className="action-button"
                  onClick={() => navigate('/login')}
                >
                  Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Login Prompt Popup */}
      {showLoginPrompt && (
        <div className="login-popup-overlay-menu">
          <div className="login-popup-menu">
            <p className="login-popup-message-menu">
              Please log in to access this feature.
            </p>
            <button
              className="login-popup-button-menu"
              onClick={() => navigate('/login')}
            >
              Log In
            </button>
            <button
              className="login-popup-close-menu"
              onClick={() => setShowLoginPrompt(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Powered By Section */}
      <div className="powered-by">
        <span>Powered By</span>
        <img src={logo} alt="Your Logo" className="powered-logo" />
      </div>
    </div>
  );
};

export default SuperMenu;
