import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import CartProductCard from './CartProductCardhome'; // Import CartProductCard for product items
import '../styles/CartSlider.css';
import { useNotification } from '../shared/NotificationContext';
import '../styles/Responsive/CartSlider.responsive.css';
import { wrapperFetch } from '../../utils/wrapperfetch';

const CartSlider = ({ isCartOpen, toggleCart }) => {
  const BASE_URL = process.env.REACT_APP_BASE_URL; // Base URL
  const [cartItems, setCartItems] = useState([]); // State for cart items
  const [loading, setLoading] = useState(false); // State for loading indicator
  const { showNotification } = useNotification(); // Access notification context
  const navigate = useNavigate(); // Initialize navigate function

  // Fetch cart items when the slider is opened
  useEffect(() => {
    const fetchCartItems = async () => {
      setLoading(true); // Show loading indicator

      const userId = localStorage.getItem('userId'); // Retrieve userId directly from localStorage
      if (!userId) {
        showNotification('Please log in to view your cart.', 'error');
        setCartItems([]); // Clear cart items if user is not logged in
        setLoading(false);
        return;
      }

      try {
        const response = await wrapperFetch(`${BASE_URL}/api/cart/fetch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId }),
        });

        const data = await response.json();
        if (response.ok) {
          setCartItems(data.cart_items || []); // Set fetched cart items
          showNotification('Cart load successfully!', 'success');
        } else {
          showNotification(data.message || 'Failed to fetch cart items.', 'error');
          setCartItems([]); // Clear cart items on failure
        }
      } catch (error) {
        console.error('Error fetching cart items:', error);
        showNotification('An error occurred while fetching cart items.', 'error');
        setCartItems([]); // Clear cart items on error
      } finally {
        setLoading(false); // Hide loading indicator
      }
    };

    if (isCartOpen) {
      fetchCartItems();
    }
  }, [isCartOpen, BASE_URL, showNotification]);

  // Function to remove a cart item in the backend and update the UI
  const handleRemoveItem = async (cartId) => {
    const userId = localStorage.getItem('userId'); // Get userId from localStorage
    try {
      const response = await wrapperFetch(`${BASE_URL}/api/cart/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, cart_item_id: cartId }),
      });

      if (response.ok) {
        setCartItems((prevItems) => prevItems.filter((item) => item.cart_id !== cartId)); // Update local cart
        showNotification('Item removed from the cart.', 'success');
      } else {
        const data = await response.json();
        showNotification(data.message || 'Failed to remove item from cart.', 'error');
      }
    } catch (error) {
      console.error('Error removing item from cart:', error);
      showNotification('An error occurred while removing the item.', 'error');
    }
  };

  // Function to update the quantity in the backend and update the UI
  const handleUpdateQuantity = async (cartId, newQuantity) => {
    const userId = localStorage.getItem('userId'); // Get userId from localStorage
    try {
      const response = await wrapperFetch(`${BASE_URL}/api/cart/update-quantity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, cart_id: cartId, quantity: newQuantity }),
      });

      const data = await response.json();
      if (response.ok) {
        setCartItems((prevItems) =>
          prevItems.map((item) =>
            item.cart_id === cartId ? { ...item, quantity: data.cart_item.quantity, final_price: data.cart_item.final_price } : item
          )
        ); // Update local cart
        showNotification('Quantity updated successfully!', 'success');
      } else {
        showNotification(data.message || 'Failed to update quantity.', 'error');
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      showNotification('An error occurred while updating quantity.', 'error');
    }
  };

  return (
    <div className={`cart-container ${isCartOpen ? 'open' : ''}`}>
      {/* Close Button */}
      <button className="close-button" onClick={toggleCart}>
        <i className="fas fa-times"></i>
      </button>

      {/* Header */}
      <h2 className="cart-header">Your Cart</h2>

      {/* Cart Items Section */}
      <div className="cart-items-section">
        {loading ? (
          <p className="loading-message">Loading cart items...</p>
        ) : cartItems.length === 0 ? (
          <p className="empty-cart-message">Your cart is empty.</p>
        ) : (
          cartItems.map((cartItem) => (
            <CartProductCard
              key={cartItem.cart_id}
              cartItem={cartItem}
              onRemove={handleRemoveItem} // Pass backend remove logic to CartProductCard
              onUpdateQuantity={handleUpdateQuantity} // Pass backend update logic to CartProductCard
            />
          ))
        )}
      </div>

      {/* Go to Cart Button */}
      <div className="go-to-cart-section">
        <button className="go-to-cart-button" onClick={() => navigate('/cart')}>
          Go to Cart
        </button>
      </div>
    </div>
  );
};

export default CartSlider;
