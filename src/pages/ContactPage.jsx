import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SuperHeader from '../components/shared/Header';
import SuperMenu from '../components/shared/Menu';
import CartSlider from '../components/shared/CartSlider';
import '../components/styles/ContactPage.css';
import { wrapperFetch } from '../utils/wrapperfetch';

const ContactPage = () => {
  const navigate = useNavigate();
  const BASE_URL = process.env.REACT_APP_BASE_URL;
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isCartOpen, setCartOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  // Assume a logged-in user; otherwise user_id might be empty.
  const userId = localStorage.getItem('userId') || '';

  // Maximum number of characters allowed in the message
  const maxMessageLength = 500;
  
  // Helper function to count spaces in a given string  
  const countSpaces = (text) => (text.match(/ /g) || []).length;

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Enforce character limit for the message field.
    if (name === 'message' && value.length > maxMessageLength) {
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission with backend integration:  
  // It sends the contact data to the backend endpoint.
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await wrapperFetch(`${BASE_URL}/api/contact/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, ...formData }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit message.');
      }
      console.log('Form submitted:', formData);
      setSubmitted(true);
      // Reset form after successful submission
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      console.error(err);
      // Optionally display an error message here.
    }
  };

  // Toggle functions for the sliding menu and cart slider.
  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const toggleCart = () => setCartOpen((prev) => !prev);

  // Dummy cart items state (for integration purposes)
  const [cartItems, setCartItems] = useState([]);

  // Dummy functions for CartSlider updates
  const handleRemoveItem = (cartId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.cart_id !== cartId)
    );
  };
  const handleUpdateQuantity = (cartId, newQuantity) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.cart_id === cartId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  return (
    <div className="contact-page">
      {/* Header & Menu Integration */}
      <SuperHeader toggleMenu={toggleMenu} />
      <SuperMenu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />

      {/* Cart Slider Integration */}
      <CartSlider
        isCartOpen={isCartOpen}
        toggleCart={toggleCart}
        cartItems={cartItems}
        onRemove={handleRemoveItem}
        onUpdateQuantity={handleUpdateQuantity}
      />

      <header className="contact-header">
        <h1>Contact Us</h1>
        <p>
          We’d love to hear from you! Please reach out with any questions, feedback, or inquiries.
        </p>
      </header>

      {!submitted ? (
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Your Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Your Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              placeholder="Type your message here"
            />
            <div className="message-counter">
              <span>
                {formData.message.length}/{maxMessageLength} characters
              </span>
              <span>
                {countSpaces(formData.message)} spaces
              </span>
            </div>
          </div>

          <button type="submit" className="submit-button">
            Send Message
          </button>
        </form>
      ) : (
        <div className="thank-you-message">
          <h2>Thank You!</h2>
          <p>
            Your message has been submitted successfully. We will get back to you shortly.
          </p>
          <button onClick={() => setSubmitted(false)} className="back-button">
            Send Another Message
          </button>
        </div>
      )}
    </div>
  );
};

export default ContactPage;
