import React, { useState } from 'react';
import SuperHeader from '../SuperShare/SuperHeader'; // Custom header component
import SuperMenu from '../SuperShare/SuperMenu';     // Custom menu component
import '../SuperStyle/FetchInfo.css';               // Styling for this page
import { wrapperFetch } from '../../utils/wrapperfetch';

const FetchInfoPage = ({ BASE_URL }) => {
  const [isMenuOpen, setMenuOpen] = useState(false); // State for menu visibility
  const [identifier, setIdentifier] = useState(''); // Stores either user ID or username
  const [info, setInfo] = useState(null);           // Stores fetched user info
  const [errorMessage, setErrorMessage] = useState(''); // Error message display
  const [loading, setLoading] = useState(false);    // Loading state

  // Toggle the menu visibility
  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  // Fetch user information
  const fetchInfo = async () => {
    if (!identifier.trim()) {
      setErrorMessage('Please enter a valid username or user ID.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setInfo(null);

    try {
      const response = await wrapperFetch(`${BASE_URL}/api/info/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: identifier.includes('@') ? undefined : identifier, // Use username if it's not an email-like ID
          user_id: identifier.includes('@') ? identifier : undefined, // Use user_id if it looks like an email
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch user info.');
      }

      setInfo(data.user_info); // Set user info if fetch is successful
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fetch-info-page">
      {/* Header Component */}
      <SuperHeader toggleMenu={toggleMenu} />

      {/* Menu Component */}
      <SuperMenu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />

      {/* Page Content */}
      <div className="fetch-info-container">
        <h1>Fetch User Information</h1>
        
        {/* Input Field and Fetch Button */}
        <div className="input-group">
          <input
            type="text"
            placeholder="Enter Username or User ID"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="fetch-info-input"
          />
          <button
            onClick={fetchInfo}
            className="fetch-info-button"
            disabled={loading}
          >
            {loading ? 'Fetching...' : 'Fetch Info'}
          </button>
        </div>

        {/* Error Message */}
        {errorMessage && <p className="error-message">{errorMessage}</p>}

        {/* Display User Information */}
        {info && (
          <div className="user-info-display">
            <h2>User Information</h2>
            <p><strong>Phone Number:</strong> {info.phone_number || 'N/A'}</p>
            <p><strong>Address Line 1:</strong> {info.address_line_1 || 'N/A'}</p>
            <p><strong>Address Line 2:</strong> {info.address_line_2 || 'N/A'}</p>
            <p><strong>City:</strong> {info.city || 'N/A'}</p>
            <p><strong>Apartment/Home:</strong> {info.apartment_or_home || 'N/A'}</p>
            <p><strong>State:</strong> {info.state || 'N/A'}</p>
            <p><strong>Country:</strong> {info.country || 'N/A'}</p>
            <p><strong>Postal Code:</strong> {info.postal_code || 'N/A'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FetchInfoPage;
