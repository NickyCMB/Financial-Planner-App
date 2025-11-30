import React, { useState, useEffect } from 'react';
import { db } from '../firebase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTransactions } from '../contexts/TransactionContext.jsx';
import { collection, addDoc, onSnapshot, orderBy, query, doc, updateDoc, increment } from 'firebase/firestore';
import { householdMembers, PERSON_COLORS, ADMIN_EMAIL, HOUSEHOLD_ID } from '../config.js';

const PresetsPage = () => {
    const { user } = useAuth();
    const { transactions } = useTransactions();
    const [presets, setPresets] = useState([]);
    const [loading, setLoading] = useState(true);
    const loggedInPerson = user.email === ADMIN_EMAIL ? 'Nicky' : 'Alex';
    const [personFilter, setPersonFilter] = useState(loggedInPerson);
    const [variableAmounts, setVariableAmounts] = useState({});

    // State for the toggle
    const [logForNextMonth, setLogForNextMonth] = useState(false);

    useEffect(() => { setPersonFilter(loggedInPerson); }, [loggedInPerson]);

    useEffect(() => {
        if (user) {
            const q = query(collection(db, 'users', HOUSEHOLD_ID, 'presets'), orderBy('description'));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                setPresets(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
                setLoading(false);
            }, (error) => {
                console.error("Error fetching presets:", error);
                setLoading(false);
            });
            return () => unsubscribe();
        }
    }, [user]);

    // --- LOGIC TO DETERMINE TARGET DATE ---
    const today = new Date();
    // If box is checked, target is next month. If not, target is today.
    const targetDate = logForNextMonth
        ? new Date(today.getFullYear(), today.getMonth() + 1, 1)
        : today;

    const handleLogPreset = async (preset) => {
        const presetAmount = preset.isVariable ? parseFloat(variableAmounts[preset.id] || 0) : preset.amount;
        if (presetAmount <= 0) { alert("Please enter a valid amount."); return; }

        try {
            const newTransaction = {
                description: preset.description, amount: presetAmount, type: preset.type,
                person: preset.person, category: preset.category,
                createdAt: targetDate, // Use the dynamic target date
            };

            if (preset.type === 'expense') {
                newTransaction.paymentMethod = preset.paymentMethod || null;
            }
            if (preset.denominations) {
                newTransaction.denominations = preset.denominations;
            }

            await addDoc(collection(db, 'users', HOUSEHOLD_ID, 'transactions'), newTransaction);

            if (preset.isSavings) {
                const savingsGoalRef = doc(db, 'users', HOUSEHOLD_ID, 'savingsGoals', preset.id);
                await updateDoc(savingsGoalRef, {
                    currentBalance: increment(presetAmount)
                });
            }

            if (preset.isVariable) { handleVariableAmountChange(preset.id, ''); }
        } catch (error) {
            console.error("Error logging transaction: ", error);
            alert("Firebase Error: " + error.message);
        }
    };

    const handleVariableAmountChange = (id, value) => { setVariableAmounts(prev => ({ ...prev, [id]: value })); };

    // --- FILTER TRANSACTIONS BY TARGET MONTH ---
    // We filter the transaction history to see what has been paid in the *Target Month*
    const transactionsForTargetMonth = transactions.filter(t => {
        const d = t.createdAt.toDate();
        return d.getFullYear() === targetDate.getFullYear() && d.getMonth() === targetDate.getMonth();
    });

    // Check presets against the *Target Month* transactions
    const checklistItems = presets.filter(preset => preset.person === personFilter).map(preset => {
        const isLogged = transactionsForTargetMonth.some(t => t.description === preset.description && t.person === preset.person);
        return { ...preset, isLogged };
    });

    return (
        <div className="page-content">
            <div className="tabs">
                {householdMembers.map(member => (
                    <button key={member} className={personFilter === member ? 'active' : ''} onClick={() => setPersonFilter(member)}>
                        {member}'s Checklist
                    </button>
                ))}
            </div>

            {/* TOGGLE SWITCH */}
            <div className="form-control checkbox-control" style={{ marginBottom: '20px', justifyContent: 'center', width: '100%' }}>
                <input
                    type="checkbox"
                    id="logNextMonth"
                    checked={logForNextMonth}
                    onChange={(e) => setLogForNextMonth(e.target.checked)}
                />
                <label htmlFor="logNextMonth">
                    {logForNextMonth
                        ? `Viewing/Logging for Next Month (${targetDate.toLocaleString('en-US', { month: 'long' })})`
                        : "Viewing/Logging for Current Month"}
                </label>
            </div>

            {loading ? <p>Loading...</p> : (
                <ul className="checklist">
                    {checklistItems.map(item => {
                        const colors = PERSON_COLORS[item.person] || {};
                        const itemStyle = { borderLeftColor: colors.primary, backgroundColor: item.isLogged ? colors.backgroundLogged : '#ffffff', };
                        const isCashPreset = (item.type === 'income' && item.category === 'Cash Deposit') || (item.type === 'expense' && item.paymentMethod === 'Cash Withdrawal');
                        return (
                            <li key={item.id} className={item.isLogged ? 'logged' : ''} style={itemStyle}>
                                <div className="preset-info">
                                    {isCashPreset && <span className="cash-icon-preset">💸</span>}
                                    <span className="preset-description">{item.description}</span>
                                </div>
                                <div className="checklist-action">{item.isLogged ? (<span style={{ color: '#008000' }}>✔️ Logged</span>) : item.isVariable ? (<div className="variable-input-group"><span>€</span><input type="number" placeholder="0.00" value={variableAmounts[item.id] || ''} onChange={(e) => handleVariableAmountChange(item.id, e.target.value)} /><button style={{ backgroundColor: colors.primary }} onClick={() => handleLogPreset(item)}>Log</button></div>) : (<button style={{ backgroundColor: colors.primary }} onClick={() => handleLogPreset(item)}>Log €{item.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</button>)}</div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};
export default PresetsPage;