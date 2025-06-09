import React, { useState, useEffect, useRef } from 'react';
import { useNotification } from '../shared/NotificationContext';
import '../styles/OrderProductCard.css';
import '../styles/Responsive/OrderProductCard.responsive.css';
import { io } from 'socket.io-client';
import { wrapperFetch } from '../../utils/wrapperfetch';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL;

const OrderProductCard = ({
  order: initialOrder,
  onCancel,
  onSelect,
  onOrderUpdate = () => {},
  // New prop for initiating return
  onInitiateReturn,
}) => {
  const [order, setOrder] = useState(initialOrder);
  const [expanded, setExpanded] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const { showNotification } = useNotification();

  const { id: orderId, status = 'Unknown', created_at, delivery_type, items = [] } = order;

  const shopLocation = {
    address: 'Seema Enterprises, 20, New Bazar, Kurukshetra, Thanesar, Haryana 136118, India',
    googleMapsLink:
      'https://maps.app.goo.gl/PiLLRDkUXKWk4WrF7',
  };

  const orderDate = created_at
    ? new Date(created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Unknown';

  const canCancel =
    status.toLowerCase() !== 'completed' &&
    status.toLowerCase() !== 'readyforpickup' &&
    status.toLowerCase() !== 'cancelled' &&
    status.toLowerCase() !== 'delivered' &&
    status.toLowerCase() !== 'sent';

  // Define when an order can be returned.
  // For simplicity, let's say it can be returned if it's 'delivered' and not already 'returned' or 'cancelled'.
  const canReturn =
    status.toLowerCase() === 'delivered' &&
    status.toLowerCase() !== 'returned' &&
    status.toLowerCase() !== 'cancelled';


  const toggleExpand = () => {
    setExpanded(!expanded);
    if (!expanded) {
      onSelect();
    }
  };

  const socketRef = useRef(null);
  useEffect(() => {
    socketRef.current = io(SOCKET_URL);
    socketRef.current.emit('joinRoom', `order_${orderId}`);

    socketRef.current.on('orderStatusUpdated', (data) => {
      if (data && data.order && String(data.order.id) === String(orderId)) {
        const updatedOrder = { ...order, status: data.order.order_status };
        setOrder(updatedOrder);
        onOrderUpdate(updatedOrder);
        showNotification(data.message, 'info');
      }
    });

    return () => {
      socketRef.current.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, showNotification]);

  const toggleItemSelection = (productId) => {
    setSelectedItems((prevItems) =>
      prevItems.includes(productId)
        ? prevItems.filter((id) => id !== productId)
        : [...prevItems, productId]
    );
  };

  const openCancelModal = (e) => {
    e.stopPropagation();
    if (!canCancel) {
      showNotification('Cannot cancel completed orders or orders ready for pickup', 'error');
      return;
    }
    setSelectedItems([]);
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setSelectedItems([]);
  };

  const submitCancelRequest = async () => {
    if (selectedItems.length === 0) {
      showNotification('Please select at least one item to cancel', 'warning');
      return;
    }
    try {
      const userId = localStorage.getItem('userId');
      const cancelItems = selectedItems.map((productId) => ({ product_id: productId }));
      console.log('Submitting cancel request with:', orderId, userId, cancelItems);
      await onCancel(orderId, userId, cancelItems);
      showNotification('Items successfully cancelled!', 'success');
      closeCancelModal();
    } catch (error) {
      console.error('Error cancelling items:', error);
      showNotification('An error occurred while cancelling items', 'error');
    }
  };

  // New handler for the Return button
  const handleReturnClick = (e) => {
    e.stopPropagation(); // Prevent card from expanding
    if (!canReturn) {
      showNotification('This order cannot be returned.', 'error');
      return;
    }
    // Call the parent's callback to open the return modal on the OrdersPage
    onInitiateReturn(orderId);
  };

  return (
    <div className="opc-card">
      {/* Order Header */}
      <div className="opc-header" onClick={toggleExpand}>
        <div className="opc-basic-info">
          <h3>Order #{orderId}</h3>
          <span className={`opc-status ${status.toLowerCase().replace(/\s+/g, '-')}`}>{status}</span>
        </div>
        <div className="opc-summary">
          <span>{orderDate}</span>
          <span>{delivery_type}</span>
          <span>{items.length} item(s)</span>
          <span className="opc-expand-indicator">{expanded ? '▲ Collapse' : '▼ Expand'}</span>
        </div>
      </div>
      {/* Expanded Order Details */}
      {expanded && (
        <div className="opc-details" onClick={(e) => e.stopPropagation()}>
          <div className="opc-items">
            <h4>Order Items</h4>
            {items.length === 0 ? (
              <p>No items in this order.</p>
            ) : (
              items.map((item) => (
                <div key={item.order_item_id} className="opc-product-item">
                  <img
                    src={item.images?.[0] || 'https://via.placeholder.com/150'}
                    alt={item.title || `Product #${item.product_id}`}
                    className="opc-product-thumbnail"
                  />
                  <div className="opc-product-info">
                    <h5>{item.title || `Product #${item.product_id}`}</h5>
                    <p>
                      <strong>Quantity:</strong> {item.quantity}
                    </p>
                    <p>
                      <strong>Price:</strong> ₹{item.price?.toFixed(2) || '0.00'}
                    </p>
                    {item.options?.length > 0 && (
                      <div className="opc-product-options">
                        <strong>Options:</strong>
                        <ul>
                          {item.options.map((option) => (
                            <li key={option.id}>
                              {option.type_name}: {option.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  {/* Cancel-item checkbox (if cancellation is allowed) */}
                  {canCancel && (
                    <div className="opc-item-select">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.product_id)}
                        onChange={() => toggleItemSelection(item.product_id)}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          {/* Pickup Location (for pickup orders) */}
          {delivery_type.toLowerCase() === 'pickup' && (
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
            </div>
          )}
          {/* Order Actions */}
          <div className="opc-actions">
            {canCancel && (
              <button className="opc-cancel-button" onClick={openCancelModal}>
                Cancel Items
              </button>
            )}
            {/* New Return Button */}
            {canReturn && (
              <button className="opc-return-button" onClick={handleReturnClick}>
                Return
              </button>
            )}
          </div>
        </div>
      )}
      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="opc-cancel-modal">
          <div className="opc-modal-content">
            <h3>Cancel Order Items</h3>
            <p>Please select the items you wish to cancel:</p>
            <div className="opc-item-selection">
              {items.map((item) => (
                <div key={item.product_id} className="opc-item-select">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.product_id)}
                    onChange={() => toggleItemSelection(item.product_id)}
                  />
                  <label>
                    {item.title} - ₹{item.price?.toFixed(2) || '0.00'}
                  </label>
                </div>
              ))}
            </div>
            <div className="opc-modal-footer">
              <button className="opc-confirm-cancel" onClick={submitCancelRequest}>
                Confirm Cancellation
              </button>
              <button className="opc-cancel-action" onClick={closeCancelModal}>
                Keep Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderProductCard;