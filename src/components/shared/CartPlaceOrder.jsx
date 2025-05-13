import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/CartPlaceOrder.css';
import { fetchUserInfo, updateUserInfo, sendOrderMessage } from '../shared/DeliveryUtils';
import { useNotification } from '../shared/NotificationContext';
import { wrapperFetch } from '../../utils/wrapperfetch';

const CartPlaceOrder = ({ cartItems, userId, onOrderSuccess }) => {
  // Tracks order type: 'pickup' or 'delivery'
  const [orderType, setOrderType] = useState(null);
  // Loader for order placement
  const [placingOrder, setPlacingOrder] = useState(false);
  // Delivery info for user (if order type is delivery)
  const [userInfo, setUserInfo] = useState(null);
  // Controls editing mode for delivery address
  const [editingAddress, setEditingAddress] = useState(false);
  // User note/message for the order
  const [orderNote, setOrderNote] = useState('');
  // Controls display of order success popup
  const [showOrderSuccessPopup, setShowOrderSuccessPopup] = useState(false);

  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const BASE_URL = process.env.REACT_APP_BASE_URL;

  // Static shop pickup location (replace with actual coordinates/address)
  const shopLocation = {
    address: 'Seema Enterprises, 20, New Bazar, Kurukshetra, Thanesar, Haryana 136118, India',
    googleMapsLink:
      'https://maps.app.goo.gl/PiLLRDkUXKWk4WrF7',
  };

  // If order type is 'delivery', fetch the user's delivery info
  useEffect(() => {
    const fetchInfo = async () => {
      if (orderType === 'delivery') {
        try {
          const info = await fetchUserInfo(userId);
          setUserInfo(info);
          showNotification('Delivery information fetched successfully.', 'success');
        } catch (error) {
          showNotification(error.message, 'error');
        }
      }
    };
    fetchInfo();
  }, [orderType, userId, showNotification]);

  // Handle updates to the delivery address
  const handleUpdateAddress = async (updatedInfo) => {
    try {
      const result = await updateUserInfo(userId, updatedInfo);
      if (result.success) {
        setUserInfo(updatedInfo);
        setEditingAddress(false);
        showNotification(result.message, 'success');
      }
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  // Handle placing the order and posting an order note (if provided)
  const handlePlaceOrder = async () => {
    if (!orderType) {
      showNotification('Please select an order type (Pickup or Delivery).', 'error');
      return;
    }
    setPlacingOrder(true);
    try {
      const formattedOrderType = orderType.charAt(0).toUpperCase() + orderType.slice(1);
      // Extract selected cart item IDs from cartItems prop.
      const selectedCartIds = cartItems.map((item) => item.cart_id);
      const response = await wrapperFetch(`${BASE_URL}/api/cart/place/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          delivery_type: formattedOrderType,
          cart_id: selectedCartIds,  // <-- Include the cart IDs here.
        }),
      });
      const data = await response.json();
      if (response.ok) {
        showNotification('Order placed successfully!', 'success');
        const orderId = data.order.id;
        if (orderNote.trim()) {
          const message = orderNote.trim();
          const formData = new FormData();
          formData.append('orderId', orderId);
          formData.append('sender_id', userId);
          formData.append('message', message);
          await wrapperFetch(`${BASE_URL}/api/messages/send`, {
            method: 'POST',
            body: formData,
          });
          showNotification('Order note sent successfully.', 'success');
        }
        // Show success popup rather than calling onOrderSuccess immediately.
        setShowOrderSuccessPopup(true);
      } else {
        showNotification(data.message || 'Failed to place the order.', 'error');
      }
    } catch (error) {
      console.error('Error placing the order:', error);
      showNotification('An error occurred while placing your order.', 'error');
    } finally {
      setPlacingOrder(false);
    }
  };

  // Popup actions: navigate to orders page or simply close the popup.
  const handleGoToOrders = () => {
    setShowOrderSuccessPopup(false);
    if (typeof onOrderSuccess === 'function') {
      onOrderSuccess();
    }
    navigate('/orders');
  };

  const handleClosePopup = () => {
    setShowOrderSuccessPopup(false);
    if (typeof onOrderSuccess === 'function') {
      onOrderSuccess();
    }
  };

  return (
    <div className="cart-place-order">
      <div className="order-type-selection">
        <h3>Choose Order Type</h3>
        <button
          className={`order-type-button${orderType === 'pickup' ? ' selected' : ''}`}
          onClick={() => setOrderType('pickup')}
        >
          Pickup
        </button>
        <button
          className={`order-type-button${orderType === 'delivery' ? ' selected' : ''}`}
          onClick={() => setOrderType('delivery')}
        >
          Delivery
        </button>
      </div>

      <div className="order-summary-kota">
        <h3>Order Summary</h3>
        <ul className="order-items-list">
          {cartItems.map((item) => (
            <li key={item.cart_id} className="order-item">
              <span>
                {item.product.title} (x{item.quantity})
              </span>
              <span>
                ₹{item.final_price || item.product.price * item.quantity}
              </span>
            </li>
          ))}
        </ul>
        <p className="order-type-price-kota">
          Total Price: ₹
          {cartItems
            .reduce(
              (total, item) => total + (item.final_price || item.product.price * item.quantity),
              0
            )
            .toFixed(2)}
        </p>

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
          <>
            <p className="order-type-note-kota">
              Note: Final price does not include tax or delivery charges. Payment will be coordinated by the owner soon.
            </p>
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
                    Phone Number:
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
                <>
                  <p className="order-type-delivery-address-kota">
                    <strong>Phone:</strong> {userInfo?.phone_number}
                    <br />
                    <strong>Apartment/Home Number:</strong> {userInfo?.apartment_or_home}
                    <br />
                    <strong>Address:</strong> {userInfo?.address_line_1}, {userInfo?.address_line_2},{' '}
                    {userInfo?.city}, {userInfo?.state}, {userInfo?.country}, {userInfo?.postal_code}
                  </p>
                  <button onClick={() => setEditingAddress(true)}>Edit Address</button>
                </>
              )}
            </div>
          </>
        )}

        <div className="order-note-section">
          <h3>Add a Note</h3>
          <textarea
            className="order-note"
            placeholder="Leave a message for the seller or additional instructions..."
            value={orderNote}
            onChange={(e) => setOrderNote(e.target.value)}
          ></textarea>
        </div>

        <button
          className="place-order-button"
          onClick={handlePlaceOrder}
          disabled={placingOrder || !orderType}
        >
          {placingOrder ? 'Placing Order...' : 'Confirm Order'}
        </button>
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
                Go to Orders
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPlaceOrder;
