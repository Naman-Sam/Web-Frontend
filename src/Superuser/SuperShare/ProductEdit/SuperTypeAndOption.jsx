import React, { useState, useEffect } from 'react';
import { useNotification } from '../../../components/shared/NotificationContext';
import '../../SuperStyle/SuperTypeAndOption.css';
import { wrapperFetch } from '../../../utils/wrapperfetch';

const SuperTypeAndOption = ({ BASE_URL, product, userId }) => {
  const { showNotification } = useNotification();
  window.dispatchEvent(new Event('productUpdated'));


  // If product is not yet provided, show loading.
  if (!product) {
    return <div>Loading...</div>;
  }

  // State for selected options (mapping type ID to an array of option objects)
  const [selectedOptions, setSelectedOptions] = useState({});
  // Full list of types fetched from the API when in edit mode
  const [allTypes, setAllTypes] = useState([]);
  // UI states
  const [editMode, setEditMode] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [activeTypeForModal, setActiveTypeForModal] = useState(null);
  const [modalSelectedOptions, setModalSelectedOptions] = useState([]);
  const [modalNewOptionName, setModalNewOptionName] = useState('');
  // Cache options for a given type (by type id)
  const [optionsCache, setOptionsCache] = useState({});

  // Context menu and inline editing states for types:
  const [typeContextMenu, setTypeContextMenu] = useState({ visible: false, x: 0, y: 0, type: null });
  const [editTypeModalVisible, setEditTypeModalVisible] = useState(false);
  const [editTypeName, setEditTypeName] = useState('');
  const [typeToEdit, setTypeToEdit] = useState(null);

  // Context menu and inline editing states for options:
  const [optionContextMenu, setOptionContextMenu] = useState({ visible: false, x: 0, y: 0, option: null, typeId: null });
  const [editOptionModalVisible, setEditOptionModalVisible] = useState(false);
  const [editOptionName, setEditOptionName] = useState('');
  const [optionToEdit, setOptionToEdit] = useState(null);
  const [optionTypeId, setOptionTypeId] = useState(null);

  // Initialize selectedOptions from the product prop.
  useEffect(() => {
    if (product.types && product.options) {
      const initialSelected = {};
      product.types.forEach((type) => {
        const optionsForType = product.options.filter((op) => op.type_id === type.id);
        if (optionsForType.length) {
          initialSelected[type.id] = optionsForType.map((op) => ({
            id: op.id,
            option_name: op.name || op.option_name,
            type_id: op.type_id,
            type_name: op.type_name || type.type_name || type.name,
          }));
        }
      });
      setSelectedOptions(initialSelected);
    }
  }, [product]);

  // When edit mode is enabled, fetch the full list of types.
  useEffect(() => {
    if (editMode) {
     wrapperFetch(`${BASE_URL}/api/type/list`)
        .then((res) => res.json())
        .then((data) => {
          if (data.types) {
            setAllTypes(data.types);
          }
        })
        .catch((err) => console.error("Error fetching types:", err));
    }
  }, [editMode, BASE_URL]);

  // Fetch options corresponding to a type if not cached yet.
  const fetchOptionsByType = (typeId) => {
    if (optionsCache[typeId]) return;
   wrapperFetch(`${BASE_URL}/api/type/option/list/by-type`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type_id: typeId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.options) {
          setOptionsCache((prev) => ({ ...prev, [typeId]: data.options }));
        }
      })
      .catch((err) => console.error(`Error fetching options for type ${typeId}:`, err));
  };

  // Open modal for a given type to select its options.
  const openTypeModal = (type) => {
    setActiveTypeForModal(type);
    fetchOptionsByType(type.id);
    setModalSelectedOptions(selectedOptions[type.id] ? [...selectedOptions[type.id]] : []);
  };

  // Toggle an option in the modal list.
  const toggleModalOption = (option) => {
    const exists = modalSelectedOptions.find((op) => op.id === option.id);
    if (exists) {
      setModalSelectedOptions(modalSelectedOptions.filter((op) => op.id !== option.id));
    } else {
      setModalSelectedOptions([...modalSelectedOptions, option]);
    }
  };

  // Add a new type via API.
  const handleAddType = () => {
    if (!newTypeName.trim()) return;
   wrapperFetch(`${BASE_URL}/api/type/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type_name: newTypeName.trim(), user_id: userId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.type) {
          showNotification(data.message, 'success');
          setAllTypes((prev) => [...prev, data.type]);
          setNewTypeName('');
        } else {
          throw new Error('Failed to add type');
        }
      })
      .catch((err) => {
        console.error(err);
        showNotification('Error adding type', 'error');
      });
  };

  // Close and save modal selections.
  const closeTypeModal = () => {
    setSelectedOptions((prev) => {
      const updated = { ...prev };
      if (modalSelectedOptions.length === 0) {
        delete updated[activeTypeForModal.id];
      } else {
        updated[activeTypeForModal.id] = modalSelectedOptions;
      }
      return updated;
    });
    setActiveTypeForModal(null);
    setModalSelectedOptions([]);
    setModalNewOptionName('');
  };

  // Add a new option for the active type via API.
  const handleAddOptionInModal = () => {
    if (!modalNewOptionName.trim()) return;
   wrapperFetch(`${BASE_URL}/api/type/option/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        option_name: modalNewOptionName.trim(),
        type_id: activeTypeForModal.id,
        user_id: userId,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.option) {
          showNotification(data.message, 'success');
          setOptionsCache((prev) => {
            const updatedOptions = prev[activeTypeForModal.id]
              ? [...prev[activeTypeForModal.id], data.option]
              : [data.option];
            return { ...prev, [activeTypeForModal.id]: updatedOptions };
          });
          // FIX: Update modalSelectedOptions so the new option appears in real time.
          setModalSelectedOptions((prev) => [...prev, data.option]);
          setModalNewOptionName('');
        } else {
          throw new Error('Failed to add option');
        }
      })
      .catch((err) => {
        console.error(err);
        showNotification('Error adding option', 'error');
      });
  };  

  // Helper: Reload the whole type and option section.
  // This re-fetches product details and the full type list.
  const reloadTypeAndOption = async () => {
    try {
      const res = await wrapperFetch(`${BASE_URL}/api/products/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id }),
      });
      const data = await res.json();
      if (data.product) {
        if (data.product.types && data.product.options) {
          const initialSelected = {};
          data.product.types.forEach((type) => {
            const optionsForType = data.product.options.filter((op) => op.type_id === type.id);
            if (optionsForType.length) {
              initialSelected[type.id] = optionsForType.map((op) => ({
                id: op.id,
                option_name: op.name || op.option_name,
                type_id: op.type_id,
                type_name: op.type_name || type.type_name || type.name,
              }));
            }
          });
          setSelectedOptions(initialSelected);
        }
      }
      // Also re-fetch the full types list.
     wrapperFetch(`${BASE_URL}/api/type/list`)
        .then((res) => res.json())
        .then((dt) => {
          if (dt.types) setAllTypes(dt.types);
        })
        .catch((err) => console.error("Error fetching types:", err));
    } catch (err) {
      console.error("Error reloading product details:", err);
    }
  };

  // Save the edited types and options to the product.
  const handleSave = () => {
    const type_ids = Object.keys(selectedOptions);
    let option_ids = [];
    Object.values(selectedOptions).forEach((optionsArr) => {
      optionsArr.forEach((op) => {
        option_ids.push(op.id);
      });
    });
    const updateData = {
      user_id: userId,
      product_id: product.id,
      type_ids,
      option_ids,
    };

   wrapperFetch(`${BASE_URL}/api/products/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    })
      .then((res) => res.json())
      .then((data) => {
        showNotification(data.message, 'success');
        // Reload the entire section so new options/types are visible.
        reloadTypeAndOption();
        setEditMode(false);
      })
      .catch((err) => {
        console.error(err);
        showNotification('Failed to update types/options', 'error');
      });
  };

  // Cancel editing and revert to product's original details.
  const handleCancel = () => {
    if (product.types && product.options) {
      const initialSelected = {};
      product.types.forEach((type) => {
        const optionsForType = product.options.filter((op) => op.type_id === type.id);
        if (optionsForType.length) {
          initialSelected[type.id] = optionsForType.map((op) => ({
            id: op.id,
            option_name: op.name || op.option_name,
            type_id: op.type_id,
            type_name: op.type_name || type.type_name || type.name,
          }));
        }
      });
      setSelectedOptions(initialSelected);
    }
    setEditMode(false);
  };

  /* ----------------- Context Menus & Inline Editing ----------------- */

  // Type context menu handlers
  const handleTypeContextMenu = (e, type) => {
    e.preventDefault();
    setTypeContextMenu({ visible: true, x: e.pageX, y: e.pageY, type });
  };

  // Option context menu handlers
  const handleOptionContextMenu = (e, option, typeId) => {
    e.preventDefault();
    setOptionContextMenu({ visible: true, x: e.pageX, y: e.pageY, option, typeId });
  };

  useEffect(() => {
    const handleGlobalClick = () => {
      setTypeContextMenu({ visible: false, x: 0, y: 0, type: null });
      setOptionContextMenu({ visible: false, x: 0, y: 0, option: null, typeId: null });
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  // Helper: Given an array of option IDs, return a label with the option names.
  const getComboLabel = (optionIds) => {
    const names = optionIds.map((id) => {
      const op = allOptions.find((o) => o.id === id);
      return op ? op.option_name : id;
    });
    return names.join(' + ');
  };

  // Edit Type inline modal functions:
  const openEditTypeModal = (type) => {
    setTypeToEdit(type);
    setEditTypeName(type.type_name);
    setEditTypeModalVisible(true);
    setTypeContextMenu({ visible: false, x: 0, y: 0, type: null });
  };

  const saveTypeEdit = () => {
   wrapperFetch(`${BASE_URL}/api/type/edit`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type_id: typeToEdit.id,
        type_name: editTypeName.trim(),
        user_id: userId,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.type) {
          showNotification(data.message, 'success');
          setAllTypes((prev) => prev.map((t) => (t.id === data.type.id ? data.type : t)));
          if (selectedOptions[data.type.id]) {
            setSelectedOptions((prev) => {
              const newSelected = { ...prev };
              newSelected[data.type.id] = newSelected[data.type.id].map((op) => ({
                ...op,
                type_name: data.type.type_name,
              }));
              return newSelected;
            });
          }
          setEditTypeModalVisible(false);
          setTypeToEdit(null);
        } else {
          throw new Error('Failed to update type');
        }
      })
      .catch((err) => {
        console.error(err);
        showNotification('Error updating type', 'error');
      });
  };

  const deleteType = (type) => {
   wrapperFetch(`${BASE_URL}/api/type/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type_id: type.id, user_id: userId }),
    })
      .then((res) => res.json())
      .then((data) => {
        showNotification(data.message, 'success');
        setAllTypes((prev) => prev.filter((t) => t.id !== type.id));
        setSelectedOptions((prev) => {
          const newSel = { ...prev };
          delete newSel[type.id];
          return newSel;
        });
      })
      .catch((err) => {
        console.error(err);
        showNotification('Error deleting type', 'error');
      });
    setTypeContextMenu({ visible: false, x: 0, y: 0, type: null });
  };

  // Edit Option inline modal functions:
  const openEditOptionModal = (option, typeId) => {
    setOptionToEdit(option);
    setEditOptionName(option.option_name);
    setOptionTypeId(typeId);
    setEditOptionModalVisible(true);
    setOptionContextMenu({ visible: false, x: 0, y: 0, option: null, typeId: null });
  };

  const saveOptionEdit = () => {
   wrapperFetch(`${BASE_URL}/api/type/option/edit`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type_id: optionTypeId,
        remove_option_ids: [optionToEdit.id],
        add_options: [editOptionName.trim()],
        user_id: userId,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        showNotification(data.message, 'success');
        // Refresh the options cache for this type.
        fetchOptionsByType(optionTypeId);
        setModalSelectedOptions((prev) =>
          prev.map((op) =>
            op.id === optionToEdit.id ? { ...op, option_name: editOptionName.trim() } : op
          )
        );
        setEditOptionModalVisible(false);
        setOptionToEdit(null);
      })
      .catch((err) => {
        console.error(err);
        showNotification('Error updating option', 'error');
      });
  };

  const deleteOption = (optionId, typeId) => {
   wrapperFetch(`${BASE_URL}/api/type/option/edit`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type_id: typeId,
        remove_option_ids: [optionId],
        user_id: userId,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        showNotification(data.message, 'success');
        setModalSelectedOptions((prev) => prev.filter((op) => op.id !== optionId));
        fetchOptionsByType(typeId);
      })
      .catch((err) => {
        console.error(err);
        showNotification('Error deleting option', 'error');
      });
    setOptionContextMenu({ visible: false, x: 0, y: 0, option: null, typeId: null });
  };

  return (
    <section className="to-section">
      <h2>Types &amp; Options</h2>
      {editMode ? (
        <div className="to-edit">
          <div className="to-types-list">
            {allTypes.length > 0 ? (
              allTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  className={selectedOptions[type.id] ? 'to-type-chip selected' : 'to-type-chip'}
                  onClick={() => openTypeModal(type)}
                  onContextMenu={(e) => handleTypeContextMenu(e, type)}
                >
                  {type.type_name}
                </button>
              ))
            ) : (
              <p>No types available.</p>
            )}
          </div>
          <div className="to-add-type">
            <input
              type="text"
              placeholder="New Type Name"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
            />
            <button type="button" onClick={handleAddType}>
              Add Type
            </button>
          </div>
          {activeTypeForModal && (
            <div className="to-modal-overlay">
              <div className="to-modal-content">
                <h3>Select Options for {activeTypeForModal.type_name}</h3>
                <div className="to-modal-options-list">
                  {optionsCache[activeTypeForModal.id] ? (
                    optionsCache[activeTypeForModal.id].map((option) => (
                      <div
                        key={option.id}
                        className={`to-modal-option-chip ${
                          modalSelectedOptions.find((op) => op.id === option.id) ? 'selected' : ''
                        }`}
                        onClick={() => toggleModalOption(option)}
                        onContextMenu={(e) => handleOptionContextMenu(e, option, activeTypeForModal.id)}
                      >
                        {option.option_name}
                      </div>
                    ))
                  ) : (
                    <p>Loading options...</p>
                  )}
                </div>
                <div className="to-modal-add-option">
                  <input
                    type="text"
                    placeholder="New Option Name"
                    value={modalNewOptionName}
                    onChange={(e) => setModalNewOptionName(e.target.value)}
                  />
                  <button type="button" onClick={handleAddOptionInModal}>
                    Add Option
                  </button>
                </div>
                <div className="to-modal-actions">
                  <button onClick={closeTypeModal}>Save</button>
                  <button
                    onClick={() => {
                      setActiveTypeForModal(null);
                      setModalSelectedOptions([]);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          <button className="more-type-user-one-save" onClick={handleSave}>Save Types &amp; Options</button>
          <button className="more-type-user-one-cancel" onClick={handleCancel}>Cancel</button>
        </div>
      ) : (
        <div className="to-display">
          {Object.keys(selectedOptions).length > 0 ? (
            Object.entries(selectedOptions).map(([typeId, options]) => (
              <div key={typeId} className="to-group">
                <h3>{options[0].type_name}</h3>
                <div>
                  {options.map((op) => (
                    <span key={op.id} className="to-chip">
                      {op.option_name}
                    </span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p>No types and options selected.</p>
          )}
          <button className="more-type-user-one" onClick={() => setEditMode(true)}>Edit Types &amp; Options</button>
        </div>
      )}

      {/* Type Context Menu */}
      {typeContextMenu.visible && (
        <div
          className="to-context-menu"
          style={{ top: typeContextMenu.y, left: typeContextMenu.x }}
        >
          <button onClick={() => openEditTypeModal(typeContextMenu.type)}>Edit Type</button>
          <button onClick={() => deleteType(typeContextMenu.type)}>Delete Type</button>
        </div>
      )}

      {/* Option Context Menu */}
      {optionContextMenu.visible && (
        <div
          className="to-context-menu"
          style={{ top: optionContextMenu.y, left: optionContextMenu.x }}
        >
          <button
            onClick={() =>
              openEditOptionModal(optionContextMenu.option, optionContextMenu.typeId)
            }
          >
            Edit Option
          </button>
          <button
            onClick={() =>
              deleteOption(optionContextMenu.option.id, optionContextMenu.typeId)
            }
          >
            Delete Option
          </button>
        </div>
      )}

      {/* Edit Type Modal */}
      {editTypeModalVisible && (
        <div className="to-modal-overlay">
          <div className="to-modal-content">
            <h3>Edit Type</h3>
            <input
              type="text"
              value={editTypeName}
              onChange={(e) => setEditTypeName(e.target.value)}
            />
            <div className="to-modal-actions">
              <button onClick={saveTypeEdit}>Save</button>
              <button onClick={() => setEditTypeModalVisible(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Option Modal */}
      {editOptionModalVisible && (
        <div className="to-modal-overlay">
          <div className="to-modal-content">
            <h3>Edit Option</h3>
            <input
              type="text"
              value={editOptionName}
              onChange={(e) => setEditOptionName(e.target.value)}
            />
            <div className="to-modal-actions">
              <button onClick={saveOptionEdit}>Save</button>
              <button onClick={() => setEditOptionModalVisible(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default SuperTypeAndOption;
