import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../imgs/logo.png';
import '../styles/Menu.css';
import '../styles/Responsive/Menu.responsive.css';
import { wrapperFetch } from '../../utils/wrapperfetch';

const Menu = ({ isMenuOpen, toggleMenu }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState(localStorage.getItem('username')); // State to track logged-in user
  const [showLoginPrompt, setShowLoginPrompt] = useState(false); // State to handle login prompt visibility
  const userId = localStorage.getItem('userId'); // Example: Retrieve username

  const handleLogout = () => {
    localStorage.clear(); // Clear login info from localStorage
    setUsername(null); // Update state to reflect logout
    navigate('/');// Close the dropdown
  };

  const handleProtectedNavigation = (path) => {
    if (userId) {
      navigate(path); // Navigate if user is logged in
    } else {
      setShowLoginPrompt(true); // Show login prompt if user is not logged in
    }
  };

  return (
    <div className={`menu-container-yets ${isMenuOpen ? 'open' : ''}`}>
      <button className="close-button-bets" onClick={toggleMenu}>
        <i className="fas fa-times"></i>
      </button>
      <ul className="menu-items-yets">
        <li><a onClick={() => navigate('/')}>Home</a></li>
        <li><a onClick={() => handleProtectedNavigation('/orders')}>Orders</a></li>
        <li><a onClick={() => handleProtectedNavigation('/cart')}>Cart</a></li>
        <li><a onClick={() => handleProtectedNavigation('/personal-info')}>Personal Info</a></li>
        <li><a onClick={() => handleProtectedNavigation('/CustomerCare')}>Help</a></li>
        <li><a onClick={() => navigate('/contact')}>Contact</a></li>
        <li><a onClick={() => navigate('/services')}>Services</a></li>
        <li><a onClick={() => navigate('/about')}>About Us</a></li>
        <li><a onClick={() => navigate('/superdashboard')}>SuperDashboard</a></li>
      </ul>

      {/* Login / Logout Section with 3D Flip */}
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
                <button className="action-button" onClick={handleLogout}>Logout</button>
              </div>
            ) : (
              <div className="user-info-container">
                <p className="user-greeting">Hi, Guest!</p>
                <button className="action-button" onClick={() => navigate('/login')}>Login</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Login Prompt Popup */}
      {showLoginPrompt && (
        <div className="login-popup-overlay-menu">
          <div className="login-popup-menu">
            <p className="login-popup-message-menu">Please log in to access this feature.</p>
            <button className="login-popup-button-menu" onClick={() => navigate('/login')}>
              Log In
            </button>
            <button className="login-popup-close-menu" onClick={() => setShowLoginPrompt(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      <div className="powered-by">
        <span>Powered By</span>
        <img src={logo} alt="Your Logo" className="powered-logo" />
      </div>
    </div>
  );
};

export default Menu;
