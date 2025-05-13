import React, { useState } from 'react';
import '../styles/UsernameCheck.css';
import '../styles/Responsive/LoginSignup.responsive.css';
import { wrapperFetch } from '../../utils/wrapperfetch';

const UsernameCheck = ({ BASE_URL, username, setUsername }) => {
  const [isAvailable, setIsAvailable] = useState(null); // null = not checked, true = available, false = taken
  const [errorMessage, setErrorMessage] = useState(''); // Error message from backend
  const [loading, setLoading] = useState(false); // Loading state for button feedback

  // Function to check username availability
  const checkUsernameAvailability = async () => {
    if (!username || username.trim() === '') {
      setErrorMessage('Please enter a username.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setIsAvailable(null); // Reset availability status

    try {
      const response = await wrapperFetch(`${BASE_URL}/api/info/check-username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }), // Sending username in POST body
      });

      const data = await response.json();

      if (!response.ok) {
        // Display error message from backend if any issue arises
        setErrorMessage(data.error || 'Failed to check username.');
        setIsAvailable(false);
      } else {
        setIsAvailable(data.isAvailable); // true = available, false = taken
      }
    } catch (error) {
      setErrorMessage('Unable to check username availability. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="username-check-container">
      <div className="username-input-group">
        <input
          type="text"
          placeholder="Enter Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="username-check-input"
        />
        <button
          type="button"
          onClick={checkUsernameAvailability}
          className="username-check-button"
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Check Availability'}
        </button>
      </div>

      {/* Success Message */}
      {isAvailable === true && (
        <p className="success-message">Username is available! 🎉</p>
      )}

      {/* Username Taken Message */}
      {isAvailable === false && errorMessage === '' && (
        <p className="error-message-again">
          {username && !loading ? 'Username is already taken. Please try another. 🙁' : null}
        </p>
      )}

      {/* Backend Error Message */}
      {isAvailable === false && errorMessage !== '' && (
        <p className="error-message-again">{errorMessage}</p>
      )}
    </div>
  );
};

export default UsernameCheck;
