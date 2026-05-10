import React, { useState, useEffect } from 'react';
import { useTransactions } from '../contexts/TransactionContext.jsx';
import { doc, deleteDoc, collection, getDocs, writeBatch, query } from 'firebase/firestore';
import { db } from '../firebase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Link } from 'react-router-dom';
import { householdMembers, incomeCategories, expenseCategories, PERSON_COLORS, HOUSEHOLD_ID, paymentMethods, ADMIN_EMAIL, denominations, BILL_COLORS } from '../config.js';
import Modal from '../components/Modal.jsx';

const TransactionsPage = () => {
    const { transactions, loading } = useTransactions();
    const { user } = useAuth();

    const loggedInPerson = user.email === ADMIN_EMAIL ? 'Nicky' : 'Alex';
    const now = new Date();
    const currentMonthString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [activeTab, setActiveTab] = useState(loggedInPerson);
    const [selectedMonth, setSelectedMonth] = useState(currentMonthString);
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('All');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('All');

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState(null);

    // State for the cash popup
    const [selectedCashTransaction, setSelectedCashTransaction] = useState(null);

    useEffect(() => {
        setActiveTab(loggedInPerson);
    }, [loggedInPerson]);

    const openDeleteModal = (id) => { setTransactionToDelete(id); setIsModalOpen(true); };
    
    const handleDeleteTransaction = async () => { 
        if (!user || !transactionToDelete) return; 
        try { 
            await deleteDoc(doc(db, 'users', HOUSEHOLD_ID, 'transactions', transactionToDelete)); 
        } catch (error) { 
            console.error("Error deleting document: ", error); 
        } 
        setIsModalOpen(false); 
        setTransactionToDelete(null); 
    };

    // --- FRESH START FUNCTION ---
    const handleExportAndWipe = async () => {
        // 1. Safety First: Double Confirmation
        const isConfirmed = window.confirm(
            "🚨 WARNING 🚨\n\nAre you absolutely sure you want to DOWNLOAD all data and then permanently DELETE it from the database?\n\nThis is your 'Fresh Start' and cannot be undone."
        );
        
        if (!isConfirmed) return;
    
        try {
            // 2. Fetch all current transactions
            const q = query(collection(db, 'users', HOUSEHOLD_ID, 'transactions'));
            const snapshot = await getDocs(q);
    
            if (snapshot.empty) {
                alert("Your database is already empty! Nothing to export or delete.");
                return;
            }
    
            // 3. Prepare the CSV Content
            let csvContent = "Date,Description,Category,Type,Person,Amount,Payment Method\n";
            
            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const date = data.createdAt ? data.createdAt.toDate().toLocaleDateString('de-DE') : '';
                const desc = `"${data.description || ''}"`; 
                const amount = data.amount || 0;
                
                csvContent += `${date},${desc},${data.category},${data.type},${data.person},${amount},${data.paymentMethod || ''}\n`;
            });
    
            // 4. Trigger the CSV Download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `finanzplaner_backup_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
    
            // 5. Delete the Data using a Batch
            const batch = writeBatch(db);
            snapshot.forEach((docSnap) => {
                batch.delete(docSnap.ref);
            });
            
            // Execute the mass deletion
            await batch.commit();
    
            alert("✅ Success! Your data has been downloaded and your database is completely wiped. Enjoy your fresh start!");
    
        } catch (error) {
            console.error("Error during export and wipe: ", error);
            alert("An error occurred. Please check the console.");
        }
    };

    const uniqueMonths = [...new Set(transactions.map(t => { const d = t.createdAt.toDate(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }))].sort().reverse();
    const allCategories = [...incomeCategories, ...expenseCategories];

    const filteredTransactions = transactions
        .filter(t => typeFilter === 'All' || t.type === typeFilter)
        .filter(t => {
            if (paymentMethodFilter === 'All') return true;
            if (paymentMethodFilter === 'Cash Withdrawal') return t.paymentMethod === 'Cash Withdrawal';
            if (paymentMethodFilter === 'Direct Debit / Transfer') return t.paymentMethod === 'Direct Debit / Transfer' || (t.type === 'expense' && !t.paymentMethod);
            return false;
        })
        .filter(t => selectedMonth === 'All' || `${t.createdAt.toDate().getFullYear()}-${String(t.createdAt.toDate().getMonth() + 1).padStart(2, '0')}` === selectedMonth)
        .filter(t => activeTab === 'All' || t.person === activeTab)
        .filter(t => categoryFilter === 'All' || t.category === categoryFilter);

    const formatCurrency = (value) => `€${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const balance = filteredTransactions.reduce((acc, t) => (t.type === 'income' ? acc + t.amount : acc - t.amount), 0);

    const handleExportCSV = () => {
        if (filteredTransactions.length === 0) { alert("There are no transactions to export in the current view."); return; }
        const headers = ['Date', 'Person', 'Description', 'Category', 'Type', 'Payment Method', 'Amount'];
        const rows = filteredTransactions.map(t => {
            const date = t.createdAt.toDate().toLocaleDateString('de-DE');
            const description = `"${(t.description || '').replace(/"/g, '""')}"`;
            const amount = t.type === 'expense' ? -t.amount : t.amount;
            return [date, t.person, description, t.category, t.type, t.paymentMethod || '', amount.toString().replace('.', ',')];
        });
        const csvContent = [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "transactions.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    if (loading) return <div className="page-content"><p>Loading transactions...</p></div>;

    return (
        <>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleDeleteTransaction} title="Löschen bestätigen">Möchtest du die Transaktion wirklich löschen?</Modal>

            {/* Cash Denomination Popup */}
            {selectedCashTransaction && (
                <div className="modal-overlay" onClick={() => setSelectedCashTransaction(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '300px' }}>
                        <h4>Cash Breakdown</h4>
                        <p style={{ marginBottom: '15px', fontStyle: 'italic' }}>{selectedCashTransaction.description}</p>

                        {selectedCashTransaction.denominations ? (
                            <ul className="mini-bill-list">
                                {denominations.map(bill => {
                                    const count = selectedCashTransaction.denominations[bill] || 0;
                                    if (count === 0) return null; 
                                    return (
                                        <li key={bill} className="mini-bill-row">
                                            <div className="bill-rectangle-mini" style={{ backgroundColor: BILL_COLORS[bill] }}>
                                                <span>€{bill}</span>
                                            </div>
                                            <span className="bill-count-mini">x {count}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p>No denomination data saved for this transaction.</p>
                        )}
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setSelectedCashTransaction(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="page-content">
                <div className="section-header"><h3 className="balance-title">Balance for this view: {formatCurrency(balance)}</h3></div>

                <div className="tabs filter-tabs">
                    <button className={activeTab === 'All' ? 'active' : ''} onClick={() => setActiveTab('All')}>All</button>
                    {householdMembers.map(member => (<button key={member} className={activeTab === member ? 'active' : ''} onClick={() => setActiveTab(member)}>{member}</button>))}
                </div>

                <div className="filter-grid">
                    <div className="form-control" style={{ gridArea: 'category' }}><label>Category</label><div className="custom-select-wrapper"><select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option value="All">All Categories</option>{allCategories.map(cat => (<option key={cat} value={cat}>{cat}</option>))} </select></div></div>
                    <div className="form-control" style={{ gridArea: 'month' }}><label>Month</label><div className="custom-select-wrapper"><select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}><option value="All">All Months</option>{uniqueMonths.map(month => (<option key={month} value={month}>{new Date(month + '-02').toLocaleString('de-DE', { month: 'long', year: 'numeric' })}</option>))}</select></div></div>
                    <div className="form-control" style={{ gridArea: 'payment' }}><label>Payment Method</label><div className="custom-select-wrapper"><select value={paymentMethodFilter} onChange={(e) => setPaymentMethodFilter(e.target.value)} disabled={typeFilter === 'income'}><option value="All">All Methods</option>{paymentMethods.map(method => (<option key={method} value={method}>{method}</option>))} </select></div></div>
                    <div className="form-control" style={{ gridArea: 'type' }}><label>Type</label><div className="custom-select-wrapper"><select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}><option value="All">All Types</option><option value="income">Income</option><option value="expense">Expense</option></select></div></div>
                </div>

                <div className="export-section">
                    <button className="export-btn" onClick={handleExportCSV}>📤 Export as CSV</button>
                </div>

                <ul className="transaction-list">
                    {filteredTransactions.map((transaction) => {
                        const colors = PERSON_COLORS[transaction.person] || {};
                        const isCashTransaction = (transaction.type === 'income' && transaction.category === 'Cash Deposit') || (transaction.type === 'expense' && transaction.paymentMethod === 'Cash Withdrawal');
                        return (
                            <li key={transaction.id} className="transaction-item-grid" style={{ backgroundColor: '#ffffff', border: `1px solid ${colors.backgroundLogged}` }}>
                                <div className="item-person" style={{ color: colors.primary }}>{transaction.person}</div>
                                <div className="item-actions">
                                    <Link to={`/edit/${transaction.id}`} className="edit-btn">✏️</Link>
                                    <button className="delete-btn" onClick={() => openDeleteModal(transaction.id)}>🗑️</button>
                                </div>
                                <div className="item-details">
                                    <span className="transaction-description">{transaction.description}</span>
                                    <span className="transaction-date">{transaction.createdAt.toDate().toLocaleString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                </div>
                                <div className="item-amount" style={{ color: transaction.type === 'income' ? '#008000' : '#FF0000' }}>
                                    {isCashTransaction && (
                                        <span
                                            className="cash-icon clickable"
                                            onClick={() => setSelectedCashTransaction(transaction)}
                                            title="Click to see cash breakdown"
                                        >
                                            💸
                                        </span>
                                    )}
                                    <span>{transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}</span>
                                </div>
                            </li>
                        );
                    })}
                </ul>

                {/* --- THE MOVED BUTTON --- */}
                <div style={{ marginTop: '40px', borderTop: '2px solid #ffcccc', paddingTop: '20px', textAlign: 'center' }}>
                    <p style={{ color: '#e74c3c', fontWeight: 'bold', marginBottom: '10px' }}>Danger Zone</p>
                    <button 
                        onClick={handleExportAndWipe} 
                        style={{ 
                            backgroundColor: '#e74c3c', 
                            color: 'white', 
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontWeight: 'bold' 
                        }}
                    >
                        🔄 Download All Data & Fresh Start
                    </button>
                </div>

            </div>
        </>
    );
};
export default TransactionsPage;