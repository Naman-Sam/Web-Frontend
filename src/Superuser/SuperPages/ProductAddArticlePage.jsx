import React from 'react';
import { useNavigate } from 'react-router-dom';
import SuperHeader from '../SuperShare/SuperHeader';
import SuperMenu from '../SuperShare/SuperMenu';
import '../SuperStyle/ProductEditArticle.css';
import { wrapperFetch } from '../../utils/wrapperfetch';

const ProductAddArticlePage = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setMenuOpen] = React.useState(false);
  const toggleMenu = () => setMenuOpen(prev => !prev);

  return (
    <div className="product-edit-article-page">
      {/* Header & Menu */}
      <SuperHeader toggleMenu={toggleMenu} />
      <SuperMenu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />

      <div className="article-content">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1>How to Add a Product</h1>

        <section>
          <h2>Overview</h2>
          <p>
            The Add Product page allows you to create a brand new product for your store. The interface is designed to guide you step by step while keeping the process simple and intuitive.
          </p>
        </section>

        <section>
          <h2>Entering Product Details</h2>
          <p>
            Here, you can provide essential information about your product such as its name, description, price, discount details, and available stock. Just fill in the form fields, and you’ll be able to see a preview before you submit.
          </p>
        </section>

        <section>
          <h2>Uploading and Managing Images</h2>
          <p>
            In the Images section, you can upload product photos. You can add new images, remove old ones, or even crop them to ensure your product is showcased at its best.
          </p>
        </section>

        <section>
          <h2>Assigning Categories</h2>
          <p>
            Categories help organize your products for easy browsing. On this page, you can select from existing categories or add new ones. When a category is removed, it is automatically unlinked from your product.
          </p>
        </section>

        <section>
          <h2>Choosing Types and Options</h2>
          <p>
            This section lets you define different attributes such as color, size, or style. By selecting the appropriate options, you can offer various product variations that suit your customers’ needs.
          </p>
        </section>

        <section>
          <h2>Creating Product Combos</h2>
          <p>
            The Combos section gives you the ability to bundle different options together at a special price. This is great for offering unique product packages or deals.
          </p>
        </section>

        <section>
          <h2>Using Simple Shortcuts</h2>
          <p>
            Throughout the page, simple actions like right-click menus allow you to quickly remove or modify images and other elements. These shortcuts are designed to save you time and make the process smoother.
          </p>
        </section>

        <section>
          <h2>Wrapping Up</h2>
          <p>
            Once you have filled in all the necessary information, simply click the save button to add your product to the store. The Add Product page is built to be straightforward and user-friendly.
          </p>
        </section>
      </div>
    </div>
  );
};

export default ProductAddArticlePage;
