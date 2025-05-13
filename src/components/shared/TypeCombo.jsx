import React, { useState, useEffect } from 'react';
import '../styles/TypeCombo.css';
import { wrapperFetch } from '../../utils/wrapperfetch';

const BASE_URL = process.env.REACT_APP_BASE_URL; // Backend URL

const TypeCombo = ({ productId, onNotify }) => {
    const [combos, setCombos] = useState([]); // Store all combos for the product
    const [selectedOptions, setSelectedOptions] = useState([]); // User-selected options
    const [comboPrice, setComboPrice] = useState(null); // Price for the selected combo
    const [loading, setLoading] = useState(false); // Loading state
    const [error, setError] = useState(null); // Error state

    // Fetch combos by product ID
    const fetchCombos = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await wrapperFetch(`${BASE_URL}/api/type-combo/fetch/by-product/${productId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) throw new Error('Unable to retrieve available combos for this product.');
            const data = await response.json();
            setCombos(data.combos || []);
        } catch (err) {
            console.error('Combo Fetch Error:', err.message);
            setError('Error loading combos. Please refresh the page or try again later.');
            if (onNotify) onNotify('Error fetching combos. Try reloading.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Fetch price for selected options
    const fetchPrice = async () => {
        if (selectedOptions.length === 0) return; // Skip if no options selected
        setLoading(true);
        setError(null);
        try {
            const response = await wrapperFetch(`${BASE_URL}/api/type-combo/fetch/price`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_id: productId, options: selectedOptions }),
            });

            if (!response.ok) throw new Error('Failed to retrieve combo price for the selected options.');
            const data = await response.json();
            setComboPrice(data.combo_price || null);
        } catch (err) {
            console.error('Combo Price Fetch Error:', err.message);
            setError('Unable to calculate the price for the selected combo. Please try again.');
            if (onNotify) onNotify('Error fetching combo price. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle option selection
    const handleOptionSelect = (optionId) => {
        setSelectedOptions((prevSelected) =>
            prevSelected.includes(optionId)
                ? prevSelected.filter((id) => id !== optionId) // Deselect if already selected
                : [...prevSelected, optionId] // Add new selection
        );
    };

    // Fetch combos on mount or when product ID changes
    useEffect(() => {
        fetchCombos();
    }, [productId]);

    // Fetch combo price whenever selected options change
    useEffect(() => {
        fetchPrice();
    }, [selectedOptions]);

    return (
        <div className="type-combo-component-container">
            <h2 className="type-combo-title">Available Combos</h2>
            {loading ? (
                <p className="type-combo-loading-message">Loading combos...</p>
            ) : error ? (
                <p className="type-combo-error-message">{error}</p>
            ) : (
                <>
                    <div className="type-combo-list">
                        {combos.map((combo) => (
                            <div key={combo.id} className="type-combo-card">
                                <h3 className="type-combo-card-title">Combo</h3>
                                <p className="type-combo-card-options">
                                    Options: {combo.options.join(', ')}
                                </p>
                                <p className="type-combo-card-price">Price: ₹{combo.combo_price}</p>
                            </div>
                        ))}
                    </div>
                    <div className="type-combo-selection">
                        <h3 className="type-combo-selection-title">Select Your Combo</h3>
                        {combos.map((combo) => (
                            <button
                                key={combo.id}
                                className={`type-combo-selection-button ${
                                    selectedOptions.includes(combo.id) ? 'type-combo-selected' : ''
                                }`}
                                onClick={() => handleOptionSelect(combo.id)}
                            >
                                {combo.options.join(', ')} - ₹{combo.combo_price}
                            </button>
                        ))}
                    </div>
                </>
            )}
            <div className="type-combo-price-display">
                <h3 className="type-combo-price-title">Selected Combo Price:</h3>
                {comboPrice !== null ? (
                    <p className="type-combo-price">₹{comboPrice.toFixed(2)}</p>
                ) : (
                    <p className="type-combo-price-message">Select options to see the price.</p>
                )}
            </div>
        </div>
    );
};

export default TypeCombo;
