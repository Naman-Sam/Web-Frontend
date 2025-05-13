import React, { useState } from 'react';
import Replies from './Replies'; // Import Replies component
import '../styles/ReviewsSection.css';
import '../styles/Responsive/ReviewSection.responsive.css';
import { wrapperFetch } from '../../utils/wrapperfetch';

const Reviews = ({ reviews, BASE_URL, productId, currentUserId, showNotification, refreshReviews }) => {
    const [newReview, setNewReview] = useState({ rating: 0, feedback: '' });
    const [editReview, setEditReview] = useState(null); // Tracks the review being edited
    const [activeReplies, setActiveReplies] = useState(null); // Tracks which replies are visible
    const [activeMenu, setActiveMenu] = useState(null); // Tracks the active three-dots menu

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

    // Add a new review
    const handleAddReview = async () => {
        const username = localStorage.getItem('username'); // Get logged-in username

        if (!newReview.rating || newReview.feedback.trim() === '' || !username) {
            showNotification('Please provide a valid rating, feedback, and username.', 'error');
            return;
        }

        if (newReview.feedback.length > 500) {
            showNotification('Your review exceeds the 500-character limit.', 'error');
            return;
        }

        try {
            const response = await wrapperFetch(`${BASE_URL}/api/reviews/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: currentUserId,
                    name: username,
                    product_id: productId,
                    rating: newReview.rating,
                    feedback: newReview.feedback.trim(),
                    is_superuser: false,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to add review.');
            }

            showNotification('Review added successfully!', 'success');
            setNewReview({ rating: 0, feedback: '' }); // Reset form
            refreshReviews(); // Refresh reviews
        } catch (err) {
            showNotification(err.message || 'Failed to add review.', 'error');
        }
    };

    // Edit an existing review
    const handleEditReview = async () => {
        if (!editReview.feedback.trim() || !editReview.rating) {
            showNotification('Feedback and rating cannot be empty.', 'error');
            return;
        }

        if (editReview.feedback.length > 500) {
            showNotification('Your review exceeds the 500-character limit.', 'error');
            return;
        }

        try {
            const response = await wrapperFetch(`${BASE_URL}/api/reviews/edit`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    review_id: editReview.id,
                    user_id: currentUserId,
                    feedback: editReview.feedback.trim(),
                    rating: editReview.rating,
                    is_superuser: false,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to edit review.');
            }

            showNotification('Review edited successfully!', 'success');
            setEditReview(null); // Exit edit mode
            refreshReviews(); // Refresh reviews
        } catch (err) {
            showNotification(err.message || 'Failed to edit review.', 'error');
        }
    };

    // Delete a review
    const handleDeleteReview = async (reviewId) => {
        try {
            const response = await wrapperFetch(`${BASE_URL}/api/reviews/delete`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    review_id: reviewId,
                    user_id: currentUserId,
                    is_superuser: false,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete review.');
            }

            showNotification('Review deleted successfully!', 'success');
            refreshReviews(); // Refresh reviews
        } catch (err) {
            showNotification(err.message || 'Failed to delete review.', 'error');
        }
    };

    return (
        <div className="reviews-section">
            {/* Add Review Section */}
            {!reviews.find((review) => review.user_id === currentUserId) && (
                <div className="add-review-container">
                    <h3 className="add-review-title">Write a Review</h3>
                    <textarea
                        className="add-review-textarea"
                        placeholder="Write your review (max 500 characters, including spaces)..."
                        value={newReview.feedback}
                        onChange={(e) => {
                            if (e.target.value.length <= 500) {
                                setNewReview({ ...newReview, feedback: e.target.value });
                            }
                        }}
                    />
                    <span className="word-counter">{newReview.feedback.length} / 500 characters</span>
                    <select
                        className="add-review-select"
                        value={newReview.rating}
                        onChange={(e) => setNewReview({ ...newReview, rating: Number(e.target.value) })}
                    >
                        <option value={0}>Select Rating</option>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <option key={star} value={star}>
                                {star} Star{star > 1 ? 's' : ''}
                            </option>
                        ))}
                    </select>
                    <button className="post-review-button" onClick={handleAddReview}>
                        Post Review
                    </button>
                </div>
            )}

            {/* Display Existing Reviews */}
            {reviews.map((review) => (
                <div key={review.id} className="review-card">
                    <div className="review-header">
                        <span className="review-username">{review.username}</span>
                        <span className="review-stars">
                            {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                        </span>
                        <span className="review-timestamp">{formatTimeDifference(review.created_at)}</span>
                        {review.user_id === currentUserId && (
                            <button
                                className="three-dots-menu-review"
                                onClick={() => setActiveMenu((prev) => (prev === review.id ? null : review.id))}
                            >
                                <i className="fas fa-ellipsis-v"></i>
                            </button>
                        )}
                        {activeMenu === review.id && (
                            <div className="menu-options">
                                <button
                                    className="reviews-edit-button"
                                    onClick={() =>
                                        setEditReview({
                                            id: review.id,
                                            feedback: review.feedback,
                                            rating: review.rating,
                                        })
                                    }
                                >
                                    Edit
                                </button>
                                <button
                                    className="reviews-delete-button"
                                    onClick={() => handleDeleteReview(review.id)}
                                >
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Review Body */}
                    <div className="review-body">
                        {editReview && editReview.id === review.id ? (
                            <div>
                                <textarea
                                    className="edit-review-textarea"
                                    placeholder="Edit your review (max 500 characters, including spaces)..."
                                    value={editReview.feedback}
                                    onChange={(e) => {
                                        if (e.target.value.length <= 500) {
                                            setEditReview({ ...editReview, feedback: e.target.value });
                                        }
                                    }}
                                    />
                                    <span className="word-counter">
                                        {editReview.feedback.length} / 500 characters
                                    </span>
                                    <select
                                        className="edit-review-select"
                                        value={editReview.rating}
                                        onChange={(e) =>
                                            setEditReview({ ...editReview, rating: Number(e.target.value) })
                                        }
                                    >
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <option key={star} value={star}>
                                                {star} Star{star > 1 ? 's' : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        className="reviews-save-button"
                                        onClick={handleEditReview} // Save the changes
                                    >
                                        Save Changes
                                    </button>
                                    <button
                                        className="reviews-cancel-button"
                                        onClick={() => setEditReview(null)} // Cancel editing
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <p className="review-text">{review.feedback}</p> // Display feedback if not editing
                            )}
                        </div>
    
                        {/* Toggle Replies Button */}
                        <button
                            className="toggle-replies"
                            onClick={() => toggleReplies(review.id)}
                        >
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
    