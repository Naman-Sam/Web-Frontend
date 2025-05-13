import React, { useState } from 'react';
import SuperHeader from '../components/shared/Header'; // Header component
import SuperMenu from '../components/shared/Menu'; // Menu component
import CartSlider from '../components/shared/CartSlider'; // Cart slider component
import '../components/styles/AboutPage.css'; // Import styles for the AboutPage
import { wrapperFetch } from '../utils/wrapperfetch';

const AboutPage = () => {
  // State management for the menu and cart slider
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isCartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  // Toggle functions for menu and cart slider
  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const toggleCart = () => setCartOpen((prev) => !prev);

  return (
    <div className="about-page">
      {/* Integration of Header, Menu, and CartSlider */}
      <SuperHeader toggleMenu={toggleMenu} toggleCart={toggleCart} />
      <SuperMenu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
      <CartSlider
        isCartOpen={isCartOpen}
        toggleCart={toggleCart}
        cartItems={cartItems}
        onRemove={(cartId) =>
          setCartItems((prevItems) =>
            prevItems.filter((item) => item.cart_id !== cartId)
          )
        }
        onUpdateQuantity={(cartId, quantity) =>
          setCartItems((prevItems) =>
            prevItems.map((item) =>
              item.cart_id === cartId ? { ...item, quantity } : item
            )
          )
        }
      />

      {/* Original About Us Content */}
      <header className="about-header">
        <h1>About Us</h1>
      </header>

      <section className="about-section">
        <div className="about-content">
          <h2>Who We Are</h2>
          <p>
            Welcome to [Your Company/Name]! We are passionate about creating
            meaningful solutions and delivering excellence in everything we do.
          </p>
        </div>

        <div className="about-content">
          <h2>Our Story</h2>
          <p>
            Founded in [Year], [Your Company/Name] began with a simple idea to
            [brief story about your origin]. Over time, we have grown into a
            thriving organization thanks to our dedication and innovative
            spirit.
          </p>
        </div>

        <div className="about-content">
          <h2>What We Do</h2>
          <p>
            We specialize in [Services/Products]. From [Service/Product Example]
            to [Another Service/Product Example], our aim is to meet the needs
            of our customers and create a positive impact.
          </p>
        </div>

        <div className="about-content">
          <h2>Why Choose Us?</h2>
          <ul>
            <li>Innovation: We embrace forward-thinking ideas.</li>
            <li>Integrity: We are honest and reliable.</li>
            <li>Excellence: We deliver quality results.</li>
            <li>Community: We grow with those who support us.</li>
          </ul>
        </div>

        <div className="about-content">
          <h2>Meet Our Team</h2>
          <p>
            Our talented team shares a vision of excellence, combining their
            skills and creativity to deliver exceptional solutions.
          </p>
        </div>

        <div className="about-content">
          <h2>Get In Touch</h2>
          <p>
            We’d love to hear from you! Reach out to us at{' '}
            <a href="mailto:info@yourcompany.com">info@yourcompany.com</a>.
          </p>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
