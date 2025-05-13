import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/shared/Header';  // Updated header from components
import Menu from '../../components/shared/Menu';        // Updated sliding menu from components
import CartSlider from '../../components/shared/CartSlider'; // Integrated cart slider
import '../SuperStyle/SuperuserFunctionalityArticle.css';        // Using ContactPage CSS for layout
import { wrapperFetch } from '../../utils/wrapperfetch';

const SuperuserArticlePage = () => {
  const navigate = useNavigate();

  // State for Menu and Cart Slider visibility
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isCartOpen, setCartOpen] = useState(false);

  // Dummy state for cart items (adjust or integrate with real data as needed)
  const [cartItems, setCartItems] = useState([]);

  // Toggle functions
  const toggleMenu = () => setMenuOpen(prev => !prev);
  const toggleCart = () => setCartOpen(prev => !prev);

  // Dummy CartSlider update functions
  const handleRemoveItem = (cartId) => {
    setCartItems(prevItems => 
      prevItems.filter(item => item.cart_id !== cartId)
    );
  };

  const handleUpdateQuantity = (cartId, newQuantity) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.cart_id === cartId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  return (
    <div className="superuser-article-page">
      {/* Header, Menu & CartSlider */}
      <Header toggleMenu={toggleMenu} toggleCart={toggleCart} />
      <Menu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
      <CartSlider 
        isCartOpen={isCartOpen} 
        toggleCart={toggleCart} 
        cartItems={cartItems} 
        onRemove={handleRemoveItem} 
        onUpdateQuantity={handleUpdateQuantity} 
      />

      {/* Article Content */}
      <div className="article-content">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1>Superuser Functionality Explained</h1>

        <section>
          <h2>Overview</h2>
          <p>
            As a superuser, you have full control over the website. This means you can manage nearly every aspect—from adding and editing products to overseeing orders, handling customer inquiries, managing categories, and even defining product variations.
          </p>
        </section>

        <section>
          <h2>Product Management</h2>
          <p>
            The product management area lets you add new products, update existing product details, remove products that are no longer available, and even handle product images. This is where you ensure that the products on your site are accurate and up to date.
          </p>
        </section>

        <section>
          <h2>Order Management</h2>
          <p>
            In the order management section, you can view and process orders submitted by customers. This includes tracking order statuses, handling delivery or pickup details, and ensuring every order is processed correctly.
          </p>
        </section>

        <section>
          <h2>Customer Care</h2>
          <p>
            Customer care is a vital part of the superuser role. You’re responsible for managing messages and inquiries from customers, ensuring that their concerns are addressed quickly, and overall, helping to maintain a great shopping experience.
          </p>
        </section>

        <section>
          <h2>Category Management</h2>
          <p>
            Categories help organize the products on your site. You can add, edit, or delete categories as needed, and any changes are reflected immediately across the website.
          </p>
        </section>

        <section>
          <h2>Types &amp; Options Management</h2>
          <p>
            This section is where you define product variations—such as color, size, or style. You can add new options, update them, or remove those that are no longer relevant. This ensures customers see the right choices when they shop.
          </p>
        </section>

        <section>
          <h2>Additional Features</h2>
          <p>
            Beyond these core functions, your dashboard also lets you preview the website as a customer, generate detailed reports, manage feedback and suggestions, and even handle promotional content like posters.
          </p>
        </section>

        <section>
          <h2>Conclusion</h2>
          <p>
            The superuser dashboard is designed to bring all these capabilities together in one easy-to-use interface. Whether you're updating product details, processing orders, or managing customer support, everything you need is just a few clicks away.
          </p>
        </section>
      </div>
    </div>
  );
};

export default SuperuserArticlePage;
