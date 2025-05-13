import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../SuperShare/SuperHeader';
import Menu from '../SuperShare/SuperMenu';
import SearchBar from '../Preview/Modals/PreviewSearchBar';
import FilterModal from '../Preview/Modals/PreviewFilterModal';
import ProductGrid from '../Preview/Modals/PreviewProductGrid';
import DiscoverSection from '../Preview/Modals/PreviewDiscoverSection';
import '../../components/styles/LoadPage.css';
import { useNotification } from '../../components/shared/NotificationContext';
import { wrapperFetch } from '../../utils/wrapperfetch';

const PreviewLoadPage = () => {
  const location = useLocation();
  const [products, setProducts] = useState([]); // Final filtered products
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState(null); // Error state
  const [isFilterOpen, setFilterOpen] = useState(false); // Filter modal visibility
  const [isMenuOpen, setMenuOpen] = useState(false); // Menu visibility state
  const BASE_URL = process.env.REACT_APP_BASE_URL;

  // Use the global notification function from Notification Context
  const { showNotification } = useNotification();

  // Toggle menu visibility
  const toggleMenu = () => {
    setMenuOpen((prevState) => !prevState);
  };

  // Fetch products based on filters and search
  useEffect(() => {
    const applyFilters = async () => {
      setLoading(true);
      setError(null);
      let finalProducts = [];
      const params = new URLSearchParams(location.search);
      const filters = JSON.parse(params.get('filter') || '{}');
      const categoryId = params.get('category_id'); // Detect category_id from URL

      try {
        // If category_id is present, use DiscoverSection logic
        if (categoryId) {
          await fetchDiscoverCategoryProducts(categoryId);
          return; // Skip additional filters logic
        }

        const categoryProducts = filters.category_id
          ? await fetchCategoryProducts(filters.category_id)
          : [];
        const priceProducts = filters.price ? await wfetchPriceProducts(filters.price) : [];
        const optionProducts = filters.option_ids
          ? await fetchOptionProducts(filters.option_ids)
          : [];
        const searchProducts = params.get('search')
          ? await fetchSearchProducts(params.get('search'))
          : [];

        // Combine results if multiple filters are applied
        finalProducts = combineAndSortProducts([
          categoryProducts,
          priceProducts,
          optionProducts,
          searchProducts,
        ]);

        setProducts(finalProducts);
      } catch (error) {
        console.error('Error applying filters:', error);
        setError('Failed to apply filters. Please try again.');
        showNotification('Failed to apply filters. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    };

    applyFilters();
  }, [location.search, showNotification]);

  // Fetch products specifically for DiscoverSection
  const fetchDiscoverCategoryProducts = async (categoryId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await wrapperFetch(`${BASE_URL}/api/categories/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: categoryId }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch DiscoverSection products for category ID: ${categoryId}`
        );
      }

      const data = await response.json();
      if (data.products && data.products.length > 0) {
        setProducts(data.products);
      } else {
        setProducts([]);
        setError('No products found for this category.');
        showNotification('No products found for this category.', 'error');
      }
    } catch (error) {
      console.error('Error fetching DiscoverSection products:', error);
      setError('Failed to load products for this category.');
      showNotification('Failed to load products for this category.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch products for a specific category
  const fetchCategoryProducts = async (categoryId) => {
    const response = await wrapperFetch(`${BASE_URL}/api/categories/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category_id: categoryId }),
    });

    if (!response.ok)
      throw new Error(`Failed to fetch products for category ID: ${categoryId}`);
    const data = await response.json();
    return data.products || [];
  };

  // Fetch products for a specific price range
  const fetchPriceProducts = async (priceRange) => {
    const [minPrice, maxPrice] = priceRange.split('-').map(Number);
    const response = await wrapperFetch(`${BASE_URL}/api/products/list`);

    if (!response.ok)
      throw new Error('Failed to fetch products for price filter');
    const data = await response.json();
    return data.products.filter(
      (product) =>
        product.price >= (minPrice || 0) && (!maxPrice || product.price <= maxPrice)
    );
  };

  // Fetch products for specific options
  const fetchOptionProducts = async (optionIds) => {
    const response = await wrapperFetch(`${BASE_URL}/api/type/products/by-options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ option_ids: optionIds }),
    });

    if (!response.ok)
      throw new Error('Failed to fetch products for options filter');
    const data = await response.json();
    return data.products || [];
  };

  // Fetch products based on a search query
  const fetchSearchProducts = async (searchQuery) => {
    const response = await wrapperFetch(`${BASE_URL}/api/products/list`);

    if (!response.ok)
      throw new Error('Failed to fetch products for search filter');
    const data = await response.json();
    return data.products.filter(
      (product) =>
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.categories.some((cat) =>
          cat.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
  };

  // Combine and sort results from multiple filters
  const combineAndSortProducts = (productLists) => {
    const validLists = productLists.filter((list) => list.length > 0);

    if (validLists.length === 1) return validLists[0];
    if (validLists.length === 0) return [];

    return validLists.reduce((intersection, currentList) =>
      intersection.filter((product) =>
        currentList.some((currentProduct) => currentProduct.id === product.id)
      )
    );
  };

  return (
    <div className="loadpage">
      <Header toggleMenu={toggleMenu} />
      <Menu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
      <SearchBar
        onSearch={(searchTerm) => {
          const params = new URLSearchParams({ search: searchTerm });
          window.location.href = `/loadpage?${params}`;
        }}
        onFilter={() => setFilterOpen(true)}
      />
      <DiscoverSection />
      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setFilterOpen(false)}
        onFilterApply={(filters) => {
          const queryParams = new URLSearchParams({ filter: JSON.stringify(filters) });
          window.location.href = `/loadpage?${queryParams}`;
        }}
      />
      <main>
        {loading && (
          <div className="message-container">
            <p className="loading-message">Loading products...</p>
          </div>
        )}
        {error && (
          <div className="message-container">
            <p className="error-message">{error}</p>
          </div>
        )}
        {!loading && products.length === 0 && !error && (
          <div className="message-container">
            <p className="no-products-message">
              No products found for the selected filters.
            </p>
          </div>
        )}
        {!loading && products.length > 0 && <ProductGrid products={products} />}
      </main>
    </div>
  );
};

export default PreviewLoadPage;
