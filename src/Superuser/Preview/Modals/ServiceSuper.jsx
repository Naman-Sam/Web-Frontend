import React, { useState } from 'react';
import SuperHeader from '../../SuperShare/SuperHeader'; // Header component
import SuperMenu from '../../SuperShare/SuperMenu'; // Menu component
import CartSlider from '../../../components/shared/CartSlider'; // Cart slider component
import '../../../components/styles/ServicesPage.css'; // Import styles for the ServicesPage
import { wrapperFetch } from '../../../utils/wrapperfetch';

const services = [
  {
    id: 1,
    title: "Web Development",
    description:
      "We craft modern, responsive, and user-friendly websites tailored to meet your unique needs. From landing pages to complex web apps, we have you covered.",
    icon: "🌐", // Optionally replace this with an image URL
  },
  {
    id: 2,
    title: "Mobile App Development",
    description:
      "Turn your ideas into reality with our custom mobile app development services. We build apps for both iOS and Android platforms.",
    icon: "📱", // Optionally replace this with an image URL
  },
  {
    id: 3,
    title: "UI/UX Design",
    description:
      "Our design team creates intuitive and engaging user experiences, ensuring your products stand out in functionality and aesthetics.",
    icon: "🎨", // Optionally replace this with an image URL
  },
  {
    id: 4,
    title: "Digital Marketing",
    description:
      "Boost your online presence with our comprehensive digital marketing strategies, including SEO, PPC, social media marketing, and more.",
    icon: "📈", // Optionally replace this with an image URL
  },
  {
    id: 5,
    title: "E-commerce Solutions",
    description:
      "From setting up online stores to integrating payment gateways, we provide end-to-end solutions for your e-commerce needs.",
    icon: "🛒", // Optionally replace this with an image URL
  },
];

const ServicesPage = () => {
  // State management for the menu, cart slider, and dummy cart items
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isCartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  // Toggle functions for menu and cart slider
  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const toggleCart = () => setCartOpen((prev) => !prev);

  return (
    <div className="services-page">
      {/* Header, Menu, and CartSlider components */}
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

      {/* Main Services Content */}
      <header className="services-header">
        <h1>Our Services</h1>
        <p>Discover the range of services we offer to help you achieve your goals.</p>
      </header>

      <section className="services-list">
        {services.map((service) => (
          <div key={service.id} className="service-card">
            <div className="service-icon">{service.icon}</div>
            <h2 className="service-title">{service.title}</h2>
            <p className="service-description">{service.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default ServicesPage;
