import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../../components/styles/FilterModal.css';
import { wrapperFetch } from '../../../utils/wrapperfetch';

const PreviewFilterModal = ({ isOpen, onClose }) => {
  const priceRef = useRef(null);
  const categoryRef = useRef(null);
  const typeRef = useRef(null);
  const optionRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [options, setOptions] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [error, setError] = useState(null); // State to handle errors
  const BASE_URL = process.env.REACT_APP_BASE_URL;
  const navigate = useNavigate();

  // Fetch categories and types when the modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCategoriesAndTypes();
    }
  }, [isOpen]);

  const fetchCategoriesAndTypes = async () => {
    setLoadingCategories(true);
    setLoadingTypes(true);
    setError(null);

    try {
      const [categoriesResponse, typesResponse] = await Promise.all([
       wrapperFetch(`${BASE_URL}/api/categories/list`),
       wrapperFetch(`${BASE_URL}/api/type/list`),
      ]);

      // Ensure valid response
      if (!categoriesResponse.ok) throw new Error('Failed to fetch categories');
      if (!typesResponse.ok) throw new Error('Failed to fetch types');

      const categoriesData = await categoriesResponse.json();
      const typesData = await typesResponse.json();

      // Update states
      if (Array.isArray(categoriesData) && categoriesData.length > 0) {
        setCategories(categoriesData);
      } else {
        throw new Error('No categories found.');
      }

      setTypes(typesData.types || []);
    } catch (error) {
      console.error('Error fetching categories and types:', error);
      setError('Failed to load categories and types. Please try again.');
    } finally {
      setLoadingCategories(false);
      setLoadingTypes(false);
    }
  };

  // Fetch options based on the selected type
  const fetchOptions = async (typeId) => {
    setLoadingOptions(true);
    setError(null);

    try {
      const response = await wrapperFetch(`${BASE_URL}/api/type/option/list/by-type`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type_id: typeId }),
      });

      if (!response.ok) throw new Error('Failed to fetch options');
      const data = await response.json();
      setOptions(data.options || []);
    } catch (error) {
      console.error('Error fetching options:', error);
      setError('Failed to load options for the selected type.');
      setOptions([]);
    } finally {
      setLoadingOptions(false);
    }
  };

  // Handle type change and fetch corresponding options
  const handleTypeChange = () => {
    const selectedType = typeRef.current?.value || '';
    if (selectedType) {
      fetchOptions(selectedType);
    } else {
      setOptions([]);
    }
  };

  // Reset filters
  const handleClearFilters = () => {
    priceRef.current.value = '';
    categoryRef.current.value = '';
    typeRef.current.value = '';
    optionRef.current.value = '';
    setOptions([]);
    setError(null); // Clear errors on reset
  };

  // Apply filters and navigate
  const handleApply = () => {
    const filters = {};
    const selectedPrice = priceRef.current?.value || '';
    const selectedCategory = categoryRef.current?.value || '';
    const selectedOption = optionRef.current?.value || '';

    // Build the filters object
    if (selectedCategory) filters.category_id = selectedCategory;
    if (selectedOption) filters.option_ids = [selectedOption];
    if (selectedPrice) filters.price = selectedPrice;

    // Navigate to the LoadPage with the query parameters
    const queryParams = new URLSearchParams({ filter: JSON.stringify(filters) });
    navigate(`/preview-load?${queryParams.toString()}`);
    onClose();
  };

  if (!isOpen) return null; // Render nothing if the modal is closed

  return (
    <div className="filter-overlay">
      <div className="filter-modal">
        <span className="close-icon" onClick={onClose}>
          &times;
        </span>
        <h3>Filter Options</h3>
        {error && <p className="error-message">{error}</p>} {/* Display errors */}
        {loadingCategories || loadingTypes ? (
          <p>Loading filters...</p>
        ) : (
          <form>
            {/* Price Filter */}
            <label>Price:</label>
            <select ref={priceRef}>
              <option value="">All Prices</option>
              <option value="0-100">Less than ₹100</option>
              <option value="100-500">₹100 - ₹500</option>
              <option value="500+">More than ₹500</option>
            </select>

            {/* Category Filter */}
            <label>Category:</label>
            <select ref={categoryRef}>
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* Type Filter */}
            <label>Type:</label>
            <select ref={typeRef} onChange={handleTypeChange}>
              <option value="">All Types</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.type_name}
                </option>
              ))}
            </select>

            {/* Option Filter */}
            {options.length > 0 && !loadingOptions && (
              <>
                <label>Options:</label>
                <select ref={optionRef}>
                  <option value="">All Options</option>
                  {options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.option_name}
                    </option>
                  ))}
                </select>
              </>
            )}
            {loadingOptions && <p>Loading options...</p>}

            <div className="filter-buttons">
              <button type="button" onClick={handleApply}>
                Apply Filter
              </button>
              <button type="button" className="clear-button" onClick={handleClearFilters}>
                Clear Filters
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PreviewFilterModal;
