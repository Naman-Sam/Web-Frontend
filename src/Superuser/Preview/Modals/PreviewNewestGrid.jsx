import React, { useEffect, useState } from 'react';
import ProductCard from './PreviewProductCard'; // Reusable ProductCard component
import '../../../components/styles/NewestGrid.css'; // Grid-specific styles
import '../../../components/styles/Responsive/NewestGrid.responsive.css';
import { wrapperFetch } from '../../../utils/wrapperfetch';

const BASE_URL = process.env.REACT_APP_BASE_URL;


const NewestGrid = () => {
  const [latestProducts, setLatestProducts] = useState([]); // State for storing latest products

  // Fetch the latest products sorted by date
  useEffect(() => {
    const fetchLatestProducts = async () => {
      try {
        const response = await wrapperFetch(`${BASE_URL}/api/products/list`);
        const data = await response.json();

        // Sort the products by date in descending order (latest first)
        const sortedProducts = data.products
          ? data.products.sort((a, b) => new Date(b.date) - new Date(a.date))
          : [];

        setLatestProducts(sortedProducts); // Update state with sorted products
      } catch (error) {
        console.error('Error fetching latest products:', error);
      }
    };

    fetchLatestProducts();
  }, []);

  return (
    <div className="newest-grid">
      {latestProducts.length > 0 ? (
        latestProducts.map((product) => (
          <ProductCard key={product.id} product={product} /> // Display product cards
        ))
      ) : (
        <p className="no-products-message">No new products available.</p> // Handle empty state
      )}
    </div>
  );
};

export default NewestGrid;
