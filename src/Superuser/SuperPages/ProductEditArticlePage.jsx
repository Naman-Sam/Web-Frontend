import React from 'react';
import { useNavigate } from 'react-router-dom';
import SuperHeader from '../SuperShare/SuperHeader';
import SuperMenu from '../SuperShare/SuperMenu';
import '../SuperStyle/ProductEditArticle.css';
import { wrapperFetch } from '../../utils/wrapperfetch';

const ProductEditArticlePage = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setMenuOpen] = React.useState(false);
  const toggleMenu = () => setMenuOpen((prev) => !prev);

  return (
    <div className="product-edit-article-page">
      {/* Header & Menu */}
      <SuperHeader toggleMenu={toggleMenu} />
      <SuperMenu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />

      <div className="article-content">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1>How to Edit Your Product</h1>

        <section>
          <h2>Overview</h2>
          <p>
            In the Product Edit page, you can update everything about your product in an easy-to-use interface. This page is divided into several sections to help you quickly manage product details, images, categories, and product variations.
          </p>
        </section>

        <section>
          <h2>Updating Product Details</h2>
          <p>
            You can see and update basic details such as product name, description, price, discount status, and available stock. Click the “Edit” button to update these details. Once you make your changes, save them to update your product information.
          </p>
        </section>

        <section>
          <h2>Managing Images</h2>
          <p>
            The Images section lets you add new product photos, remove outdated ones, or even crop photos to get them just right. A simple right-click on an image will let you quickly decide if you want to remove or crop it.
          </p>
        </section>

        <section>
          <h2>Working with Categories</h2>
          <p>
            Categories help organize your product. If you wish to add a new category or remove an existing one, you can do so easily. Removing a category will automatically update your product so that it is no longer listed under that category.
          </p>
        </section>

        <section>
          <h2>Handling Types and Options</h2>
          <p>
            The Types &amp; Options section lets you manage different product variations like color, size, or style. You can add new options, update existing ones, or delete those that you no longer need. This makes it very simple to offer your customers exactly what they’re looking for.
          </p>
        </section>

        <section>
          <h2>Setting Up Combos</h2>
          <p>
            Finally, the Combos section allows you to create special combinations of options. This helps you offer different package deals or unique variations of your product. Simply choose your options, set a price for the combo, and you're done.
          </p>
        </section>

        <section>
          <h2>Quick Right-Click Menus</h2>
          <p>
            Throughout the page, you can use right-click menus to quickly access common actions like edit or delete. This intuitive feature makes managing your product fast and hassle-free.
          </p>
        </section>

        <section>
          <h2>Wrapping Up</h2>
          <p>
            The Product Edit page is designed to be simple and efficient. With clear sections and quick actions, you can update your product’s information with just a few clicks. Enjoy the ease of keeping your product details up to date!
          </p>
        </section>
      </div>
    </div>
  );
};

export default ProductEditArticlePage;
