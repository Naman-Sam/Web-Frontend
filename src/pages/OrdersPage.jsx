import React, { useState, useEffect } from 'react';
import Header from '../components/shared/Header';
import Menu from '../components/shared/Menu';
import CartSlider from '../components/shared/CartSlider';
import OrderProductCard from '../components/shared/OrderProductCard';
import OrderMessages from '../components/shared/OrderMessages';
import '../components/styles/OrdersPage.css';
import { useNotification } from '../components/shared/NotificationContext';
import '../components/styles/Responsive/OrderPage.responsive.css';
import { wrapperFetch } from '../utils/wrapperfetch';

const BASE_URL = process.env.REACT_APP_BASE_URL;

const OrdersPage = () => {
  // --- State Variables ---
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isCartOpen, setCartOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const userId = localStorage.getItem('userId');
  const { showNotification } = useNotification();

  // Responsive state: mobile if width ≤480px; tablet if width >480 and ≤768px.
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);
  const [isTablet, setIsTablet] = useState(window.innerWidth > 480 && window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 480);
      setIsTablet(window.innerWidth > 480 && window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Fetch Orders ---
  const fetchOrders = async (silent = false) => {
    if (!userId) {
      showNotification('Please log in to view your orders.', 'error');
      setLoading(false);
      return;
    }
    try {
      const response = await wrapperFetch(`${BASE_URL}/api/orders/user/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await response.json();
      if (response.ok) {
        const processedOrders = (data.orders || []).map((order) => ({
          id: order.id || order.order_id,
          status: order.status || 'Unknown',
          created_at: order.created_at,
          delivery_type: order.delivery_type,
          delivery_address: order.delivery_address,
          items: order.items || [],
        }));
        setOrders(processedOrders);
        if (!silent) {
          showNotification('Orders loaded successfully!', 'success');
        }
      } else {
        showNotification(data.message || 'Failed to fetch orders.', 'error');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      showNotification('An error occurred while fetching orders.', 'error');
      setError('Unable to fetch orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [userId, showNotification]);

  // --- Toggle Functions ---
  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const toggleCart = () => setCartOpen((prev) => !prev);

  // --- Handle Order Cancellation ---
  const handleCancelItem = async (orderId, userId, cancelItems) => {
    try {
      const response = await wrapperFetch(`${BASE_URL}/api/orders/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, user_id: userId, cancel_items: cancelItems }),
      });
      const data = await response.json();
      if (response.ok) {
        const cancelledProductIds = cancelItems.map((item) => item.product_id);
        // Update orders list.
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId
              ? { ...order, items: order.items.filter((item) => !cancelledProductIds.includes(item.product_id)) }
              : order
          )
        );
        // Update selected order summary if applicable.
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prevOrder) => ({
            ...prevOrder,
            items: prevOrder.items.filter((item) => !cancelledProductIds.includes(item.product_id)),
          }));
        }
        showNotification(data.message || 'Items successfully cancelled!', 'success');
        await wrapperFetchOrders(true); // Refresh orders silently.
      } else {
        showNotification(data.message || 'Failed to cancel items.', 'error');
      }
    } catch (error) {
      console.error('Error cancelling items:', error);
      showNotification('An error occurred while cancelling items.', 'error');
    }
  };

  // --- Handle Order Selection ---
  const handleSelectOrder = (orderId) => {
    const order = orders.find((o) => o.id === orderId);
    setSelectedOrder(order);
  };

  // --- Utility: Calculate Total Order Value ---
  const calculateTotalValue = (items) => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  // --- Layouts ---

  // Mobile Layout (≤480px)
  if (isMobile) {
    return (
      <div className="orders-page">
        <Header toggleMenu={toggleMenu} toggleCart={toggleCart} />
        <Menu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
        <CartSlider
          isCartOpen={isCartOpen}
          toggleCart={toggleCart}
          cartItems={cartItems}
          onRemove={(cartId) =>
            setCartItems((prevItems) => prevItems.filter((item) => item.cart_id !== cartId))
          }
          onUpdateQuantity={(cartId, quantity) =>
            setCartItems((prevItems) =>
              prevItems.map((item) => (item.cart_id === cartId ? { ...item, quantity } : item))
            )
          }
        />
        <div className="mobile-orders-layout">
          <h2>Your Orders</h2>
          {loading && <p>Loading orders...</p>}
          {error && <p className="error-message">{error}</p>}
          {!loading && !error && orders.length === 0 && <p>No orders found.</p>}
          {orders.map((order) => (
            <div key={order.id} className="mobile-order-item">
              <OrderProductCard
                order={order}
                onCancel={handleCancelItem}
                onSelect={() => handleSelectOrder(order.id)}
                onOrderUpdate={(updatedOrder) => {
                  setOrders((prev) =>
                    prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
                  );
                  if (selectedOrder && selectedOrder.id === updatedOrder.id) {
                    setSelectedOrder(updatedOrder);
                  }
                }}
              />
              {selectedOrder && selectedOrder.id === order.id && (
                <div className="mobile-order-expanded">
                  <div className="mobile-order-messages">
                    <h2>Order Messages</h2>
                    <OrderMessages orderId={order.id} senderId={userId} />
                  </div>
                  <div className="mobile-order-summary">
                    <h2>Order Summary</h2>
                    <div className="order-summary">
                      <p>
                        <strong>Status:</strong> {order.status}
                      </p>
                      <p>
                        <strong>Created At:</strong>{' '}
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                      <p>
                        <strong>Delivery Type:</strong> {order.delivery_type}
                      </p>
                      {order.delivery_address && (
                        <div>
                          <h3>Delivery Address</h3>
                          <p>{order.delivery_address.address_line_1}</p>
                          <p>{order.delivery_address.address_line_2}</p>
                          <p>
                            {order.delivery_address.city}, {order.delivery_address.state}
                          </p>
                          <p>
                            {order.delivery_address.country} - {order.delivery_address.postal_code}
                          </p>
                        </div>
                      )}
                      <p>
                        <strong>Total Value:</strong> ₹
                        {calculateTotalValue(order.items).toLocaleString()}
                      </p>
                      <p>
                        <strong>Total Items:</strong> {order.items.length}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedOrder(null)} className="mobile-collapse-button">
                    Close ▲
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Tablet Layout (between 481px and 768px)
  if (isTablet) {
    return (
      <div className="orders-page">
        <Header toggleMenu={toggleMenu} toggleCart={toggleCart} />
        <Menu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
        <CartSlider
          isCartOpen={isCartOpen}
          toggleCart={toggleCart}
          cartItems={cartItems}
          onRemove={(cartId) => setCartItems((prev) => prev.filter((item) => item.cart_id !== cartId))}
          onUpdateQuantity={(cartId, quantity) =>
            setCartItems((prev) =>
              prev.map((item) => (item.cart_id === cartId ? { ...item, quantity } : item))
            )
          }
        />
        <div className="tablet-orders-layout">
          <div className="tablet-left-column">
            <div className="tablet-orders-list">
              <h2>Your Orders</h2>
              {loading && <p>Loading orders...</p>}
              {error && <p className="error-message">{error}</p>}
              {!loading && !error && orders.length === 0 && <p>No orders found.</p>}
              {orders.map((order) => (
                <OrderProductCard
                  key={order.id}
                  order={order}
                  onCancel={handleCancelItem}
                  onSelect={() => handleSelectOrder(order.id)}
                  onOrderUpdate={(updatedOrder) => {
                    setOrders((prev) =>
                      prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
                    );
                    if (selectedOrder && selectedOrder.id === updatedOrder.id) {
                      setSelectedOrder(updatedOrder);
                    }
                  }}
                />
              ))}
            </div>
            <div className="tablet-order-summary">
              {selectedOrder ? (
                <div className="order-summary">
                  <h2>Order Summary</h2>
                  <p>
                    <strong>Status:</strong> {selectedOrder.status}
                  </p>
                  <p>
                    <strong>Created At:</strong>{' '}
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </p>
                  <p>
                    <strong>Delivery Type:</strong> {selectedOrder.delivery_type}
                  </p>
                  {selectedOrder.delivery_address && (
                    <div>
                      <h3>Delivery Address</h3>
                      <p>{selectedOrder.delivery_address.address_line_1}</p>
                      <p>{selectedOrder.delivery_address.address_line_2}</p>
                      <p>
                        {selectedOrder.delivery_address.city}, {selectedOrder.delivery_address.state}
                      </p>
                      <p>
                        {selectedOrder.delivery_address.country} -{' '}
                        {selectedOrder.delivery_address.postal_code}
                      </p>
                    </div>
                  )}
                  <p>
                    <strong>Total Value:</strong> ₹
                    {calculateTotalValue(selectedOrder.items).toLocaleString()}
                  </p>
                  <p>
                    <strong>Total Items:</strong> {selectedOrder.items.length}
                  </p>
                </div>
              ) : (
                <p>Select an order to view its summary.</p>
              )}
            </div>
          </div>
          <div className="tablet-right-column">
            <h2>Order Messages</h2>
            {selectedOrder ? (
              <OrderMessages orderId={selectedOrder.id} senderId={userId} />
            ) : (
              <p>Select an order to view messages.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Desktop Layout (>768px): Three-column layout.
  return (
    <div className="orders-page">
      <Header toggleMenu={toggleMenu} toggleCart={toggleCart} />
      <Menu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
      <CartSlider
        isCartOpen={isCartOpen}
        toggleCart={toggleCart}
        cartItems={cartItems}
        onRemove={(cartId) =>
          setCartItems((prev) => prev.filter((item) => item.cart_id !== cartId))
        }
        onUpdateQuantity={(cartId, quantity) =>
          setCartItems((prev) =>
            prev.map((item) =>
              item.cart_id === cartId ? { ...item, quantity } : item
            )
          )
        }
      />
      <div className="orders-layout">
        {/* Left Section - Orders */}
        <section className="left-section-inforce">
          <h2>Your Orders</h2>
          {loading && <p>Loading orders...</p>}
          {error && <p className="error-message">{error}</p>}
          {!loading && !error && orders.length === 0 && <p>No orders found.</p>}
          {!loading &&
            !error &&
            orders.map((order) => (
              <OrderProductCard
                key={order.id}
                order={order}
                onCancel={handleCancelItem}
                onSelect={() => handleSelectOrder(order.id)}
                onOrderUpdate={(updatedOrder) => {
                  setOrders((prev) =>
                    prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
                  );
                  if (selectedOrder && selectedOrder.id === updatedOrder.id) {
                    setSelectedOrder(updatedOrder);
                  }
                }}
              />
            ))}
        </section>

        {/* Middle Section - Order Messages */}
        <section className="middle-section-inforce">
          <h2>Order Messages</h2>
          {selectedOrder ? (
            <OrderMessages orderId={selectedOrder.id} senderId={userId} />
          ) : (
            <p>Select an order to view messages.</p>
          )}
        </section>

        {/* Right Section - Order Summary */}
        <section className="right-section-inforce">
          <h2>Order Summary</h2>
          {selectedOrder ? (
            <div className="order-summary">
              <p>
                <strong>Status:</strong> {selectedOrder.status}
              </p>
              <p>
                <strong>Created At:</strong>{' '}
                {new Date(selectedOrder.created_at).toLocaleString()}
              </p>
              <p>
                <strong>Delivery Type:</strong> {selectedOrder.delivery_type}
              </p>
              {selectedOrder.delivery_address && (
                <div>
                  <h3>Delivery Address</h3>
                  <p>{selectedOrder.delivery_address.address_line_1}</p>
                  <p>{selectedOrder.delivery_address.address_line_2}</p>
                  <p>
                    {selectedOrder.delivery_address.city},{' '}
                    {selectedOrder.delivery_address.state}
                  </p>
                  <p>
                    {selectedOrder.delivery_address.country} -{' '}
                    {selectedOrder.delivery_address.postal_code}
                  </p>
                </div>
              )}
              <p>
                <strong>Total Value:</strong> ₹
                {calculateTotalValue(selectedOrder.items).toLocaleString()}
              </p>
              <p>
                <strong>Total Items:</strong> {selectedOrder.items.length}
              </p>
            </div>
          ) : (
            <p>Select an order to view its summary.</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default OrdersPage;
