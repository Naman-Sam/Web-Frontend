import React, { useState, useEffect } from 'react';
import Header from '../SuperShare/SuperHeader';
import Menu from '../SuperShare/SuperMenu';
import SuperOrderMessageDone from '../SuperShare/SuperOrderMessage';
import SuperOrderCardPage from '../SuperShare/SuperOrderCardPage';
import { FaHeadset } from 'react-icons/fa';
import { useNotification } from '../../components/shared/NotificationContext';
import '../SuperStyle/SuperOrderMessagePage.css';
import { io } from 'socket.io-client';
import { wrapperFetch } from '../../utils/wrapperfetch';

const BASE_URL = `${process.env.REACT_APP_BASE_URL}/api`;
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL;

const SuperOrderMessagesPage = () => {
  // Data & UI states
  const [orders, setOrders] = useState([]);
  const [orderMessages, setOrderMessages] = useState([]);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'users'
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [sortCriteria, setSortCriteria] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSortPopupOpen, setIsSortPopupOpen] = useState(false);
  // sortFilterInput holds additional input if sortCriteria is month/year/product
  const [sortFilterInput, setSortFilterInput] = useState({ month: '', year: '', product: '' });
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userCache, setUserCache] = useState({});
  const { showNotification } = useNotification();

  // Get the superuserID from localStorage.
  const userId = localStorage.getItem('superuserId');

  // Check viewport size
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 480);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMenu = () => setMenuOpen(prev => !prev);

  //----------------------------//
  // FETCH ALL ORDERS
  //----------------------------//
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await wrapperFetch(`${BASE_URL}/orders/all`);
        const data = await response.json();
        if (response.ok) {
          setOrders(data.orders || []);
        } else {
          setError('Failed to fetch orders. Please try again later.');
          showNotification('Failed to fetch orders.', 'error');
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to fetch orders. Please try again later.');
        showNotification('Failed to fetch orders.', 'error');
      }
    };
    fetchOrders();
  }, [showNotification]);

  //----------------------------//
  // FETCH USER DETAILS FOR EACH UNIQUE USER
  //----------------------------//
  useEffect(() => {
    const uniqueUserIds = [...new Set(orders.map(order => order.user_id))];
    uniqueUserIds.forEach(userId => {
      if (!userCache[userId]) {
        const fetchUserDetails = async (userId) => {
          try {
            const response = await wrapperFetch(`${BASE_URL}/info/get/detailed/info`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: userId }),
            });
            const data = await response.json();
            if (response.ok && data.user) {
              return data.user.username;
            } else {
              console.error('Failed to fetch user details:', data.message);
              return "Unknown";
            }
          } catch (err) {
            console.error('Error fetching user details:', err);
            return "Unknown";
          }
        };
        fetchUserDetails(userId).then(username => {
          setUserCache(prev => ({ ...prev, [userId]: username }));
        });
      }
    });
  }, [orders, userCache]);

  const getUserName = userId => userCache[userId] || "Unknown";

  //----------------------------//
  // Filter and Sort Orders (including search)
  //----------------------------//
  const filterAndSortOrders = (ordersList) => {
    let filtered = [...ordersList];
    // Filter by search query (Order ID)
    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.order_id.toString().includes(searchQuery)
      );
    }
    // Apply sort/filter based on sortCriteria and additional inputs
    switch (sortCriteria) {
      case 'month':
        filtered = filtered.filter(order => {
          const dt = new Date(order.created_at);
          return sortFilterInput.month &&
                 sortFilterInput.year &&
                 (dt.getMonth() + 1 === parseInt(sortFilterInput.month)) &&
                 (dt.getFullYear() === parseInt(sortFilterInput.year));
        });
        break;
      case 'year':
        filtered = filtered.filter(order => {
          const dt = new Date(order.created_at);
          return sortFilterInput.year &&
                 (dt.getFullYear() === parseInt(sortFilterInput.year));
        });
        break;
      case 'product':
        filtered = filtered.filter(order => {
          return order.items && order.items.some(item =>
            item.title.toLowerCase().includes(sortFilterInput.product.toLowerCase())
          );
        });
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      default:
        break;
    }
    return filtered;
  };

  //----------------------------//
  // Left Panel Handlers (orders/users)
  //----------------------------//
  const handleOrderClick = orderId => {
    setSelectedOrderId(orderId);
    setSelectedUserId(null);
    setOrderMessages([]); // Clear previous messages if any
  };

  const handleUserClick = userId => {
    setSelectedUserId(prev => (prev === userId ? null : userId));
    setSelectedOrderId(null);
  };

  const ordersForSelectedUser = orders.filter(order => order.user_id === selectedUserId);

  const handleSortChange = (e) => {
    const value = e.target.value;
    setSortCriteria(value);
    if (value === 'month' || value === 'year' || value === 'product') {
      setIsSortPopupOpen(true);
    }
  };

  const handleSortPopupSubmit = () => {
    setIsSortPopupOpen(false);
  };

  const handleSortPopupCancel = () => {
    setIsSortPopupOpen(false);
    setSortFilterInput({ month: '', year: '', product: '' });
    setSortCriteria('newest');
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSortCriteria('newest');
    setSortFilterInput({ month: '', year: '', product: '' });
  };

  //----------------------------//
  // Update Order Status Handler (passed to SuperOrderCardPage)
  //----------------------------//
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    if (!orderId || !newStatus) return;
    try {
      const response = await wrapperFetch(`${BASE_URL}/orders/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status: newStatus, superuser_id: userId }),
      });
      const data = await response.json();
      if (response.ok) {
        // Update local orders state with new status
        setOrders(prev => prev.map(order => order.order_id === orderId ? { ...order, status: newStatus } : order));
        showNotification(data.message, 'success');
      } else {
        showNotification(data.error || 'Failed to update order status.', 'error');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      showNotification('Error updating order status.', 'error');
    }
  };

  //----------------------------//
  // Socket: Listen for orderStatusUpdated events for the selected order
  //----------------------------//
  useEffect(() => {
    if (!selectedOrderId) return;
    const socket = io(SOCKET_URL);
    socket.emit('joinRoom', `order_${selectedOrderId}`);
    socket.on('orderStatusUpdated', (data) => {
      console.log('Order status updated:', data);
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.order_id === data.order_id ? { ...order, status: data.status } : order
        )
      );
      showNotification(`Order ${data.order_id} updated to ${data.status}`, 'success');
    });
    return () => { socket.disconnect(); };
  }, [selectedOrderId, showNotification]);

  const selectedOrder = orders.find(order => order.order_id === selectedOrderId);

  //----------------------------//
  // Render Left Panel
  //----------------------------//
  const renderLeftPanel = () => {
    if (activeTab === 'orders') {
      return (
        <div className="orders-view">
          <div className="tab-buttons">
            <button
              className={activeTab === 'orders' ? 'active' : ''}
              onClick={() => setActiveTab('orders')}
            >
              Orders
            </button>
            <button
              className={activeTab === 'users' ? 'active' : ''}
              onClick={() => setActiveTab('users')}
            >
              Users
            </button>
          </div>
          <div className="search-sort-bar">
            <input
              type="text"
              placeholder="Search by Order ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button onClick={handleClearFilters}>Clear</button>
            <div className="sort-filter">
              <label htmlFor="sortSelect">Sort by: </label>
              <select id="sortSelect" value={sortCriteria} onChange={handleSortChange}>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
                <option value="product">Product Name</option>
              </select>
            </div>
            {(sortCriteria === 'month' ||
              sortCriteria === 'year' ||
              sortCriteria === 'product') && (
              <button onClick={() => setIsSortPopupOpen(true)}>Sort Options</button>
            )}
          </div>
          {filterAndSortOrders(orders).map((order) => (
            <SuperOrderCardPage
              key={order.order_id}
              order={order}
              expanded={false}
              getUserName={getUserName}
              onUpdateStatus={handleUpdateOrderStatus}
              onClick={() => handleOrderClick(order.order_id)}
            />
          ))}
        </div>
      );
    } else if (activeTab === 'users') {
      const userMap = {};
      orders.forEach(order => {
        if (order.user_id && !userMap[order.user_id]) {
          userMap[order.user_id] = getUserName(order.user_id);
        }
      });
      const uniqueUsers = Object.keys(userMap).map(id => ({ id, name: userMap[id] }));
      return (
        <div className="users-view">
          <div className="tab-buttons">
            <button
              className={activeTab === 'orders' ? 'active' : ''}
              onClick={() => setActiveTab('orders')}
            >
              Orders
            </button>
            <button
              className={activeTab === 'users' ? 'active' : ''}
              onClick={() => setActiveTab('users')}
            >
              Users
            </button>
          </div>
          <h3>Users</h3>
          {uniqueUsers.map(user => (
            <div
              key={user.id}
              className={`user-card${selectedUserId === user.id ? ' active' : ''}`}
              onClick={() => handleUserClick(user.id)}
            >
              <span className="user-card-text">User: {user.name}</span>
            </div>
          ))}
          {selectedUserId && (
            <div className="user-orders">
              <h4>Orders for {getUserName(selectedUserId)}</h4>
              {ordersForSelectedUser.length > 0 ? (
                ordersForSelectedUser.map(order => (
                  <SuperOrderCardPage
                    key={order.order_id}
                    order={order}
                    expanded={false}
                    getUserName={getUserName}
                    onUpdateStatus={handleUpdateOrderStatus}
                    onClick={() => handleOrderClick(order.order_id)}
                  />
                ))
              ) : (
                <p>No orders found for this user.</p>
              )}
            </div>
          )}
        </div>
      );
    }
  };

  //----------------------------//
  // Render Detail Panel (Expanded view with messages)
  //----------------------------//
  const renderDetailPanel = () => {
    if (selectedOrder) {
      return (
        <div className="detail-panel">
          <SuperOrderCardPage
            order={selectedOrder}
            expanded={true}
            getUserName={getUserName}
            onUpdateStatus={handleUpdateOrderStatus}
            onClick={() => {}}
          />
          <SuperOrderMessageDone
            orderId={selectedOrderId}
            messages={orderMessages}
            setMessages={setOrderMessages}
            onNotify={(msg, type) => showNotification(msg, type)}
          />
        </div>
      );
    }
    return <p>Please select an order to view details and messages.</p>;
  };

  //----------------------------//
  // Render Layout Based on Viewport
  //----------------------------//
  if (isMobile) {
    return (
      <div className="customer-care-pagemobile">
        <Header toggleMenu={toggleMenu} />
        <Menu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
        <div className="customer-care-content">
          {selectedOrderId ? (
            <div className="mobile-order-details">
              <button className="back-btn" onClick={() => setSelectedOrderId(null)}>
                Back
              </button>
              {renderDetailPanel()}
            </div>
          ) : (
            <>
              {activeTab === 'orders' && (
                <div className="mobile-orders">
                  <h2>Orders</h2>
                  {filterAndSortOrders(orders).map(order => (
                    <SuperOrderCardPage
                      key={order.order_id}
                      order={order}
                      expanded={false}
                      getUserName={getUserName}
                      onUpdateStatus={handleUpdateOrderStatus}
                      onClick={() => handleOrderClick(order.order_id)}
                    />
                  ))}
                </div>
              )}
              {activeTab === 'users' && (
                <div className="mobile-users">
                  <h2>Users</h2>
                  {(() => {
                    const userMap = {};
                    orders.forEach(order => {
                      if (order.user_id && !userMap[order.user_id]) {
                        userMap[order.user_id] = getUserName(order.user_id);
                      }
                    });
                    const uniqueUsers = Object.keys(userMap).map(id => ({ id, name: userMap[id] }));
                    return uniqueUsers.map(user => (
                      <div key={user.id} className="user-card" onClick={() => handleUserClick(user.id)}>
                        <span className="user-card-text">User: {user.name}</span>
                      </div>
                    ));
                  })()}
                  {selectedUserId && (
                    <div className="user-orders">
                      <h3>Orders for {getUserName(selectedUserId)}</h3>
                      {ordersForSelectedUser.map(order => (
                        <SuperOrderCardPage
                          key={order.order_id}
                          order={order}
                          expanded={false}
                          getUserName={getUserName}
                          onUpdateStatus={handleUpdateOrderStatus}
                          onClick={() => handleOrderClick(order.order_id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        {isSortPopupOpen && (
          <div className="sort-popup-overlay">
            <div className="sort-popup">
              <h3>Sort Options</h3>
              {sortCriteria === 'month' && (
                <>
                  <label>Month:</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={sortFilterInput.month}
                    onChange={(e) =>
                      setSortFilterInput({ ...sortFilterInput, month: e.target.value })
                    }
                  />
                  <label>Year:</label>
                  <input
                    type="number"
                    value={sortFilterInput.year}
                    onChange={(e) =>
                      setSortFilterInput({ ...sortFilterInput, year: e.target.value })
                    }
                  />
                </>
              )}
              {sortCriteria === 'year' && (
                <>
                  <label>Year:</label>
                  <input
                    type="number"
                    value={sortFilterInput.year}
                    onChange={(e) =>
                      setSortFilterInput({ ...sortFilterInput, year: e.target.value })
                    }
                  />
                </>
              )}
              {sortCriteria === 'product' && (
                <>
                  <label>Product Name:</label>
                  <input
                    type="text"
                    value={sortFilterInput.product}
                    onChange={(e) =>
                      setSortFilterInput({ ...sortFilterInput, product: e.target.value })
                    }
                  />
                </>
              )}
              <div className="sort-popup-actions">
                <button onClick={handleSortPopupSubmit}>Apply</button>
                <button onClick={handleSortPopupCancel}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } else {
    return (
      <div className="customer-care-page">
        <Header toggleMenu={toggleMenu} />
        <Menu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
        <div className="customer-care-content">
          <div className="left-panel">{renderLeftPanel()}</div>
          <div className="right-panel">{renderDetailPanel()}</div>
        </div>
        {isSortPopupOpen && (
          <div className="sort-popup-overlay">
            <div className="sort-popup">
              <h3>Sort Options</h3>
              {sortCriteria === 'month' && (
                <>
                  <label>Month:</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={sortFilterInput.month}
                    onChange={(e) =>
                      setSortFilterInput({ ...sortFilterInput, month: e.target.value })
                    }
                  />
                  <label>Year:</label>
                  <input
                    type="number"
                    value={sortFilterInput.year}
                    onChange={(e) =>
                      setSortFilterInput({ ...sortFilterInput, year: e.target.value })
                    }
                  />
                </>
              )}
              {sortCriteria === 'year' && (
                <>
                  <label>Year:</label>
                  <input
                    type="number"
                    value={sortFilterInput.year}
                    onChange={(e) =>
                      setSortFilterInput({ ...sortFilterInput, year: e.target.value })
                    }
                  />
                </>
              )}
              {sortCriteria === 'product' && (
                <>
                  <label>Product Name:</label>
                  <input
                    type="text"
                    value={sortFilterInput.product}
                    onChange={(e) =>
                      setSortFilterInput({ ...sortFilterInput, product: e.target.value })
                    }
                  />
                </>
              )}
              <div className="sort-popup-actions">
                <button onClick={handleSortPopupSubmit}>Apply</button>
                <button onClick={handleSortPopupCancel}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
};

export default SuperOrderMessagesPage;
