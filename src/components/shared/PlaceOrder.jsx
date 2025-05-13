import React, { useState, useEffect } from 'react';
import '../styles/PlaceOrder.css';
import '../styles/Responsive/PlaceOrder.responsive.css';
import { useNotification } from '../shared/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { wrapperFetch } from '../../utils/wrapperfetch';

const BASE_URL = `${process.env.REACT_APP_BASE_URL}/api`;

const PlaceOrder = ({ productDetails, onClose, onOrderSuccess }) => {
  const [orderType, setOrderType] = useState(null); // Tracks 'pickup' or 'delivery'
  const [placingOrder, setPlacingOrder] = useState(false); // Loader for order placement
  const [userInfo, setUserInfo] = useState(null); // Delivery info for user
  const [editingAddress, setEditingAddress] = useState(false); // Editing mode for address
  const [quantity, setQuantity] = useState(1); // Default quantity
  const [selectedOptions, setSelectedOptions] = useState({}); // Selected options keyed by type_id
  const [userId, setUserId] = useState(null); // Manage userID dynamically
  const [orderError, setOrderError] = useState(false); // Manage order errors
  const [showOrderSuccessPopup, setShowOrderSuccessPopup] = useState(false); // Show the success popup

  // NEW: State for storing fetched combos for the product
  const [combos, setCombos] = useState([]);

  const { showNotification } = useNotification();
  const navigate = useNavigate();

  // Static shop pickup location
  const shopLocation = {
    address: 'Seema Enterprises, 20, New Bazar, Kurukshetra, Thanesar, Haryana 136118, India',
    googleMapsLink:
      'https://maps.app.goo.gl/PiLLRDkUXKWk4WrF7',
  };
  
  // Retrieve userID and check login status on mount
  useEffect(() => {
    const id = localStorage.getItem('userId');
    setUserId(id);
    if (!id) {
      showNotification('Please login to proceed.', 'error');
    }
  }, [showNotification]);

  // Fetch user delivery info if orderType is 'delivery'
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (orderType === 'delivery' && userId) {
        try {
          const response = await wrapperFetch(`${BASE_URL}/info/fetch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId }),
          });
          const data = await response.json();
          if (!response.ok)
            throw new Error(data.message || 'Failed to fetch user info.');
          setUserInfo(data.user_info);
        } catch (error) {
          showNotification(error.message, 'error');
        }
      }
    };
    fetchUserInfo();
  }, [orderType, userId, showNotification]);

  // Fetch combos for the product once productDetails is available
  useEffect(() => {
    const fetchCombos = async () => {
      try {
        const response = await wrapperFetch(
          `${BASE_URL}/type-combo/fetch/by-product/${productDetails.id}`,
          { method: 'GET' }
        );
        const data = await response.json();
        if (response.ok) {
          setCombos(data.combos || []);
        } else {
          showNotification('Failed to fetch product combos.', 'error');
        }
      } catch (error) {
        showNotification('Error fetching product combos.', 'error');
      }
    };
    if (productDetails) {
      fetchCombos();
    }
  }, [productDetails, showNotification]);

  // Handle option selection
  const handleOptionChange = (typeId, optionId) => {
    setSelectedOptions((prev) => ({ ...prev, [typeId]: optionId }));
  };

  // Handle address updates
  const handleUpdateAddress = async (updatedInfo) => {
    try {
      const response = await wrapperFetch(`${BASE_URL}/info/add/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, ...updatedInfo }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || 'Failed to update address.');
      setUserInfo(updatedInfo); // Update address info locally
      setEditingAddress(false);
      showNotification(data.message, 'success');
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  // Handle placing the order
  const handlePlaceOrder = async () => {
    if (!orderType) {
      showNotification('Please select an order type (Pickup or Delivery).', 'error');
      return;
    }
    // Validate that options are selected for all types
    const unselectedTypes =
      productDetails.types?.filter((type) => !selectedOptions[type.id]) || [];
    if (unselectedTypes.length > 0) {
      showNotification('Please select options for all available types.', 'error');
      return;
    }
    setPlacingOrder(true);
    try {
      const orderBody = {
        user_id: userId,
        items: [
          {
            product_id: productDetails.id,
            option_ids: Object.values(selectedOptions),
            quantity,
          },
        ],
        delivery_type: orderType.charAt(0).toUpperCase() + orderType.slice(1),
      };
      const response = await wrapperFetch(`${BASE_URL}/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderBody),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.error && data.error.includes('combo selected')) {
          setOrderError(data.error);
          setPlacingOrder(false);
          return;
        }
        throw new Error(data.message || 'Failed to place order.');
      }
      showNotification('Order placed successfully!', 'success');
      // Instead of auto-closing, show the success popup
      setShowOrderSuccessPopup(true);
    } catch (error) {
      showNotification(error.message || 'Failed to place order.', 'error');
    } finally {
      setPlacingOrder(false);
    }
  };

  // Handle Login Redirect
  const handleLoginRedirect = () => {
    navigate('/login');
  };

  // Success popup actions
  const handleGoToOrders = () => {
    setShowOrderSuccessPopup(false);
    onClose();
    if (typeof onOrderSuccess === 'function') {
      onOrderSuccess();
    }
    navigate('/orders');
  };

  const handleClosePopup = () => {
    setShowOrderSuccessPopup(false);
    onClose();
  };

  // Error modal for order errors
  if (orderError) {
    return (
      <div className="error-popup-overlay">
        <div className="error-container">
          <button className="error-close-button" onClick={() => setOrderError(null)}>
            &times;
          </button>
          <h2 className="error-title">Order Not Valid</h2>
          <p className="error-message">
            The selected combo is not available. Please choose a different combo.
          </p>
          <button className="retry-button" onClick={() => setOrderError(null)}>
            Okay
          </button>
        </div>
      </div>
    );
  }

  // If the user is not logged in, show a login prompt
  if (!userId) {
    return (
      <div className="place-order">
        <div className="place-order-container">
          <button className="place-order-cross-button" onClick={onClose}>
            ✖
          </button>
          <h2 className="place-order-title">Please Log In</h2>
          <button className="place-order-login-button" onClick={handleLoginRedirect}>
            Log In
          </button>
        </div>
      </div>
    );
  }

  /*
    Helper Function: isOptionAvailable
    For each type (in display order) and a candidate option, ensure that all previous types
    have a selection. Then check if there is at least one valid combo from the fetched combos
    that includes the selected options from previous types and the candidate option for the
    current type.
  */
  const isOptionAvailable = (typeIndex, optionId) => {
    const types = productDetails.types;
    // For types beyond the first, if any previous type is unselected, lock this type.
    for (let j = 0; j < typeIndex; j++) {
      if (!selectedOptions[types[j].id]) {
        return false;
      }
    }
    // If no combos are loaded, allow by default.
    if (!combos || combos.length === 0) {
      return true;
    }
    // Check if at least one combo contains both the previous selections and the candidate option.
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
        } else {
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

  return (
    <>
      <div className="place-order">
        <div className="place-order-container">
          <button className="place-order-close-button" onClick={onClose}>
            &times;
          </button>
          <h2 className="place-order-title">{productDetails.title}</h2>
          <p className="place-order-details">{productDetails.description}</p>
          <p className="place-order-details">Price: ₹{productDetails.price}</p>

          {/* Quantity Selection */}
          <div className="quantity-section">
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

          {/* Types Selection with Combo-based Option Locking */}
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

          {/* Order Type Selection */}
          <div className="place-order-type-section">
            <h3>Choose Order Type</h3>
            <button
              className={`place-order-type-button${orderType === 'pickup' ? ' selected' : ''}`}
              onClick={() => setOrderType('pickup')}
            >
              Pickup
            </button>
            <button
              className={`place-order-type-button${orderType === 'delivery' ? ' selected' : ''}`}
              onClick={() => setOrderType('delivery')}
            >
              Delivery
            </button>
          </div>

          {/* Pickup / Delivery Sections */}
          {orderType === 'pickup' && (
            <div className="pickup-location">
              <h3>Pickup Location</h3>
              <p className="order-type-address-kota">
                <strong>Address:</strong> {shopLocation.address}
              </p>
              <a
                href={shopLocation.googleMapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="get-directions-button"
              >
                Get Directions
              </a>
              <p className="order-type-note-kota">
                Note: Final price does not include tax. Payment will be coordinated by the owner soon.
              </p>
            </div>
          )}
          {orderType === 'delivery' && (
            <div className="delivery-section">
              <h3>Delivery Address</h3>
              {editingAddress ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const updatedInfo = {
                      phone_number: e.target.phone_number.value,
                      apartment_or_home: e.target.apartment_or_home.value,
                      address_line_1: e.target.address_line_1.value,
                      address_line_2: e.target.address_line_2.value,
                      city: e.target.city.value,
                      state: e.target.state.value,
                      country: e.target.country.value,
                      postal_code: e.target.postal_code.value,
                    };
                    handleUpdateAddress(updatedInfo);
                  }}
                >
                  <label>
                    Phone:
                    <input type="text" name="phone_number" defaultValue={userInfo?.phone_number} required />
                  </label>
                  <label>
                    Apartment/Home Number:
                    <input type="text" name="apartment_or_home" defaultValue={userInfo?.apartment_or_home} required />
                  </label>
                  <label>
                    Address Line 1:
                    <input type="text" name="address_line_1" defaultValue={userInfo?.address_line_1} required />
                  </label>
                  <label>
                    Address Line 2:
                    <input type="text" name="address_line_2" defaultValue={userInfo?.address_line_2} />
                  </label>
                  <label>
                    City:
                    <input type="text" name="city" defaultValue={userInfo?.city} required />
                  </label>
                  <label>
                    State:
                    <input type="text" name="state" defaultValue={userInfo?.state} required />
                  </label>
                  <label>
                    Country:
                    <input type="text" name="country" defaultValue={userInfo?.country} required />
                  </label>
                  <label>
                    Postal Code:
                    <input type="text" name="postal_code" defaultValue={userInfo?.postal_code} required />
                  </label>
                  <button type="submit">Save</button>
                  <button type="button" onClick={() => setEditingAddress(false)}>
                    Cancel
                  </button>
                </form>
              ) : (
                <div>
                  <p className="order-type-delivery-address-kota">
                    <strong>Phone:</strong> {userInfo?.phone_number}
                    <br />
                    <strong>Apartment/Home Number:</strong> {userInfo?.apartment_or_home}
                    <br />
                    <strong>Address:</strong> {userInfo?.address_line_1}, {userInfo?.address_line_2},{' '}
                    {userInfo?.city}, {userInfo?.state}, {userInfo?.country}, {userInfo?.postal_code}
                  </p>
                  <button onClick={() => setEditingAddress(true)}>Edit Address</button>
                </div>
              )}
              <p className="order-type-note-kota">
                Note: Final price does not include tax or delivery charges. Payment will be coordinated by the owner soon.
              </p>
            </div>
          )}

          {/* Order Summary */}
          <div className="order-summary">
            <h3>Order Summary</h3>
            <p className="order-type-price-kota">
              Total Price: ₹{(productDetails.price * quantity).toFixed(2)}
            </p>
          </div>

          {/* Place Order Button */}
          <button
            className="place-order-button-ojgn"
            onClick={handlePlaceOrder}
            disabled={placingOrder || !orderType}
          >
            {placingOrder ? 'Placing Order...' : 'Confirm Order'}
          </button>
        </div>
      </div>

      {/* Order Success Popup */}
      {showOrderSuccessPopup && (
        <div className="order-success-popup-overlay">
          <div className="order-success-container">
            <button className="order-success-close-button" onClick={handleClosePopup}>
              &times;
            </button>
            <h2 className="order-success-title">Order Placed Successfully!</h2>
            <p className="order-success-message">Your order has been placed.</p>
            <div className="popup-buttons-container">
              {orderType === 'pickup' && (
                <a
                  href={shopLocation.googleMapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="get-directions-button-seen"
                >
                  Get Directions
                </a>
              )}
              <button className="go-to-orders-button" onClick={handleGoToOrders}>
                Goto Orders
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PlaceOrder;
