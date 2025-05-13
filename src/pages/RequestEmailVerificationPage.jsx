import React, { useState } from 'react';
import Header from '../components/shared/Header'; // Reusable Header
import Menu from '../components/shared/Menu'; // Reusable Menu
import CartSlider from '../components/shared/CartSlider'; // Reusable CartSlider
import Notification from '../components/shared/Notification'; // Notification component
import RequestEmailVerification from '../components/auth/RequestEmailVerification'; // Email Request component
import VerifyMail from '../components/auth/VerifyMail'; // Updated Verify Email component
import { wrapperFetch } from '../utils/wrapperfetch';

const BASE_URL = process.env.REACT_APP_BASE_URL;

const RequestEmailVerificationPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [currentStep, setCurrentStep] = useState('request-email-verification');

  // Example notification function; you might already have this wired up via a context
  const showNotification = (message, type) => {
    // Logic to show notification (or you may use your NotificationContext)
  };

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  const renderCurrentStep = () => {
    if (currentStep === 'request-email-verification') {
      return (
        <RequestEmailVerification
          BASE_URL={BASE_URL}
          email={email}
          setEmail={setEmail}
          setSuccessMessage={(msg) => {
            showNotification(msg, 'success');
            // Switch to the verification step once the OTP is sent.
            setCurrentStep('email-verification');
          }}
          setErrorMessage={(msg) => {
            if (msg === 'This email is already verified.') {
              showNotification('Email is already verified. No further action needed.', 'info');
            } else {
              showNotification(msg, 'error');
            }
          }}
        />
      );
    }
    if (currentStep === 'email-verification') {
      return (
        <VerifyMail
          BASE_URL={BASE_URL}
          email={email}
          otp={otp}
          setOtp={setOtp}
          // This function lets VerifyMail update the parent’s form state (for example, move to login or signup)
          setCurrentForm={setCurrentStep}
        />
      );
    }
  };

  return (
    <div>
      <Header toggleMenu={toggleMenu} toggleCart={toggleCart} />
      <Menu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
      <CartSlider isCartOpen={isCartOpen} toggleCart={toggleCart} cartItems={[]} />
      <Notification />
      <div className="request-page">
        <h1>Request Email Verification</h1>
        {renderCurrentStep()}
      </div>
    </div>
  );
};

export default RequestEmailVerificationPage;
