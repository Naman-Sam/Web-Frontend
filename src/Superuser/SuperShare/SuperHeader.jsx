import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../components/imgs/logodare.png'; // Import your logo
import '../../components/styles/Header.css'; // Import your CSS styles
import '../../components/styles/Responsive/Header.responsive.css';
import { wrapperFetch } from '../../utils/wrapperfetch';

const SuperHeader = ({ toggleMenu }) => {
  const [isDropdownOpen, setDropdownOpen] = useState(false); // Manage dropdown visibility
  const [showLoginPrompt, setShowLoginPrompt] = useState(false); // State for login prompt
  const navigate = useNavigate();

  // Check login status
  const username = localStorage.getItem('username');

  // Logout function
  const handleLogout = () => {
    localStorage.clear(); // Clear login info from localStorage
    setDropdownOpen(false);
    navigate('/');// Close the dropdown
  };

  return (
    <header className="header">
      <div className="menu-bar">
        {/* Menu button now toggles the supermenu */}
        <button id="menu-btn" aria-label="Toggle SuperMenu" onClick={toggleMenu}>
          <i className="fas fa-bars"></i>
        </button>
      </div>

      <div className="logo-super">
        <img src={logo} alt="Your Logo" />
      </div>

      <div className="options">
        {/* Removed Cart button */}
        {/* Account Dropdown */}
        <div
          className="option-item"
          tabIndex="0"
          aria-label="Account"
          onClick={() => setDropdownOpen(!isDropdownOpen)}
        >
          <i className="fas fa-user"></i> Account
        </div>

        {/* Dropdown Window */}
        {isDropdownOpen && (
          <div className="account-dropdown">
            {/* Cross Icon to Close Dropdown */}
            <span className="close-icon-drop" onClick={() => setDropdownOpen(false)}>
              &times;
            </span>
            {username ? (
              <div>
                <p>
                  Welcome, <strong>{username}</strong>
                </p>
                <button onClick={handleLogout}>Logout</button>
              </div>
            ) : (
              <div>
                <p>Hi, Guest!</p>
                <button onClick={() => navigate('/login')}>Login</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Login Prompt Popup */}
      {showLoginPrompt && (
        <div className="login-popup-overlay-header">
          <div className="login-popup-header">
            <p className="login-popup-message-header">
              Please log in to access this feature.
            </p>
            <button
              className="login-popup-button-header"
              onClick={() => navigate('/login')}
            >
              Log In
            </button>
            <button
              className="login-popup-close-header"
              onClick={() => setShowLoginPrompt(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default SuperHeader;
