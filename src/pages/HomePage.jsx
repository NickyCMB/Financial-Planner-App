import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useBalance } from '../contexts/BalanceContext.jsx'; // Import the new balance hook
import { householdMembers, ADMIN_EMAIL } from '../config.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const HomePage = () => {
    const { user } = useAuth();
    const { monthlySummaries, isBalanceLoading } = useBalance(); // Get the calculated summaries
    
    const loggedInPerson = user.email === ADMIN_EMAIL ? 'Nicky' : 'Alex';
    const [viewingAs, setViewingAs] = useState(loggedInPerson);

    useEffect(() => { setViewingAs(loggedInPerson); }, [loggedInPerson]);

    // Get the current month in "YYYY-MM" format
    const now = new Date();
    const currentMonthString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Get the summary for the current month from our context
    const currentMonthSummary = monthlySummaries[currentMonthString] || { totalIncome: 0, totalExpense: 0, closingBalance: 0 };
    
    const chartData = [
        { name: 'Income', total: currentMonthSummary.totalIncome, color: '#006300ff' },
        { name: 'Expense', total: currentMonthSummary.totalExpense, color: '#c50000ff' },
    ];
    
    const formatCurrency = (value) => `€${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (isBalanceLoading) return <div className="page-content"><p>Calculating balances...</p></div>;
    
    return (
        <div className="page-content">
            <div className="tabs view-switcher">
                {householdMembers.map(member => (
                    <button key={member} className={viewingAs === member ? 'active' : ''} onClick={() => setViewingAs(member)}>
                        {member}'s View
                    </button>
                ))}
            </div>
            <div className="top-balance-container">
                {/* Note: This dashboard now shows the total household balance for the month, not an individual's */}
                <h2>Household Balance ({now.toLocaleString('de-DE', { month: 'long' })})</h2>
                <p className="balance-large" style={{ color: currentMonthSummary.closingBalance >= 0 ? '#008000' : '#FF0000' }}>
                    {formatCurrency(currentMonthSummary.closingBalance)}
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