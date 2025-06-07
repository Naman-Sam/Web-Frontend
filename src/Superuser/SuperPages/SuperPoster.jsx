import React, { useState, useEffect, useRef } from 'react';
import { useNotification } from '../../components/shared/NotificationContext';
import PosterProductCard from '../SuperShare/PosterProductCard';
import { FaSync } from 'react-icons/fa';
import { AiOutlineClose } from 'react-icons/ai';
import SuperHeader from '../SuperShare/SuperHeader';
import SuperMenu from '../SuperShare/SuperMenu';
import '../SuperStyle/SuperPoster.css';
import ImageCropperPosterModal from '../SuperShare/ImageCropperPosterModal';
import { wrapperFetch } from '../../utils/wrapperfetch';

const SuperPoster = ({ BASE_URL }) => {
  const { showNotification } = useNotification();

  // Header and Menu Integration States
  const [isMenuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(prev => !prev);

  // --- Poster States ---
  const [posters, setPosters] = useState([]);
  const [desktopFile, setDesktopFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  // --- Product Linking (Add Form) ---
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [products, setProducts] = useState([]);

  // --- Crop Modal State (For both Add and Edit) ---
  const [cropMode, setCropMode] = useState('');
  const [posterToCrop, setPosterToCrop] = useState(null);
  const [croppingImageUrl, setCroppingImageUrl] = useState('');
  const [showCropModal, setShowCropModal] = useState(false);

  // --- Add Poster Modal State ---
  const [showAddPosterModal, setShowAddPosterModal] = useState(false);

  // --- Context Menu State for Existing Posters (Crop & Delete) ---
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    poster: null,
  });

  const userId = localStorage.getItem('superuserId');

  // ------------------ FETCH ALL POSTERS ------------------
  const fetchPosters = () => {
   wrapperFetch(`${BASE_URL}/api/posters/all`)
      .then((res) => res.json())
      .then((data) => {
        if (data.posters) {
          setPosters(data.posters);
        }
      })
      .catch((err) => console.error('Error fetching posters:', err));
  };

  useEffect(() => {
    fetchPosters();
  }, [BASE_URL]);

  // ------------------ FETCH PRODUCTS (For Add Form) ------------------
  const fetchProducts = () => {
   wrapperFetch(`${BASE_URL}/api/products/list`)
      .then((res) => res.json())
      .then((data) => {
        if (data.products) {
          setProducts(data.products);
        }
      })
      .catch((err) => console.error('Error fetching products:', err));
  };

  const openProductModal = () => {
    if (products.length === 0) {
      fetchProducts();
    }
    setShowProductModal(true);
  };

  // ------------------ FILE HANDLING FOR ADD POSTER ------------------
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDesktopFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveFile = () => {
    setDesktopFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ------------------ SUBMIT ADD POSTER FORM ------------------
  const handleAddPoster = (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      showNotification('Please select a product first.', 'error');
      return;
    }
    if (!desktopFile) {
      showNotification('Please select a poster image.', 'error');
      return;
    }
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('product_id', selectedProduct.id);
    formData.append('desktopPoster', desktopFile);
   wrapperFetch(`${BASE_URL}/api/posters/add`, {
      method: 'POST',
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        showNotification(data.message, 'success');
        setPosters([...posters, data.poster]);
        // Reset add poster section
        setDesktopFile(null);
        setPreviewUrl(null);
        setSelectedProduct(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setShowAddPosterModal(false);
      })
      .catch((err) => {
        console.error(err);
        showNotification('Error adding poster', 'error');
      });
  };

  // ------------------ CONTEXT MENU FOR EXISTING POSTERS (Crop & Delete) ------------------
  const handleRightClick = (e, poster) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      poster: poster,
    });
  };

  useEffect(() => {
    const handleClick = () => {
      if (contextMenu.visible) {
        setContextMenu({ ...contextMenu, visible: false });
      }
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [contextMenu]);

  const handleDeletePoster = (posterId) => {
   wrapperFetch(`${BASE_URL}/api/posters/delete/`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, poster_id: posterId }),
    })
      .then((res) => res.json())
      .then((data) => {
        showNotification(data.message, 'success');
        setPosters(posters.filter((p) => p && p.id !== posterId));
      })
      .catch((err) => {
        console.error(err);
        showNotification('Error deleting poster', 'error');
      });
  };

  // ------------------ CROPPING ACTIONS ------------------
  const handleCropActionEdit = (poster) => {
    setCropMode('edit');
    setPosterToCrop(poster);
    setCroppingImageUrl(poster.poster_desktop_url);
    setContextMenu({ ...contextMenu, visible: false });
    setShowCropModal(true);
  };

  const handleCropActionAdd = () => {
    if (previewUrl) {
      setCropMode('add');
      setCroppingImageUrl(previewUrl);
      setShowCropModal(true);
    }
  };

  // Callback used by ImageCropperPosterModal when cropping is completed
  const onCropSave = async (croppedFile, croppedImageUrl) => {
    if (cropMode === 'add') {
      // For a new poster, update the file and preview with the cropped image.
      setDesktopFile(croppedFile);
      setPreviewUrl(URL.createObjectURL(croppedFile));
      showNotification('Image cropped successfully!', 'success');
    } else if (cropMode === 'edit') {
      // For an existing poster, send a PATCH request to update it.
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('product_id', posterToCrop.product_id);
      formData.append('poster_id', posterToCrop.id);
      formData.append('desktopPoster', croppedFile);
     wrapperFetch(`${BASE_URL}/api/posters/edit`, {
        method: 'PATCH',
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          showNotification(data.message, 'success');
          setPosters(
            posters.map((p) => (p && p.id === data.poster.id ? data.poster : p))
          );
        })
        .catch((err) => {
          console.error(err);
          showNotification('Error cropping poster', 'error');
        });
    }
    // Close the crop modal and reset cropping image.
    setShowCropModal(false);
    setCroppingImageUrl('');
  };

  // Grid settings: Allowed slots is fixed at 6 (2 rows x 3 columns).
  const totalSlots = 6;
  const filledSlots = posters.length;
  const emptySlots = totalSlots - filledSlots;

  return (
    <div className="superposter-page">
      {/* Integrated Header and Menu */}
      <SuperHeader toggleMenu={toggleMenu} />
      <SuperMenu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />

      {/* Main Content */}
      <h2 className="poster-gage">Poster Management</h2>
      <button className="refresh-button-poster-gage" onClick={fetchPosters}>
        <FaSync title="Refresh Posters" />
      </button>

      {/* Poster Grid 2x3 */}
      <div className="poster-grid">
        {Array.from({ length: totalSlots }).map((_, index) => {
          const poster = posters[index];
          return (
            <div key={index} className="grid-item">
              {poster ? (
                <img
                  src={poster.poster_desktop_url}
                  alt={`Poster ${poster.id}`}
                  onContextMenu={(e) => handleRightClick(e, poster)}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              ) : (
                <div
                  className="empty-slot"
                  onClick={() => setShowAddPosterModal(true)}
                >
                  <span className="plus-icon">+</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Poster Modal Popup */}
      {showAddPosterModal && emptySlots > 0 && (
        <div className="modal-overlay">
          <div className="modal-content add-poster-modal">
            <div className="modal-header">
              <h3>Add Poster (You can add {emptySlots} more)</h3>
              <button
                className="close-modal"
                onClick={() => {
                  setShowAddPosterModal(false);
                  // Optionally, reset add poster fields here:
                  handleRemoveFile();
                  setSelectedProduct(null);
                }}
              >
                <AiOutlineClose size={24} />
              </button>
            </div>

            {/* Product Linking Section */}
            <div className="product-selection">
              {selectedProduct ? (
                <div className="selected-product">
                  <p>
                    <strong>Selected Product:</strong> {selectedProduct.title}
                  </p>
                  <button  className="poster-gage-connect-product-select" onClick={() => setSelectedProduct(null)}>
                    Change Product
                  </button>
                </div>
              ) : (
                <button className="poster-gage-connect-product" onClick={openProductModal}>Connect Product</button>
              )}
            </div>

            {/* Add Poster Form */}
            <form onSubmit={handleAddPoster}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              {previewUrl && (
                <div className="preview-actions">
                  <img
                    src={previewUrl}
                    alt="Poster Preview"
                    className="poster-preview"
                    style={{ maxWidth: '300px', marginTop: '10px' }}
                  />
                  <div>
                    <button className="poster-gage-connect-product-crop" type="button" onClick={handleCropActionAdd}>
                      Crop Image
                    </button>
                    <button className="poster-gage-connect-product-remove" type="button" onClick={handleRemoveFile}>
                      Remove Image
                    </button>
                  </div>
                </div>
              )}
              <button className="poster-gage-connect-product-add" type="submit">Add Poster</button>
            </form>
          </div>
        </div>
      )}

      {/* Context Menu for Existing Posters */}
      {contextMenu.visible && contextMenu.poster && (
        <ul
          className="context-menu"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
            position: 'absolute',
            backgroundColor: '#fff',
            boxShadow: '0 5px 5px rgba(0,0,0,0.3)',
            listStyleType: 'none',
            padding: '10px',
            zIndex: 1000,
          }}
        >
          <li
            style={{ cursor: 'pointer', padding: '5px' }}
            onClick={() => handleDeletePoster(contextMenu.poster.id)}
          >
            Delete Poster
          </li>
        </ul>
      )}

      {/* Crop Modal: Using ImageCropperPosterModal */}
      {showCropModal && croppingImageUrl && (
        <ImageCropperPosterModal
          imageUrl={croppingImageUrl}
          onSave={onCropSave}
          onCancel={() => {
            setShowCropModal(false);
            setCroppingImageUrl('');
          }}
          maxWidth="400px"
          maxHeight="300px"
        />
      )}

      {/* Product Selection Modal */}
      {showProductModal && (
        <div className="modal-overlay">
          <div className="modal-content product-modal">
            <h3>Select a Product</h3>
            <div className="product-list">
              {products &&
                products.map((product, idx) => {
                  if (!product) return null;
                  return (
                    <div
                      key={product.id || idx}
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowProductModal(false);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <PosterProductCard
                        product={product}
                        selectedProduct={selectedProduct}
                        setSelectedProduct={setSelectedProduct}
                      />
                    </div>
                  );
                })}
            </div>
            <button onClick={() => setShowProductModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperPoster;
