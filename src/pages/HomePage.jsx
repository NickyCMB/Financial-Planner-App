import React, { useState, useEffect } from 'react';
import { useTransactions } from '../contexts/TransactionContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { householdMembers, ADMIN_EMAIL, PERSON_COLORS } from '../config.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const HomePage = () => {
    const { transactions, loading } = useTransactions();
    const { user } = useAuth();
    
    const loggedInPerson = user.email === ADMIN_EMAIL ? 'Nicky' : 'Alex';
    const [viewingAs, setViewingAs] = useState(loggedInPerson);

    useEffect(() => {
        setViewingAs(loggedInPerson);
    }, [loggedInPerson]);

    const now = new Date();

    // --- HELPER: Handles the "Household" view logic ---
    const filterByView = (transaction) => {
        if (viewingAs === 'Household') return true; // Show everything
        return transaction.person === viewingAs;    // Show specific person
    };

    // 1. Filter for CHART (Current Month Only)
    const currentMonthTransactions = transactions.filter(t => {
        const d = t.createdAt.toDate();
        return d.getFullYear() === now.getFullYear() && 
               d.getMonth() === now.getMonth() && 
               filterByView(t);
    });

    const monthlyIncome = currentMonthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const monthlyExpense = currentMonthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    
    // 2. Filter for TOTAL BALANCE (All Time - Past & Future)
    const allTimeTransactions = transactions.filter(t => filterByView(t));
    
    const totalIncome = allTimeTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = allTimeTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const totalBalance = totalIncome - totalExpense;

    const chartData = [
        { name: 'Income', total: monthlyIncome, color: '#006300ff' }, 
        { name: 'Expense', total: monthlyExpense, color: '#c50000ff' }
    ];
    
    const formatCurrency = (value) => `€${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Get the specific color for the current view title
    const viewColor = PERSON_COLORS[viewingAs]?.primary || '#333';

    if (loading) return <div className="page-content"><p>Loading dashboard...</p></div>;
    
    return (
        <div className="page-content">
            <div className="tabs view-switcher">
                {['Household', ...householdMembers].map(member => (
                    <button key={member} className={viewingAs === member ? 'active' : ''} onClick={() => setViewingAs(member)}>
                        {member}'s View
                    </button>
                ))}
            </div>
            
            <div className="top-balance-container">
                <h2 style={{ color: viewColor }}>
                    {viewingAs}'s Total Balance
                </h2>
                <p className="balance-large" style={{ color: totalBalance >= 0 ? '#008000' : '#FF0000' }}>
                    {formatCurrency(totalBalance)}
                </p>
            </div>

            <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `€${value.toLocaleString('de-DE')}`} />
                        <Tooltip formatter={(value) => formatCurrency(value)} cursor={{fill: 'rgba(206, 206, 206, 0.2)'}} />
                        <Bar dataKey="total" barSize={80}>
                            {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
export default HomePage;