import React, { useState, useEffect } from 'react';
import { useTransactions } from '../contexts/TransactionContext.jsx';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Link } from 'react-router-dom';
import { householdMembers, incomeCategories, expenseCategories, PERSON_COLORS, HOUSEHOLD_ID, paymentMethods, ADMIN_EMAIL } from '../config.js';
import Modal from '../components/Modal.jsx';

const TransactionsPage = () => {
    const { transactions, loading } = useTransactions();
    const { user } = useAuth();

    // --- NEW: Logic for smart defaults ---
    const loggedInPerson = user.email === ADMIN_EMAIL ? 'Nicky' : 'Alex';
    const now = new Date();
    const currentMonthString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // --- UPDATED: States now use the smart defaults ---
    const [activeTab, setActiveTab] = useState(loggedInPerson);
    const [selectedMonth, setSelectedMonth] = useState(currentMonthString);
    
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('All');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState(null);

    const openDeleteModal = (id) => { setTransactionToDelete(id); setIsModalOpen(true); };
    const handleDeleteTransaction = async () => { if (!user || !transactionToDelete) return; try { await deleteDoc(doc(db, 'users', HOUSEHOLD_ID, 'transactions', transactionToDelete)); } catch (error) { console.error("Error deleting document: ", error); } setIsModalOpen(false); setTransactionToDelete(null); };
    
    const uniqueMonths = [...new Set(transactions.map(t => { const d = t.createdAt.toDate(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }))];
    const allCategories = [...incomeCategories, ...expenseCategories];
    
    const filteredTransactions = transactions
        .filter(t => typeFilter === 'All' || t.type === typeFilter)
        .filter(t => paymentMethodFilter === 'All' || t.paymentMethod === paymentMethodFilter)
        .filter(t => selectedMonth === 'All' || `${t.createdAt.toDate().getFullYear()}-${String(t.createdAt.toDate().getMonth() + 1).padStart(2, '0')}` === selectedMonth)
        .filter(t => activeTab === 'All' || t.person === activeTab)
        .filter(t => categoryFilter === 'All' || t.category === categoryFilter);
        
    const formatCurrency = (value) => `€${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const balance = filteredTransactions.reduce((acc, t) => (t.type === 'income' ? acc + t.amount : acc - t.amount), 0);
    
    if (loading) return <div className="page-content"><p>Loading transactions...</p></div>;

    return (
        <>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleDeleteTransaction} title="Transaktion löschen">Möchtest du die Transaktion wirklich löschen?</Modal>
            <div className="page-content">
                <div className="section-header"><h3 className="balance-title">Balance for this view: {formatCurrency(balance)}</h3></div>
                <div className="tabs filter-tabs">
                    <button className={activeTab === 'All' ? 'active' : ''} onClick={() => setActiveTab('All')}>All</button>
                    {householdMembers.map(member => (<button key={member} className={activeTab === member ? 'active' : ''} onClick={() => setActiveTab(member)}>{member}</button>))}
                </div>
                <div className="filter-grid">
                    <div className="form-control" style={{ gridArea: 'category' }}><label>Category</label><div className="custom-select-wrapper"><select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option value="All">All Categories</option>{allCategories.map(cat => (<option key={cat} value={cat}>{cat}</option>))} </select></div></div>
                    <div className="form-control" style={{ gridArea: 'month' }}><label>Month</label><div className="custom-select-wrapper"><select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}><option value="All">All Months</option>{uniqueMonths.map(month => (<option key={month} value={month}>{new Date(month + '-02').toLocaleString('de-DE', { month: 'long', year: 'numeric' })}</option>))}</select></div></div>
                    <div className="form-control" style={{ gridArea: 'payment' }}><label>Payment Method</label><div className="custom-select-wrapper"><select value={paymentMethodFilter} onChange={(e) => setPaymentMethodFilter(e.target.value)} disabled={typeFilter === 'income'}><option value="All">All Methods</option>{paymentMethods.map(method => (<option key={method} value={method}>{method}</option>))}</select></div></div>
                    <div className="form-control" style={{ gridArea: 'type' }}><label>Type</label><div className="custom-select-wrapper"><select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}><option value="All">All Types</option><option value="income">Income</option><option value="expense">Expense</option></select></div></div>
                </div>
                {/* NEW: Export Button */}
                <div className="export-section">
                    <button className="export-btn" onClick={handleExportCSV}>📤</button>
                </div>
                <ul className="transaction-list">
                    {filteredTransactions.map((transaction) => {
                        const colors = PERSON_COLORS[transaction.person] || {};
                        const isCashTransaction = 
                            (transaction.type === 'income' && transaction.category === 'Cash Deposit') || 
                            (transaction.type === 'expense' && transaction.paymentMethod === 'Cash Withdrawal');

                        return (
                            <li key={transaction.id} className="transaction-item-grid" style={{ backgroundColor: '#ffffff', border: `1px solid ${colors.backgroundLogged}` }}>
                                <div className="item-person" style={{ color: colors.primary }}>{transaction.person}</div>
                                <div className="item-actions">
                                    <Link to={`/edit/${transaction.id}`} className="edit-btn">✏️</Link>
                                    <button className="delete-btn" onClick={() => openDeleteModal(transaction.id)}>🗑️</button>
                                </div>
                                <div className="item-details">
                                    <span className="transaction-description">{transaction.description}</span>
                                    <span className="transaction-date">
                                        {transaction.createdAt.toDate().toLocaleString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                                <div className="item-amount" style={{ color: transaction.type === 'income' ? '#008000' : '#FF0000' }}>
                                    {isCashTransaction && <span className="cash-icon">💸</span>}
                                    <span>{transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}</span>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </>
    );
};
export default TransactionsPage;