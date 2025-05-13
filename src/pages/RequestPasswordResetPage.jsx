import React, { useState } from 'react';
import Header from '../components/shared/Header'; // Reusable Header
import Menu from '../components/shared/Menu'; // Reusable Menu
import CartSlider from '../components/shared/CartSlider'; // Reusable CartSlider
import Notification from '../components/shared/Notification'; // Notification component
import RequestPasswordReset from '../components/auth/RequestPasswordReset'; // Request Password Reset component
import ResetPassword from '../components/auth/ResetPassword'; // Reset Password component
import { wrapperFetch } from '../utils/wrapperfetch';


const BASE_URL = process.env.REACT_APP_BASE_URL;

const RequestPasswordResetPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Menu visibility state
  const [isCartOpen, setIsCartOpen] = useState(false); // Cart slider visibility
  const [notification, setNotification] = useState({ message: '', type: '' }); // Notifications
  const [email, setEmail] = useState(''); // Email input state
  const [otp, setOtp] = useState(''); // OTP input state
  const [currentStep, setCurrentStep] = useState('request-password-reset'); // Manage current step

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 3000); // Clear notifications
  };

  const toggleMenu = () => setIsMenuOpen((prev) => !prev); // Toggle menu state
  const toggleCart = () => setIsCartOpen((prev) => !prev); // Toggle cart state

  const renderCurrentStep = () => {
    if (currentStep === 'request-password-reset') {
      return (
        <RequestPasswordReset
          BASE_URL={BASE_URL}
          email={email}
          setEmail={setEmail}
          setSuccessMessage={(msg) => {
            showNotification(msg, 'success');
            setCurrentStep('password-reset'); // Transition to Reset Password step
          }}
          setErrorMessage={(msg) => showNotification(msg, 'error')}
        />
      );
    }
    if (currentStep === 'password-reset') {
      return (
        <ResetPassword
          BASE_URL={BASE_URL}
          email={email}
          otp={otp}
          setOtp={setOtp}
          setSuccessMessage={(msg) => showNotification(msg, 'success')}
          setErrorMessage={(msg) => showNotification(msg, 'error')}
        />
      );
    }
  };

  return (
    <div>
      {/* Header */}
      <Header toggleMenu={toggleMenu} toggleCart={toggleCart} />
      
      {/* Menu */}
      <Menu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
      
      {/* Cart Slider */}
      <CartSlider isCartOpen={isCartOpen} toggleCart={toggleCart} cartItems={[]} />
      
      {/* Notification */}
      <Notification message={notification.message} type={notification.type} />

      <div className="request-page">
        <h1>Request Password Reset</h1>
        {renderCurrentStep()}
      </div>
    </div>
  );
};

export default RequestPasswordResetPage;
