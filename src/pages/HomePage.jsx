import React, { useState } from 'react';
import { useTransactions } from '../contexts/TransactionContext';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { householdMembers, USER_MAP } from '../config.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const HomePage = () => {
    const { transactions, loading } = useTransactions();
    const { user } = useAuth();
    const loggedInPerson = USER_MAP[user.email];
    const [viewingAs, setViewingAs] = useState(loggedInPerson || householdMembers[0]);
    const now = new Date();
    const currentMonthTransactions = transactions.filter(t => { const d = t.createdAt.toDate(); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && t.person === viewingAs; });
    const monthlyIncome = currentMonthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const monthlyExpense = currentMonthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const monthlyBalance = monthlyIncome - monthlyExpense;
    const chartData = [{ name: 'Income', total: monthlyIncome, color: '#2ecc71' }, { name: 'Expense', total: monthlyExpense, color: '#e74c3c' }];
    const formatCurrency = (value) => `€${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (loading) return <p>Loading dashboard...</p>;
    return (
        <div className="page-content">
            <div className="tabs view-switcher">{householdMembers.map(member => (<button key={member} className={viewingAs === member ? 'active' : ''} onClick={() => setViewingAs(member)}>{member}'s View</button>))}</div>
            <div className="top-balance-container"><p className="balance-large" style={{ color: monthlyBalance >= 0 ? '#008000' : '#FF0000' }}>{formatCurrency(monthlyBalance)}</p></div>
            <div className="chart-container"><ResponsiveContainer width="100%" height={300}><BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><XAxis dataKey="name" /><YAxis tickFormatter={(value) => `€${value.toLocaleString('de-DE')}`} /><Tooltip formatter={(value) => formatCurrency(value)} cursor={{fill: 'rgba(206, 206, 206, 0.2)'}} /><Bar dataKey="total" barSize={80}>{chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Bar></BarChart></ResponsiveContainer></div>
        </div>
    );
};
export default HomePage;