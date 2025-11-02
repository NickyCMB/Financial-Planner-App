import React, { useState, useEffect } from 'react';
import { db } from '../firebase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { collection, onSnapshot, query, doc, updateDoc, increment } from 'firebase/firestore';
import { householdMembers, ADMIN_EMAIL, HOUSEHOLD_ID, PERSON_COLORS } from '../config.js';
import { useNotification } from '../contexts/NotificationContext.jsx';

const BalanceControl = ({ goalId, onAdjust }) => {
  const [amount, setAmount] = useState(10);
  const handleAdjust = (multiplier) => {
    const value = parseFloat(amount) * multiplier;
    if (isNaN(value) || value === 0) return;
    onAdjust(goalId, value);
  };
  return (
    <div className="balance-controls">
      <button className="denomination-btn btn-minus" onClick={() => handleAdjust(-1)}>➖</button>
      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="balance-adjust-input"/>
      <button className="denomination-btn btn-plus" onClick={() => handleAdjust(1)}>➕</button>
    </div>
  );
};

const SavingsPage = () => {
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const [savingsGoals, setSavingsGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const loggedInPerson = user.email === ADMIN_EMAIL ? 'Nicky' : 'Alex';
    const [personFilter, setPersonFilter] = useState(loggedInPerson);

    useEffect(() => {
        if (user) {
            const q = query(collection(db, 'users', HOUSEHOLD_ID, 'savingsGoals'));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                setSavingsGoals(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
                setLoading(false);
            });
            return () => unsubscribe();
        }
    }, [user]);

    useEffect(() => { setPersonFilter(loggedInPerson); }, [loggedInPerson]);

    const handleBalanceAdjust = async (goalId, amount) => {
        try {
            const goalRef = doc(db, 'users', HOUSEHOLD_ID, 'savingsGoals', goalId);
            await updateDoc(goalRef, {
                currentBalance: increment(amount)
            });
            const action = amount > 0 ? "added" : "removed";
            showNotification(`€${Math.abs(amount).toLocaleString('de-DE')} ${action} from savings.`);
        } catch (error) {
            console.error("Error adjusting balance: ", error);
            alert("Error adjusting balance: " + error.message);
        }
    };

    const filteredGoals = savingsGoals.filter(g => g.person === personFilter);
    const totalSavings = filteredGoals.reduce((sum, g) => sum + (g.currentBalance || 0), 0);
    const formatCurrency = (value) => `€${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const handleExportCSV = () => {
        const headers = ['Savings Goal', 'Person', 'Current Balance'];
        const rows = filteredGoals.map(goal => {
            const description = `"${(goal.description || '').replace(/"/g, '""')}"`;
            const balance = (goal.currentBalance || 0).toString().replace('.', ',');
            return [description, goal.person, balance];
        });
        rows.push(['"Total"', '', totalSavings.toString().replace('.', ',')]);
        
        const csvContent = [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `savings_summary_${personFilter}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="page-content">
            <div className="tabs">
                {householdMembers.map(member => (
                    <button key={member} className={personFilter === member ? 'active' : ''} onClick={() => setPersonFilter(member)}>
                        {member}'s Savings
                    </button>
                ))}
            </div>
            
            <div className="export-section">
                <button className="export-btn" onClick={handleExportCSV}>📤 Export as CSV</button>
            </div>
            
            {loading ? <p>Loading...</p> : (
                <ul className="savings-list">
                    {filteredGoals.map(goal => {
                        const colors = PERSON_COLORS[goal.person] || {};
                        return (
                            <li key={goal.id} className="savings-row" style={{ borderLeftColor: colors.primary, backgroundColor: colors.background }}>
                                <div className="savings-info">
                                    <span className="savings-description">{goal.description}</span>
                                    <span className="savings-balance">{formatCurrency(goal.currentBalance || 0)}</span>
                                </div>
                                <BalanceControl goalId={goal.id} onAdjust={handleBalanceAdjust} />
                            </li>
                        );
                    })}
                </ul>
            )}

            <div className="summary-total">
                <strong>{personFilter}'s Total Savings: {formatCurrency(totalSavings)}</strong>
            </div>
        </div>
    );
};

export default SavingsPage;