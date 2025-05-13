const BASE_URL = process.env.REACT_APP_BASE_URL;
import { wrapperFetch } from '../../utils/wrapperfetch';

// Fetch user delivery info
export const fetchUserInfo = async (userId) => {
  try {
    const response = await wrapperFetch(`${BASE_URL}/api/info/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
    const data = await response.json();
    if (response.ok) {
      return data.user_info;
    } else {
      throw new Error(data.message || 'Failed to fetch user information.');
    }
  } catch (error) {
    console.error('Error fetching user information:', error);
    throw error;
  }
};

// Update user delivery info
export const updateUserInfo = async (userId, updatedInfo) => {
  try {
    const response = await wrapperFetch(`${BASE_URL}/api/info/add/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, ...updatedInfo }),
    });
    const data = await response.json();
    if (response.ok) {
      return { success: true, message: data.message };
    } else {
      throw new Error(data.message || 'Failed to update user information.');
    }
  } catch (error) {
    console.error('Error updating user information:', error);
    throw error;
  }
};

// Send order-related message with a note
export const sendOrderMessage = async (orderId, senderId, message) => {
  const formData = new FormData();
  formData.append('orderId', orderId);
  formData.append('sender_id', senderId);
  formData.append('message', message);

  try {
    const response = await wrapperFetch(`${BASE_URL}/api/orders/messages/send`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (response.ok) {
      return { success: true, message: data.message };
    } else {
      throw new Error(data.message || 'Failed to send the message.');
    }
  } catch (error) {
    console.error('Error sending the message:', error);
    throw error;
  }
};
