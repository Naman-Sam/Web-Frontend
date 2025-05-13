import React, { useState, useEffect } from 'react';
import '../styles/ReviewsSection.css';
import Reviews from './Reviews'; // Import Reviews component
import '../styles/Responsive/ReviewSection.responsive.css';
import { wrapperFetch } from '../../utils/wrapperfetch';

const ReviewsSection = ({ BASE_URL, productId, showNotification }) => {
    const [reviews, setReviews] = useState([]); // Store all reviews
    const [filteredReviews, setFilteredReviews] = useState([]); // Store filtered reviews
    const [loadingReviews, setLoadingReviews] = useState(true); // Loading state
    const [error, setError] = useState(null); // Error state
    const currentUserId = localStorage.getItem('userId'); // Retrieve logged-in user ID
    const [filter, setFilter] = useState('newest'); // Default filter option: "newest"

    // Fetch Reviews
    useEffect(() => {
        const fetchReviews = async () => {
            setLoadingReviews(true);
            setError(null);

            try {
                // Fetch reviews from the API
                const response = await wrapperFetch(`${BASE_URL}/api/reviews/reviews?product_id=${productId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch reviews.');
                }

                const data = await response.json();
                const fetchedReviews = data.reviews || []; // Use empty array as fallback
                setReviews(fetchedReviews);
                setFilteredReviews(fetchedReviews); // Initialize with all reviews
            } catch (err) {
                console.error('Error fetching reviews:', err.message);
                setError('Failed to load reviews. Please try again later.');
            } finally {
                setLoadingReviews(false);
            }
        };

        fetchReviews();
    }, [BASE_URL, productId]);

    // Refresh Reviews
    const refreshReviews = async () => {
        try {
            const response = await wrapperFetch(`${BASE_URL}/api/reviews/reviews?product_id=${productId}`);
            if (!response.ok) {
                throw new Error('Failed to refresh reviews.');
            }

            const data = await response.json();
            const fetchedReviews = data.reviews || [];
            setReviews(fetchedReviews);
            applyFilter(filter, fetchedReviews); // Maintain the current filter
        } catch (err) {
            console.error('Error refreshing reviews:', err.message);
            showNotification('Failed to refresh reviews.', 'error');
        }
    };

    // Filter Reviews
    const applyFilter = (filterType, reviewsData) => {
        let sortedReviews = [...reviewsData];
        switch (filterType) {
            case 'newest':
                sortedReviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Sort by newest
                break;
            case 'oldest':
                sortedReviews.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); // Sort by oldest
                break;
            case '1-star':
                sortedReviews = reviewsData.filter((review) => review.rating === 1); // Only 1-star reviews
                break;
            case '2-star':
                sortedReviews = reviewsData.filter((review) => review.rating === 2); // Only 2-star reviews
                break;
            case '3-star':
                sortedReviews = reviewsData.filter((review) => review.rating === 3); // Only 3-star reviews
                break;
            case '4-star':
                sortedReviews = reviewsData.filter((review) => review.rating === 4); // Only 4-star reviews
                break;
            case '5-star':
                sortedReviews = reviewsData.filter((review) => review.rating === 5); // Only 5-star reviews
                break;
            default:
                sortedReviews = [...reviewsData]; // Default to all reviews
                break;
        }
        setFilteredReviews(sortedReviews); // Update state with filtered reviews
    };

    // Handle Filter Change
    const handleFilterChange = (event) => {
        const selectedFilter = event.target.value;
        setFilter(selectedFilter); // Update filter state
        applyFilter(selectedFilter, reviews); // Apply new filter
    };

    // Handle Clear Filter
    const handleClearFilter = () => {
        setFilter('newest'); // Reset to default filter
        setFilteredReviews([...reviews]); // Reset filtered reviews to all reviews
    };

    // Ensure reviews refresh after adding a new review
    const handleReviewAdded = () => {
        refreshReviews(); // Call refreshReviews to reload the reviews
    };

    return (
        <div className="reviews-section">
            <h2>Reviews</h2>

            {/* Filter Section */}
            {reviews.length > 0 && !loadingReviews && !error && (
                <div className="filter-section">
                    <label htmlFor="filter">Sort Reviews By:</label>
                    <select id="filter" value={filter} onChange={handleFilterChange}>
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="1-star">1 Star</option>
                        <option value="2-star">2 Stars</option>
                        <option value="3-star">3 Stars</option>
                        <option value="4-star">4 Stars</option>
                        <option value="5-star">5 Stars</option>
                    </select>
                    <button className="clear-filter" onClick={handleClearFilter}>
                        Clear Filter
                    </button>
                </div>
            )}

            {/* Loading/Error/Empty States */}
            {loadingReviews ? (
                <p>Loading reviews...</p>
            ) : error ? (
                <div>
                    <p className="error">{error}</p>
                    {/* Add Review Option for Logged-In Users */}
                    {currentUserId ? (
                        <Reviews
                            reviews={[]} // Pass an empty array to the Reviews component
                            BASE_URL={BASE_URL}
                            productId={productId}
                            currentUserId={currentUserId}
                            showNotification={showNotification}
                            refreshReviews={refreshReviews}
                            onReviewAdded={handleReviewAdded} // Pass handleReviewAdded to trigger refresh
                        />
                    ) : (
                        <p>You need to log in to add a review.</p>
                    )}
                </div>
            ) : reviews.length === 0 ? (
                <div>
                    <p>No reviews yet. Be the first to add a review!</p>
                    {/* Add Review Option for Logged-In Users */}
                    {currentUserId ? (
                        <Reviews
                            reviews={[]} // Pass an empty array to the Reviews component
                            BASE_URL={BASE_URL}
                            productId={productId}
                            currentUserId={currentUserId}
                            showNotification={showNotification}
                            refreshReviews={refreshReviews}
                            onReviewAdded={handleReviewAdded} // Pass handleReviewAdded to trigger refresh
                        />
                    ) : (
                        <p>You need to log in to add a review.</p>
                    )}
                </div>
            ) : (
                <Reviews
                    reviews={filteredReviews}
                    BASE_URL={BASE_URL}
                    productId={productId}
                    currentUserId={currentUserId}
                    showNotification={showNotification}
                    refreshReviews={refreshReviews}
                    onReviewAdded={handleReviewAdded} // Pass handleReviewAdded to trigger refresh
                />
            )}
        </div>
    );
};

export default ReviewsSection;
