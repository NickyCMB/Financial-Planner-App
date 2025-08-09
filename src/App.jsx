import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import { useAuth } from './contexts/AuthContext.jsx';
import { ADMIN_EMAIL, PERSON_COLORS } from './config.js';
import HomePage from './pages/HomePage.jsx';
import AddTransactionPage from './pages/AddTransactionPage.jsx';
import TransactionsPage from './pages/TransactionsPage.jsx';
import PresetsPage from './pages/PresetsPage.jsx';
import ManagePresetsPage from './pages/ManagePresetsPage.jsx';
import EditTransactionPage from './pages/EditTransactionPage.jsx';

function usePrevious(value) { const ref = useRef(); useEffect(() => { ref.current = value; }); return ref.current; }

function App() {
  const { user, loading, signInWithGoogle, signOutUser } = useAuth();
  const isAdmin = user && user.email === ADMIN_EMAIL;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const prevUser = usePrevious(user);

  useEffect(() => { if (!user) return; let timer; const reset = () => { clearTimeout(timer); timer = setTimeout(() => { if (location.pathname !== '/') navigate('/'); }, 5 * 60 * 1000); }; const events = ['mousemove', 'keydown', 'click', 'scroll']; events.forEach(e => window.addEventListener(e, reset)); reset(); return () => { clearTimeout(timer); events.forEach(e => window.removeEventListener(e, reset)); }; }, [user, navigate, location.pathname]);
  useEffect(() => { if (!prevUser && user) { navigate('/'); } }, [user, prevUser, navigate]);

  const loggedInPerson = user ? (isAdmin ? 'Nicky' : 'Alex') : null;
  const appBackgroundColor = loggedInPerson ? PERSON_COLORS[loggedInPerson]?.background : '#ffffff';

  if (loading) { return <div className="loading-container"><h1>Loading App...</h1></div>; }
  if (!user) { return ( <div className="login-container"><h1 className="login-title">This is your financial planer</h1><p>to show you the money you have to</p><button className="login-btn" onClick={signInWithGoogle}>Sign in with Google</button></div> ); }

  return (
    <div className="app-wrapper">
      <div className="app-container" style={{ backgroundColor: appBackgroundColor }}>
        <header className="main-header">
          <h1 className="header-title">Finanzplaner</h1>
          <div className="burger-menu-container">
            <div className="burger-menu" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <div className="burger-line"></div><div className="burger-line"></div><div className="burger-line"></div>
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
            <Route path="/edit/:transactionId" element={<EditTransactionPage />} />
            {isAdmin && <Route path="/presets/manage" element={<ManagePresetsPage />} />}
          </Routes>
        </main>
      </div>
    </div>
  );
}
export default App;