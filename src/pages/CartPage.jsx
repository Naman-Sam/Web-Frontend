import React, { useState, useEffect } from 'react';
import Header from '../components/shared/Header';
import Menu from '../components/shared/Menu';
import CartProductCard from '../components/shared/CartProductCard';
import CartPlaceOrder from '../components/shared/CartPlaceOrder';
import '../components/styles/CartPage.css';
import { useNotification } from '../components/shared/NotificationContext';
import '../components/styles/Responsive/CartPage.responsive.css';
import { wrapperFetch } from '../utils/wrapperfetch';

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  // State to track selected cart item IDs
  const [selectedCartIds, setSelectedCartIds] = useState([]);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const userId = localStorage.getItem('userId');
  const { showNotification } = useNotification();
  const BASE_URL = process.env.REACT_APP_BASE_URL;

  // Fetch cart items from the server
  const fetchCartItems = async () => {
    if (!userId) {
      showNotification('Please log in to view your cart.', 'error');
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
        setCartItems(data.cart_items || []);
        showNotification('Cart loaded successfully!', 'success');
      } else {
        showNotification(data.message || 'Failed to fetch cart items.', 'error');
      }
    } catch (error) {
      console.error('Error fetching cart items:', error);
      showNotification('An error occurred while fetching cart items.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch username from local storage and cart items on mount
  useEffect(() => {
    const storedUserName = localStorage.getItem('username');
    if (storedUserName) {
      setUserName(storedUserName);
    }
    fetchCartItems();
  }, [userId, showNotification]);

  // Remove an item from the cart
  const handleRemoveItem = async (cartId) => {
    try {
      const response = await wrapperFetch(`${BASE_URL}/api/cart/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, cart_item_id: cartId }),
      });
      if (response.ok) {
        // Update the local state by removing the ordered item
        setCartItems((prevItems) => prevItems.filter((item) => item.cart_id !== cartId));
        // Also remove from selected items if it exists
        setSelectedCartIds((prevIds) => prevIds.filter((id) => id !== cartId));
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

  // Update quantity for an item in the cart
  const handleUpdateQuantity = async (cartId, newQuantity) => {
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
            item.cart_id === cartId
              ? { ...item, quantity: data.cart_item.quantity, final_price: data.cart_item.final_price }
              : item
          )
        );
        showNotification('Quantity updated successfully!', 'success');
      } else {
        showNotification(data.message || 'Failed to update quantity.', 'error');
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      showNotification('An error occurred while updating quantity.', 'error');
    }
  };

  // Handle checkbox selection coming from CartProductCard
  const handleSelectChange = (cartId, isSelected) => {
    setSelectedCartIds((prev) => {
      if (isSelected) {
        return [...prev, cartId];
      } else {
        return prev.filter((id) => id !== cartId);
      }
    });
  };

  // Derive items selected for order placement
  const selectedItems = cartItems.filter((item) => selectedCartIds.includes(item.cart_id));

  // Check if any selected item is out of stock
  const hasOutOfStock = selectedItems.some((item) => item.product.stock_quantity === 0);

  // Calculate total value for selected items
  const totalSelectedValue = selectedItems.reduce((total, item) => total + item.final_price, 0);

  // After a successful order, re-fetch the cart so only the unordered items remain
  const handleOrderSuccess = () => {
    // Re-fetch cart items from the server
    fetchCartItems();
    // Clear the selected cart items state
    setSelectedCartIds([]);
  };

  return (
    <div className="cart-page">
      <Header toggleMenu={() => setMenuOpen((prev) => !prev)} />
      <Menu isMenuOpen={isMenuOpen} toggleMenu={() => setMenuOpen((prev) => !prev)} />
      <h2 className="cart-header-title">
        {userName ? `${userName}'s Cart` : 'Your Cart'}
      </h2>
      <div className="cart-layout">
        {/* Cart Items Section */}
        <div className="cart-products-section">
          <h1>Cart Items</h1>
          {loading && <p className="loading-message">Loading cart items...</p>}
          {!loading && cartItems.length === 0 && (
            <div className="empty-cart">
              <p>Your cart is empty.</p>
              <button
                className="browse-products-button"
                onClick={() => (window.location.href = '/')}
              >
                Browse Products
              </button>
            </div>
          )}
          {!loading && cartItems.length > 0 && (
            <div className="cart-items-list">
              {cartItems.map((cartItem) => (
                <CartProductCard
                  key={cartItem.cart_id}
                  cartItem={cartItem}
                  selected={selectedCartIds.includes(cartItem.cart_id)}
                  onSelectChange={(isSelected) => handleSelectChange(cartItem.cart_id, isSelected)}
                  onRemove={() => handleRemoveItem(cartItem.cart_id)}
                  onUpdateQuantity={handleUpdateQuantity}
                />
              ))}
            </div>
          )}
        </div>
        {/* Order Summary & Place Order Section */}
        <div className="order-summary-section">
          <h2>Order Summary</h2>
          {selectedItems.length === 0 ? (
            <p>No items selected for order.</p>
          ) : (
            <>
              <ul className="order-items-list">
                {selectedItems.map((cartItem) => (
                  <li key={cartItem.cart_id} className="order-item">
                    <span>
                      {cartItem.product.title} (x{cartItem.quantity})
                    </span>
                    <span>₹{cartItem.final_price.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="order-total">
                <h3>Total: ₹{totalSelectedValue.toFixed(2)}</h3>
              </div>
              {hasOutOfStock && (
                <p className="stock-warning">
                  One or more selected items are out of stock. Please remove or uncheck these items to place your order.
                </p>
              )}
              <CartPlaceOrder
                cartItems={selectedItems}
                userId={userId}
                onOrderSuccess={handleOrderSuccess}
                // You can pass an "isDisabled" prop to disable the place order button within CartPlaceOrder if needed.
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartPage;
