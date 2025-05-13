import React, { useState, useEffect } from 'react';
import Header from '../components/shared/Header'; // Header for the homepage
import SearchBar from '../components/shared/SearchBar'; // Search bar for product search
import FilterModal from '../components/shared/FilterModal'; // Filter modal for category selection
import PosterSection from '../components/shared/PosterSection'; // Promotional section
import DiscoverSection from '../components/shared/DiscoverSection'; // Product categories
import ProductGrid from '../components/shared/ProductGrid'; // Grid for displaying products
import NewestGrid from '../components/shared/NewestGrid'; // New grid for latest products
import CategorySection from '../components/shared/CategorySection'; // Dynamic category section
import Menu from '../components/shared/Menu'; // Sliding menu component
import CartSlider from '../components/shared/CartSlider'; // CartSlider for cart management
import AddToCart from '../components/shared/AddToCart'; // AddToCart modal component
import '../components/styles/Homepage.css'; // Homepage-specific styling
import '../components/styles/Responsive/HomePage.responsive.css';
import { wrapperFetch } from '../utils/wrapperfetch';

const BASE_URL = process.env.REACT_APP_BASE_URL;

import { useNotification } from '../components/shared/NotificationContext'; // Import Notification Context

const Homepage = () => {
  const [isMenuOpen, setMenuOpen] = useState(false); // State for menu visibility
  const [isCartOpen, setCartOpen] = useState(false); // State for CartSlider visibility
  const [isFilterOpen, setFilterOpen] = useState(false); // State for filter modal visibility
  const [products, setProducts] = useState([]); // State for fetched products
  const [filteredProducts, setFilteredProducts] = useState([]); // State for filtered products
  const [cartItems, setCartItems] = useState([]); // State for cart items in CartSlider
  const [loading, setLoading] = useState(false); // Loading indicator
  const [showAddToCart, setShowAddToCart] = useState(false); // Manage AddToCart modal visibility
  const [selectedProductId, setSelectedProductId] = useState(null); // Store the selected product ID

  // Use the global notification function from context
  const { showNotification } = useNotification();

  const PRODUCTS_PER_LOAD = 20; // Number of products per batch

    // Clear full local storage on page reload if "superuserId" exists
    useEffect(() => {
      if (localStorage.getItem('superuserId')) {
        console.log('Clearing full local storage...');
        localStorage.clear();
      }
    }, []);

  // Toggle the menu visibility
  const toggleMenu = () => {
    setMenuOpen((prevState) => !prevState);
  };

  // Toggle the cart slider visibility
  const toggleCart = () => {
    setCartOpen((prevState) => !prevState);
  };

  // Function to shuffle products randomly
  const shuffleProducts = (productArray) => {
    return productArray.sort(() => Math.random() - 0.5);
  };

  // Fetch all products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true); // Show loading indicator
      try {
        const response = await wrapperFetch(`${BASE_URL}/api/products/list`);
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        const shuffled = shuffleProducts(data.products || []);
        setProducts(shuffled); // Store shuffled products
        setFilteredProducts(shuffled.slice(0, PRODUCTS_PER_LOAD)); // Set initial batch
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false); // Hide loading indicator
      }
    };

    fetchProducts();
  }, []);

  // Load more products into the filteredProducts state
  const loadMoreProducts = () => {
    const currentCount = filteredProducts.length;
    const nextBatch = products.slice(currentCount, currentCount + PRODUCTS_PER_LOAD);
    if (nextBatch.length > 0) {
      setFilteredProducts((prevProducts) => [...prevProducts, ...nextBatch]);
      showNotification('Loaded more products successfully!', 'success');
    } else {
      showNotification('No more products to load.', 'error');
    }
  };

  // Search functionality
  const handleSearch = (searchTerm) => {
    if (!searchTerm) {
      // Reset to initial product batch if no search term
      setFilteredProducts(products.slice(0, PRODUCTS_PER_LOAD));
      return;
    }

    const results = products.filter((product) =>
      product.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(results); // Set filtered results
  };

  // Handle filters (based on category ID)
  const handleFilterApply = async (categoryId) => {
    setLoading(true);
    try {
      const response = await wrapperFetch(`${BASE_URL}/api/categories/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: categoryId }),
      });

      if (!response.ok) throw new Error('Failed to fetch filtered products');
      const data = await response.json();
      const shuffled = shuffleProducts(data.products || []);
      setFilteredProducts(shuffled); // Update filtered product list
    } catch (error) {
      console.error('Error applying filter:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle Add to Cart modal logic
  const openAddToCartModal = (productId) => {
    setSelectedProductId(productId); // Set the selected product ID
    setShowAddToCart(true); // Open AddToCart modal
  };

  return (
    <div className="homepage">
      <Header toggleMenu={toggleMenu} toggleCart={toggleCart} />
      <Menu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
      <CartSlider
        isCartOpen={isCartOpen}
        toggleCart={toggleCart}
        cartItems={cartItems}
        onRemove={(cartId) =>
          setCartItems((prevItems) => prevItems.filter((item) => item.cart_id !== cartId))
        }
        onUpdateQuantity={(cartId, quantity) =>
          setCartItems((prevItems) =>
            prevItems.map((item) => (item.cart_id === cartId ? { ...item, quantity } : item))
          )
        }
      />

      <SearchBar onSearch={handleSearch} onFilter={() => setFilterOpen(true)} />
      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setFilterOpen(false)}
        onFilterApply={handleFilterApply}
      />
      <PosterSection />
      <DiscoverSection />
      <div className="homepage-test-note-up"> <h6>Note : This is just a Test Website products aren't real here .</h6></div>

      <main>
        {/* Newest Products Grid Section */}
        <section className="newest-section">
          <h2 className="section-title newest-title">
            <i className="fas fa-clock"></i> Newest
          </h2>
          <NewestGrid />
        </section>

        {/* Category Section */}
        <section className="category-section">
          <CategorySection BASE_URL={`${process.env.REACT_APP_BASE_URL}/api`} />
        </section>

        {/* Products Grid Section */}
        <section className="products-section">
          <h2 className="section-title products-title">
            <i className="fas fa-tags"></i> Products
          </h2>
          <ProductGrid
            products={filteredProducts}
            onAddToCart={openAddToCartModal}
          />
          {loading && <p>Loading products...</p>}
          {!loading && filteredProducts.length >= products.length && (
            <p className="no-more-products-message">No more products to display.</p>
          )}
          {!loading && filteredProducts.length < products.length && (
            <button onClick={loadMoreProducts} className="load-more-button">
              Load More
            </button>
          )}
        </section>
      </main>

      {/* AddToCart Modal */}
      {showAddToCart && (
        <AddToCart
          productId={selectedProductId}
          onClose={() => setShowAddToCart(false)}
          onNotify={(message, type) => showNotification(message, type)}
        />
      )}
    </div>
  );
};

export default Homepage;
