import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddToCart from './AddToCart';
import '../styles/ProductCard.css';
import '../styles/Responsive/ProductCard.responsive.css';

const ProductCard = ({ product, userId }) => {
  const navigate = useNavigate();
  const [showAddToCart, setShowAddToCart] = useState(false);

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  // Ensure the values we need are numbers
  const price = parseFloat(product.price);
  const discountAmount = product.discount_amount ? parseFloat(product.discount_amount) : 0;

  // Compute formatted prices
  const formattedDiscountedPrice = !isNaN(price) ? price.toFixed(2) : "0.00";
  
  const showDiscount = product.is_discounted && discountAmount > 0;
  
  // Because initial_price is not provided from the fetch request,
  // we calculate it by adding the discount amount to the discounted price.
  const computedInitialPrice = showDiscount ? price + discountAmount : price;
  const formattedInitialPrice = !isNaN(computedInitialPrice)
    ? computedInitialPrice.toFixed(2)
    : formattedDiscountedPrice;

  return (
    <>
      <div className="product-card" onClick={handleCardClick}>
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
              <span className="original-price">₹{formattedInitialPrice}</span>
              <span className="discounted-price">₹{formattedDiscountedPrice}</span>
            </p>
          ) : (
            <p className="product-price">₹{formattedDiscountedPrice}</p>
          )}
          <button
            className="cart-button"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click from triggering navigation
              setShowAddToCart(true);
            }}
          >
            <i className="fas fa-shopping-cart"></i>
          </button>
        </div>
      </div>

      {showAddToCart && (
        <AddToCart
          productId={product.id}
          userId={userId}
          onClose={() => setShowAddToCart(false)}
        />
      )}
    </>
  );
};

export default ProductCard;
