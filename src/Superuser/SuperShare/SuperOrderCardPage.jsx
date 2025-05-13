import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../SuperStyle/SuperOrderMessagePage.css';
import { wrapperFetch } from '../../utils/wrapperfetch';

const SuperOrderCardPage = ({
  order,
  expanded = false,
  getUserName,
  onClick,
  onUpdateStatus,
}) => {
  const navigate = useNavigate();

  return (
    <div
      className={`super-order-card${expanded ? ' active' : ''}`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="card-summary">
        <span className="order-id">OrderID: {order.order_id}</span>
        <span className={`order-status ${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
          {order.status}
        </span>
        <span className="user-info">{getUserName(order.user_id)}</span>
        <span className={`order-type ${order.delivery_type.toLowerCase()}`}>
          {order.delivery_type}
        </span>
      </div>
      {expanded && (
        <div className="order-card-details" onClick={(e) => e.stopPropagation()}>
          <div className="order-details-content">
            <p>
              <strong>Created At:</strong>{' '}
              {new Date(order.created_at).toLocaleString()}
            </p>
            {order.delivery_type === 'Delivery' && order.delivery_address ? (
              <div className="delivery-address">
                <p>
                  <strong>Delivery Address:</strong>
                </p>
                <p>{order.delivery_address.address_line_1}</p>
                {order.delivery_address.address_line_2 && (
                  <p>{order.delivery_address.address_line_2}</p>
                )}
                <p>
                  {order.delivery_address.city}, {order.delivery_address.state},{' '}
                  {order.delivery_address.country}-{order.delivery_address.postal_code}
                </p>
                <p>
                  <strong>Phone:</strong> {order.delivery_address.phone_number}
                </p>
              </div>
            ) : (
              <p>
                <strong>Pickup Order</strong>
              </p>
            )}
          </div>
          <div className="order-items-section">
            <h3>Items</h3>
            {order.items &&
              order.items.map((item) => (
                <div key={item.order_item_id} className="order-item">
                  <p>
                    <strong>Title:</strong> {item.title}
                  </p>
                  <p>
                    <strong>Price:</strong> {item.price}
                  </p>
                  <p>
                    <strong>Quantity:</strong> {item.quantity}
                  </p>
                  {item.images && item.images.length > 0 && (
                    <img
                      className="item-image"
                      src={item.images[0]}
                      alt={item.title}
                    />
                  )}
                  <div className="item-options">
                    {item.options &&
                      item.options.map((option) => (
                        <p key={option.id}>
                          <strong>{option.type_name}:</strong> {option.name}
                        </p>
                      ))}
                  </div>
                  {/* More Details Button for each order item */}
                  <button
                    className="more-details-button-super"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/preview-product/${item.product_id}`);
                    }}
                  >
                    More Details
                  </button>
                </div>
              ))}
          </div>
          <div className="order-status-update">
            <p>
              Current Status:{' '}
              <span
                className={`opc-status ${order.status.toLowerCase().replace(
                  /\s+/g,
                  '-'
                )}`}
              >
                {order.status}
              </span>
            </p>
            <div>
              <label htmlFor={`orderStatusSelect-${order.order_id}`}>
                Update Order Status:{' '}
              </label>
              <select
                id={`orderStatusSelect-${order.order_id}`}
                onChange={(e) => {
                  // onUpdateStatus handles sending the update (via API and socket)
                  onUpdateStatus(order.order_id, e.target.value);
                }}
              >
                <option value="">Select status</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Completed">Completed</option>
                <option value="Sent">Sent</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
                <option value="ReadyforPickup">Ready for Pickup</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperOrderCardPage;
