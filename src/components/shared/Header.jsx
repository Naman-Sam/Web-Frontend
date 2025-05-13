import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../imgs/logodare.png';
import '../styles/Header.css';
import '../styles/Responsive/Header.responsive.css';
import { wrapperFetch } from '../../utils/wrapperfetch';

const Header = ({ toggleMenu, toggleCart }) => {
  const [isDropdownOpen, setDropdownOpen] = useState(false); // Manage dropdown visibility
  const [showLoginPrompt, setShowLoginPrompt] = useState(false); // State for login prompt
  const navigate = useNavigate();

  // Check login status
  const username = localStorage.getItem('username'); // Example: Retrieve username
  const userId = localStorage.getItem('userId'); // Example: Retrieve username

  // Logout function
  const handleLogout = () => {
    localStorage.clear(); // Clear all localStorage (or remove specific items)
    setDropdownOpen(false); // Close the dropdown
    navigate('/');// Close the dropdown
  };

  // Handle Cart button with login check
  const handleCartClick = () => {
    if (userId) {
      toggleCart(); // Open CartSlider if logged in
    } else {
      setShowLoginPrompt(true); // Show login prompt if not logged in
    }
  };

  // Handle More button with login check
  const handleMoreClick = () => {
    if (userId) {
      navigate('/personal-info') 
    } else {
      setShowLoginPrompt(true); // Show login prompt if not logged in
    }
  };

  return (
    <header className="header">
      <div className="menu-bar">
        <button id="menu-btn" aria-label="Toggle Menu" onClick={toggleMenu}>
          <i className="fas fa-bars"></i>
        </button>
      </div>

      <div className="logo">
        <img src={logo} alt="Your Logo" />
      </div>

      <div className="options">
        {/* Cart button */}
        <div
          className="option-item"
          tabIndex="0"
          aria-label="Cart"
          onClick={handleCartClick} // Handle login check here
        >
          <i className="fas fa-shopping-cart"></i> Cart
        </div>

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
                <p>Welcome, <strong>{username}</strong></p>
                <button onClick={handleLogout}>Logout</button>
                <button onClick={handleMoreClick}>More</button> {/* Handles login check */}
              </div>
            ) : (
              <div>
                <p>Hi, Guest!</p>
                <button onClick={() => navigate('/login')}>Login</button>
                <button onClick={handleMoreClick}>More</button> {/* Handles login check */}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Login Prompt Popup */}
      {showLoginPrompt && (
        <div className="login-popup-overlay-header">
          <div className="login-popup-header">
            <p className="login-popup-message-header">Please log in to access this feature.</p>
            <button className="login-popup-button-header" onClick={() => navigate('/login')}>
              Log In
            </button>
            <button className="login-popup-close-header" onClick={() => setShowLoginPrompt(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
