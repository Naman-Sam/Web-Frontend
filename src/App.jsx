import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './pages/Homepage'; // Homepage component
import LoadPage from './pages/LoadPage'; // LoadPage component
import ProductPage from './pages/Productpage'; // ProductPage component
import LoginPage from './pages/LoginPage'; // LoginPage component
import CartPage from './pages/CartPage'; // CartPage component
import OrdersPage from './pages/OrdersPage'; // OrdersPage component
import PersonalInfoPage from './pages/PersonalInfoPage'; // PersonalInfoPage component
import MessagePage from './pages/CustomerCarePage'; // CustomerCare / MessagePage component
import AboutPage from './pages/AboutPage'; // About Page component
import ContactPage from './pages/ContactPage'; // Contact Page component
import ServicesPage from './pages/ServicesPage'; // Services Page component
import SuperDashboard from './Superuser/SuperPages/SuperDashboard'; // SuperDashboard component
import SuperUserMessagesPage from './Superuser/SuperPages/SuperMessagePage'; // Newly added SuperUserMessagesPage
import SuperOrderMessagesPage from './Superuser/SuperPages/SuperOrderMessagePage'; // New orders order message page
import RequestReportPage from './Superuser/SuperPages/RequestReportPage'; // New orders order message page
import FetchInfoPage from './Superuser/SuperPages/FetchInfoPage'; // New orders order message page
import SuperPoster from './Superuser/SuperPages/SuperPoster'; // New orders order message page
import AddProductPage from './Superuser/SuperPages/AddProductPage'; // New orders order message page
import ProductEditArticlePage from './Superuser/SuperPages/ProductEditArticlePage'; // New orders order message page
import ProductAddArticlePage from './Superuser/SuperPages/ProductAddArticlePage'; // New orders order message page
import ManageProductPage from './Superuser/SuperPages/ManageProductsPage'; // New orders order message page
import FeedbackPage from './Superuser/Preview/Modals/FeedbackPage'; // New orders order message page
import ServiceSuper from './Superuser/Preview/Modals/ServiceSuper'; // New orders order message page
import SuperAbout from './Superuser/Preview/Modals/SuperAbout'; // New orders order message page
import PreviewHomepage from './Superuser/Preview/PreviewHomepage'; // New orders order message page
import PreviewLoadPage from './Superuser/Preview/PreviewLoadPage'; // New orders order message page
import PreviewProductPage from './Superuser/Preview/PreviewProductPage'; // New orders order message page
import ProductEdit from './Superuser/SuperShare/ProductEdit'; // New orders order message page
import NotificationContainer from './components/shared/Notification'; // Global Notification container
import { NotificationProvider, useNotification } from './components/shared/NotificationContext'; // Notification Context
import './App.css'; // General styles
import SuperuserArticlePage from './Superuser/SuperPages/SuperuserArticlePage';

// Base URL for backend API
const BASE_URL = process.env.REACT_APP_BASE_URL;

// This wrapper connects the notification context with your Notification container.
const NotificationContainerWrapper = () => {
  const { notifications } = useNotification();
  return <NotificationContainer notifications={notifications} />;
};

const App = () => {
  return (
    <NotificationProvider>
      <Router>
        {/* Global Notification Container that stays in the viewport */}
        <NotificationContainerWrapper />
        <Routes>
          {/* Route for Homepage */}
          <Route path="/" element={<Homepage />} />

          {/* Route for LoadPage */}
          <Route path="/loadpage" element={<LoadPage />} />

          {/* Route for ProductPage */}
          <Route path="/product/:id" element={<ProductPage BASE_URL={BASE_URL} />} />

          {/* Route for LoginPage */}
          <Route path="/login" element={<LoginPage BASE_URL={BASE_URL} />} />

          {/* Route for CartPage */}
          <Route path="/cart" element={<CartPage BASE_URL={BASE_URL} />} />

          {/* Route for OrdersPage */}
          <Route path="/orders" element={<OrdersPage BASE_URL={BASE_URL} />} />

          {/* Route for PersonalInfoPage */}
          <Route path="/personal-info" element={<PersonalInfoPage userId="user_id" BASE_URL={BASE_URL} />} />

          {/* Route for CustomerCare / MessagePage */}
          <Route path="/CustomerCare" element={<MessagePage BASE_URL={BASE_URL} />} />

          {/* Route for Super User Messages Page */}
          <Route path="/super-message" element={<SuperUserMessagesPage />} />

          {/* Super Order Messages Page (new route for orders) */}
         <Route path="/super-order-messages" element={<SuperOrderMessagesPage />} />

          {/* Route for LoginPage */}
          <Route path="/add-product" element={<AddProductPage BASE_URL={BASE_URL} />} />

          {/* Route for LoginPage */}
          <Route path="/report" element={<RequestReportPage BASE_URL={BASE_URL} />} />

          {/* Route for LoginPage */}
          <Route path="/product-edit/:productId" element={<ProductEdit BASE_URL={BASE_URL} />} />

          {/* Route for LoginPage */}
          <Route path="/manage-product" element={<ManageProductPage BASE_URL={BASE_URL} />} />

          {/* Route for CustomerCare / MessagePage */}
          <Route path="/add-poster" element={<SuperPoster userId="user_id" BASE_URL={BASE_URL} />} />

          {/* Route for Homepage */}
          <Route path="/preview" element={<PreviewHomepage />} />

          {/* Route for Homepage */}
          <Route path="/preview-load" element={<PreviewLoadPage />} />

          {/* Route for Homepage */}
          <Route path="/preview-product/:id" element={<PreviewProductPage BASE_URL={BASE_URL} />} />

          {/* Route for ProductPage */}
          <Route path="/info" element={<FetchInfoPage BASE_URL={BASE_URL} />} />

          {/* Route for AboutPage */}
          <Route path="/edit-article" element={<ProductEditArticlePage />} />

          {/* Route for AboutPage */}
          <Route path="/add-article" element={<ProductAddArticlePage />} />

          {/* Route for AboutPage */}
          <Route path="/super-article" element={<SuperuserArticlePage />} />

          {/* Route for AboutPage */}
          <Route path="/about" element={<AboutPage />} />

          {/* Route for ContactPage */}
          <Route path="/contact" element={<ContactPage />} />

          {/* Route for ContactPage */}
          <Route path="/feedback" element={<FeedbackPage />} />
          
          {/* Route for ContactPage */}
          <Route path="/super-service" element={<ServiceSuper />} />

          {/* Route for ContactPage */}
          <Route path="/super-about" element={<SuperAbout />} />

          {/* Route for ServicesPage */}
          <Route path="/services" element={<ServicesPage />} />

          {/* Route for SuperDashboard */}
          <Route path="/superdashboard" element={<SuperDashboard />} />
        </Routes>
      </Router>
    </NotificationProvider>
  );
};

export default App;
