import React, { useState, useEffect } from 'react';
import { fetchUserInfo, updateUserInfo } from '../components/shared/DeliveryUtils';
import Menu from '../components/shared/Menu';
import Header from '../components/shared/Header';
import CartSlider from '../components/shared/CartSlider';
import Notification from '../components/shared/Notification';
import RequestEmailVerification from '../components/auth/RequestEmailVerification';
import RequestPasswordReset from '../components/auth/RequestPasswordReset';
import ResetPassword from '../components/auth/ResetPassword';
import VerifyMail from '../components/auth/VerifyMail';
import '../components/styles/PersonalInfoPage.css';
import { wrapperFetch } from '../utils/wrapperfetch';

const BASE_URL = process.env.REACT_APP_BASE_URL;

const PersonalInfoPage = () => {
  // Default to empty objects so that rendering always has something to work with.
  const [userInfo, setUserInfo] = useState({});
  const [detailedInfo, setDetailedInfo] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  // Instead of halting the UI, we store an error message and still let the form render.
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [currentForm, setCurrentForm] = useState('info');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const userId = localStorage.getItem('userId');

  // Function to display notifications
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 3000);
  };

  // When error changes, show a notification.
  useEffect(() => {
    if (error) {
      showNotification(error, 'error');
    }
  }, [error]);

  // Fetch user data on mount.
  useEffect(() => {
    if (!userId) {
      // Instead of halting the UI, we set an error message.
      setError('User ID not found. Please login.');
      setIsLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch delivery info
        const deliveryData = await fetchUserInfo(userId);
        setUserInfo(deliveryData || {}); // fallback to empty object
        setFormData(deliveryData || {});
        // Fetch detailed user info
        const detailedData = await fetchDetailedUserInfo(userId);
        setDetailedInfo(detailedData.user || {});
        setEmail(detailedData.user?.email || '');
      } catch (err) {
        setError(err.message || 'Failed to fetch user information.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  // Function to fetch detailed info
  const fetchDetailedUserInfo = async (userId) => {
    try {
      const response = await wrapperFetch(`${BASE_URL}/api/info/get/detailed/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await response.json();
      if (response.ok) {
        return data;
      } else {
        throw new Error(data.message || 'Failed to fetch detailed user information.');
      }
    } catch (err) {
      console.error('Error fetching detailed user information:', err);
      throw err;
    }
  };

  // Handle input changes in forms.
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission to update info.
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await updateUserInfo(userId, formData);
      setUserInfo(formData);
      setIsEditing(false);
      showNotification(response.message || 'Address updated successfully!', 'success');
    } catch (err) {
      setError(err.message || 'Failed to update address.');
    }
  };

  // Toggle menu and cart.
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  // Render the appropriate form based on the currentForm state.
  const renderForm = () => {
    if (currentForm === 'email-verification') {
      return (
        <VerifyMail
          BASE_URL={BASE_URL}
          email={email}
          otp={otp}
          setOtp={setOtp}
          setCurrentForm={setCurrentForm}
        />
      );
    }
    if (currentForm === 'request-password-reset') {
      return (
        <RequestPasswordReset
          BASE_URL={BASE_URL}
          email={email}
          setEmail={setEmail}
          setSuccessMessage={(msg) => showNotification(msg, 'success')}
          setErrorMessage={(msg) => showNotification(msg, 'error')}
          setCurrentForm={setCurrentForm}
        />
      );
    }
    if (currentForm === 'password-reset') {
      return (
        <ResetPassword
          BASE_URL={BASE_URL}
          email={email}
          otp={otp}
          setOtp={setOtp}
          setSuccessMessage={(msg) => showNotification(msg, 'success')}
          setErrorMessage={(msg) => showNotification(msg, 'error')}
          setCurrentForm={setCurrentForm}
        />
      );
    }
    if (currentForm === 'request-email-verification') {
      return (
        <RequestEmailVerification
          BASE_URL={BASE_URL}
          email={email}
          setEmail={setEmail}
          setSuccessMessage={(msg) => {
            showNotification(msg, 'success');
            setCurrentForm('email-verification');
          }}
          setErrorMessage={(msg) => {
            if (msg === 'This email is already verified.') {
              showNotification('Email is already verified. No further action needed.', 'info');
            } else {
              showNotification(msg, 'error');
            }
          }}
          setCurrentForm={setCurrentForm}
        />
      );
    }
    // Default: Personal Information / Address form.
    return (
      <div className="personal-info-content">
        <h1 className="personal-info-title">Personal Information</h1>
        {/* Detailed info section: show empty fields if not provided */}
        <div className="info-display">
          <p>
            <strong>Username:</strong> {detailedInfo.username || ''}
          </p>
          <p>
            <strong>Email:</strong> {detailedInfo.email || ''}
          </p>
        </div>
        {/* Delivery/Address info */}
        {!isEditing ? (
          <div className="info-display">
            <p>
              <strong>Phone Number:</strong> {userInfo.phone_number || ''}
            </p>
            <p>
              <strong>Apartment/Home:</strong> {userInfo.apartment_or_home || ''}
            </p>
            <p>
              <strong>Address Line1:</strong> {userInfo.address_line_1 || ''}
            </p>
            <p>
              <strong>Address Line2:</strong> {userInfo.address_line_2 || ''}
            </p>
            <p>
              <strong>City:</strong> {userInfo.city || ''}
            </p>
            <p>
              <strong>State:</strong> {userInfo.state || ''}
            </p>
            <p>
              <strong>Country:</strong> {userInfo.country || ''}
            </p>
            <p>
              <strong>Postal Code:</strong> {userInfo.postal_code || ''}
            </p>
            <button className="edit-address-button" onClick={() => setIsEditing(true)}>
              Edit Address
            </button>
          </div>
        ) : (
          <form className="info-form" onSubmit={handleFormSubmit}>
            <label>
              Phone Number:
              <input
                type="text"
                name="phone_number"
                value={formData.phone_number || ''}
                onChange={handleInputChange}
              />
            </label>
            <label>
              Apartment/Home:
              <input
                type="text"
                name="apartment_or_home"
                value={formData.apartment_or_home || ''}
                onChange={handleInputChange}
              />
            </label>
            <label>
              Address Line1:
              <input
                type="text"
                name="address_line_1"
                value={formData.address_line_1 || ''}
                onChange={handleInputChange}
              />
            </label>
            <label>
              Address Line2:
              <input
                type="text"
                name="address_line_2"
                value={formData.address_line_2 || ''}
                onChange={handleInputChange}
              />
            </label>
            <label>
              City:
              <input
                type="text"
                name="city"
                value={formData.city || ''}
                onChange={handleInputChange}
              />
            </label>
            <label>
              State:
              <input
                type="text"
                name="state"
                value={formData.state || ''}
                onChange={handleInputChange}
              />
            </label>
            <label>
              Country:
              <input
                type="text"
                name="country"
                value={formData.country || ''}
                onChange={handleInputChange}
              />
            </label>
            <label>
              Postal Code:
              <input
                type="text"
                name="postal_code"
                value={formData.postal_code || ''}
                onChange={handleInputChange}
              />
            </label>
            <button type="submit" className="edit-address-button">
              Save
            </button>
            <button type="button" className="edit-address-button" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </form>
        )}
        {/* Action buttons for resetting password and verifying email */}
        <div className="action-buttons">
          <button className="action-button-reset-password" onClick={() => setCurrentForm('request-password-reset')}>
            Reset Password
          </button>
          <button className="action-button-Email-Own" onClick={() => setCurrentForm('request-email-verification')}>
            Verify Email
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      {isLoading ? (
        <p className="loading-info-for-user">Loading information...</p>
      ) : (
        <>
          <Header toggleMenu={toggleMenu} toggleCart={toggleCart} />
          <Menu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
          <CartSlider isCartOpen={isCartOpen} toggleCart={toggleCart} cartItems={[]} />
          <Notification message={notification.message} type={notification.type} />
          <div className="personal-info-page">{renderForm()}</div>
        </>
      )}
    </div>
  );
};

export default PersonalInfoPage;
