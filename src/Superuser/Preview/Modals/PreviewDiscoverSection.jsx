import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // Import for navigation
import '../../../components/styles/DiscoverSection.css'; // Import styles specific to discover section
import '../../../components/styles/Responsive/DiscoverSection.responsive.css';
import { wrapperFetch } from '../../../utils/wrapperfetch';

const BASE_URL = process.env.REACT_APP_BASE_URL;


const PreviewDiscoverSection = () => {
  const [categories, setCategories] = useState([]); // State to store categories
  const [loading, setLoading] = useState(true); // State for loading indicator
  const [error, setError] = useState(null); // State for error handling
  const categoriesRef = useRef(null); // Ref for smooth scrolling
  const navigate = useNavigate(); // Hook for programmatic navigation

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true); // Start loading
    setError(null); // Reset error state

    try {
      const response = await wrapperFetch(`${BASE_URL}/api/categories/list`);
      if (!response.ok) throw new Error(`Failed to fetch categories: ${response.statusText}`);

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setCategories(data); // Update categories state
      } else {
        throw new Error('No categories found.');
      }
    } catch (error) {
      setError(error.message); // Set error message
    } finally {
      setLoading(false); // Stop loading
    }
  };

  // Smooth scrolling to the left
  const scrollLeft = () => {
    if (categoriesRef.current) {
      categoriesRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  // Smooth scrolling to the right
  const scrollRight = () => {
    if (categoriesRef.current) {
      categoriesRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // Handle category click and redirect to LoadPage with category ID
  const handleCategoryClick = (categoryId) => {
    navigate(`/preview-load?category_id=${categoryId}`);
  };

  // Determine if scrolling is possible (dynamically show/hide scroll buttons)
  const canScroll = categoriesRef.current?.scrollWidth > categoriesRef.current?.clientWidth;

  return (
    <section className="discover-section">
      <div className="discover-row">
        <h2 className="section-title-discover">
          <i className="fas fa-box-open"></i> Discover
        </h2>
        <div className="digged-container">
          {/* Left Scroll Arrow */}
          {canScroll && (
            <button
              className="scroll-arrow left-arrow"
              onClick={scrollLeft}
              aria-label="Scroll left"
              disabled={loading || error} // Disable during loading or error state
            >
              ◀
            </button>
          )}

          {/* Categories Container */}
          <div className="categories-container" ref={categoriesRef}>
            {loading ? (
              <div className="loading-spinner" aria-label="Loading categories"></div> // Loading spinner
            ) : error ? (
              <div className="error-container">
                <p className="error-message">{error}</p>
                <button className="retry-button" onClick={fetchCategories} aria-label="Retry">
                  Retry
                </button>
              </div>
            ) : categories.length === 0 ? (
              <p className="empty-message">No categories available. Check back later!</p>
            ) : (
              <div className="categories" role="list">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="category-item"
                    onClick={() => handleCategoryClick(category.id)} // Redirect to LoadPage
                    role="listitem"
                    tabIndex="0" // Make it keyboard-navigable
                    onKeyDown={(e) => e.key === 'Enter' && handleCategoryClick(category.id)}
                  >
                    {category.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Scroll Arrow */}
          {canScroll && (
            <button
              className="scroll-arrow right-arrow"
              onClick={scrollRight}
              aria-label="Scroll right"
              disabled={loading || error} // Disable during loading or error state
            >
              ▶
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default PreviewDiscoverSection;
