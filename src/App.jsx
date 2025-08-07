// src/App.jsx
import React from 'react';
import { useState, useEffect } from 'react';
import './App.css';
import { Routes, Route, NavLink } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ADMIN_EMAIL, PERSON_COLORS, USER_MAP } from './config.js';
import HomePage from './pages/HomePage';
import AddTransactionPage from './pages/AddTransactionPage';
import TransactionsPage from './pages/TransactionsPage';
import PresetsPage from './pages/PresetsPage';
import ManagePresetsPage from './pages/ManagePresetsPage';

function App() {
    const { user, loading, signInWithGoogle, signOutUser } = useAuth();
    const isAdmin = user && user.email === ADMIN_EMAIL;
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    // Determine background color based on logged-in user
    const loggedInPerson = user ? USER_MAP[user.email] : null;
    const appBackgroundColor = loggedInPerson ? PERSON_COLORS[loggedInPerson]?.background : '#ffffff';

    if (loading) {
        return <div className="loading-container"><h1>Loading...</h1></div>;
    }

    if (!user) {
        return (
            <div className="login-container">
                <h1 className="login-title">This is your financial planer</h1>
                <p>to show you the money you have to</p>
                <button className="login-btn" onClick={signInWithGoogle}>Sign in with Google</button>
            </div>
        );
    }

    return (
        <div className="app-container" style={{ backgroundColor: appBackgroundColor }}>
            <header className="main-header">
                <h1 className="header-title">Finanzplaner</h1>
                <div className="burger-menu-container">
                    <div className="burger-menu" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        <div className="burger-line"></div>
                        <div className="burger-line"></div>
                        <div className="burger-line"></div>
                    </div>
                    {isMenuOpen && (
                        <nav className="dropdown-menu" onClick={() => setIsMenuOpen(false)}>
                            <div className="menu-user-info">Signed in as <strong>{user.displayName}</strong></div>
                            <NavLink to="/" end>Dashboard</NavLink>
                            <NavLink to="/add">Add Transaction</NavLink>
                            <NavLink to="/transactions">View All</NavLink>
                            <NavLink to="/presets" end>Fixed Costs</NavLink>
                            {isAdmin && <NavLink to="/presets/manage">Manage Presets</NavLink>}
                            <button className="signout-btn-menu" onClick={signOutUser}>Sign Out</button>
                        </nav>
                    )}
                </div>
            </header>
            <main>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/add" element={<AddTransactionPage />} />
                    <Route path="/transactions" element={<TransactionsPage />} />
                    <Route path="/presets" element={<PresetsPage />} />
                    {isAdmin && <Route path="/presets/manage" element={<ManagePresetsPage />} />}
                </Routes>
            </main>
        </div>
    );
}
export default App;