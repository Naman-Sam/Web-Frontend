import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SuperHeader from '../SuperShare/SuperHeader'; // Custom super header component
import SuperMenu from '../SuperShare/SuperMenu';       // Custom super menu component
import '../SuperStyle/SuperDashboard.css';            // Dashboard-specific styling
import { wrapperFetch } from '../../utils/wrapperfetch';

const SuperDashboard = () => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Toggle the super menu visibility
  const toggleMenu = () => {
    setMenuOpen(prev => !prev);
  };

  // Define modules that represent superuser functions.
  // Update the 'route' fields to match your app's routes.
  const modules = [
    {
      name: 'Manage Product',
      description: 'Add, fetch, edit, delete categories and fetch products by category',
      route: '/manage-product'
    },
    {
      name: 'Add Product',
      description: 'Add New Products',
      route: '/add-product'
    },
    {
      name: 'Add Poster',
      description: 'Add and delete posters',
      route: '/add-poster'
    },
    {
      name: 'User Orders',
      description: 'Manage Orders and Order Messages',
      route: '/super-order-messages'
    },
    {
      name: 'Message',
      description:
        'Handle conversations and messages between users and the system',
      route: '/super-message'
    },
    {
      name: 'Preview Website',
      description:
        'Preview the website as a superuser',
      route: '/preview'
    },
    {
      name: 'Info',
      description: 'Get and update user info with username',
      route: '/info'
    },
    {
      name: 'Report',
      description: 'Generate and view detailed motnhly and yearly reports',
      route: '/report'
    },
    {
      name: 'Feedback',
      description: 'Give yoru feedback and suggestions',
      route: '/feedback'
    }
  ];

  // Navigate to a module when its card is clicked
  const handleNavigation = (route) => {
    navigate(route);
  };

  return (
    <div className="super-dashboard">
      {/* Super Header */}
      <SuperHeader toggleMenu={toggleMenu} />
      
      {/* Super Menu */}
      <SuperMenu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />

      {/* Dashboard Body Area */}
      <div className="super-dashboard-body">
        <h1>Superuser Dashboard</h1>

        {/* Navigation Grid from Modules */}
        <div className="dashboard-grid">
          {modules.map((module, idx) => (
            <div
              key={idx}
              className="dashboard-card"
              onClick={() => handleNavigation(module.route)}
            >
              <h2>{module.name}</h2>
              <p>{module.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuperDashboard;
