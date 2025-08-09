import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { householdMembers, incomeCategories, expenseCategories, HOUSEHOLD_ID } from '../config.js';

const EditTransactionPage = () => {
  const { transactionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [person, setPerson] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { if (!user || !transactionId) return; const getTransaction = async () => { const docRef = doc(db, 'users', HOUSEHOLD_ID, 'transactions', transactionId); const docSnap = await getDoc(docRef); if (docSnap.exists()) { const data = docSnap.data(); setDescription(data.description); setAmount(data.amount.toString().replace('.', ',')); setType(data.type); setPerson(data.person); setCategory(data.category || ''); if (data.createdAt && data.createdAt.toDate) { setDate(data.createdAt.toDate().toISOString().split('T')[0]); } } else { alert("Transaction not found."); navigate('/transactions'); } setLoading(false); }; getTransaction(); }, [transactionId, user, navigate]);
  useEffect(() => { if (loading) return; if (type === 'income' && !incomeCategories.includes(category)) { setCategory(incomeCategories[0]); } else if (type === 'expense' && !expenseCategories.includes(category)) { setCategory(expenseCategories[0]); } }, [type, category, loading]);
  const handleUpdateTransaction = async (e) => { e.preventDefault(); if (!user || !description || !amount) return; setIsSubmitting(true); try { const docRef = doc(db, 'users', HOUSEHOLD_ID, 'transactions', transactionId); await updateDoc(docRef, { description, amount: parseFloat(amount.replace(',', '.')), type, person, category, createdAt: new Date(date), }); navigate('/transactions'); } catch (error) { console.error("Error updating document: ", error); alert("Fehler beim Aktualisieren der Transaktion."); setIsSubmitting(false); } };

  if (loading) return <div className="page-content"><p>Loading transaction...</p></div>;
  return (
    <div className="page-content">
      <form className="transaction-form" onSubmit={handleUpdateTransaction}>
        <div className="form-control"><label htmlFor="description">Beschreibung</label><input type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        <div className="form-control"><label htmlFor="amount">Betrag (€)</label><input type="text" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        <div className="form-control"><label htmlFor="date">Datum</label><input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} required /></div>
        <div className="form-control"><label htmlFor="type">Typ</label><div className="custom-select-wrapper"><select id="type" value={type} onChange={(e) => setType(e.target.value)}><option value="expense">Ausgabe</option><option value="income">Einnahme</option></select></div></div>
        <div className="form-control"><label htmlFor="person">Person</label><div className="custom-select-wrapper"><select id="person" value={person} onChange={(e) => setPerson(e.target.value)}>{householdMembers.map(member => <option key={member} value={member}>{member}</option>)}</select></div></div>
        <div className="form-control"><label htmlFor="category">Category</label><div className="custom-select-wrapper"><select id="category" value={category || ''} onChange={(e) => setCategory(e.target.value)}>{type === 'income' ? incomeCategories.map(cat => <option key={cat} value={cat}>{cat}</option>) : expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div></div>
        <div className="form-buttons"><button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Update Transaction'}</button><button type="button" className="cancel-btn" onClick={() => navigate('/transactions')}>Cancel</button></div>
      </form>
    </div>
  );
};
export default EditTransactionPage;