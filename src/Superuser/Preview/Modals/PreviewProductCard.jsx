import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../../components/styles/ProductCard.css';
import '../../../components/styles/Responsive/ProductCard.responsive.css';
import { wrapperFetch } from '../../../utils/wrapperfetch';

const PreviewProductCard = ({ product }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/preview-product/${product.id}`);
  };

  const handleEditProduct = () => {
    navigate(`/product-edit/${product.id}`);
  };

  // Safely parse values to ensure we work with numbers
  const price = parseFloat(product.price);
  const discountAmount = product.discount_amount ? parseFloat(product.discount_amount) : 0;

  // Format the final (discounted) price
  const formattedDiscountedPrice = !isNaN(price) ? price.toFixed(2) : "0.00";

  // Determine if a valid discount exists
  const hasDiscount = product.is_discounted && discountAmount > 0;

  // Calculate the original price by adding the discount to the final price if a discount applies, otherwise use the final price
  const computedInitialPrice = hasDiscount ? price + discountAmount : price;
  const formattedInitialPrice = !isNaN(computedInitialPrice) ? computedInitialPrice.toFixed(2) : formattedDiscountedPrice;

  return (
    <>
      <div className="product-card" onClick={handleCardClick}>
        <div className="product-image-container">
          {hasDiscount && (
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
          {hasDiscount ? (
            <p className="product-price">
              <span className="original-price">₹{formattedInitialPrice}</span>
              <span className="discounted-price">₹{formattedDiscountedPrice}</span>
            </p>
          ) : (
            <p className="product-price">₹{formattedDiscountedPrice}</p>
          )}
          <p className="product-id">ID: {product.id}</p>
          <button
            className="edit-button-preview-card"
            onClick={(e) => {
              e.stopPropagation();
              handleEditProduct();
            }}
          >
            Edit
          </button>
        </div>
      </div>
    </>
  );
};

export default PreviewProductCard;
