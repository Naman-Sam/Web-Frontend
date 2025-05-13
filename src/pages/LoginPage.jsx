import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/shared/Header'; // Import Header
import Menu from '../components/shared/Menu'; // Import Menu
import CartSlider from '../components/shared/CartSlider'; // Import CartSlider Component
import LoginSignup from '../components/auth/LoginSignup'; // Login and Signup Component
import RequestPasswordReset from '../components/auth/RequestPasswordReset'; // Request Password Reset Component
import ResetPassword from '../components/auth/ResetPassword'; // Password Reset Component
import VerifyMail from '../components/auth/VerifyMail'; // Verify Email Component – now used for all email verification flows
import RequestEmailVerification from '../components/auth/RequestEmailVerification'; // Request Email Verification Component
import SuperuserLogin from '../components/auth/SuperuserLogin'; // Superuser Login Component
import Notification from '../components/shared/Notification'; // Notification Component
import '../components/styles/LoginPage.css'; // Styling for LoginPage
import { wrapperFetch } from '../utils/wrapperfetch';

const LoginPage = ({ BASE_URL }) => {
  const [currentForm, setCurrentForm] = useState('login'); // Current form state
  const [email, setEmail] = useState(''); // Email state
  const [password, setPassword] = useState(''); // Password state
  const [username, setUsername] = useState(''); // Username state
  const [otp, setOtp] = useState(''); // OTP state
  const [notification, setNotification] = useState({ message: '', type: '' }); // Notification state
  const [popup, setPopup] = useState(null); // Popup state
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Menu toggle state
  const [isCartOpen, setIsCartOpen] = useState(false); // Cart slider toggle state
  const [cartItems, setCartItems] = useState([]); // Cart items state

  const navigate = useNavigate(); // Navigation hook

  // Function to show notifications
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 3000);
  };

  // Function to close popups
  const closePopup = () => setPopup(null);

  // Function to toggle the menu
  const toggleMenu = () => {
    setIsMenuOpen((prevState) => !prevState);
  };

  // Function to toggle the cart slider
  const toggleCart = () => {
    setIsCartOpen((prevState) => !prevState);
  };

  // Render Popup
  const renderPopup = () => {
    if (!popup) return null;
    return (
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
    );
  };

  // Centralized configuration for forms to simplify rendering logic
  const formConfig = {
    login: (
      <LoginSignup
        BASE_URL={BASE_URL}
        currentForm={currentForm}
        setCurrentForm={setCurrentForm}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        username={username}
        setUsername={setUsername}
        setSuccessMessage={(msg) => showNotification(msg, 'success')}
        setErrorMessage={(msg) => {
          if (msg === 'Email not verified. Please verify your email to log in.') {
            setPopup({
              message: 'Email not verified. Please verify your email to log in.',
              actionText: 'Verify Email',
              action: () => {
                setCurrentForm('request-email-verification'); // Redirect to request email verification
                closePopup();
              },
            });
          } else {
            showNotification(msg, 'error');
          }
        }}
      />
    ),
    signup: (
      <LoginSignup
        BASE_URL={BASE_URL}
        currentForm={currentForm}
        setCurrentForm={setCurrentForm}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        username={username}
        setUsername={setUsername}
        setSuccessMessage={(msg) => showNotification(msg, 'success')}
        setErrorMessage={(msg) => {
          if (msg === 'Email already exists. Please use a different email address.') {
            setPopup({
              message: 'Email already exists. Please log in instead.',
              actionText: 'Login',
              action: () => {
                setCurrentForm('login'); // Redirect to login
                closePopup();
              },
            });
          } else {
            showNotification(msg, 'error');
          }
        }}
      />
    ),
    'verify-email': (
      <VerifyMail
        BASE_URL={BASE_URL}
        email={email}
        otp={otp}
        setOtp={setOtp}
        setSuccessMessage={(msg) => {
          showNotification(msg, 'success');
          setCurrentForm('login'); // Redirect to login after verification
        }}
        setErrorMessage={(msg) => showNotification(msg, 'error')}
        setCurrentForm={setCurrentForm}
      />
    ),
    'request-email-verification': (
      <RequestEmailVerification
        BASE_URL={BASE_URL}
        email={email}
        setEmail={setEmail}
        setCurrentForm={(form) => {
          // When the RequestEmailVerification process requests a transition to 
          // email verification, redirect to 'verify-email' to use VerifyMail.
          if (form === 'email-verification') {
            setCurrentForm('verify-email');
          } else {
            setCurrentForm(form);
          }
        }}
        setSuccessMessage={(msg) => showNotification(msg, 'success')}
        setErrorMessage={(msg) => showNotification(msg, 'error')}
      />
    ),
    'request-password-reset': (
      <RequestPasswordReset
        BASE_URL={BASE_URL}
        email={email}
        setEmail={setEmail}
        setSuccessMessage={(msg) => showNotification(msg, 'success')}
        setErrorMessage={(msg) => showNotification(msg, 'error')}
        setCurrentForm={setCurrentForm}
      />
    ),
    'password-reset': (
      <ResetPassword
        BASE_URL={BASE_URL}
        email={email}
        otp={otp}
        setOtp={setOtp}
        setSuccessMessage={(msg) => showNotification(msg, 'success')}
        setErrorMessage={(msg) => showNotification(msg, 'error')}
        setCurrentForm={setCurrentForm}
      />
    ),
    'superuser-login': (
      <SuperuserLogin 
        BASE_URL={BASE_URL}
        setSuccessMessage={(msg) => showNotification(msg, 'success')}
        setErrorMessage={(msg) => showNotification(msg, 'error')}
      />
    ),
  };

  // Button toggle logic: If on superuser login, switch to login; otherwise, switch to superuser login.
  const handleSuperuserToggle = () => {
    if (currentForm === 'superuser-login') {
      setCurrentForm('login');
    } else {
      setCurrentForm('superuser-login');
    }
  };

  const superuserButtonLabel =
    currentForm === 'superuser-login' ? 'Login' : 'Superuser Login';

  return (
    <div className="login-page">
      <Header toggleMenu={toggleMenu} toggleCart={toggleCart} />
      <Menu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
      <CartSlider
        isCartOpen={isCartOpen}
        toggleCart={toggleCart}
        cartItems={cartItems}
        onRemove={(cartId) =>
          setCartItems((prevItems) =>
            prevItems.filter((item) => item.cart_id !== cartId)
          )
        }
        onUpdateQuantity={(cartId, quantity) =>
          setCartItems((prevItems) =>
            prevItems.map((item) =>
              item.cart_id === cartId ? { ...item, quantity } : item
            )
          )
        }
      />

      <Notification message={notification.message} type={notification.type} />

      {renderPopup()}

      <div className="login-container">{formConfig[currentForm]}</div>

      {/* Permanent Superuser Toggle Button with separate CSS */}
      <div className="superuser-btn-container">
        <button
          className="superuser-toggle-btn"
          onClick={handleSuperuserToggle}
        >
          {superuserButtonLabel}
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
