import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // For navigation
import '../styles/SearchBar.css'; // Import styles
import '../styles/Responsive/SearchBar.responsive.css';
import { wrapperFetch } from '../../utils/wrapperfetch';

const SearchBar = ({ onFilter }) => {
  const [searchTerm, setSearchTerm] = useState(''); // State to store search term
  const navigate = useNavigate(); // Navigation hook
  const [debounceTimeout, setDebounceTimeout] = useState(null); // Debounce state

  // Handle manual search button click
  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/loadpage?search=${encodeURIComponent(searchTerm)}`); // Navigate with search term
    }
  };

  // Handle filter modal trigger
  const handleFilter = () => {
    if (onFilter) {
      onFilter(); // Open the filter modal if the handler exists
    }
  };

  // Handle search input change with debouncing
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout); // Clear the previous timeout
    }

    setDebounceTimeout(
      setTimeout(() => {
        if (value.trim()) {
          navigate(`/loadpage?search=${encodeURIComponent(value)}`); // Navigate with debounced input
        }
      }, 500) // Delay in milliseconds
    );
  };

  // Clear search input and reset results
  const clearSearch = () => {
    setSearchTerm('');
    navigate(`/loadpage`); // Navigate back to loadpage without search query
  };

  return (
    <div className="search-bar">
      <input
        type="text"
        id="search"
        placeholder="Search for products or categories..."
        aria-label="Search bar"
        aria-live="polite" // Announce dynamic changes to assistive tech
        value={searchTerm}
        onChange={handleInputChange}
      />
      <button id="search-btn" aria-label="Search" onClick={handleSearch}>
        Search
      </button>
      <button id="filter-btn" className="filter-btn" aria-label="Filter" onClick={handleFilter}>
        <i className="fas fa-filter"></i>
      </button>
      {searchTerm && (
        <button id="clear-btn" aria-label="Clear search" onClick={clearSearch}>
          Clear
        </button>
      )}
    </div>
  );
};

export default SearchBar;
