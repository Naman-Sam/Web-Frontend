import React, { useState, useEffect, useCallback } from 'react';
import ProductCard from './ProductCard'; // Reusable ProductCard component
import '../styles/ProductGrid.css'; // Styling for Product Grid
import '../styles/Responsive/ProductGrid.responsive.css';
import { wrapperFetch } from '../../utils/wrapperfetch';

const ProductGrid = ({ products }) => {
  const [visibleProducts, setVisibleProducts] = useState([]); // State for the products currently visible
  const [page, setPage] = useState(1); // State for pagination (current page)

  const PRODUCTS_PER_PAGE = 12; // Number of products to load per batch

  useEffect(() => {
    // Load initial products
    setVisibleProducts(products.slice(0, PRODUCTS_PER_PAGE));
  }, [products]);

  const loadMoreProducts = useCallback(() => {
    const nextPage = page + 1;
    const start = PRODUCTS_PER_PAGE * (nextPage - 1);
    const end = PRODUCTS_PER_PAGE * nextPage;

    setVisibleProducts((prev) => [...prev, ...products.slice(start, end)]);
    setPage(nextPage);
  }, [page, products]);

  const handleScroll = useCallback(() => {
    // Check if the user has scrolled to the bottom of the container
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      loadMoreProducts();
    }
  }, [loadMoreProducts]);

  useEffect(() => {
    // Attach scroll event listener
    window.addEventListener('scroll', handleScroll);

    // Clean up the event listener when the component unmounts
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div className="product-grid">
      {visibleProducts.length > 0 ? (
        visibleProducts.map((product) => (
          <ProductCard key={product.id} product={product} /> // Display product cards
        ))
      ) : (
        <p className="no-products-message">No products available.</p> // Handle empty state
      )}
    </div>
  );
};

export default ProductGrid;
