// src/components/shared/Notification.jsx
import React from 'react';
import { useNotification } from './NotificationContext';
import '../styles/Notification.css';
import { wrapperFetch } from '../../utils/wrapperfetch';

const Notification = () => {
  const { notifications } = useNotification();

  return (
    <div className="notification-container">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          className={`notification ${
            notification.type === 'error' ? 'error-notification' : 'success-notification'
          }`}
          style={{ top: `${100 + index * 70}px` }} // Stacks notifications vertically
        >
          {notification.message}
        </div>
      ))}
    </div>
  );
};

export default Notification;
