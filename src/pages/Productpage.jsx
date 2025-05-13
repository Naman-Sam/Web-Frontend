import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/shared/Header";
import Menu from "../components/shared/Menu";
import DiscoverSection from "../components/shared/DiscoverSection";
import AddToCart from "../components/shared/AddToCart";
import ReviewsSection from "../components/shared/ReviewsSection";
import CartSlider from "../components/shared/CartSlider";
import PlaceOrder from "../components/shared/PlaceOrder";
import "../components/styles/Productpage.css";
import { useNotification } from "../components/shared/NotificationContext";
import "../components/styles/Responsive/ProductPage.responsive.css";
import { wrapperFetch } from "../utils/wrapperfetch";

const ProductPage = ({ BASE_URL, userId }) => {
  const { id: productId } = useParams(); // Extract productId from URL parameters
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  // Basic states
  const [product, setProduct] = useState(null);
  const [mainImage, setMainImage] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // selectedOptions is an array of objects like { typeId, optionId }
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [comboPrice, setComboPrice] = useState(null);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isCartOpen, setCartOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showAddToCart, setShowAddToCart] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [isBuyNowOpen, setIsBuyNowOpen] = useState(false);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);

  // NEW: State to hold the registered combos fetched from the backend.
  const [registeredCombos, setRegisteredCombos] = useState([]);

  // Toggle menu and cart slider
  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const toggleCart = () => setCartOpen((prev) => !prev);

  // Handle the share functionality
  const handleShare = async () => {
    const productLink = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.title || "Checkout this product!",
          text: "I found this product interesting. Check it out!",
          url: productLink,
        });
      } catch (error) {
        console.error("Error sharing", error);
        showNotification("Error sharing product.", "error");
      }
    } else {
      try {
        await navigator.clipboard.writeText(productLink);
        showNotification("Product link copied to clipboard!", "success");
      } catch (err) {
        console.error("Copy failed", err);
        showNotification("Failed to copy product link.", "error");
      }
    }
  };

  // Fetch product details and reviews on load
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch product details
        const productResponse = await wrapperFetch(`${BASE_URL}/api/products/fetch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: productId }),
        });
        if (!productResponse.ok)
          throw new Error("Failed to fetch product details.");
        const productData = await productResponse.json();
        setProduct(productData.product);
        setMainImage(productData.product.images[0]);

        // Fetch reviews
        const reviewsResponse = await wrapperFetch(
          `${BASE_URL}/api/reviews/reviews?product_id=${productId}`
        );
        if (reviewsResponse.status === 404) {
          setReviews([]);
        } else if (!reviewsResponse.ok) {
          throw new Error("Failed to fetch reviews.");
        } else {
          const reviewsData = await reviewsResponse.json();
          setReviews(reviewsData.reviews || []);
        }
      } catch (err) {
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [BASE_URL, productId]);

  // NEW: Fetch the registered combos for this product after the product loads.
  useEffect(() => {
    if (product) {
      const fetchCombos = async () => {
        try {
          const response = await wrapperFetch(
            `${BASE_URL}/api/type-combo/fetch/by-product/${productId}`,
            { method: "GET" }
          );
          if (!response.ok) {
            throw new Error("Failed to fetch combos.");
          }
          const data = await response.json();
          setRegisteredCombos(data.combos || []);
        } catch (err) {
          console.error("Error fetching combos:", err);
        }
      };
      fetchCombos();
    }
  }, [product, BASE_URL, productId]);

  // Helper: Calculate average rating dynamically.
  const calculateAverageRating = () => {
    if (!reviews.length) return 0;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (totalRating / reviews.length).toFixed(1);
  };

  // Helper: Count total reviews
  const totalReviewsCount = () => reviews.length;

  // Helper: Consolidated fetching of combo price from the backend.
  const fetchComboPriceFn = async () => {
    if (!product || selectedOptions.length !== product.types.length) {
      return { comboPrice: null };
    }
    setIsFetchingPrice(true);
    try {
      const response = await wrapperFetch(`${BASE_URL}/api/type-combo/fetch/price`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          options: selectedOptions.map((sel) => sel.optionId),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          return { error: "Selected variant unavailable.", unavailable: true };
        }
        return { error: data.error || "Error fetching combo price." };
      }

      if (data.combo_price === undefined || data.combo_price === null) {
        return { error: "Selected variant unavailable.", unavailable: true };
      }

      return { comboPrice: data.combo_price };
    } catch (err) {
      console.error("Error fetching combo price:", err);
      return { error: "Error fetching combo price. Please try again." };
    } finally {
      setIsFetchingPrice(false);
    }
  };

  // Handle selection of an option for a given type.
  const handleTypeOptionSelect = (typeId, optionId) => {
    const isAlreadySelected = selectedOptions.some((sel) => sel.typeId === typeId);
    if (isAlreadySelected) {
      showNotification(
        "Selection for this type is locked. Click 'Clear Selections' to change.",
        "info"
      );
      return;
    }
    setSelectedOptions((prev) => [...prev, { typeId, optionId }]);
  };

  // Handle the "Buy Now" action by opening the PlaceOrder modal.
  const handleBuyNow = () => {
    setIsBuyNowOpen(true);
  };

  // Handle the "Get Price" button click.
  const handleGetPrice = async () => {
    if (selectedOptions.length !== product?.types?.length) {
      showNotification("Please select options for all types.", "error");
      return;
    }
    const result = await fetchComboPriceFn();
    if (result.comboPrice !== undefined) {
      setComboPrice(result.comboPrice);
      showNotification("Combo price fetched successfully!", "success");
    } else {
      setComboPrice(null);
      showNotification(result.error, "error");
    }
  };

  // Clear selections and unlock all types so the user can choose a different combo.
  const handleClearSelections = () => {
    setSelectedOptions([]);
    setComboPrice(null);
  };

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
      <Header toggleMenu={toggleMenu} toggleCart={toggleCart} />
      <Menu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />

      {/* Place Order Modal Overlay */}
      {isBuyNowOpen && (
        <div className="unique-popup-overlay">
          <PlaceOrder
            productDetails={product}
            onClose={() => setIsBuyNowOpen(false)}
          />
        </div>
      )}

      {/* Cart Slider */}
      <CartSlider
        isCartOpen={isCartOpen}
        toggleCart={toggleCart}
        cartItems={cartItems}
        onRemove={(cartId) =>
          setCartItems((prevItems) =>
            prevItems.filter((item) => item.cart_id !== cartId)
          )
        }
        onUpdateQuantity={(cartId, quantity) =>
          setCartItems((prevItems) =>
            prevItems.map((item) =>
              item.cart_id === cartId ? { ...item, quantity } : item
            )
          )
        }
      />

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
              className="left-add-to-cart-button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAddToCart(true);
              }}
            >
              Add to Cart
            </button>
            <button
              className={`left-buy-now-button ${
                product && product.stock_quantity === 0
                  ? "left-buy-now-button--out-of-stock"
                  : ""
              }`}
              onClick={handleBuyNow}
              disabled={product && product.stock_quantity === 0}
            >
              Buy Now
            </button>
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
                  {"★".repeat(Math.floor(calculateAverageRating()))}
                  {"☆".repeat(5 - Math.floor(calculateAverageRating()))}(
                  {calculateAverageRating()})
                </span>
                <span className="right-total-reviews">
                  ({totalReviewsCount()} reviews)
                </span>
              </div>
              <div className="right-price">
                {product?.is_discounted ? (
                  <>
                    <span className="right-original-price">
                      ₹{product?.price.toFixed(2)}
                    </span>
                    <span className="right-discounted-price">
                      ₹{(product?.price + product?.discount_amount).toFixed(2)}
                    </span>
                  </>
                ) : (
                  <span className="right-current-price">
                    ₹{product?.price.toFixed(2)}
                  </span>
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

              {/* Types Section with Dynamic Combo Functionality */}
              {product?.types?.length > 0 && (
                <div className="types-container-umi">
                  <h2>Available Options</h2>
                  {product.types.map((type, index) => {
                    // Determine if this type is active for selection.
                    // If a selection exists, it remains locked;
                    // Otherwise, it is active if it’s the next type (i.e. index equals the number of selections).
                    const isActive = selectedOptions.find(
                      (sel) => sel.typeId === type.id
                    )
                      ? false
                      : index === selectedOptions.length;
                    // Get allowed option IDs for this type based on registered combos and previous selections.
                    const allowedOptionIds = getAllowedOptionIdsForType(type, index);

                    return (
                      <div
                        key={type.id}
                        className={`type-card ${
                          !isActive &&
                          !selectedOptions.find((sel) => sel.typeId === type.id)
                            ? "locked"
                            : ""
                        }`}
                      >
                        <h3 className="type-title-umi">
                          {type.name}{" "}
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
                              // Determine if this option is allowed based on the fetched combos.
                              const isAllowed = allowedOptionIds.has(option.id);
                              return (
                                <button
                                  key={option.id}
                                  className={`type-option-button ${
                                    isOptionSelected ? "type-option-selected" : ""
                                  } ${!isAllowed ? "option-disabled" : ""}`}
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
                      disabled={
                        isFetchingPrice ||
                        selectedOptions.length !== product?.types?.length ||
                        comboPrice !== null
                      }
                    >
                      {isFetchingPrice ? "Fetching..." : "Get Price"}
                    </button>
                    <button className="type-clear-button" onClick={handleClearSelections}>
                      <i className="fas fa-unlock" aria-label="Unlock"></i>
                    </button>
                  </div>
                  {comboPrice !== null && (
                    <div className="type-combo-price-display">
                      <h3>Combo Price:</h3>
                      <p>₹{comboPrice.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Description Section */}
              <div className="description-container">
                <h2>Description</h2>
                <p>{product?.description}</p>
              </div>
            </>
          )}

          {/* Reviews Section */}
          <ReviewsSection
            BASE_URL={BASE_URL}
            productId={productId}
            showNotification={showNotification}
          />
        </div>
      </div>

      {/* Full-Screen Image Preview */}
      {isPreviewOpen && (
        <div className="full-preview">
          <button
            className="close-preview"
            onClick={() => setIsPreviewOpen(false)}
          >
            X
          </button>
          <img
            src={mainImage}
            alt="Full Preview"
            className="full-preview-image"
          />
        </div>
      )}

      {/* Add to Cart Modal */}
      {showAddToCart && (
        <AddToCart
          productId={product?.id}
          userId={userId}
          onClose={() => setShowAddToCart(false)}
          onNotify={showNotification}
        />
      )}
    </div>
  );
};

export default ProductPage;
