import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../SuperStyle/ProductEditCard.css';
import '../../components/styles/Responsive/ProductCard.responsive.css';
import { wrapperFetch } from '../../utils/wrapperfetch';

const ProductEditCard = ({ product, userId, onRightClick }) => {
  const navigate = useNavigate();

  // On left-click, navigate to product details.
  const handleCardClick = () => {
    navigate(`/preview-product/${product.id}`);
  };

  // Safely parse numeric values.
  const price = parseFloat(product.price);
  const discountAmount = product.discount_amount ? parseFloat(product.discount_amount) : 0;
  const showDiscount = product.is_discounted && discountAmount > 0;

  // Format the discounted price as the actual price coming from the backend.
  const formattedDiscountedPrice = !isNaN(price) ? price.toFixed(2) : "0.00";

  // Since initial_price is not provided by the fetch, compute it by adding the discountAmount.
  const computedInitialPrice = showDiscount ? price + discountAmount : price;
  const formattedInitialPrice = !isNaN(computedInitialPrice) ? computedInitialPrice.toFixed(2) : formattedDiscountedPrice;

  return (
    <div
      className="product-card"
      onClick={handleCardClick}
      onContextMenu={onRightClick}
    >
      <div className="product-image-container">
        {showDiscount && (
          <span className="discount-badge">Save ₹{discountAmount.toFixed(2)}</span>
        )}
        <img
          src={product.images?.[0] || 'https://via.placeholder.com/300'}
          alt={product.title || 'Product Image'}
          className="product-image"
        />
      </div>
      <h3 className="product-title">{product.title || 'Unnamed Product'}</h3>
      <hr className="divider" />
      <div className="product-info">
        {showDiscount ? (
          <p className="product-price">
            <span className="original-price">₹{formattedInitialPrice}</span>{' '}
            <span className="discounted-price">₹{formattedDiscountedPrice}</span>
          </p>
        ) : (
          <p className="product-price">₹{formattedDiscountedPrice}</p>
        )}
      </div>
    </div>
  );
};

export default ProductEditCard;
