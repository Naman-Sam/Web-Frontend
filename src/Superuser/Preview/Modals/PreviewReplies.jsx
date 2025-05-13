import React, { useState } from 'react';
import '../../../components/styles/ReviewsSection.css';
import '../../../components/styles/Responsive/ReviewSection.responsive.css';
import { wrapperFetch } from '../../../utils/wrapperfetch';

const Replies = ({
  BASE_URL,
  reviewId,
  productId,
  currentUserId,
  showNotification,
  refreshReviews,
  replies,
}) => {
  const [newReply, setNewReply] = useState('');
  const [editReplyInput, setEditReplyInput] = useState({ replyId: null, text: '' });
  const [activeMenu, setActiveMenu] = useState(null); // Tracks the active three-dots menu

  // Format time difference function remains unchanged.
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

  // Add Reply
  const handleAddReply = async () => {
    const username = localStorage.getItem('username'); // Retrieve username
    if (!newReply) {
      showNotification('Reply cannot be empty.', 'error');
      return;
    }
    if (newReply.length > 300) {
      // Validate character limit
      showNotification('Reply cannot exceed 300 characters.', 'error');
      return;
    }
    if (!productId) {
      showNotification('Product ID is required.', 'error');
      return;
    }
    try {
      const response = await wrapperFetch(`${BASE_URL}/api/reviews/reply/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review_id: reviewId,
          product_id: productId,
          user_id: currentUserId,
          reply: newReply,
          is_superuser: true, // Explicitly set is_superuser to false
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add reply.');
      }
      showNotification('Reply added successfully!', 'success');
      setNewReply(''); // Clear the reply input field
      refreshReviews(); // Refresh the reviews and replies
    } catch (err) {
      showNotification(err.message || 'Failed to add reply.', 'error');
    }
  };

  // Edit Reply
  const handleEditReply = async () => {
    if (!editReplyInput.replyId || !editReplyInput.text) {
      showNotification('Reply text cannot be empty.', 'error');
      return;
    }
    if (editReplyInput.text.length > 300) {
      showNotification('Reply cannot exceed 300 characters.', 'error');
      return;
    }
    try {
      const response = await wrapperFetch(`${BASE_URL}/api/reviews/reply/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reply_id: editReplyInput.replyId,
          user_id: currentUserId,
          reply: editReplyInput.text,
          is_superuser: false, // Explicitly set is_superuser to false
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to edit reply.');
      }
      showNotification('Reply edited successfully!', 'success');
      setEditReplyInput({ replyId: null, text: '' }); // Reset the input field
      refreshReviews(); // Refresh reviews and replies
    } catch (err) {
      showNotification(err.message || 'Failed to edit reply.', 'error');
    }
  };

  // Delete Reply
  const handleDeleteReply = async (replyId) => {
    try {
      const response = await wrapperFetch(`${BASE_URL}/api/reviews/reply/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reply_id: replyId,
          user_id: currentUserId,
          is_superuser: false, // Explicitly set is_superuser to false
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete reply.');
      }
      showNotification('Reply deleted successfully!', 'success');
      refreshReviews(); // Refresh reviews and replies
    } catch (err) {
      showNotification(err.message || 'Failed to delete reply.', 'error');
    }
  };

  // Toggle three-dots menu
  const toggleMenu = (replyId) => {
    setActiveMenu((prevMenu) => (prevMenu === replyId ? null : replyId));
  };

  return (
    <div className="replies-section">
      {/* Display existing replies */}
      {replies.map((reply) => (
        <div key={reply.id} className="reply">
          {/* Reply Header: Username and Timestamp */}
          <div className="reply-header">
            <span className="reply-username">{reply.username}</span>
            <span className="reply-timestamp">{formatTimeDifference(reply.created_at)}</span>
          </div>
          {/* Reply Text */}
          <div className="reply-body">
            {editReplyInput.replyId === reply.id ? (
              <div className="edit-reply">
                <textarea
                  placeholder="Edit your reply (max300 characters)..."
                  value={editReplyInput.text}
                  onChange={(e) => {
                    // Count every letter and space
                    if (e.target.value.length <= 300) {
                      setEditReplyInput({ ...editReplyInput, text: e.target.value });
                    }
                  }}
                />
                <span className="word-counter">
                  {editReplyInput.text.length}/300 characters
                </span>
                <button onClick={handleEditReply}>Save</button>
                <button onClick={() => setEditReplyInput({ replyId: null, text: '' })}>
                  Cancel
                </button>
              </div>
            ) : (
              <p className="reply-text">{reply.reply}</p>
            )}
          </div>
          {/* Options for the logged-in user's replies */}
          {reply.user_id === currentUserId && (
            <div className="three-dots-menu">
              <button onClick={() => toggleMenu(reply.id)} className="three-dots-menu-button">
                <i className="fas fa-ellipsis-v"></i>
              </button>
              {activeMenu === reply.id && (
                <div className="menu-options">
                  <button
                    className="replies-edit-button"
                    onClick={() => setEditReplyInput({ replyId: reply.id, text: reply.reply })}
                  >
                    Edit
                  </button>
                  <button
                    className="replies-delete-button"
                    onClick={() => handleDeleteReply(reply.id)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      {/* Add a new reply */}
      <div className="add-reply">
        <textarea
          placeholder="Write a reply (max300 characters)..."
          value={newReply}
          onChange={(e) => {
            // Count every letter and space
            if (e.target.value.length <= 300) {
              setNewReply(e.target.value);
            }
          }}
        />
        <span className="word-counter">{newReply.length}/300 characters</span>
        <button onClick={handleAddReply}>Post Reply</button>
      </div>
    </div>
  );
};

export default Replies;
