import React, { useState, useEffect } from 'react';
import { db } from '../firebase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNotification } from '../contexts/NotificationContext.jsx';
import { collection, addDoc } from 'firebase/firestore';
import { householdMembers, incomeCategories, expenseCategories, ADMIN_EMAIL, HOUSEHOLD_ID } from '../config.js';

const AddTransactionPage = () => {
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const loggedInPerson = user.email === ADMIN_EMAIL ? 'Nicky' : 'Alex';
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('expense');
    const [person, setPerson] = useState(loggedInPerson);
    const [category, setCategory] = useState(expenseCategories[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => { if (type === 'income') { setCategory(incomeCategories[0]); } else { setCategory(expenseCategories[0]); } }, [type]);
    const handleAddTransaction = async (e) => { e.preventDefault(); if (!user || !description || !amount) { alert('Bitte Beschreibung und Betrag eingeben.'); return; } setIsSubmitting(true); try { await addDoc(collection(db, 'users', HOUSEHOLD_ID, 'transactions'), { description, amount: parseFloat(amount.replace(',', '.')), type, person, category, createdAt: new Date() }); setDescription(''); setAmount(''); showNotification("Transaktion wurde erfolgreich hinzugefügt"); } catch (error) { console.error("Error adding document: ", error); alert("Firebase Error: " + error.message); } finally { setIsSubmitting(false); } };

    return (
        <div className="page-content">
            <form className="transaction-form" onSubmit={handleAddTransaction}>
                <div className="form-control"><label htmlFor="description">Beschreibung</label><input type="text" id="description" placeholder="z.B. Miete, Gehalt..." value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                <div className="form-control"><label htmlFor="amount">Betrag (€)</label><input type="text" id="amount" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
                <div className="form-control"><label htmlFor="type">Typ</label><div className="custom-select-wrapper"><select id="type" value={type} onChange={(e) => setType(e.target.value)}><option value="expense">Ausgabe</option><option value="income">Einnahme</option></select></div></div>
                <div className="form-control"><label htmlFor="person">Person</label><div className="custom-select-wrapper"><select id="person" value={person} onChange={(e) => setPerson(e.target.value)}>{householdMembers.map(member => (<option key={member} value={member}>{member}</option>))}</select></div></div>
                <div className="form-control"><label htmlFor="category">Category</label><div className="custom-select-wrapper"><select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>{type === 'income' ? incomeCategories.map(cat => <option key={cat} value={cat}>{cat}</option>) : expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div></div>
                <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Adding...' : 'Hinzufügen'}</button>
            </form>
        </div>
    );
};
export default AddTransactionPage;