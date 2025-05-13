import React from "react";
import "../SuperStyle/PosterProductCard.css"; // Ensure this path is correct
import { wrapperFetch } from '../../utils/wrapperfetch';

const PosterProductCard = ({ product, selectedProduct, setSelectedProduct }) => {
  if (!product) return null; // Guard for undefined product
  return (
    <div className={`poster-product-card ${selectedProduct?.id === product.id ? "selected" : ""}`}>
      <img src={product.images?.[0] || "https://via.placeholder.com/150"} alt={product.title} />
      <div className="product-details">
        <h3>{product.title}</h3>
        <p>Price: ₹{product.price.toFixed(2)}</p>
        <input
          type="checkbox"
          checked={selectedProduct?.id === product.id}
          onChange={() => setSelectedProduct(product)}
        />
      </div>
    </div>
  );
};

export default PosterProductCard;
