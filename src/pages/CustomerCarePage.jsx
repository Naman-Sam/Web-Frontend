import React, { useEffect, useState } from 'react';
import Header from '../components/shared/Header';
import Menu from '../components/shared/Menu';
import CartSlider from '../components/shared/CartSlider';
import '../components/styles/CustomerCarePage.css';
import MessageDone from '../components/shared/MessageDone';
import { FaHeadset } from 'react-icons/fa';
import { useNotification } from '../components/shared/NotificationContext';
import CatchTheBox from '../components/shared/CatchTheBox'; // Added CatchTheBox component
import '../components/styles/Responsive/CustomerCarePage.responsive.css';
import { wrapperFetch } from '../utils/wrapperfetch';

const BASE_URL = `${process.env.REACT_APP_BASE_URL}/api`;

const CustomerCarePage = () => {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isCartOpen, setCartOpen] = useState(false);
  const userId = localStorage.getItem('userId');

  // Get the global notification function from our notification context.
  const { showNotification } = useNotification();

  // Toggle Menu
  const toggleMenu = () => setMenuOpen((prev) => !prev);

  // Toggle Cart
  const toggleCart = () => setCartOpen((prev) => !prev);

  // Fetch conversation ID
  useEffect(() => {
    if (!userId) {
      setError('User ID not found. Please log in to continue.');
      return;
    }

    const fetchConversationId = async () => {
      try {
        const response = await wrapperFetch(`${BASE_URL}/messages/conversation/id`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId }),
        });
        const data = await response.json();

        if (response.ok) {
          setConversationId(data.conversation_id);
        } else {
          console.log('Conversation ID not found. Creating a new one.');
          await createConversation();
        }
      } catch (error) {
        console.error('Error fetching conversation ID:', error);
        setError('Failed to fetch conversation ID. Please try again later.');
      }
    };

    const createConversation = async () => {
      try {
        const response = await wrapperFetch(`${BASE_URL}/messages/conversation/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId }),
        });
        const data = await response.json();

        if (response.ok) {
          setConversationId(data.conversation.conversation_id);
        } else {
          setError('Failed to create conversation. Please try again later.');
        }
      } catch (error) {
        console.error('Error creating conversation:', error);
        setError('Failed to create conversation. Please try again later.');
      }
    };

    fetchConversationId();
  }, [userId]);

  // Fetch messages for the conversation
  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      try {
        const response = await wrapperFetch(`${BASE_URL}/messages/fetch/conversation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversation_id: conversationId }),
        });
        const data = await response.json();

        if (response.ok) {
          setMessages(data.messages || []);
        } else {
          setError('Failed to fetch messages. Please try again later.');
          showNotification('Failed to fetch messages.', 'error');
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError('Failed to fetch messages. Please try again later.');
        showNotification('Failed to fetch messages.', 'error');
      }
    };

    fetchMessages();
  }, [conversationId, showNotification]);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="customer-care-page">
      {/* Header Section */}
      <Header toggleMenu={toggleMenu} toggleCart={toggleCart} />

      {/* Menu Section */}
      <Menu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />

      {/* CartSlider Section */}
      <CartSlider
        isCartOpen={isCartOpen}
        toggleCart={toggleCart}
        cartItems={[]} // Pass empty cartItems for now
        onRemove={(cartId) => console.log(`Remove item with cart ID: ${cartId}`)}
        onUpdateQuantity={(cartId, quantity) =>
          console.log(`Update item with cart ID: ${cartId}, Quantity: ${quantity}`)
        }
      />

      {/* Main Content Area Divided into Two Sections */}
      <div className="customer-care-content">
        {/* Left Section: Catch The Box Game */}
        <div className="left-section-witness">
          <CatchTheBox />
        </div>

        {/* Right Section: Customer Care Messages */}
        <div className="right-section-witness">
          <h1 className="customer-care-title">
            <FaHeadset className="customer-care-icon" /> Customer Care
          </h1>
          <p className="customer-care-subtitle">
          We're here to help you with any queries or issues. While you wait for a reply, feel free to play a game!
          </p>
          {conversationId ? (
            <MessageDone
              conversationId={conversationId}
              messages={messages}
              setMessages={setMessages}
              senderId={userId}
              onNotify={(msg, type) => showNotification(msg, type)}
            />
          ) : (
            <p>Loading conversation...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerCarePage;
