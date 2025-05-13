import React, { useEffect, useState } from 'react';
import Header from '../SuperShare/SuperHeader';
import Menu from '../SuperShare/SuperMenu';
import '../SuperStyle/SuperMessagePage.css';
import SuperMessageDone from '../SuperShare/SuperMessageDone';
import { FaHeadset } from 'react-icons/fa';
import { useNotification } from '../../components/shared/NotificationContext';
import { wrapperFetch } from '../../utils/wrapperfetch';

const BASE_URL = `${process.env.REACT_APP_BASE_URL}/api`;

const SuperUserMessagesPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false); // new state for viewport

  // Get the superuser ID from localStorage.
  const userId = localStorage.getItem('superuserId');

  // Retrieve the global notification function.
  const { showNotification } = useNotification();

  const toggleMenu = () => setMenuOpen(prev => !prev);

  // Check viewport size and set isMobile accordingly.
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 480);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch conversations for the superuser.
  useEffect(() => {
    if (!userId) {
      setError('Superuser ID not found. Please log in.');
      return;
    }
    const fetchConversations = async () => {
      try {
        const response = await wrapperFetch(`${BASE_URL}/messages/fetch/conversations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ superuser_id: userId }),
        });
        const data = await response.json();
        if (response.ok) {
          setConversations(data.conversations || []);
        } else {
          setError('Failed to fetch conversations. Please try again later.');
          showNotification('Failed to fetch conversations.', 'error');
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError('Failed to fetch conversations. Please try again later.');
        showNotification('Failed to fetch conversations.', 'error');
      }
    };
    fetchConversations();
  }, [userId, showNotification]);

  // When a conversation is clicked, load its messages.
  const handleConversationClick = (conversationId) => {
    setSelectedConversationId(conversationId);
    setMessages([]); // Clear previous messages.
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  // ----------------------------
  // FETCH USER INFO FUNCTION
  // ----------------------------
  // This function calls /api/info/fetch with a POST body that sends only the user id.
  const fetchUserInfo = async (user) => {
    // If user is an object, extract its id; otherwise use the value directly.
    const userIdToFetch = typeof user === 'object' && user ? user.id : user;
    try {
      const response = await wrapperFetch(`${BASE_URL}/info/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userIdToFetch }),
      });
      const data = await response.json();
      if (response.ok && data.user_info) {
        return data.user_info;
      } else {
        console.error('Failed to fetch user info:', data.message);
        return null;
      }
    } catch (err) {
      console.error('Error fetching user info:', err);
      return null;
    }
  };

  // ----------------------------
  // Conversation Card Component with Expand/Collapse
  // ----------------------------
  const SuperMessageCard = ({ conv, isActive, onClick }) => {
    const [expanded, setExpanded] = useState(false);
    const [userInfo, setUserInfo] = useState(null);

    // Toggle expand/collapse, and fetch user info if expanding.
    const toggleExpand = async (e) => {
      e.stopPropagation(); // Prevent event bubbling to parent's onClick.
      if (!expanded && conv.user_id) {
        const info = await fetchUserInfo(conv.user_id);
        setUserInfo(info);
      }
      setExpanded(prev => !prev);
    };

    return (
      <div
        className={`super-message-card ${isActive ? 'active' : ''}`}
        onClick={() => onClick(conv.conversation_id)}
      >
        <div className="card-content">
          <span className="conversation-id"></span>
          {conv.user_id && (
            <span className="username-message-super"> | {conv.user_id.username || conv.user_id}</span>
          )}
        </div>
        <button className="expand-btn" onClick={toggleExpand}>
          {expanded ? '−' : 'i'}
        </button>
        {expanded && userInfo && (
          <div className="user-info">
            <p><strong>Phone:</strong> {userInfo.phone_number}</p>
            <p><strong>Address 1:</strong> {userInfo.address_line_1}</p>
            <p><strong>Address 2:</strong> {userInfo.address_line_2}</p>
            <p><strong>City:</strong> {userInfo.city}</p>
            <p><strong>Type:</strong> {userInfo.apartment_or_home}</p>
            <p><strong>State:</strong> {userInfo.state}</p>
            <p><strong>Country:</strong> {userInfo.country}</p>
            <p><strong>Postal Code:</strong> {userInfo.postal_code}</p>
          </div>
        )}
      </div>
    );
  };

  // ----------------------------
  // Render Layout Based on Viewport
  // ----------------------------

  // Mobile view: single column with conversation list OR conversation details + messages.
  if (isMobile) {
    return (
      <div className="customer-care-page mobile">
        <Header toggleMenu={toggleMenu} toggleCart={() => {}} />
        <Menu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
        <div className="customer-care-content">
          {!selectedConversationId ? (
            <div className="mobile-conversations">
              <h2>Conversations</h2>
              {conversations.length > 0 ? (
                conversations.map((conv) => (
                  <SuperMessageCard
                    key={conv.conversation_id}
                    conv={conv}
                    isActive={false}
                    onClick={handleConversationClick}
                  />
                ))
              ) : (
                <p>No conversations available.</p>
              )}
            </div>
          ) : (
            <div className="mobile-conversation-details">
              <button className="back-btn" onClick={() => setSelectedConversationId(null)}>
                Back
              </button>
              {conversations
                .filter((conv) => conv.conversation_id === selectedConversationId)
                .map((conv) => (
                  <SuperMessageCard
                    key={conv.conversation_id}
                    conv={conv}
                    isActive={true}
                    onClick={() => {}}
                  />
                ))}
              <SuperMessageDone
                conversationId={selectedConversationId}
                userId={userId}
                messages={messages}
                setMessages={setMessages}
                onNotify={(msg, type) => showNotification(msg, type)}
              />
            </div>
          )}
        </div>
      </div>
    );
  } else {
    // Desktop/Tablet view: two-column layout.
    return (
      <div className="customer-care-page">
        <Header toggleMenu={toggleMenu} toggleCart={() => {}} />
        <Menu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
        <div className="customer-care-content">
          <div className="left-section-witness">
            <h2>Conversations</h2>
            {conversations.length > 0 ? (
              conversations.map((conv) => (
                <SuperMessageCard
                  key={conv.conversation_id}
                  conv={conv}
                  isActive={selectedConversationId === conv.conversation_id}
                  onClick={handleConversationClick}
                />
              ))
            ) : (
              <p>No conversations available.</p>
            )}
          </div>
          <div className="right-section-witness">
            <h1 className="customer-care-title">
              <FaHeadset className="customer-care-icon" /> Messages
            </h1>
            {selectedConversationId ? (
              <SuperMessageDone
                conversationId={selectedConversationId}
                userId={userId}
                messages={messages}
                setMessages={setMessages}
                onNotify={(msg, type) => showNotification(msg, type)}
              />
            ) : (
              <p>Please select a conversation to view messages.</p>
            )}
          </div>
        </div>
      </div>
    );
  }
};

export default SuperUserMessagesPage;
