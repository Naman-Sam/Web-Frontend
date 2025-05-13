import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from './NotificationContext';
import '../styles/AddToCart.css'; // Ensure unique styles
import { wrapperFetch } from '../../utils/wrapperfetch';

const BASE_URL = process.env.REACT_APP_BASE_URL;

const AddToCart = ({ productId, onClose, onNotify }) => {
  // Use global notification; if onNotify is provided, use that instead.
  const { showNotification: globalShowNotification } = useNotification();
  const notify = onNotify || globalShowNotification;

  const [productDetails, setProductDetails] = useState(null); // Store product details
  const [combos, setCombos] = useState([]); // Store fetched combos for the product
  const [quantity, setQuantity] = useState(1); // Default quantity
  const [selectedOptions, setSelectedOptions] = useState({}); // Selected options keyed by type_id
  const [loading, setLoading] = useState(false); // Loading state
  const [showLoginPrompt, setShowLoginPrompt] = useState(false); // Control login prompt visibility
  const [comboError, setComboError] = useState(false); // Track combo availability errors

  const navigate = useNavigate();
  const userId = localStorage.getItem('userId'); // Retrieve userId from localStorage

  // 1. On mount, if user is logged in fetch product details; otherwise, prompt login.
  useEffect(() => {
    if (!userId) {
      setShowLoginPrompt(true);
    } else {
      fetchProductDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // 2. Fetch product details.
  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      const response = await wrapperFetch(`${BASE_URL}/api/products/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch product details.');
      }

      const data = await response.json();
      setProductDetails(data.product); // Store product details
    } catch (err) {
      notify('Failed to load product details. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 3. Once productDetails are loaded, fetch available combos.
  useEffect(() => {
    if (productDetails) {
      fetchCombos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productDetails]);

  // 4. Fetch combos for the product.
  const fetchCombos = async () => {
    try {
      const response = await wrapperFetch(`${BASE_URL}/api/type-combo/fetch/by-product/${productId}`, {
        method: 'GET',
      });
      const data = await response.json();
      if (response.ok) {
        setCombos(data.combos || []);
      } else {
        notify('Failed to fetch product combos.', 'error');
      }
    } catch (err) {
      console.error(err);
      notify('Error fetching product combos.', 'error');
    }
  };

  // 5. Add to cart flow.
  const handleAddToCart = async () => {
    if (!userId) {
      setShowLoginPrompt(true);
      notify('Please login to add items to your cart.', 'error');
      return;
    }

    // Validate that options are selected for all types.
    const unselectedTypes =
      productDetails && productDetails.types
        ? productDetails.types.filter((type) => !selectedOptions[type.id])
        : [];
    if (unselectedTypes.length > 0) {
      notify('Please select options for all available types.', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await wrapperFetch(`${BASE_URL}/api/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          product_id: productId,
          option_ids: Object.values(selectedOptions), // Pass selected option IDs
          quantity, // Quantity
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'The selected combo is not available.') {
          setComboError(true); // Show combo error modal
          return;
        }
        throw new Error(data.message || 'Failed to add product to cart.');
      }

      notify(data.message || 'Product successfully added to cart!', 'success');
      onClose();
    } catch (err) {
      notify(err.message || 'Failed to add product to cart. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (typeId, optionId) => {
    setSelectedOptions((prev) => ({ ...prev, [typeId]: optionId }));
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  /*
    Helper Function: isOptionAvailable
    ----------------------------------------------------
    For each type (in the order displayed) and a candidate option,
    determine if there is at least one valid combo that – when combined
    with all selections for previous types – includes the candidate option.
  
    Additionally, if any previous type (j from 0 to typeIndex-1) does not have
    a selection, then for the current type we return false. Thus, only the first type
    is always enabled, and subsequent types remain locked (greyed out) until prior
    selections are made.
  */
  const isOptionAvailable = (typeIndex, optionId) => {
    const types = productDetails.types;

    // For all types beyond the first, if previous types are not selected, lock this type.
    for (let j = 0; j < typeIndex; j++) {
      if (!selectedOptions[types[j].id]) {
        return false;
      }
    }

    if (!combos || combos.length === 0) {
      return true;
    }

    for (const combo of combos) {
      let valid = true;
      for (let j = 0; j <= typeIndex; j++) {
        const currentTypeId = types[j].id;
        if (j < typeIndex) {
          const selectedOption = selectedOptions[currentTypeId];
          if (selectedOption && !combo.options.includes(selectedOption)) {
            valid = false;
            break;
          }
        } else if (j === typeIndex) {
          if (!combo.options.includes(optionId)) {
            valid = false;
            break;
          }
        }
      }
      if (valid) return true;
    }
    return false;
  };

  if (loading) {
    return (
      <div className="unique-popup-overlay">
        <div className="unique-add-to-cart-container">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Combo error modal: prompt user to choose a different combo */}
      {comboError && productDetails && (
        <div className="unique-popup-overlay">
          <div className="unique-add-to-cart-container">
            <button className="unique-close-button" onClick={() => setComboError(false)}>
              &times;
            </button>
            <h2 className="unique-add-to-cart-title">Combo Not Available</h2>
            <p className="unique-product-details">
              The selected combo is not available. Please choose a different combo.
            </p>
            <div className="unique-types-container">
              <h3>Choose Available Options:</h3>
              {productDetails.types.map((type, index) => (
                <div key={type.id}>
                  <h4>{type.name}</h4>
                  <ul className="unique-options-list">
                    {productDetails.options
                      .filter((option) => option.type_id === type.id)
                      .map((option) => {
                        const available = isOptionAvailable(index, option.id);
                        return (
                          <li key={option.id}>
                            <input
                              type="radio"
                              id={`unique-option-${option.id}`}
                              name={`unique-type-${type.id}`} // Group options by type
                              value={option.id}
                              onChange={() => handleOptionChange(type.id, option.id)}
                              checked={selectedOptions[type.id] === option.id}
                              disabled={!available} // Disable if not in any valid combo or if previous types remain unselected
                            />
                            <label
                              htmlFor={`unique-option-${option.id}`}
                              className={!available ? 'disabled-option' : ''}
                            >
                              {option.name}
                            </label>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              ))}
            </div>
            <div className="unique-modal-buttons">
              <button
                className="unique-add-to-cart-button"
                onClick={handleAddToCart}
                disabled={loading}
              >
                Try Again
              </button>
              <button className="unique-cancel-button" onClick={onClose}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login prompt modal */}
      {showLoginPrompt && (
        <div className="unique-popup-overlay">
          <div className="unique-add-to-cart-container">
            <button className="unique-close-button" onClick={onClose}>
              &times;
            </button>
            <h2 className="unique-add-to-cart-title">Login Required</h2>
            <p className="unique-product-details">
              You must log in to add items to your cart.
            </p>
            <div className="unique-modal-buttons">
              <button className="unique-add-to-cart-button" onClick={handleLoginRedirect}>
                Login
              </button>
              <button className="unique-cancel-button" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main modal: display product details and let user choose options */}
      {!showLoginPrompt && productDetails && !comboError && (
        <div className="unique-popup-overlay">
          <div className="unique-add-to-cart-container">
            <button className="unique-close-button" onClick={onClose}>
              &times;
            </button>
            <h2 className="unique-add-to-cart-title">{productDetails.title}</h2>
            <p className="unique-product-details">{productDetails.description}</p>
            <p className="unique-product-details">
              Price: ₹{productDetails.price}
              {productDetails.is_discounted && (
                <> (Discounted Price: ₹{productDetails.price - productDetails.discount_amount})</>
              )}
            </p>
            <div className="unique-quantity-container">
              <label htmlFor="quantity">Quantity:</label>
              <input
                id="quantity"
                type="number"
                value={quantity}
                min="1"
                max={productDetails.stock_quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
              />
            </div>
            <div className="unique-types-container">
              <h3>Available Types:</h3>
              {productDetails.types.map((type, index) => (
                <div key={type.id}>
                  <h4>{type.name}</h4>
                  <ul className="unique-options-list">
                    {productDetails.options
                      .filter((option) => option.type_id === type.id)
                      .map((option) => {
                        const available = isOptionAvailable(index, option.id);
                        return (
                          <li key={option.id}>
                            <input
                              type="radio"
                              id={`unique-option-${option.id}`}
                              name={`unique-type-${type.id}`}
                              value={option.id}
                              onChange={() => handleOptionChange(type.id, option.id)}
                              checked={selectedOptions[type.id] === option.id}
                              disabled={!available}
                            />
                            <label
                              htmlFor={`unique-option-${option.id}`}
                              className={!available ? 'disabled-option' : ''}
                            >
                              {option.name}
                            </label>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              ))}
            </div>
            <div className="unique-modal-buttons">
              <button
                className="unique-add-to-cart-button"
                onClick={handleAddToCart}
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add to Cart'}
              </button>
              <button className="unique-cancel-button" onClick={onClose}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddToCart;
