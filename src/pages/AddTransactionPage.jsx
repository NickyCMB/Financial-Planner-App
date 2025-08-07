import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { householdMembers, incomeCategories, expenseCategories, USER_MAP } from '../config.js';

const AddTransactionPage = () => {
    const { user } = useAuth();
    const loggedInPerson = USER_MAP[user.email];
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('expense');
    const [person, setPerson] = useState(loggedInPerson || householdMembers[0]);
    const [category, setCategory] = useState(expenseCategories[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => { if (type === 'income') { setCategory(incomeCategories[0]); } else { setCategory(expenseCategories[0]); } }, [type]);
    const handleAddTransaction = async (e) => { e.preventDefault(); if (!user || !description || !amount) { alert('Bitte Beschreibung und Betrag eingeben.'); return; } setIsSubmitting(true); try { await addDoc(collection(db, 'users', user.uid, 'transactions'), { description, amount: parseFloat(amount.replace(',', '.')), type, person, category, createdAt: new Date() }); setDescription(''); setAmount(''); } catch (error) { console.error("Error adding document: ", error); alert("Fehler beim Hinzufügen der Transaktion."); } finally { setIsSubmitting(false); } };
    
    return (
        <div className="page-content">
            <form className="transaction-form" onSubmit={handleAddTransaction}>
                <div className="form-control"><label htmlFor="description">Beschreibung</label><input type="text" id="description" placeholder="z.B. Miete, Gehalt..." value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                <div className="form-control"><label htmlFor="amount">Betrag (€)</label><input type="text" id="amount" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
                <div className="custom-select-wrapper"><label htmlFor="type">Typ</label><select id="type" value={type} onChange={(e) => setType(e.target.value)}><option value="expense">Ausgabe</option><option value="income">Einnahme</option></select></div>
                <div className="custom-select-wrapper"><label htmlFor="person">Person</label><select id="person" value={person} onChange={(e) => setPerson(e.target.value)}>{householdMembers.map(member => (<option key={member} value={member}>{member}</option>))}</select></div>
                <div className="custom-select-wrapper"><label htmlFor="category">Category</label><select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>{type === 'income' ? incomeCategories.map(cat => <option key={cat} value={cat}>{cat}</option>) : expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Adding...' : 'Hinzufügen'}</button>
            </form>
        </div>
    );
};
export default AddTransactionPage;