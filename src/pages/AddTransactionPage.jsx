import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { collection, addDoc } from 'firebase/firestore';
// IMPORTANT: Notice that we imported 'commonDescriptions' here
import { householdMembers, incomeCategories, expenseCategories, HOUSEHOLD_ID, paymentMethods, commonDescriptions } from '../config.js';
import DenominationSelector from '../components/DenominationSelector.jsx';

const AddTransactionPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- NEW: State for Description Mode ---
  const [description, setDescription] = useState('');
  const [descriptionMode, setDescriptionMode] = useState('select'); // tracks if we use the dropdown or text box

  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [person, setPerson] = useState(householdMembers[0] || '');
  const [category, setCategory] = useState(expenseCategories[0] || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0] || '');
  const [denominationsData, setDenominationsData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Logic to check if the denomination selector should be visible
  const isCashWithdrawal = type === 'expense' && paymentMethod === 'Cash Withdrawal';

  // Handle category changes when type changes
  useEffect(() => {
    if (type === 'income' && !incomeCategories.includes(category)) {
      setCategory(incomeCategories[0]);
    } else if (type === 'expense' && !expenseCategories.includes(category)) {
      setCategory(expenseCategories[0]);
    }
  }, [type, category]);

  // Clear denominations if no longer a cash withdrawal
  useEffect(() => {
    if (!isCashWithdrawal) {
      setDenominationsData(null);
    }
  }, [isCashWithdrawal]);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!user || !description || !amount) return;

    setIsSubmitting(true);
    try {
      // Create the date at 12:00:00 (Noon) to avoid timezone shifts!
      const dateObj = new Date(date);
      dateObj.setHours(12, 0, 0, 0); 

      const newTransaction = {
        description, // Saves whatever is currently in the state (from dropdown or text input)
        amount: parseFloat(amount.replace(',', '.')),
        type,
        person,
        category,
        createdAt: dateObj, 
      };

      // Add payment method and denominations to the new transaction
      if (type === 'expense') {
        newTransaction.paymentMethod = paymentMethod;
        if (isCashWithdrawal && denominationsData) {
            newTransaction.denominations = denominationsData;
        } else {
            newTransaction.denominations = null;
        }
      } else {
        newTransaction.paymentMethod = null;
        newTransaction.denominations = null;
      }

      await addDoc(collection(db, 'users', HOUSEHOLD_ID, 'transactions'), newTransaction);
      navigate('/transactions');
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Fehler beim Hinzufügen der Transaktion.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-content">
      <form className="transaction-form" onSubmit={handleAddTransaction}>
        
        {/* --- NEW HYBRID DESCRIPTION INPUT --- */}
        <div className="form-control">
            <label htmlFor="descriptionSelect">Beschreibung</label>
            <div className="custom-select-wrapper" style={{ marginBottom: descriptionMode === 'manual' ? '10px' : '0' }}>
                <select 
                    id="descriptionSelect" 
                    value={descriptionMode === 'select' ? description : 'manual'} 
                    onChange={(e) => {
                        if (e.target.value === 'manual') {
                            setDescriptionMode('manual');
                            setDescription(''); // Clear the state so you can type a fresh word
                        } else {
                            setDescriptionMode('select');
                            setDescription(e.target.value);
                        }
                    }}
                >
                    <option value="" disabled>Select a description...</option>
                    {commonDescriptions.map(desc => (
                        <option key={desc} value={desc}>{desc}</option>
                    ))}
                    <option value="manual">Enter description manually...</option>
                </select>
            </div>
            
            {/* This input ONLY shows up if you select "Enter description manually..." */}
            {descriptionMode === 'manual' && (
                <input 
                    type="text" 
                    id="descriptionManual" 
                    placeholder="Type your custom description here..."
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    required 
                />
            )}
        </div>
        {/* --- END NEW HYBRID INPUT --- */}

        <div className="form-control"><label htmlFor="type">Typ</label><div className="custom-select-wrapper"><select id="type" value={type} onChange={(e) => setType(e.target.value)}><option value="expense">Ausgabe</option><option value="income">Einnahme</option></select></div></div>
        {type === 'expense' && (<div className="form-control"><label htmlFor="paymentMethod">Payment Method</label><div className="custom-select-wrapper"><select id="paymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>{paymentMethods.map(method => (<option key={method} value={method}>{method}</option>))}</select></div></div>)}
        <div className="form-control"><label htmlFor="amount">Betrag (€)</label><input type="text" id="amount" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} readOnly={isCashWithdrawal} style={isCashWithdrawal ? { backgroundColor: '#f0f0f0' } : {}} required/></div>
        {isCashWithdrawal && (<div className="form-control"><label>Denominations</label><DenominationSelector onTotalChange={setAmount} onDenominationsChange={setDenominationsData} initialDenominations={denominationsData}/></div>)}
        <div className="form-control"><label htmlFor="date">Datum</label><input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} required /></div>
        <div className="form-control"><label htmlFor="person">Person</label><div className="custom-select-wrapper"><select id="person" value={person} onChange={(e) => setPerson(e.target.value)}>{householdMembers.map(member => <option key={member} value={member}>{member}</option>)}</select></div></div>
        <div className="form-control"><label htmlFor="category">Category</label><div className="custom-select-wrapper"><select id="category" value={category || ''} onChange={(e) => setCategory(e.target.value)}>{type === 'income' ? incomeCategories.map(cat => <option key={cat} value={cat}>{cat}</option>) : expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div></div>
        <div className="form-buttons"><button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Adding...' : 'Add Transaction'}</button><button type="button" className="cancel-btn" onClick={() => navigate('/transactions')}>Cancel</button></div>
      </form>
    </div>
  );
};
export default AddTransactionPage;