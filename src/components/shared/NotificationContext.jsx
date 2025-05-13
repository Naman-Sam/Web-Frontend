import React, { createContext, useState, useContext, useCallback } from 'react';
import { wrapperFetch } from '../../utils/wrapperfetch';

const NotificationContext = createContext();

// Custom hook to use the notification context
export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]); // Support for multiple notifications

  // Function to show a new notification
  const showNotification = useCallback((message, type, duration = 3000) => {
    const id = new Date().getTime(); // Unique ID for each notification
    const newNotification = { id, message, type };

    setNotifications((prevNotifications) => [...prevNotifications, newNotification]);

    // Auto-hide notification after the specified duration
    setTimeout(() => {
      setNotifications((prevNotifications) =>
        prevNotifications.filter((notification) => notification.id !== id)
      );
    }, duration);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, showNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};
