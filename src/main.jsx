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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <TransactionProvider>
            {/* 2. Wrap the App with BalanceProvider */}
            <BalanceProvider>
              <App />
            </BalanceProvider>
          </TransactionProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);