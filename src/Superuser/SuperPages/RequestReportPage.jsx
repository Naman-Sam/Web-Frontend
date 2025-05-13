import React, { useState, useEffect } from 'react';
import SuperHeader from '../SuperShare/SuperHeader'; // Custom header component
import SuperMenu from '../SuperShare/SuperMenu';     // Custom menu component
import '../SuperStyle/RequestReport.css';           // Styling specific to the report page
import { wrapperFetch } from '../../utils/wrapperfetch';

const RequestReportPage = ({ BASE_URL }) => {
  const [isMenuOpen, setMenuOpen] = useState(false); // State for menu visibility
  const [period, setPeriod] = useState('month');     // Selected report period (month/year)
  const [month, setMonth] = useState('January');       // Selected month (default to January)
  const [year, setYear] = useState(new Date().getFullYear()); // Default to current year
  const [userId, setUserId] = useState('');           // User ID fetched from localStorage
  const [loading, setLoading] = useState(false);      // Loading state for the request button
  const [responseMessage, setResponseMessage] = useState(''); // Success/Error message

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Generate years from current year down to 1900
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear; y >= 1900; y--) {
    years.push(y);
  }

  // Toggle the menu visibility
  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  // Fetch the user ID from localStorage on component mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('superuserId');
    if (storedUserId) {
      setUserId(storedUserId); // Automatically set the user ID from localStorage
    } else {
      setResponseMessage('User ID not found. Please ensure you are logged in.');
    }
  }, []);

  // Validate inputs and send the request
  const requestReport = async () => {
    // If period is month, combine the month and year. Otherwise just the year.
    const value = period === 'month' ? `${month} ${year}` : `${year}`;
    if (!period || !value.trim() || !userId.trim()) {
      setResponseMessage('All fields (period, value, and user ID) are required.');
      return;
    }

    setLoading(true);
    setResponseMessage('');

    try {
      const response = await wrapperFetch(`${BASE_URL}/api/report/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period, value: value.trim(), user_id: userId.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request the report.');
      }

      setResponseMessage(data.message || 'Report requested successfully!');
    } catch (error) {
      setResponseMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="request-report-page">
      {/* Header Component */}
      <SuperHeader toggleMenu={toggleMenu} />

      {/* Menu Component */}
      <SuperMenu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />

      {/* Page Content */}
      <div className="request-report-container">
        <h1>Request Detailed Report</h1>

        {/* Period Selection */}
        <div className="input-group">
          <label htmlFor="period">Period:</label>
          <select
            id="period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="report-input"
          >
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
        </div>

        {/* Month Dropdown for Monthly Reports */}
        {period === 'month' && (
          <div className="input-group">
            <label htmlFor="month">Month:</label>
            <select
              id="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="report-input"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Year Dropdown */}
        <div className="input-group">
          <label htmlFor="year">Year:</label>
          <select
            id="year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="report-input"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <div className="button-group">
          <button
            onClick={requestReport}
            className="request-report-button"
            disabled={loading || !userId}
          >
            {loading ? 'Requesting...' : 'Request Report'}
          </button>
        </div>

        {/* Response Message */}
        {responseMessage && <p className="response-message">{responseMessage}</p>}
      </div>
    </div>
  );
};

export default RequestReportPage;
