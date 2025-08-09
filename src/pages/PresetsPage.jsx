import React, { useState, useEffect } from 'react';
import { db } from '../firebase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTransactions } from '../contexts/TransactionContext.jsx';
import { collection, addDoc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { householdMembers, PERSON_COLORS, ADMIN_EMAIL, HOUSEHOLD_ID } from '../config.js';

const PresetsPage = () => {
    const { user } = useAuth();
    const { transactions } = useTransactions();
    const [presets, setPresets] = useState([]);
    const [loading, setLoading] = useState(true);
    const loggedInPerson = user.email === ADMIN_EMAIL ? 'Nicky' : 'Alex';
    const [personFilter, setPersonFilter] = useState(loggedInPerson);
    const [variableAmounts, setVariableAmounts] = useState({});

    useEffect(() => { setPersonFilter(loggedInPerson); }, [loggedInPerson]);
    useEffect(() => { if (user) { const q = query(collection(db, 'users', HOUSEHOLD_ID, 'presets'), orderBy('description')); const unsubscribe = onSnapshot(q, (snapshot) => { setPresets(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))); setLoading(false); }, (error) => { console.error("Error fetching presets:", error); setLoading(false); }); return () => unsubscribe(); } }, [user]);
    const handleLogPreset = async (preset) => { const presetAmount = preset.isVariable ? parseFloat(variableAmounts[preset.id] || 0) : preset.amount; if (presetAmount <= 0) { alert("Please enter a valid amount."); return; } try { await addDoc(collection(db, 'users', HOUSEHOLD_ID, 'transactions'), { description: preset.description, amount: presetAmount, type: preset.type, person: preset.person, category: preset.category, createdAt: new Date(), }); if (preset.isVariable) { handleVariableAmountChange(preset.id, ''); } } catch (error) { console.error("Error logging transaction: ", error); alert("Firebase Error: " + error.message); } };
    const handleVariableAmountChange = (id, value) => { setVariableAmounts(prev => ({ ...prev, [id]: value })); };
    const now = new Date();
    const currentMonthTransactions = transactions.filter(t => { const d = t.createdAt.toDate(); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); });
    const checklistItems = presets.filter(preset => preset.person === personFilter).map(preset => { const isLogged = currentMonthTransactions.some(t => t.description === preset.description && t.person === preset.person); return { ...preset, isLogged }; });

    return (
        <div className="page-content">
            <div className="tabs">{householdMembers.map(member => (<button key={member} className={personFilter === member ? 'active' : ''} onClick={() => setPersonFilter(member)}>{member}'s Checklist</button>))}</div>
            {loading ? <p>Loading...</p> : (<ul className="checklist">{checklistItems.map(item => { const colors = PERSON_COLORS[item.person] || {}; const itemStyle = { borderLeftColor: colors.primary, backgroundColor: item.isLogged ? colors.backgroundLogged : '#ffffff', }; return (<li key={item.id} className={item.isLogged ? 'logged' : ''} style={itemStyle}><div className="preset-info"><span className="preset-description">{item.description}</span></div><div className="checklist-action">{item.isLogged ? (<span style={{ color: '#008000' }}>✔️ Logged</span>) : item.isVariable ? (<div className="variable-input-group"><span>€</span><input type="number" placeholder="0.00" value={variableAmounts[item.id] || ''} onChange={(e) => handleVariableAmountChange(item.id, e.target.value)} /><button style={{backgroundColor: colors.primary}} onClick={() => handleLogPreset(item)}>Log</button></div>) : (<button style={{backgroundColor: colors.primary}} onClick={() => handleLogPreset(item)}>Log €{item.amount.toLocaleString('de-DE', {minimumFractionDigits: 2})}</button>)}</div></li>);})}</ul>)}
        </div>
    );
};
export default PresetsPage;