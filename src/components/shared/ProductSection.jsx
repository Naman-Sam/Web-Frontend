import React, { useEffect, useState } from 'react';
import ProductCard from './ProductCard'; // Import the reusable ProductCard component
import '../styles/ProductSection.css'; // CSS specific to ProductsSection
import { wrapperFetch } from '../../utils/wrapperfetch';

const ProductsSection = ({ fetchProducts, title }) => {
  const [products, setProducts] = useState([]); // State to store products
  const [page, setPage] = useState(1); // Current page for API pagination
  const [hasMore, setHasMore] = useState(true); // Whether more products are available
  const [loading, setLoading] = useState(false); // Loading indicator

  // Shuffle the products array to display them randomly
  const shuffleProducts = (productArray) => {
    return productArray.sort(() => Math.random() - 0.5); // Randomize order
  };

  // Function to fetch more products
  const loadMoreProducts = async () => {
    if (!hasMore || loading) return; // Prevent fetching if no more products or already loading

    setLoading(true); // Set loading state
    try {
      const response = await fetchProducts(page); // Fetch products for the current page
      if (response.products && response.products.length > 0) {
        setProducts((prevProducts) => [
          ...prevProducts,
          ...shuffleProducts(response.products), // Append shuffled products
        ]);
        setPage((prevPage) => prevPage + 1); // Increment the page
      } else {
        setHasMore(false); // No more products to load
      }
    } catch (error) {
      console.error('Error loading more products:', error);
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  // Infinite scrolling logic
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.offsetHeight - 100 &&
        hasMore
      ) {
        loadMoreProducts(); // Trigger load more when the user scrolls near the bottom
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll); // Cleanup
  }, [hasMore, page]);

  // Load initial products
  useEffect(() => {
    loadMoreProducts(); // Load products on mount
  }, []);

  return (
    <section className="products-section">
    <h2 className="section-title">{title}</h2>
    <div className="products-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
    {loading && <p>Loading more products...</p>} {/* Show loading indicator */}
    {!hasMore && <p className="no-more-products-message">No more products to display.</p>} {/* Highlighted message */}
  </section>  
  );
};

export default ProductsSection;
