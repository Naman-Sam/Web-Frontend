import React, { useState, useEffect } from 'react';
import Header from '../SuperShare/SuperHeader'; // Header for the homepage
import SearchBar from '../Preview/Modals/PreviewSearchBar'; // Search bar for product search
import FilterModal from '../Preview/Modals/PreviewFilterModal'; // Filter modal for category selection
import PosterSection from '../Preview/Modals/PreviewPosterSection'; // Promotional section
import DiscoverSection from '../Preview/Modals/PreviewDiscoverSection'; // Product categories
import ProductGrid from '../Preview/Modals/PreviewProductGrid'; // Grid for displaying products
import NewestGrid from '../Preview/Modals/PreviewNewestGrid'; // New grid for latest products
import CategorySection from '../Preview/Modals/PreviewCategorySection'; // Dynamic category section
import Menu from '../SuperShare/SuperMenu'; // Sliding menu component
import '../../components/styles/Homepage.css'; // Homepage-specific styling
import '../../components/styles/Responsive/HomePage.responsive.css';
import { wrapperFetch } from '../../utils/wrapperfetch';

import { useNotification } from '../../components/shared/NotificationContext'; // Import Notification Context

// Define BASE_URL from your environment variables
const BASE_URL = process.env.REACT_APP_BASE_URL;

const PreviewHomepage = () => {
  // State for menu visibility and filter modal
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isFilterOpen, setFilterOpen] = useState(false);
  // States for products and loading
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Global notification function from context
  const { showNotification } = useNotification();
  const PRODUCTS_PER_LOAD = 20;

  // Toggle the menu visibility
  const toggleMenu = () => {
    setMenuOpen((prevState) => !prevState);
  };

  // Function to shuffle products randomly
  const shuffleProducts = (productArray) => {
    return productArray.sort(() => Math.random() - 0.5);
  };

  // Fetch all products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await wrapperFetch(`${BASE_URL}/api/products/list`);
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        const shuffled = shuffleProducts(data.products || []);
        setProducts(shuffled);
        setFilteredProducts(shuffled.slice(0, PRODUCTS_PER_LOAD));
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Load more products into the filtered list
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

  // Search functionality to filter products by title
  const handleSearch = (searchTerm) => {
    if (!searchTerm) {
      setFilteredProducts(products.slice(0, PRODUCTS_PER_LOAD));
      return;
    }
    const results = products.filter((product) =>
      product.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(results);
  };

  // Handle filtering of products based on category ID
  const handleFilterApply = async (categoryId) => {
    setLoading(true);
    try {
      const response = await wrapperFetch(`${BASE_URL}api/categories/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: categoryId }),
      });

      if (!response.ok) throw new Error('Failed to fetch filtered products');
      const data = await response.json();
      const shuffled = shuffleProducts(data.products || []);
      setFilteredProducts(shuffled);
    } catch (error) {
      console.error('Error applying filter:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="homepage">
      <Header toggleMenu={toggleMenu} />
      <Menu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
      <SearchBar onSearch={handleSearch} onFilter={() => setFilterOpen(true)} />
      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setFilterOpen(false)}
        onFilterApply={handleFilterApply}
      />
      <PosterSection />
      <DiscoverSection />

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
          <ProductGrid products={filteredProducts} />
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
    </div>
  );
};

export default PreviewHomepage;
