import React, { useState } from 'react';
import { useTransactions } from '../contexts/TransactionContext.jsx';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Link } from 'react-router-dom';
import { householdMembers, incomeCategories, expenseCategories, PERSON_COLORS, HOUSEHOLD_ID } from '../config.js';
import Modal from '../components/Modal.jsx';

const TransactionsPage = () => {
    const { transactions, loading } = useTransactions();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('All');
    const [selectedMonth, setSelectedMonth] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState(null);

    const openDeleteModal = (id) => { setTransactionToDelete(id); setIsModalOpen(true); };
    const handleDeleteTransaction = async () => { if (!user || !transactionToDelete) return; try { await deleteDoc(doc(db, 'users', HOUSEHOLD_ID, 'transactions', transactionToDelete)); } catch (error) { console.error("Error deleting document: ", error); } setIsModalOpen(false); setTransactionToDelete(null); };

    const uniqueMonths = [...new Set(transactions.map(t => { const d = t.createdAt.toDate(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }))];
    const allCategories = [...incomeCategories, ...expenseCategories];
    const filteredTransactions = transactions.filter(t => selectedMonth === 'All' || `${t.createdAt.toDate().getFullYear()}-${String(t.createdAt.toDate().getMonth() + 1).padStart(2, '0')}` === selectedMonth).filter(t => activeTab === 'All' || t.person === activeTab).filter(t => categoryFilter === 'All' || t.category === categoryFilter);
    const formatCurrency = (value) => `€${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const balance = filteredTransactions.reduce((acc, t) => (t.type === 'income' ? acc + t.amount : acc - t.amount), 0);

    if (loading) return <div className="page-content"><p>Loading transactions...</p></div>;
    return (
        <>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleDeleteTransaction} title="Delete Transaction">Are you sure you want to permanently delete this transaction?</Modal>
            <div className="page-content">
                <div className="section-header"><h3 className="balance-title">Balance for this view: {formatCurrency(balance)}</h3></div>
                <div className="filter-controls"><div className="tabs"><button className={activeTab === 'All' ? 'active' : ''} onClick={() => setActiveTab('All')}>All</button>{householdMembers.map(member => (<button key={member} className={activeTab === member ? 'active' : ''} onClick={() => setActiveTab(member)}>{member}</button>))}</div><div className="custom-select-wrapper month-filter"><select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}><option value="All">All Months</option>{uniqueMonths.map(month => (<option key={month} value={month}>{new Date(month + '-02').toLocaleString('de-DE', { month: 'long', year: 'numeric' })}</option>))}</select></div><div className="custom-select-wrapper category-filter"><select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option value="All">All Categories</option>{allCategories.map(cat => (<option key={cat} value={cat}>{cat}</option>))} </select></div></div>
                <ul className="transaction-list">{filteredTransactions.map((transaction) => { const colors = PERSON_COLORS[transaction.person] || {}; return (<li key={transaction.id} style={{ backgroundColor: '#ffffff', border: `1px solid ${colors.backgroundLogged}` }}><div className="transaction-main-content"><div className="transaction-details"><div><span className="transaction-person" style={{ color: colors.primary }}>{transaction.person}</span><span>{transaction.description}</span></div></div><div className="transaction-meta"><span className="transaction-month">{transaction.createdAt.toDate().toLocaleString('de-DE', { month: 'long', year: 'numeric' })}</span></div></div><div className="transaction-side-content"><div className="transaction-actions"><Link to={`/edit/${transaction.id}`} className="edit-btn">✏️</Link><button className="delete-btn" onClick={() => openDeleteModal(transaction.id)}>X</button></div><span className="transaction-amount" style={{ color: transaction.type === 'income' ? '#008000' : '#FF0000' }}>{transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}</span></div></li>);})}</ul>
            </div>
        </>
    );
};
export default TransactionsPage;