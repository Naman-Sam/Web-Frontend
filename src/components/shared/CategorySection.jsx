import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // Import navigation hook
import AddToCart from './AddToCart'; // Import AddToCart component
import '../styles/CategorySection.css'; // Styling for Category Section
import '../styles/Responsive/CategorySection.responsive.css';
import { wrapperFetch } from '../../utils/wrapperfetch';

const CategorySection = ({ BASE_URL, userId }) => {
  const [categories, setCategories] = useState([]); // All categories
  const [usedCategoryIds, setUsedCategoryIds] = useState([]); // Track used category IDs
  const [currentCategory, setCurrentCategory] = useState(null); // Current category
  const [categoryProducts, setCategoryProducts] = useState([]); // Current category products
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error handling
  const [showAddToCart, setShowAddToCart] = useState(null); // Track AddToCart modal visibility
  const productsContainerRef = useRef(null); // Ref for horizontal scrolling container
  const navigate = useNavigate(); // Initialize navigation hook

  // Fetch all categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      setError(null);
      setLoading(true);

      try {
        const response = await wrapperFetch(`${BASE_URL}/categories/list`);
        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.status}`);
        }
        const fetchedCategories = await response.json();
        setCategories(fetchedCategories);
      } catch (err) {
        console.error('Error fetching categories:', err.message);
        setError('Failed to load categories.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [BASE_URL]);

  // Function to select a random category and fetch its products
  const selectRandomCategory = async () => {
    if (!categories.length) return;

    try {
      const availableCategories = categories.filter(
        (category) => !usedCategoryIds.includes(category.id)
      );

      if (!availableCategories.length) {
        setError("No more categories to display.");
        return;
      }

      const randomCategory =
        availableCategories[Math.floor(Math.random() * availableCategories.length)];
      setCurrentCategory(randomCategory);
      setUsedCategoryIds((prev) => [...prev, randomCategory.id]);

      await fetchCategoryProducts(randomCategory.id);

      // Reset used categories after cycling through all
      if (usedCategoryIds.length + 1 === categories.length) {
        setUsedCategoryIds([]); // Clear used categories for continuous cycling
      }
    } catch (err) {
      console.error('Error selecting category:', err.message);
      setError('Failed to load category and products.');
    }
  };

  // Function to fetch products for the selected category
  const fetchCategoryProducts = async (categoryId) => {
    setLoading(true);
    setCategoryProducts([]); // Clear previous products
    setError(null);

    try {
      const response = await wrapperFetch(`${BASE_URL}/categories/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: categoryId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products for category ID: ${categoryId}`);
      }

      const productsData = await response.json();
      setCategoryProducts(productsData.products || []);
    } catch (err) {
      console.error('Error fetching products:', err.message);
      setError('Failed to load products for this category.');
    } finally {
      setLoading(false);
    }
  };

  // Horizontal scrolling logic
  const handleScroll = (direction) => {
    if (productsContainerRef.current) {
      productsContainerRef.current.scrollBy({
        left: direction === 'left' ? -200 : 200,
        behavior: 'smooth',
      });
    }
  };

  // Trigger category switching on component mount and at intervals
  useEffect(() => {
    if (categories.length) selectRandomCategory();
    const interval = setInterval(() => {
      selectRandomCategory();
    }, 8000); // Switch category every 8 seconds
    return () => clearInterval(interval); // Cleanup on component unmount
  }, [categories]);

  // Handle product card click to navigate to product details
  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`); // Navigate to the product details page
  };

  return (
    <section className="category-section">
      <h2 className="section-title">
        <i className="fas fa-th-large"></i>{' '}
        {currentCategory?.name || 'Category'}
      </h2>

      {loading ? (
        <p className="loading-message">Loading...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : categoryProducts.length > 0 ? (
        <div className="categories-container">
          {/* Left scroll button */}
          <button
            className="arrow-btn left-arrow"
            onClick={() => handleScroll('left')}
            aria-label="Scroll left"
          >
            <i className="fas fa-chevron-left"></i>
          </button>

          {/* Horizontal scroll container */}
          <div className="products-horizontal-scroll" ref={productsContainerRef}>
            {categoryProducts.map((product) => (
              <div
                key={product.id}
                className="product-card"
                onClick={() => handleProductClick(product.id)} // Add click handler for navigation
              >
                <div className="product-image-container">
                  {product.is_discounted && product.discount_amount && (
                    <span className="discount-badge">Save ₹{product.discount_amount}</span>
                  )}
                  <img
                    src={product.images?.[0] || 'https://via.placeholder.com/250'}
                    alt={product.title}
                    className="product-image"
                  />
                </div>
                <h3 className="product-title">{product.title}</h3>
                <div className="product-info">
                  {product.is_discounted && product.discount_amount ? (
                    <p className="product-price">
                      <span className="original-price">₹{product.price.toFixed(2)}</span> ₹{(
                        product.price - product.discount_amount
                      ).toFixed(2)}
                    </p>
                  ) : (
                    <p className="product-price">₹{product.price.toFixed(2)}</p>
                  )}
                  <button
                    className="cart-button"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent navigation on cart button click
                      setShowAddToCart(product.id); // Track selected product for AddToCart modal
                    }}
                  >
                    <i className="fas fa-shopping-cart"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Right scroll button */}
          <button
            className="arrow-btn right-arrow"
            onClick={() => handleScroll('right')}
            aria-label="Scroll right"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      ) : (
        <p className="error-message">No products found for this category.</p>
      )}

      {/* AddToCart Modal */}
      {showAddToCart && (
        <AddToCart
          productId={showAddToCart} // Pass selected product ID
          userId={userId} // Pass user ID
          onClose={() => setShowAddToCart(null)} // Close modal
        />
      )}
    </section>
  );
};

export default CategorySection;
