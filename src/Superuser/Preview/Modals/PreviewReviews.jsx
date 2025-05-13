import React, { useState } from 'react';
import Replies from './PreviewReplies'; // Import Replies component
import '../../../components/styles/ReviewsSection.css';
import '../../../components/styles/Responsive/ReviewSection.responsive.css';
import { wrapperFetch } from '../../../utils/wrapperfetch';

const Reviews = ({ reviews, BASE_URL, productId, currentUserId, showNotification, refreshReviews }) => {
  // Removed states for newReview, editReview, and activeMenu since superuser cannot add/edit/delete reviews.
  const [activeReplies, setActiveReplies] = useState(null); // Tracks which replies are visible

  // Toggle replies visibility
  const toggleReplies = (reviewId) => {
    setActiveReplies((prev) => (prev === reviewId ? null : reviewId));
  };

  // Helper function to format timestamps
  const formatTimeDifference = (timestamp) => {
    const now = new Date();
    const replyDate = new Date(timestamp);
    // Convert to local time
    const replyLocal = new Date(replyDate.getTime() - replyDate.getTimezoneOffset() * 60000);
    const differenceInSeconds = Math.floor((now - replyLocal) / 1000);
    if (differenceInSeconds < 60) {
      return `${differenceInSeconds} second${differenceInSeconds !== 1 ? 's' : ''} ago`;
    } else if (differenceInSeconds < 3600) {
      const minutes = Math.floor(differenceInSeconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (differenceInSeconds < 86400) {
      const hours = Math.floor(differenceInSeconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (differenceInSeconds < 2592000) {
      const days = Math.floor(differenceInSeconds / 86400);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else if (differenceInSeconds < 31536000) {
      const months = Math.floor(differenceInSeconds / 2592000);
      return `${months} month${months !== 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(differenceInSeconds / 31536000);
      return `${years} year${years !== 1 ? 's' : ''} ago`;
    }
  };

  return (
    <div className="reviews-section">
      {/* The add/edit/delete review section has been removed for superuser */}
      
      {/* Display Existing Reviews */}
      {reviews.map((review) => (
        <div key={review.id} className="review-card">
          <div className="review-header">
            <span className="review-username">{review.username}</span>
            <span className="review-stars">
              {'★'.repeat(review.rating)}
              {'☆'.repeat(5 - review.rating)}
            </span>
            <span className="review-timestamp">{formatTimeDifference(review.created_at)}</span>
          </div>
          {/* Review Body */}
          <div className="review-body">
            <p className="review-text">{review.feedback}</p>
          </div>
          {/* Toggle Replies Button */}
          <button className="toggle-replies" onClick={() => toggleReplies(review.id)}>
            {activeReplies === review.id ? '▲ Replies' : '▼ Replies'}
          </button>
          {/* Replies Section */}
          {activeReplies === review.id && (
            <Replies
              BASE_URL={BASE_URL}
              reviewId={review.id}
              productId={productId}
              currentUserId={currentUserId}
              showNotification={showNotification}
              refreshReviews={refreshReviews}
              replies={review.replies}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default Reviews;
