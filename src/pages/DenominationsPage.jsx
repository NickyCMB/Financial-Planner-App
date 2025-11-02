import React, { useState, useEffect } from 'react';
import { useTransactions } from '../contexts/TransactionContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { householdMembers, ADMIN_EMAIL, denominations, HOUSEHOLD_ID, BILL_COLORS } from '../config.js';
import { db } from '../firebase.js';
import { onSnapshot, query, collection } from 'firebase/firestore';

const DenominationsPage = () => {
    const { transactions, loading } = useTransactions();
    const { user } = useAuth();
    
    const loggedInPerson = user.email === ADMIN_EMAIL ? 'Nicky' : 'Alex';
    const [personFilter, setPersonFilter] = useState(loggedInPerson);
    
    const [uniqueMonths, setUniqueMonths] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState('');

    useEffect(() => {
        const months = [...new Set(transactions.map(t => {
            const d = t.createdAt.toDate();
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }))].sort().reverse();
        
        setUniqueMonths(months);
        if (months.length > 0 && !selectedMonth) {
            setSelectedMonth(months[0]);
        }
    }, [transactions, selectedMonth]);

    useEffect(() => {
        setPersonFilter(loggedInPerson);
    }, [loggedInPerson]);

    const getSummary = () => {
        const filtered = transactions.filter(t => {
            const monthMatch = `${t.createdAt.toDate().getFullYear()}-${String(t.createdAt.toDate().getMonth() + 1).padStart(2, '0')}` === selectedMonth;
            const personMatch = t.person === personFilter;
            const isCashWithdrawal = t.type === 'expense' && t.paymentMethod === 'Cash Withdrawal';
            return monthMatch && personMatch && isCashWithdrawal && t.denominations;
        });

        const totalDenominations = filtered.reduce((acc, t) => {
            for (const bill of denominations) {
                acc[bill] = (acc[bill] || 0) + (t.denominations[bill] || 0);
            }
            return acc;
        }, {});

        const totalAmount = denominations.reduce((sum, bill) => {
            return sum + (totalDenominations[bill] || 0) * bill;
        }, 0);

        return { summary: totalDenominations, totalAmount };
    };

    const { summary, totalAmount } = getSummary();
    const formatCurrency = (value) => `€${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const handleExportCSV = () => {
        const headers = ['Bill', 'Count', 'Subtotal'];
        const rows = denominations.map(bill => {
            const count = summary[bill] || 0;
            const subtotal = (count * bill).toString().replace('.', ',');
            return [`"€${bill} Bill"`, count, subtotal];
        });
        rows.push(['"Total"', '', totalAmount.toString().replace('.', ',')]);
        
        const csvContent = [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `denominations_${selectedMonth}_${personFilter}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="page-content"><p>Loading...</p></div>;

    return (
        <div className="page-content denomination-summary-page">
            <div className="tabs">
                {householdMembers.map(member => (
                    <button key={member} className={personFilter === member ? 'active' : ''} onClick={() => setPersonFilter(member)}>
                        {member}'s Summary
                    </button>
                ))}
            </div>
            
            <div className="filter-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '400px', margin: '0 auto 20px auto' }}>
                <div className="form-control">
                    <label>Select Month</label>
                    <div className="custom-select-wrapper">
                        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                            {uniqueMonths.map(month => (
                                <option key={month} value={month}>
                                    {new Date(month + '-02').toLocaleString('de-DE', { month: 'long', year: 'numeric' })}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <h3>Withdrawal Summary for {personFilter}</h3>

            <div className="export-section">
                <button className="export-btn" onClick={handleExportCSV}>📤 Export as CSV</button>
            </div>
            
            <ul className="summary-list">
                {denominations.map(bill => (
                    <li key={bill} className="summary-row">
                        <div className="bill-rectangle" style={{ backgroundColor: BILL_COLORS[bill] }}>
                            <span className="bill-amount">€{bill}</span>
                        </div>
                        <span className="summary-count">x {summary[bill] || 0}</span>
                    </li>
                ))}
            </ul>

            <div className="summary-total">
                <strong>Total Withdrawn: {formatCurrency(totalAmount)}</strong>
            </div>
        </div>
    );
};

export default DenominationsPage;