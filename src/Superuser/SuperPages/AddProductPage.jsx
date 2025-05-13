import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SuperHeader from '../SuperShare/SuperHeader'; // Custom super header component
import SuperMenu from '../SuperShare/SuperMenu'; // Custom super menu component
import { useNotification } from '../../components/shared/NotificationContext';
import ImageCropperModal from '../SuperShare/ImageCropperModal'; // Import the cropper modal component
import { wrapperFetch } from '../../utils/wrapperfetch';
import '../SuperStyle/AddProductPage.css';

const SuperProductPage = ({ BASE_URL }) => {
  // Header/Menu state
  const [isMenuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen((prev) => !prev);

  // General product details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // NOTE: Use "price" rather than "initialPrice" as backend calculates the original automatically.
  const [price, setPrice] = useState('');
  const [isDiscounted, setIsDiscounted] = useState(false);
  const [discountAmount, setDiscountAmount] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');

  // Categories state (chips UI)
  const [allCategories, setAllCategories] = useState([]); // fetched from /api/categories/list
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  // Types and Options state
  const [types, setTypes] = useState([]); // fetched from /api/type/list
  // For each type, store an array of selected option objects: { [typeId]: [option objects] }
  const [selectedOptions, setSelectedOptions] = useState({});
  // Cache options for each type: { [typeId]: [option objects] }
  const [optionsCache, setOptionsCache] = useState({});
  // Modal state for selecting options from a type (popup)
  const [activeTypeForModal, setActiveTypeForModal] = useState(null);
  const [modalSelectedOptions, setModalSelectedOptions] = useState([]);
  const [modalNewOptionName, setModalNewOptionName] = useState('');

  // New state for adding a type
  const [newTypeName, setNewTypeName] = useState('');

  // Type Combos state (generated combos with price input)
  const [typeCombos, setTypeCombos] = useState([]);

  // Images state
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Custom context menu & modals state for edit/delete actions
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    menuType: '', // 'category', 'option', or 'type'
    data: null,
    parentId: null, // used for options (stores type id)
  });
  const contextRef = useRef(null);
  const [editModal, setEditModal] = useState({
    visible: false,
    type: '', // 'category', 'option', or 'type'
    data: null,
    parentId: null,
    input: '',
  });
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    type: '', // 'category', 'option', or 'type'
    data: null,
    parentId: null,
    message: '',
  });

  // Image context menu state for uploaded images
  const [imageContextMenu, setImageContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    imageIndex: null,
  });
  const imageContextRef = useRef(null);

  // Crop modal state for image cropping functionality
  const [cropModalInfo, setCropModalInfo] = useState({
    visible: false,
    imageIndex: null,
    imageUrl: '',
  });

  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const userId = localStorage.getItem('superuserId');

  //----------------- FETCH INITIAL DATA -----------------
  useEffect(() => {
    wrapperFetch(`${BASE_URL}/api/categories/list`)
      .then((res) => res.json())
      .then((data) => setAllCategories(data))
      .catch((err) => console.error('Error fetching categories:', err));
  }, [BASE_URL]);

  useEffect(() => {
    wrapperFetch(`${BASE_URL}/api/type/list`)
      .then((res) => res.json())
      .then((data) => {
        if (data.types) setTypes(data.types);
      })
      .catch((err) => console.error('Error fetching types:', err));
  }, [BASE_URL]);

  //----------------- CONTEXT MENU: Close on Outside Click -----------------
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextRef.current && !contextRef.current.contains(event.target)) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  //----------------- IMAGE CONTEXT MENU: Close on Outside Click -----------------
  useEffect(() => {
    const handleClickOutsideImageContext = (event) => {
      if (imageContextRef.current && !imageContextRef.current.contains(event.target)) {
        setImageContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener('click', handleClickOutsideImageContext);
    return () => document.removeEventListener('click', handleClickOutsideImageContext);
  }, []);

  //----------------- UTILITY FUNCTIONS -----------------
  // Modified to allow force refresh of cache
  const fetchOptionsByType = (typeId, forceRefresh = false) => {
    if (!forceRefresh && optionsCache[typeId]) return;
    wrapperFetch(`${BASE_URL}/api/type/option/list/by-type`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type_id: typeId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.options)
          setOptionsCache((prev) => ({ ...prev, [typeId]: data.options }));
      })
      .catch((err) =>
        console.error(`Error fetching options for type ${typeId}:`, err)
      );
  };

  //----------------- CATEGORY HANDLERS -----------------
  const handleCategoryToggle = (category) => {
    const exists = selectedCategories.find((cat) => cat.id === category.id);
    if (exists) {
      setSelectedCategories(selectedCategories.filter((cat) => cat.id !== category.id));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleCategoryContextMenu = (e, category) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      menuType: 'category',
      data: category,
      parentId: null,
    });
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    wrapperFetch(`${BASE_URL}/api/categories/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategoryName, user_id: userId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.category) {
          showNotification(data.message, 'success');
          setAllCategories([...allCategories, data.category]);
          setSelectedCategories([...selectedCategories, data.category]);
          setNewCategoryName('');
        }
      })
      .catch((err) => {
        console.error(err);
        showNotification('Error adding category', 'error');
      });
  };

  //----------------- TYPES & OPTIONS HANDLERS -----------------
  const openTypeModal = (type) => {
    setActiveTypeForModal(type);
    fetchOptionsByType(type.id);
    setModalSelectedOptions(selectedOptions[type.id] || []);
  };

  const toggleModalOption = (option, typeId) => {
    const exists = modalSelectedOptions.find((op) => op.id === option.id);
    if (exists) {
      setModalSelectedOptions(modalSelectedOptions.filter((op) => op.id !== option.id));
    } else {
      setModalSelectedOptions([...modalSelectedOptions, option]);
    }
  };

  const handleOptionContextMenu = (e, option, typeId) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      menuType: 'option',
      data: option,
      parentId: typeId,
    });
  };

  const handleTypeContextMenu = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      menuType: 'type',
      data: type,
      parentId: null,
    });
  };

  const closeTypeModal = () => {
    if (modalSelectedOptions.length === 0) {
      const updated = { ...selectedOptions };
      delete updated[activeTypeForModal.id];
      setSelectedOptions(updated);
    } else {
      setSelectedOptions((prev) => ({
        ...prev,
        [activeTypeForModal.id]: modalSelectedOptions,
      }));
    }
    setActiveTypeForModal(null);
    setModalSelectedOptions([]);
  };

  // New: Handle adding a new type
  const handleAddType = () => {
    if (!newTypeName.trim()) return;
    wrapperFetch(`${BASE_URL}/api/type/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type_name: newTypeName, user_id: userId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.type) {
          showNotification(data.message, 'success');
          setTypes([...types, data.type]);
          setNewTypeName('');
        }
      })
      .catch((err) => {
        console.error(err);
        showNotification('Error adding type', 'error');
      });
  };

  //----------------- CONTEXT MENU MODAL FUNCTIONS -----------------
  const openEditModal = (modalType, data, parentId = null) => {
    setEditModal({
      visible: true,
      type: modalType,
      data,
      parentId,
      input: data.name || data.option_name || data.type_name,
    });
    setContextMenu({ ...contextMenu, visible: false });
  };

  const openConfirmModal = (modalType, data, parentId = null) => {
    let message = '';
    if (modalType === 'category') {
      message = `Are you sure to delete category "${data.name}"?`;
    } else if (modalType === 'option') {
      message = `Are you sure to delete option "${data.option_name}"?`;
    } else if (modalType === 'type') {
      message = `Are you sure to delete type "${data.type_name}"?`;
    }
    setConfirmModal({
      visible: true,
      type: modalType,
      data,
      parentId,
      message,
    });
    setContextMenu({ ...contextMenu, visible: false });
  };

  const handleEditSave = () => {
    if (editModal.type === 'category') {
      wrapperFetch(`${BASE_URL}/api/categories/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editModal.data.id,
          name: editModal.input,
          user_id: userId,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          showNotification(data.message, 'success');
          setAllCategories(
            allCategories.map((cat) =>
              cat.id === editModal.data.id ? data.category : cat
            )
          );
          setSelectedCategories(
            selectedCategories.map((cat) =>
              cat.id === editModal.data.id ? data.category : cat
            )
          );
          setEditModal({ visible: false, type: '', data: null, parentId: null, input: '' });
        })
        .catch((err) => {
          console.error(err);
          showNotification('Error editing category', 'error');
        });
    } else if (editModal.type === 'option') {
      wrapperFetch(`${BASE_URL}/api/type/option/edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type_id: editModal.parentId,
          add_options: [editModal.input],
          remove_option_ids: [editModal.data.id],
          user_id: userId,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          showNotification(data.message, 'success');
          // Force refresh options cache for this type.
          fetchOptionsByType(editModal.parentId, true);
          setEditModal({ visible: false, type: '', data: null, parentId: null, input: '' });
        })
        .catch((err) => {
          console.error(err);
          showNotification('Error editing option', 'error');
        });
    } else if (editModal.type === 'type') {
      wrapperFetch(`${BASE_URL}/api/type/edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type_id: editModal.data.id,
          type_name: editModal.input,
          user_id: userId,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          showNotification(data.message, 'success');
          setTypes(types.map((t) => (t.id === editModal.data.id ? data.type : t)));
          setEditModal({ visible: false, type: '', data: null, parentId: null, input: '' });
        })
        .catch((err) => {
          console.error(err);
          showNotification('Error editing type', 'error');
        });
    }
  };

  const handlehowtoeditClick = () => {
    navigate(`/add-article`);
  };

  const handleConfirmDelete = () => {
    if (confirmModal.type === 'category') {
      wrapperFetch(`${BASE_URL}/api/categories/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: confirmModal.data.id, user_id: userId }),
      })
        .then((res) => res.json())
        .then((data) => {
          showNotification(data.message, 'success');
          setAllCategories(allCategories.filter((cat) => cat.id !== confirmModal.data.id));
          setSelectedCategories(selectedCategories.filter((cat) => cat.id !== confirmModal.data.id));
          setConfirmModal({ visible: false, type: '', data: null, parentId: null, message: '' });
        })
        .catch((err) => {
          console.error(err);
          showNotification('Error deleting category', 'error');
        });
    } else if (confirmModal.type === 'option') {
     wrapperFetch(`${BASE_URL}/api/type/option/edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type_id: confirmModal.parentId,
          remove_option_ids: [confirmModal.data.id],
          user_id: userId,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          showNotification(data.message, 'success');
          // Force refresh options cache for this type.
          fetchOptionsByType(confirmModal.parentId, true);
          setConfirmModal({ visible: false, type: '', data: null, parentId: null, message: '' });
        })
        .catch((err) => {
          console.error(err);
          showNotification('Error deleting option', 'error');
        });
    } else if (confirmModal.type === 'type') {
     wrapperFetch(`${BASE_URL}/api/type/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type_id: confirmModal.data.id, user_id: userId }),
      })
        .then((res) => res.json())
        .then((data) => {
          showNotification(data.message, 'success');
          setTypes(types.filter((t) => t.id !== confirmModal.data.id));
          const updated = { ...selectedOptions };
          delete updated[confirmModal.data.id];
          setSelectedOptions(updated);
          setConfirmModal({ visible: false, type: '', data: null, parentId: null, message: '' });
        })
        .catch((err) => {
          console.error(err);
          showNotification('Error deleting type', 'error');
        });
    }
  };

  //----------------- TYPE COMBOS HANDLERS -----------------
  const generateTypeCombos = () => {
    const typesWithOptions = Object.keys(selectedOptions).filter(
      (typeId) => selectedOptions[typeId].length > 0
    );
    if (typesWithOptions.length === 0) return [];
    const cartesian = (arr) =>
      arr.reduce((a, b) => a.flatMap((d) => b.map((e) => [...d, e])), [[]]);
    const optionsArrays = typesWithOptions.map((typeId) => selectedOptions[typeId]);
    const combos = cartesian(optionsArrays);
    return combos.map((combo) => ({
      options: combo,
      comboPrice: '',
    }));
  };

  useEffect(() => {
    const combos = generateTypeCombos();
    setTypeCombos(combos);
  }, [selectedOptions]);

  const handleComboPriceChange = (index, newPrice) => {
    setTypeCombos((prev) => {
      const updated = [...prev];
      updated[index].comboPrice = newPrice;
      return updated;
    });
  };

  //----------------- IMAGE HANDLERS -----------------
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + uploadedImages.length > 10) {
      showNotification('You can only upload upto 10 images.', 'error');
      return;
    }
    setUploadedImages((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const previewUrl = URL.createObjectURL(file);
      setImagePreviews((prev) => [...prev, previewUrl]);
    });
  };

  const handleImageContextMenu = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setImageContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      imageIndex: index,
    });
  };

  const handleRemoveImage = () => {
    const index = imageContextMenu.imageIndex;
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setImageContextMenu({ visible: false, x: 0, y: 0, imageIndex: null });
  };

  const handleImageCrop = () => {
    const index = imageContextMenu.imageIndex;
    const imageUrl = imagePreviews[index];
    setCropModalInfo({ visible: true, imageIndex: index, imageUrl });
    setImageContextMenu({ visible: false, x: 0, y: 0, imageIndex: null });
  };

  const handleCropCancel = () => {
    setCropModalInfo({ visible: false, imageIndex: null, imageUrl: '' });
  };

  const handleCropSave = (croppedFile, croppedImageUrl) => {
    setUploadedImages((prev) => {
      const newImages = [...prev];
      newImages[cropModalInfo.imageIndex] = croppedFile;
      return newImages;
    });
    setImagePreviews((prev) => {
      const newPreviews = [...prev];
      newPreviews[cropModalInfo.imageIndex] = croppedImageUrl;
      return newPreviews;
    });
    setCropModalInfo({ visible: false, imageIndex: null, imageUrl: '' });
  };

  //----------------- SUBMIT HANDLER -----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !price || !stockQuantity) {
      showNotification('Please fill out all required product details.', 'error');
      return;
    }
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    // Use price (final price) instead of initial_price
    formData.append('initial_price', price);
    formData.append('is_discounted', isDiscounted);
    if (isDiscounted) {
      formData.append('discount_amount', discountAmount);
    }
    formData.append('stock_quantity', stockQuantity);
    formData.append('user_id', userId);

    selectedCategories.forEach((cat) =>
      formData.append('category_ids[]', cat.id)
    );
    Object.keys(selectedOptions).forEach((typeId) =>
      formData.append('type_ids[]', typeId)
    );
    Object.values(selectedOptions).forEach((optionsArr) =>
      optionsArr.forEach((option) =>
        formData.append('option_ids[]', option.id)
      )
    );
    uploadedImages.forEach((file) => formData.append('images', file));

    try {
      const response = await wrapperFetch(`${BASE_URL}/api/products/add`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        showNotification('Product added successfully!', 'success');
        navigate('/superdashboard');
        const productId = data.product.id;
        for (let combo of typeCombos) {
          if (combo.comboPrice) {
            await wrapperFetch(`${BASE_URL}/api/type-combo/add`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                product_id: productId,
                options: combo.options.map((op) => op.id),
                combo_price: parseFloat(combo.comboPrice),
                user_id: userId,
              }),
            });
          }
        }
        // Reset form state
        setTitle('');
        setDescription('');
        setPrice('');
        setIsDiscounted(false);
        setDiscountAmount('');
        setStockQuantity('');
        setUploadedImages([]);
        setImagePreviews([]);
        setSelectedCategories([]);
        setSelectedOptions({});
        setTypeCombos([]);
      } else {
        throw new Error(data.message || 'Failed to add product.');
      }
    } catch (err) {
      showNotification(err.message, 'error');
      console.error(err);
    }
  };

  //----------------- RENDER -----------------
  return (
    <div className="super-product-page">
      {/* Super Header and Menu */}
      <SuperHeader toggleMenu={toggleMenu} />
      <SuperMenu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
      <form className="product-form" onSubmit={handleSubmit}>
        <h1>Add New Product</h1>
        {/* Product Details Section */}
        <section className="form-section">
          <h2>Product Details</h2>
          <input
            type="text"
            placeholder="Product Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            placeholder="Product Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          ></textarea>
          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
          <label>
            Discounted?
            <input
              type="checkbox"
              checked={isDiscounted}
              onChange={(e) => setIsDiscounted(e.target.checked)}
            />
          </label>
          {isDiscounted && (
            <input
              type="number"
              placeholder="Discount Amount"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              required
            />
          )}
          <input
            type="number"
            placeholder="Stock Quantity"
            value={stockQuantity}
            onChange={(e) => setStockQuantity(e.target.value)}
            required
          />
        </section>

        <p className="redirect-note-for-me" > Note:You can right click on category,type and option chip to get edit and delete options. for more info <h className="redirect-note-for-me-click" onClick={handlehowtoeditClick}>click here</h></p>
        {/* Categories Section */}
        <section className="form-section">
          <h2>Categories</h2>
          <input
            type="text"
            placeholder="Search Categories"
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
          />
          <div className="categories-list">
            {allCategories
              .filter((cat) =>
                cat.name.toLowerCase().includes(categorySearch.toLowerCase())
              )
              .map((cat) => (
                <div
                  key={cat.id}
                  className={`category-chip ${
                    selectedCategories.find((s) => s.id === cat.id) ? 'selected' : ''
                  }`}
                  onClick={() => handleCategoryToggle(cat)}
                  onContextMenu={(e) => handleCategoryContextMenu(e, cat)}
                >
                  {cat.name}
                  <span className="remove-chip">×</span>
                </div>
              ))}
          </div>
          <div className="add-category">
            <input
              type="text"
              placeholder="New Category Name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <button type="button" onClick={handleAddCategory}>
              Add Category
            </button>
          </div>
        </section>
        {/* Types & Options Section */}
        <section className="form-section">
          <h2>Types & Options</h2>
          <div className="types-list">
            {types.map((type) => (
              <button
                key={type.id}
                type="button"
                className={`type-button ${selectedOptions[type.id] ? 'selected' : ''}`}
                onClick={() => openTypeModal(type)}
                onContextMenu={(e) => handleTypeContextMenu(e, type)}
              >
                {type.type_name}
              </button>
            ))}
          </div>
          {/* New Area for Adding a Type */}
          <div className="add-type">
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
        </section>
        {/* Type Combos Section (Table Layout) */}
        <section className="form-section">
          <h2>Type Combos</h2>
          {typeCombos && typeCombos.length > 0 ? (
            <table className="combo-table">
              <thead>
                <tr>
                  <th>Combination</th>
                  <th>Combo Price</th>
                </tr>
              </thead>
              <tbody>
                {typeCombos.map((combo, idx) => (
                  <tr key={idx}>
                    <td>{combo.options.map((opt) => opt.option_name).join('+')}</td>
                    <td>
                      <input
                        type="number"
                        placeholder="Enter Combo Price"
                        value={combo.comboPrice}
                        onChange={(e) => handleComboPriceChange(idx, e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No type combos generated.</p>
          )}
        </section>
        {/* Modal for Type Options */}
        {activeTypeForModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Select Options for {activeTypeForModal.type_name}</h3>
              <div className="modal-options-list">
                {optionsCache[activeTypeForModal.id] ? (
                  optionsCache[activeTypeForModal.id].map((option) => (
                    <div
                      key={option.id}
                      className={`modal-option-chip ${
                        modalSelectedOptions.find((op) => op.id === option.id)
                          ? 'selected'
                          : ''
                      }`}
                      onClick={() => toggleModalOption(option, activeTypeForModal.id)}
                      onContextMenu={(e) =>
                        handleOptionContextMenu(e, option, activeTypeForModal.id)
                      }
                    >
                      {option.option_name}
                    </div>
                  ))
                ) : (
                  <p>Loading options...</p>
                )}
              </div>
              <div className="modal-add-option">
                <input
                  type="text"
                  placeholder="New Option Name"
                  value={modalNewOptionName}
                  onChange={(e) => setModalNewOptionName(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!modalNewOptionName.trim()) return;
                   wrapperFetch(`${BASE_URL}/api/type/option/add`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        option_name: modalNewOptionName,
                        type_id: activeTypeForModal.id,
                        user_id: userId,
                      }),
                    })
                      .then((res) => res.json())
                      .then((data) => {
                        showNotification(data.message, 'success');
                        // Force refresh options cache for this type.
                        fetchOptionsByType(activeTypeForModal.id, true);
                        setModalNewOptionName('');
                      })
                      .catch((err) => {
                        console.error(err);
                        showNotification('Error adding option', 'error');
                      });
                  }}
                >
                  Add Option
                </button>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeTypeModal}>
                  Save
                </button>
                <button type="button" onClick={closeTypeModal}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Product Images Section */}
        <section className="form-section">
          <h2>Product Images (Max 10)</h2>
          <input type="file" accept="image/*" multiple onChange={handleImageUpload} />
          <div className="image-previews">
            {imagePreviews.map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt={`Preview ${idx + 1}`}
                onContextMenu={(e) => handleImageContextMenu(e, idx)}
              />
            ))}
          </div>
        </section>
        <button type="submit">Add Product</button>
      </form>
      {/* Custom Context Menu for Categories/Types/Options */}
      {contextMenu.visible && (
        <div
          className="custom-context-menu"
          ref={contextRef}
          style={{ top: contextMenu.y, left: contextMenu.x, zIndex: 10000 }}
        >
          {contextMenu.menuType === 'category' && (
            <>
              <button onClick={() => openEditModal('category', contextMenu.data)}>
                Edit Category
              </button>
              <button onClick={() => openConfirmModal('category', contextMenu.data)}>
                Delete Category
              </button>
            </>
          )}
          {contextMenu.menuType === 'option' && (
            <>
              <button onClick={() => openEditModal('option', contextMenu.data, contextMenu.parentId)}>
                Edit Option
              </button>
              <button onClick={() => openConfirmModal('option', contextMenu.data, contextMenu.parentId)}>
                Delete Option
              </button>
            </>
          )}
          {contextMenu.menuType === 'type' && (
            <>
              <button
                onClick={() => {
                  const updated = { ...selectedOptions };
                  delete updated[contextMenu.data.id];
                  setSelectedOptions(updated);
                  setContextMenu({ ...contextMenu, visible: false });
                }}
              >
                Deselect Type
              </button>
              <button onClick={() => openEditModal('type', contextMenu.data)}>
                Edit Type
              </button>
              <button onClick={() => openConfirmModal('type', contextMenu.data)}>
                Delete Type
              </button>
            </>
          )}
        </div>
      )}
      {/* Custom Context Menu for Image Previews */}
      {imageContextMenu.visible && (
        <div
          className="custom-context-menu"
          ref={imageContextRef}
          style={{ top: imageContextMenu.y, left: imageContextMenu.x, zIndex: 10000 }}
        >
          <button onClick={handleRemoveImage}>Remove Image</button>
          <button onClick={handleImageCrop}>Crop Image</button>
        </div>
      )}
      {/* Edit Modal */}
      {editModal.visible && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>
              Edit{' '}
              {editModal.type === 'category'
                ? 'Category'
                : editModal.type === 'option'
                ? 'Option'
                : 'Type'}
            </h3>
            <input
              type="text"
              value={editModal.input}
              onChange={(e) => setEditModal({ ...editModal, input: e.target.value })}
            />
            <div className="modal-actions">
              <button onClick={handleEditSave}>Save</button>
              <button onClick={() => setEditModal({ visible: false, type: '', data: null, parentId: null, input: '' })}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Modal */}
      {confirmModal.visible && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Delete</h3>
            <p>{confirmModal.message}</p>
            <div className="modal-actions">
              <button onClick={handleConfirmDelete}>Confirm</button>
              <button onClick={() => setConfirmModal({ visible: false, type: '', data: null, parentId: null, message: '' })}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Image Cropper Modal */}
      {cropModalInfo.visible && (
        <ImageCropperModal
          imageUrl={cropModalInfo.imageUrl}
          onSave={handleCropSave}
          onCancel={handleCropCancel}
          maxWidth={500}
          maxHeight={500}
        />
      )}
    </div>
  );
};

export default SuperProductPage;
