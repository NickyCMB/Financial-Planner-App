// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './firebase.js';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { TransactionProvider } from './contexts/TransactionContext.jsx';
import { NotificationProvider } from './contexts/NotificationContext.jsx';
import { BalanceProvider } from './contexts/BalanceContext.jsx';

// 1. Import the new ToastProvider
import { ToastProvider } from './contexts/ToastContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <TransactionProvider>
            {/* Wrap the App with BalanceProvider */}
            <BalanceProvider>
              {/* 2. Wrap the App with the new ToastProvider */}
              <ToastProvider>
                <App />
              </ToastProvider>
            </BalanceProvider>
          </TransactionProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);