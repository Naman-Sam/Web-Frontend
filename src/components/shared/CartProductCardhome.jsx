import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from './NotificationContext';
import '../styles/CartProductCard.css';
import '../styles/Responsive/CartProductCard.responsive.css';
import { wrapperFetch } from '../../utils/wrapperfetch';

const CartProductCard = ({ cartItem, selected, onSelectChange, onRemove, onUpdateQuantity }) => {
  const { product, quantity, final_price } = cartItem;
  const [newQuantity, setNewQuantity] = React.useState(quantity);
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const handleQuantityChange = (e) => {
    e.stopPropagation(); // Prevent triggering card click
    const updatedQuantity = parseInt(e.target.value, 10);
    if (updatedQuantity >= 1) {
      setNewQuantity(updatedQuantity);
    } else {
      showNotification('Quantity must be at least 1.', 'error');
    }
  };

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  const handleConfirmQuantity = async (e) => {
    e.stopPropagation();
    if (newQuantity !== quantity) {
      try {
        await onUpdateQuantity(cartItem.cart_id, newQuantity);
        showNotification('Quantity updated successfully!', 'success');
      } catch (error) {
        console.error('Error updating quantity:', error);
        showNotification('An error occurred while updating quantity.', 'error');
      }
    } else {
      showNotification('Quantity is already up to date.', 'info');
    }
  };

  const handleRemoveClick = (e) => {
    e.stopPropagation();
    onRemove(cartItem.cart_id);
  };

  return (
    <div className="cart-product-card-cart" onClick={handleCardClick}>
      {/* Checkbox for selecting this item for order placement */}

      <img
        src={product.images?.[0] || 'https://via.placeholder.com/150'}
        alt={product.title}
        className="product-image-cart"
      />
      <div className="product-details-cart">
        <h3>{product.title}</h3>
        {product.stock_quantity === 0 && (
          <div className="out-of-stock-label">Out of Stock</div>
        )}
        <p>Unit Price: ₹{(final_price / quantity).toFixed(2)}</p>
        <div className="quantity-control-cart">
          <label htmlFor={`quantity-${cartItem.cart_id}`}>Quantity:</label>
          <input
            type="number"
            id={`quantity-${cartItem.cart_id}`}
            value={newQuantity}
            onClick={(e) => e.stopPropagation()}
            onChange={handleQuantityChange}
          />
          <button onClick={handleConfirmQuantity} disabled={newQuantity === quantity}>
            Confirm
          </button>
        </div>
        <p>Total Price: ₹{(newQuantity * (final_price / quantity)).toFixed(2)}</p>
        <button onClick={handleRemoveClick}>Remove</button>
      </div>
    </div>
  );
};

export default CartProductCard;