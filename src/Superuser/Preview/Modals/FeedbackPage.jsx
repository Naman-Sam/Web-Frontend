import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SuperHeader from '../../SuperShare/SuperHeader';
import SuperMenu from '../../SuperShare/SuperMenu';
import '../../SuperStyle/Feedback.css'; // You can reuse this or create a separate CSS file for feedbacks
import { wrapperFetch } from '../../../utils/wrapperfetch';

const BASE_URL = process.env.REACT_APP_BASE_URL;

const FeedbackPage = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isCartOpen, setCartOpen] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Toggle functions for the sliding menu and cart slider
  const toggleMenu = () => setMenuOpen((prev) => !prev);

  // Fetch feedbacks from the backend once, when the component mounts.
  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const response = await wrapperFetch(`${BASE_URL}/api/contact/feedbacks`, {
          method: 'GET',
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch feedbacks.');
        }
        setFeedbacks(data.feedbacks);
      } catch (err) {
        console.error('Error fetching feedbacks:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedbacks();
  }, []);

  return (
    <div className="contact-page">
      {/* Header & Menu Integration */}
      <SuperHeader toggleMenu={toggleMenu} />
      <SuperMenu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />

      <header className="contact-header">
        <h1>Feedbacks</h1>
        <p>See what our customers are saying about us.</p>
      </header>

      <main className="feedback-section">
        {loading ? (
          <p>Loading feedbacks...</p>
        ) : error ? (
          <p className="error-message">Error: {error}</p>
        ) : feedbacks.length === 0 ? (
          <p>No feedbacks are available yet.</p>
        ) : (
          feedbacks.map((feedback) => (
            <div key={feedback.id} className="feedback-item">
              <h3>
                {feedback.name}{' '}
                <span className="feedback-date">
                  {new Date(feedback.created_at).toLocaleDateString()}
                </span>
              </h3>
              <p className="feedback-message">{feedback.message}</p>
              <small className="feedback-email">{feedback.email}</small>
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default FeedbackPage;
