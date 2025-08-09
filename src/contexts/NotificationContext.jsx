// src/contexts/NotificationContext.jsx

import React, { createContext, useState, useContext, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
  return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
  const [message, setMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  const showNotification = useCallback((msg) => {
    setMessage(msg);
    setIsVisible(true);
    setTimeout(() => {
      setIsVisible(false);
      setMessage('');
    }, 3000); // The notification will disappear after 3 seconds
  }, []);

  const value = {
    showNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {isVisible && <div className="notification-toast">{message}</div>}
    </NotificationContext.Provider>
  );
};