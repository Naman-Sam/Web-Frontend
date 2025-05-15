import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../SuperShare/SuperHeader';
import Menu from '../SuperShare/SuperMenu';
import DiscoverSection from '../Preview/Modals/PreviewDiscoverSection';
import ReviewsSection from '../Preview/Modals/PreviewReviewSection';
import '../../components/styles/Productpage.css';
import { useNotification } from '../../components/shared/NotificationContext';
import '../../components/styles/Responsive/ProductPage.responsive.css';
import AddToCart from '../../components/shared/AddToCart';
// Remain imported if used elsewhere
import { wrapperFetch } from '../../utils/wrapperfetch';

const PreviewProductPage = ({ BASE_URL, userId }) => {
  const { id: productId } = useParams(); // Extract productId from URL parameters
  const navigate = useNavigate();

  // States for product details, reviews, selected options, combo price, and menu/preview states.
  const [product, setProduct] = useState(null);
  const [mainImage, setMainImage] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]); // Track user-selected options
  const [comboPrice, setComboPrice] = useState(null); // Price for selected combo

  // Removed states related to CartSlider, BuyNow, and AddToCart here
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // NEW: State to store registered combos for dynamic option filtering
  const [registeredCombos, setRegisteredCombos] = useState([]);

  // Global notification context
  const { showNotification } = useNotification();

  // Toggle the menu
  const toggleMenu = () => setMenuOpen((prevState) => !prevState);

  // Handle share functionality
  const handleShare = async () => {
    const productLink = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.title || 'Checkout this product!',
          text: 'I found this product interesting. Have a look!',
          url: productLink,
        });
      } catch (error) {
        console.error('Error sharing', error);
        showNotification('Error sharing product.', 'error');
      }
    } else {
      try {
        await navigator.clipboard.writeText(productLink);
        showNotification('Product link copied to clipboard!', 'success');
      } catch (err) {
        console.error('Copy failed', err);
        showNotification('Failed to copy product link.', 'error');
      }
    }
  };

  // Fetch product details and reviews
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch product details
        const productResponse = await wrapperFetch(`${BASE_URL}/api/products/fetch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: productId }),
        });
        if (!productResponse.ok) throw new Error('Failed to fetch product details.');
        const productData = await productResponse.json();
        setProduct(productData.product);
        setMainImage(productData.product.images[0]);

        // Fetch reviews
        const reviewsResponse = await wrapperFetch(`${BASE_URL}/api/reviews/reviews?product_id=${productId}`);
        if (reviewsResponse.status === 404) {
          setReviews([]);
        } else if (!reviewsResponse.ok) {
          throw new Error('Failed to fetch reviews.');
        } else {
          const reviewsData = await reviewsResponse.json();
          setReviews(reviewsData.reviews || []);
        }
      } catch (err) {
        setError('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [BASE_URL, productId]);

  // Fetch registered combos for dynamic option filtering after product loads.
  useEffect(() => {
    if (product) {
      const fetchCombos = async () => {
        try {
          const response = await wrapperFetch(
            `${BASE_URL}/api/type-combo/fetch/by-product/${productId}`,
            { method: 'GET' }
          );
          if (!response.ok) {
            throw new Error('Failed to fetch combos.');
          }
          const data = await response.json();
          setRegisteredCombos(data.combos || []);
        } catch (err) {
          console.error('Error fetching combos:', err);
        }
      };
      fetchCombos();
    }
  }, [product, BASE_URL, productId]);

  // Fetch combo price when user selects options (if fully selected)
  useEffect(() => {
    const fetchComboPrice = async () => {
      if (!product || selectedOptions.length === 0 || selectedOptions.length !== product.types.length) {
        return;
      }
      try {
        const response = await wrapperFetch(`${BASE_URL}/api/type-combo/fetch/price`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: productId,
            options: selectedOptions.map((selection) => selection.optionId),
          }),
        });
        if (!response.ok) throw new Error('Failed to fetch combo price.');
        const data = await response.json();
        setComboPrice(data.combo_price || null);
      } catch (err) {
        showNotification('Error fetching combo price. Please try again.', 'error');
        setComboPrice(null);
      }
    };
    fetchComboPrice();
  }, [selectedOptions, product, productId, BASE_URL, showNotification]);

  // Handle selection of an option for a given type with lock functionality.
  const handleTypeOptionSelect = (typeId, optionId) => {
    // Only allow selection if no selection exists for this type.
    const alreadySelected = selectedOptions.some((selection) => selection.typeId === typeId);
    if (alreadySelected) {
      showNotification("Selection for this type is locked. Click 'Clear Selections' to change.", 'info');
      return;
    }
    setSelectedOptions((prevSelected) => {
      // Update: remove any previous selection for this type then add the new one.
      const updatedSelections = prevSelected.filter((selection) => selection.typeId !== typeId);
      return [...updatedSelections, { typeId, optionId }];
    });
  };

  // Handle the "Get Price" button click.
  const handleGetPrice = async () => {
    if (selectedOptions.length !== product?.types?.length) {
      showNotification('Please select options for all types.', 'error');
      return;
    }
    try {
      const response = await wrapperFetch(`${BASE_URL}/api/type-combo/fetch/price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          options: selectedOptions.map((selection) => selection.optionId),
        }),
      });
      const data = await response.json();
      if (response.status !== 200) {
        setComboPrice(null);
        showNotification(data.error, 'error');
        return;
      }
      setComboPrice(data.combo_price || null);
    } catch (err) {
      showNotification('Error fetching combo price. Please try again.', 'error');
      setComboPrice(null);
    }
  };

  // Handle the "Clear Selections" button click.
  const handleClearSelections = () => {
    setSelectedOptions([]);
    setComboPrice(null);
  };

  // Calculate average rating dynamically.
  const calculateAverageRating = () => {
    if (!reviews.length) return 0;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (totalRating / reviews.length).toFixed(1);
  };

  // Count total reviews dynamically.
  const totalReviewsCount = () => reviews.length;

  // NEW: Helper to determine allowed option IDs for a given type based on registered combos and previous selections.
  const getAllowedOptionIdsForType = (type, typeIndex) => {
    // If no combos are fetched, allow all options for this type.
    if (!registeredCombos || registeredCombos.length === 0) {
      return new Set(
        product.options
          .filter((option) => option.type_id === type.id)
          .map((option) => option.id)
      );
    }
    // Ensure previous types have been selected; if not, no options are allowed.
    for (let i = 0; i < typeIndex; i++) {
      if (!selectedOptions.find((sel) => sel.typeId === product.types[i].id)) {
        return new Set();
      }
    }
    // Narrow down valid combos based on previous selections.
    let validCombos = registeredCombos;
    for (let i = 0; i < typeIndex; i++) {
      const prevType = product.types[i];
      const selected = selectedOptions.find((sel) => sel.typeId === prevType.id);
      if (selected) {
        validCombos = validCombos.filter((combo) =>
          combo.options.includes(selected.optionId)
        );
      }
    }
    // For the current type, allowed option IDs are those found in any valid combo.
    const allowed = new Set();
    product.options
      .filter((option) => option.type_id === type.id)
      .forEach((option) => {
        validCombos.forEach((combo) => {
          if (combo.options.includes(option.id)) {
            allowed.add(option.id);
          }
        });
      });
    return allowed;
  };

  return (
    <div className="product-page">
      {/* Header and Menu */}
      <Header toggleMenu={toggleMenu} />
      <Menu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />

      {/* Discover Section */}
      <DiscoverSection />

      <div className="content-container">
        {/* Left Section */}
        <div className="left-section">
          <button className="left-back-button" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <div className="thumbnails-wrapper">
          <div className="left-thumbnails">
            {product?.images?.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="left-thumbnail"
                onClick={() => setMainImage(image)}
              />
            ))}
          </div>
          </div>
          <img
            src={mainImage}
            alt="Main Product"
            className="left-main-image"
            onClick={() => setIsPreviewOpen(true)}
          />
          <div className="left-action-buttons">
            <button
              className="left-edit-product-button-preview"
              onClick={() => navigate(`/product-edit/${product?.id}`)}
            >
              Edit Product
            </button>
            <p className="product-id-display-preview">ProductID: {product?.id}</p>
            <button className="product-share-button" onClick={handleShare}>
              <i className="fas fa-share"></i>
            </button>
          </div>
        </div>
        {/* Right Section */}
        <div className="right-section">
          {loading ? (
            <p>Loading product details...</p>
          ) : error ? (
            <p>{error}</p>
          ) : (
            <>
              <h1 className="right-product-title">{product?.title}</h1>
              <div className="right-meta">
                <span className="right-rating">
                  {'★'.repeat(Math.floor(calculateAverageRating()))}
                  {'☆'.repeat(5 - Math.floor(calculateAverageRating()))} ({calculateAverageRating()})
                </span>
                <span className="right-total-reviews">({totalReviewsCount()} reviews)</span>
              </div>
              <div className="right-price">
                {product?.is_discounted ? (
                  <>
                  <span className="right-original-price">
                  ₹{(product?.price + product?.discount_amount).toFixed(2)}
                  </span>
                  <span className="right-discounted-price">
                  ₹{product?.price.toFixed(2)}
                  </span>
                </>
                ) : (
                  <span className="right-current-price">₹{product?.price.toFixed(2)}</span>
                )}
                {product?.types?.length > 0 && (
                  <p className="right-combo-note">
                    This is the base price. Select options below to see actual pricing.
                  </p>
                )}
              </div>
              {!loading && product && product.stock_quantity === 0 && (
                <div className="stock-status">
                  <p className="out-of-stock-label">Out of Stock</p>
                </div>
              )}

              {/* Types Section with Dynamic Combo and Lock Functionality */}
              <div className="types-container-umi">
                <h2>Available Options</h2>
                {product?.types?.map((type, index) => {
                  // Determine if this type is active for selection:
                  // Active if no selection exists and if index equals number of selections made.
                  const isActive = selectedOptions.find((sel) => sel.typeId === type.id)
                    ? false
                    : index === selectedOptions.length;
                  // Get allowed option IDs for this type based on registered combos and previous selections.
                  const allowedOptionIds = getAllowedOptionIdsForType(type, index);
                  return (
                    <div
                      key={type.id}
                      className={`type-card ${
                        !isActive && !selectedOptions.find((sel) => sel.typeId === type.id)
                          ? 'locked'
                          : ''
                      }`}
                    >
                      <h3 className="type-title-umi">
                        {type.name}{' '}
                        {!isActive ? (
                          <i className="fas fa-lock" aria-label="Locked"></i>
                        ) : (
                          <i className="fas fa-unlock" aria-label="Unlocked"></i>
                        )}
                      </h3>
                      <div className="options-container">
                        {product.options
                          .filter((option) => option.type_id === type.id)
                          .map((option) => {
                            const isOptionSelected = selectedOptions.some(
                              (sel) =>
                                sel.typeId === type.id &&
                                sel.optionId === option.id
                            );
                            const isAllowed = allowedOptionIds.has(option.id);
                            return (
                              <button
                                key={option.id}
                                className={`type-option-button ${
                                  isOptionSelected ? 'type-option-selected' : ''
                                } ${!isAllowed ? 'option-disabled' : ''}`}
                                onClick={() => {
                                  if (!isActive) return;
                                  if (!isAllowed) return;
                                  handleTypeOptionSelect(type.id, option.id);
                                }}
                                disabled={!isActive || !isAllowed}
                              >
                                {option.name}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  );
                })}
                {/* Actions */}
                <div className="type-actions-container">
                  <button
                    className="type-get-price-button"
                    onClick={handleGetPrice}
                    disabled={selectedOptions.length !== product?.types?.length}
                  >
                    Get Price
                  </button>
                  <button className="type-clear-button" onClick={handleClearSelections}>
                      <i className="fas fa-unlock" aria-label="Unlock"></i>
                    </button>
                </div>
                {comboPrice !== null && (
                  <div className="type-combo-price-display">
                    <h3>Price:</h3>
                    <p>₹{comboPrice.toFixed(2)}</p>
                  </div>
                )}
              </div>

              {/* Description Section */}
              <div className="description-container">
                <h2>Description</h2>
                <p>{product?.description}</p>
              </div>
            </>
          )}
          <ReviewsSection BASE_URL={BASE_URL} productId={productId} showNotification={showNotification} />
        </div>
      </div>

      {/* Full-Screen Image Preview */}
      {isPreviewOpen && (
        <div className="full-preview">
          <button className="close-preview" onClick={() => setIsPreviewOpen(false)}>
            X
          </button>
          <img src={mainImage} alt="Full Preview" className="full-preview-image" />
        </div>
      )}
    </div>
  );
};

export default PreviewProductPage;
