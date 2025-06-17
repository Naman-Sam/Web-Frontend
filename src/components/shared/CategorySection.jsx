import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AddToCart from './AddToCart';
import '../styles/CategorySection.css';
import '../styles/Responsive/CategorySection.responsive.css';
import { wrapperFetch } from '../../utils/wrapperfetch';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(
    Number.isFinite(n) ? n : 0
  );

const CategorySection = ({ BASE_URL, userId }) => {
  const [categories, setCategories] = useState([]);
  const [usedCategoryIds, setUsedCategoryIds] = useState([]);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddToCart, setShowAddToCart] = useState(null);
  const productsContainerRef = useRef(null);
  const navigate = useNavigate();

  /* ─────────────── 1. FETCH ALL CATEGORIES ─────────────── */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await wrapperFetch(`${BASE_URL}/categories/list`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        setCategories(await res.json());
      } catch (e) {
        setError('Failed to load categories.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [BASE_URL]);

  /* ─────────────── 2. PICK RANDOM CATEGORY ─────────────── */
  const selectRandomCategory = async () => {
    if (!categories.length) return;

    const available = categories.filter(
      (c) => !usedCategoryIds.includes(c.id)
    );
    if (!available.length) {
      setUsedCategoryIds([]); // reset
      return;
    }

    const random = available[Math.floor(Math.random() * available.length)];
    setCurrentCategory(random);
    setUsedCategoryIds((p) => [...p, random.id]);
    await fetchCategoryProducts(random.id);
  };

  /* ─────────────── 3. FETCH PRODUCTS FOR CATEGORY ──────── */
  const fetchCategoryProducts = async (categoryId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await wrapperFetch(`${BASE_URL}/categories/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: categoryId }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const { products = [] } = await res.json();
      setCategoryProducts(products);
    } catch (e) {
      setError('Failed to load products for this category.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────── 4. AUTO-SWITCH CATEGORIES ───────────── */
  useEffect(() => {
    if (categories.length) selectRandomCategory();
    const id = setInterval(selectRandomCategory, 8000);
    return () => clearInterval(id);
  }, [categories]);

  /* ─────────────── 5. SCROLL ARROWS ────────────────────── */
  const scroll = (dir) =>
    productsContainerRef.current?.scrollBy({
      left: dir === 'left' ? -200 : 200,
      behavior: 'smooth',
    });

  /* ────────────────────────── UI ───────────────────────── */
  return (
    <section className="category-section">
      <h2 className="section-title">
        <i className="fas fa-th-large"></i> {currentCategory?.name || 'Category'}
      </h2>

      {loading ? (
        <p className="loading-message">Loading...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : categoryProducts.length ? (
        <div className="categories-container">
          <button
            className="arrow-btn left-arrow"
            onClick={() => scroll('left')}
            aria-label="Scroll left"
          >
            <i className="fas fa-chevron-left"></i>
          </button>

          <div className="products-horizontal-scroll" ref={productsContainerRef}>
            {categoryProducts.map((p) => {
              /* ---- PRICE CALCULATION (FIXED) ---- */
              const price = parseFloat(p.price); // already discounted
              const discountAmt = p.discount_amount
                ? parseFloat(p.discount_amount)
                : 0;
              const showDiscount = p.is_discounted && discountAmt > 0;
              const discounted = fmt(price);
              const original = fmt(price + discountAmt); // add back to get initial

              return (
                <div
                  key={p.id}
                  className="product-card"
                  onClick={() => navigate(`/product/${p.id}`)}
                >
                  <div className="product-image-container">
                    {showDiscount && (
                      <span className="discount-badge">
                        Save {fmt(discountAmt)}
                      </span>
                    )}
                    <img
                      src={p.images?.[0] || 'https://via.placeholder.com/250'}
                      alt={p.title}
                      className="product-image"
                    />
                  </div>

                  <h3 className="product-title">{p.title}</h3>

                  <div className="product-info">
                    {showDiscount ? (
                      <p className="product-price">
                        <span className="original-price">{original}</span>{' '}
                        <span className="discounted-price">{discounted}</span>
                      </p>
                    ) : (
                      <p className="product-price">{discounted}</p>
                    )}

                    <button
                      className="cart-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAddToCart(p.id);
                      }}
                    >
                      <i className="fas fa-shopping-cart"></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            className="arrow-btn right-arrow"
            onClick={() => scroll('right')}
            aria-label="Scroll right"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      ) : (
        <p className="error-message">No products found for this category.</p>
      )}

      {showAddToCart && (
        <AddToCart
          productId={showAddToCart}
          userId={userId}
          onClose={() => setShowAddToCart(null)}
        />
      )}
    </section>
  );
};

export default CategorySection;
