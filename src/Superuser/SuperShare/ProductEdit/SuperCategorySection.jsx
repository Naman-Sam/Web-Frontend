// SuperCategorySection.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNotification } from '../../../components/shared/NotificationContext';
import '../../SuperStyle/SuperCategorySection.css';
import { wrapperFetch } from '../../../utils/wrapperfetch';

const SuperCategorySection = ({ BASE_URL, product, userId }) => {
  const { showNotification } = useNotification();
  const [allCategories, setAllCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(product.categories || []);
  const [categorySearch, setCategorySearch] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editMode, setEditMode] = useState(false);

  // Context menu state for categories
  const [categoryContextMenu, setCategoryContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    category: null,
  });
  const contextRef = useRef(null);

  // Fetch all categories
  useEffect(() => {
   wrapperFetch(`${BASE_URL}/api/categories/list`)
      .then((res) => res.json())
      .then((data) => setAllCategories(data))
      .catch((err) => console.error('Error fetching categories:', err));
  }, [BASE_URL]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextRef.current && !contextRef.current.contains(e.target)) {
        setCategoryContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Toggle category selection
  const handleCategoryToggle = (cat) => {
    const exists = selectedCategories.find((c) => c.id === cat.id);
    if (exists) {
      setSelectedCategories(selectedCategories.filter((c) => c.id !== cat.id));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  // Add new category
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

  // Save selected categories (update product)
  const handleSave = () => {
    const updateData = {
      user_id: userId,
      product_id: product.id,
      category_ids: selectedCategories.map((cat) => cat.id),
    };
   wrapperFetch(`${BASE_URL}/api/products/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    })
      .then((res) => res.json())
      .then((data) => {
        showNotification(data.message, 'success');
        setEditMode(false);
      })
      .catch((err) => {
        console.error(err);
        showNotification('Failed to update categories', 'error');
      });
  };

  const handleCancel = () => {
    setSelectedCategories(product.categories || []);
    setEditMode(false);
  };

  // --- Custom Context Menu for Categories ---
  const handleCategoryContextMenu = (e, category) => {
    e.preventDefault();
    setCategoryContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      category,
    });
  };

  const handleEditCategory = () => {
    const cat = categoryContextMenu.category;
    if (!cat) return;
    // Using prompt for simplicity; you may later use a modal
    const newName = window.prompt('Enter new category name:', cat.name);
    if (!newName || newName.trim() === '') return;
   wrapperFetch(`${BASE_URL}/api/categories/edit`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cat.id, name: newName, user_id: userId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.category) {
          showNotification(data.message, 'success');
          setAllCategories(
            allCategories.map((c) => (c.id === data.category.id ? data.category : c))
          );
          setSelectedCategories(
            selectedCategories.map((c) => (c.id === data.category.id ? data.category : c))
          );
        } else {
          throw new Error('Failed to update category');
        }
      })
      .catch((err) => {
        console.error(err);
        showNotification('Error editing category', 'error');
      });
    setCategoryContextMenu({ ...categoryContextMenu, visible: false });
  };

  const handleDeleteCategory = () => {
    const cat = categoryContextMenu.category;
    if (!cat) return;
   wrapperFetch(`${BASE_URL}/api/categories/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cat.id, user_id: userId }),
    })
      .then((res) => res.json())
      .then((data) => {
        showNotification(data.message, 'success');
        setAllCategories(allCategories.filter((c) => c.id !== cat.id));
        setSelectedCategories(selectedCategories.filter((c) => c.id !== cat.id));
      })
      .catch((err) => {
        console.error(err);
        showNotification('Error deleting category', 'error');
      });
    setCategoryContextMenu({ ...categoryContextMenu, visible: false });
  };

  return (
    <section className="category-section">
      <h2>Categories</h2>
      {editMode ? (
        <div className="category-edit">
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
                    selectedCategories.find((c) => c.id === cat.id) ? 'selected' : ''
                  }`}
                  onClick={() => handleCategoryToggle(cat)}
                  onContextMenu={(e) => handleCategoryContextMenu(e, cat)}
                >
                  {cat.name}
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
          <button className="category-edit-user-one-save" onClick={handleSave}>Save Categories</button>
          <button className="category-edit-user-one-cancel" onClick={handleCancel}>Cancel</button>
        </div>
      ) : (
        <div className="category-display">
          {selectedCategories.map((cat) => (
            <span
              key={cat.id}
              className="category-chip"
              onContextMenu={(e) => handleCategoryContextMenu(e, cat)}
            >
              {cat.name}
            </span>
          ))}
          <button className="category-edit-user-one" onClick={() => setEditMode(true)}>Edit Categories</button>
        </div>
      )}
      {/* Custom Context Menu for Categories */}
      {categoryContextMenu.visible && (
        <div
          className="custom-context-menu"
          ref={contextRef}
          style={{ top: categoryContextMenu.y, left: categoryContextMenu.x }}
        >
          <button onClick={handleEditCategory}>Edit Category</button>
          <button onClick={handleDeleteCategory}>Delete Category</button>
        </div>
      )}
    </section>
  );
};

export default SuperCategorySection;
