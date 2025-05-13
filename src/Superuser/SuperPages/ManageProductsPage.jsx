import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SuperHeader from '../SuperShare/SuperHeader';
import SuperMenu from '../SuperShare/SuperMenu';
import ProductCard from '../SuperShare/ProductEditCard'; // Shared product card component
import { useNotification } from '../../components/shared/NotificationContext';
import '../SuperStyle/ManageProductsPage.css';
import { wrapperFetch } from '../../utils/wrapperfetch';

const ManageProductsPage = ({ BASE_URL }) => {
  // State to control header/menu visibility
  const [isMenuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen((prev) => !prev);

  // State for products and context menu
  const [products, setProducts] = useState([]);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    product: null,
  });
  const contextRef = useRef(null);
  
  // New UI states for "See Product" and Out-of-stock popup
  const [seeProductInput, setSeeProductInput] = useState('');
  const [showOutOfStockPopup, setShowOutOfStockPopup] = useState(false);

  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const userId = localStorage.getItem('superuserId');

  // Fetch products from API when component mounts
  useEffect(() => {
    wrapperFetch(`${BASE_URL}/api/products/list`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        } else if (data && Array.isArray(data.products)) {
          setProducts(data.products);
        } else {
          console.error('Expected an array from API, got:', data);
          setProducts([]);
        }
      })
      .catch((err) => console.error("Error fetching products:", err));
  }, [BASE_URL]);

  // Close the custom context menu when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextRef.current && !contextRef.current.contains(event.target)) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // When a product card is right-clicked, show the custom context menu
  const handleProductRightClick = (product, event) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.pageX,
      y: event.pageY,
      product,
    });
  };

  // Edit action: Navigate to the Product Edit page.
  const handleEditProduct = () => {
    if (contextMenu.product) {
      navigate(`/product-edit/${contextMenu.product.id}`);
      setContextMenu((prev) => ({ ...prev, visible: false }));
    }
  };

  // Delete action: Issue a DELETE request and remove product from state.
  const handleDeleteProduct = async () => {
    if (!contextMenu.product) return;
    try {
      const response = await wrapperFetch(`${BASE_URL}/api/products/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: contextMenu.product.id,
          user_id: userId,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        showNotification(data.message, 'success');
        setProducts(products.filter((p) => p.id !== contextMenu.product.id));
      } else {
        throw new Error(data.message || 'Failed to delete product.');
      }
    } catch (err) {
      showNotification(err.message, 'error');
      console.error(err);
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  // New function: Handle "See Product" button click using the input value.
  const handleSeeProductClick = () => {
    if (!seeProductInput.trim()) {
      showNotification('Please enter a product ID.', 'error');
      return;
    }
    navigate(`/preview-product/${seeProductInput.trim()}`);
  };

  return (
    <div className="manage-products-page">
      {/* Render SuperHeader and SuperMenu */}
      <SuperHeader toggleMenu={toggleMenu} />
      <SuperMenu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />

      <h1>Manage Products</h1>

      {/* New Action Section */}
      <div className="manage-products-actions">
        <div className="see-product-section">
          <input
            type="text"
            placeholder="Enter Product ID"
            value={seeProductInput}
            onChange={(e) => setSeeProductInput(e.target.value)}
            className="see-product-input"
          />
          <button onClick={handleSeeProductClick} className="see-product-button">
            See Product
          </button>
        </div>
        <button
          className="out-of-stock-button"
          onClick={() => setShowOutOfStockPopup(true)}
        >
          Out of Stock Products
        </button>
      </div>

      {/* Product Grid */}
      <div className="products-grid">
        {products.map((product) => (
          <div
            key={product.id}
            onContextMenu={(e) => handleProductRightClick(product, e)}
          >
            <ProductCard product={product} userId={userId} />
          </div>
        ))}
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="custom-context-menu"
          ref={contextRef}
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button onClick={handleEditProduct}>Edit Product</button>
          <button onClick={handleDeleteProduct}>Delete Product</button>
        </div>
      )}

      {/* Out of Stock Products Popup */}
      {showOutOfStockPopup && (
  <div className="out-of-stock-popup">
    <div className="popup-container">
      <div className="popup-header">
        <h2>Out of Stock Products</h2>
        <button
          className="popup-close-button"
          onClick={() => setShowOutOfStockPopup(false)}
        >
          &times;
        </button>
      </div>
      <div className="popup-body">
        {products.filter((prod) => prod.stock_quantity === 0).length === 0 ? (
          <p>No out of stock products found.</p>
        ) : (
          products
            .filter((prod) => prod.stock_quantity === 0)
            .map((prod) => (
              <div
                key={prod.id}
                onClick={() => navigate(`/preview-product/${prod.id}`)}
                onContextMenu={(e) => handleProductRightClick(prod, e)}
                className="out-of-stock-card"
              >
                <ProductCard product={prod} userId={userId} />
              </div>
            ))
        )}
      </div>
    </div>
  </div>
)}
</div>
  );
};

export default ManageProductsPage;
