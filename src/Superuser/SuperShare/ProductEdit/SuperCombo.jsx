import React, { useState, useEffect } from 'react';
import { useNotification } from '../../../components/shared/NotificationContext';
import '../../SuperStyle/SuperCombo.css';
import { FaSync } from 'react-icons/fa'; // Refresh icon
import { wrapperFetch } from '../../../utils/wrapperfetch';

const SuperCombo = ({ BASE_URL, productId, userId, product }) => {
  const { showNotification } = useNotification();

  const [combos, setCombos] = useState([]);
  const [allOptions, setAllOptions] = useState([]);
  // Local copy of the product details with types and options.
  const [localProduct, setLocalProduct] = useState(product);
  const [editingComboId, setEditingComboId] = useState(null);
  const [comboPriceEdits, setComboPriceEdits] = useState({});
  const [newComboPrices, setNewComboPrices] = useState({});
  const [newCombosToAdd, setNewCombosToAdd] = useState([]);
  const [popupInfo, setPopupInfo] = useState(null); // For deleted combo info popup

  // Fetch existing combos for the product
  const fetchCombos = () => {
   wrapperFetch(`${BASE_URL}/api/type-combo/fetch/by-product/${productId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.combos) {
          setCombos(data.combos);
        }
      })
      .catch((err) => console.error('Error fetching combos:', err));
  };

  // Fetch all options (to resolve IDs into names)
  const fetchAllOptions = () => {
   wrapperFetch(`${BASE_URL}/api/type/options`)
      .then((res) => res.json())
      .then((data) => {
        if (data.options) {
          setAllOptions(data.options);
        }
      })
      .catch((err) => console.error('Error fetching all options:', err));
  };

  useEffect(() => {
    fetchCombos();
  }, [BASE_URL, productId]);

  useEffect(() => {
    fetchAllOptions();
  }, [BASE_URL]);

  // Refresh handler: fully re-fetch product details, combos, and options
  const refreshProductAndCombos = async () => {
    try {
      // Re-fetch product details
      const resProduct = await wrapperFetch(`${BASE_URL}/api/products/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      });
      const productData = await resProduct.json();
      if (productData.product) {
        // Update local product for latest types and options
        setLocalProduct(productData.product);
      }
      
      // Re-fetch combos
      await fetchCombos();
      // Re-fetch all options to get updated names
      await fetchAllOptions();

      showNotification('Product, combos, and options refreshed successfully!', 'success');
    } catch (err) {
      console.error(err);
      showNotification('Error refreshing product details', 'error');
    }
  };

  // Compute potential new combos from localProduct's types and options
  useEffect(() => {
    if (localProduct && localProduct.types && localProduct.options) {
      const typeOptionMap = {};
      localProduct.types.forEach((type) => {
        const optionsForType = localProduct.options.filter(
          (op) => op.type_id === type.id
        );
        if (optionsForType.length > 0) {
          typeOptionMap[type.id] = optionsForType;
        }
      });
      const arrays = Object.values(typeOptionMap);
      if (arrays.length === 0) {
        setNewCombosToAdd([]);
        return;
      }
      // Compute the Cartesian product of the options arrays.
      const cartesian = arrays.reduce(
        (a, b) => a.flatMap((d) => b.map((e) => [...d, e])),
        [[]]
      );
      // Filter out combos that already exist.
      const existingComboKeys = combos.map((combo) => {
        const sorted = [...combo.options].sort((a, b) => a - b);
        return sorted.join('-');
      });
      const potentials = cartesian.filter((combo) => {
        const comboIds = combo.map((op) => op.id).sort((a, b) => a - b).join('-');
        return !existingComboKeys.includes(comboIds);
      });
      setNewCombosToAdd(potentials);
    }
  }, [localProduct, combos]);

  // Helper to check if a combo has any deleted (missing) option.
  const comboIsInvalid = (combo) => {
    return combo.options.some((id) => !allOptions.find((o) => o.id === id));
  };

  // Convert an array of option IDs into JSX elements with styling.
  const getComboLabelElements = (optionIds) => {
    const elements = optionIds.map((id) => {
      const op = allOptions.find((o) => o.id === id);
      if (op) {
        return (
          <span key={id} className="combo-option-chip">
            {op.option_name}
          </span>
        );
      } else {
        return (
          <span key={id} className="combo-option-chip deleted-option">
            {id}
            <i className="warning-icon">⚠️</i>
          </span>
        );
      }
    });
    // Insert "+" separators between chips.
    const result = [];
    elements.forEach((el, idx) => {
      result.push(el);
      if (idx < elements.length - 1) {
        result.push(
          <span key={`plus-${idx}`} className="combo-plus">
            {'+'}
          </span>
        );
      }
    });
    return result;
  };

  const handleEditCombo = (comboId) => {
    setEditingComboId(comboId);
    const combo = combos.find((c) => c.id === comboId);
    if (combo) {
      setComboPriceEdits((prev) => ({ ...prev, [comboId]: combo.combo_price }));
    }
  };

  const handleSaveComboEdit = (comboId) => {
    const newPrice = parseFloat(comboPriceEdits[comboId]);
    const combo = combos.find((c) => c.id === comboId);
   wrapperFetch(`${BASE_URL}/api/type-combo/edit`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        combo_id: comboId,
        product_id: productId,
        options: combo.options,
        combo_price: newPrice,
        user_id: userId,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        showNotification(data.message, 'success');
        setCombos((prev) => prev.map((c) => (c.id === comboId ? data.combo : c)));
        setEditingComboId(null);
      })
      .catch((err) => {
        console.error(err);
        showNotification('Error updating combo', 'error');
      });
  };

  const handleDeleteCombo = (comboId) => {
   wrapperFetch(`${BASE_URL}/api/type-combo/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        combo_id: comboId,
        user_id: userId,
      }),
    })
      .then((res) => res.json())
      .then(() => {
        showNotification('Combo deleted successfully!', 'success');
        setCombos((prev) => prev.filter((c) => c.id !== comboId));
      })
      .catch((err) => {
        console.error(err);
        showNotification('Error deleting combo', 'error');
      });
  };

  const handleAddNewCombo = (combo) => {
    const comboKey = combo.map((op) => op.id).sort((a, b) => a - b).join('-');
    const price = parseFloat(newComboPrices[comboKey]);
   wrapperFetch(`${BASE_URL}/api/type-combo/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: productId,
        options: combo.map((op) => op.id),
        combo_price: price,
        user_id: userId,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        showNotification(data.message, 'success');
        setCombos((prev) => [...prev, data.combo]);
        setNewCombosToAdd((prev) =>
          prev.filter((c) => {
            const ids1 = c.map((op) => op.id).sort((a, b) => a - b).join('-');
            return ids1 !== comboKey;
          })
        );
      })
      .catch((err) => {
        console.error(err);
        showNotification('Error adding combo', 'error');
      });
  };

  // Popup to explain that the combo contains invalid (deleted) options.
  const openDeletedComboPopup = (combo) => {
    setPopupInfo({
      combo,
      message:
        'This combo contains one or more options that are no longer available. It cannot be updated. Please delete the combo and add a new one.',
    });
  };

  const closePopupInfo = () => {
    setPopupInfo(null);
  };

  return (
    <section className="combo-section">
      <div className="combo-header">
        <h2>Type Combos</h2>
        <FaSync
          className="refresh-icon"
          onClick={refreshProductAndCombos}
          title="Refresh Combos"
        />
      </div>
      <table className="combo-table">
        <thead>
          <tr>
            <th>Combination</th>
            <th>Combo Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {combos.map((combo) => (
            <tr key={combo.id}>
              <td>{getComboLabelElements(combo.options)}</td>
              <td>
                {editingComboId === combo.id ? (
                  <input
                    type="number"
                    value={comboPriceEdits[combo.id] || ''}
                    onChange={(e) =>
                      setComboPriceEdits((prev) => ({
                        ...prev,
                        [combo.id]: e.target.value,
                      }))
                    }
                  />
                ) : (
                  combo.combo_price
                )}
              </td>
              <td>
                {editingComboId === combo.id ? (
                  <>
                    <button
                      className="edit-save-combo-tombo"
                      onClick={() => handleSaveComboEdit(combo.id)}
                    >
                      Save
                    </button>
                    <button
                      className="edit-cancel-combo-tombo"
                      onClick={() => setEditingComboId(null)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    {/* Only show Edit button if combo is valid */}
                    {!comboIsInvalid(combo) && (
                      <button
                        className="edit-save-combo-tombo"
                        onClick={() => handleEditCombo(combo.id)}
                      >
                        Edit
                      </button>
                    )}
                    <button
                      className="edit-cancel-combo-tombo"
                      onClick={() => handleDeleteCombo(combo.id)}
                    >
                      Delete
                    </button>
                    {comboIsInvalid(combo) && (
                      <i
                        className="info-icon"
                        onClick={() => openDeletedComboPopup(combo)}
                      >
                        i
                      </i>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {newCombosToAdd.length > 0 && (
        <div className="new-combo-section">
          <h3>Add New Combos</h3>
          {newCombosToAdd.map((combo) => {
            const comboKey = combo
              .map((op) => op.id)
              .sort((a, b) => a - b)
              .join('-');
            return (
              <div key={comboKey} className="new-combo-item">
                <span>{getComboLabelElements(combo.map((op) => op.id))}</span>
                <input
                  type="number"
                  placeholder="Enter Combo Price"
                  value={newComboPrices[comboKey] || ''}
                  onChange={(e) =>
                    setNewComboPrices((prev) => ({
                      ...prev,
                      [comboKey]: e.target.value,
                    }))
                  }
                />
                <button onClick={() => handleAddNewCombo(combo)}>Add Combo</button>
              </div>
            );
          })}
        </div>
      )}
      {/* Popup for deleted combo info */}
      {popupInfo && (
        <div className="combo-popup-overlay">
          <div className="combo-popup-content">
            <h3>Combo Notice</h3>
            <p>{popupInfo.message}</p>
            <button onClick={closePopupInfo}>Close</button>
          </div>
        </div>
      )}
    </section>
  );
};

export default SuperCombo;
