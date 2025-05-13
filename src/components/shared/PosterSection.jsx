import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import navigation hook
import '../styles/PosterSection.css'; // Import styles
import '../styles/Responsive/PosterSection.responsive.css';
console.log('BASE_URL:', BASE_URL);
import { wrapperFetch } from '../../utils/wrapperfetch';

const BASE_URL = process.env.REACT_APP_BASE_URL; // Base URL for API

const PosterSection = () => {
  const [posters, setPosters] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate(); // Initialize navigation hook

  useEffect(() => {
    const fetchPosters = async () => {
      try {
        const response = await wrapperFetch(`${BASE_URL}/api/posters/all`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (data.message === "Posters fetched successfully!" && Array.isArray(data.posters)) {
          setPosters(data.posters);
        } else {
          console.warn("No posters found or invalid response format.");
        }
      } catch (error) {
        console.error("Error fetching posters:", error);
      }
    };

    fetchPosters();
  }, []);

  const moveToSlide = (index) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % posters.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + posters.length) % posters.length);
  };

  useEffect(() => {
    const autoSlide = setInterval(nextSlide, 5000);
    return () => clearInterval(autoSlide); // Cleanup interval on unmount
  }, [posters]);

  const handleBuyNowClick = (productId) => {
    navigate(`/product/${productId}`); // Navigate to product page with product_id
  };

  return (
    <section className="poster-container">
      <div className="poster-carousel" tabIndex="0" aria-label="Poster carousel">
        <div
          className="poster-wrapper"
          style={{
            transform: `translateX(-${currentSlide * 100}%)`,
            transition: 'transform 0.5s ease-in-out',
          }}
        >
          {posters.map((poster, index) => (
            <div className="poster-container-item" key={index}>
              <img
                src={poster.poster_desktop_url || 'fallback-image.jpg'}
                alt={`Poster ${index + 1}`}
                className="poster"
              />
              {/* Updated "Buy Now" button */}
              <button
                className="buy-now-button"
                onClick={() => handleBuyNowClick(poster.product_id)} // Call navigation function
              >
                Buy Now
              </button>
            </div>
          ))}
        </div>
        <div className="dots-navigation" aria-label="Poster navigation">
          {posters.map((_, index) => (
            <div
              key={index}
              className={`dot ${currentSlide === index ? 'active' : ''}`}
              onClick={() => moveToSlide(index)}
            ></div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PosterSection;
