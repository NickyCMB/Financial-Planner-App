import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
// IMPORTANT: Notice that we imported 'commonDescriptions' here
import { householdMembers, incomeCategories, expenseCategories, HOUSEHOLD_ID, paymentMethods, commonDescriptions } from '../config.js';
import DenominationSelector from '../components/DenominationSelector.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

const EditTransactionPage = () => {
  const { transactionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  // --- NEW: State for Description Mode ---
  const [description, setDescription] = useState('');
  const [descriptionMode, setDescriptionMode] = useState('select'); // tracks if we use the dropdown or text box
  
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [person, setPerson] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0]);
  const [denominationsData, setDenominationsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCashWithdrawal = type === 'expense' && paymentMethod === 'Cash Withdrawal';

  useEffect(() => {
    if (!user || !transactionId) return;
    const getTransaction = async () => {
      const docRef = doc(db, 'users', HOUSEHOLD_ID, 'transactions', transactionId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // --- NEW LOGIC: Determine if the saved description is a preset or custom ---
        if (commonDescriptions.includes(data.description)) {
            setDescriptionMode('select');
        } else {
            // If the word isn't in our config list, it must be a custom entry
            setDescriptionMode('manual');
        }
        setDescription(data.description);
        
        setAmount(data.amount.toString().replace('.', ','));
        setType(data.type);
        setPerson(data.person);
        setCategory(data.category || '');
        setDate(data.createdAt.toDate().toISOString().split('T')[0]);
        setPaymentMethod(data.paymentMethod || paymentMethods[0]);
        setDenominationsData(data.denominations || null);
      } else {
        showToast("Transaction not found!", "error");
        navigate('/transactions');
      }
      setLoading(false);
    };
    getTransaction();
  }, [transactionId, user, navigate]);

  useEffect(() => { if (loading) return; if (type === 'income' && !incomeCategories.includes(category)) { setCategory(incomeCategories[0]); } else if (type === 'expense' && !expenseCategories.includes(category)) { setCategory(expenseCategories[0]); } }, [type, category, loading]);
  useEffect(() => { if (!isCashWithdrawal) { setDenominationsData(null); } }, [isCashWithdrawal]);

  const handleUpdateTransaction = async (e) => {
    e.preventDefault();
    if (!user || !description || !amount) return;

    setIsSubmitting(true);
    try {
      const docRef = doc(db, 'users', HOUSEHOLD_ID, 'transactions', transactionId);
      
      const dateObj = new Date(date);
      dateObj.setHours(12, 0, 0, 0); // Preserves our timezone fix

      const updatedTransaction = {
        description, // Saves whatever is currently in the state (from dropdown or text input)
        amount: parseFloat(amount.replace(',', '.')),
        type,
        person,
        category,
        createdAt: dateObj, 
      };

      if (type === 'expense') {
        updatedTransaction.paymentMethod = paymentMethod;
        if (isCashWithdrawal && denominationsData) {
            updatedTransaction.denominations = denominationsData;
        } else {
            updatedTransaction.denominations = null;
        }
      } else {
        updatedTransaction.paymentMethod = null;
        updatedTransaction.denominations = null;
      }

      await updateDoc(docRef, updatedTransaction);
      navigate('/transactions');
    } catch (error) {
      console.error("Error updating document: ", error);
      showToast("Fehler beim Aktualisieren der Transaktion.", "error");
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="page-content"><p>Loading transaction...</p></div>;

  return (
    <div className="page-content">
      <form className="transaction-form" onSubmit={handleUpdateTransaction}>
        
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
                            setDescription(''); // Clear the state so they can type a fresh word
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
            
            {/* This input ONLY shows up if they select "Enter description manually..." */}
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
        <div className="form-control"><label htmlFor="amount">Betrag (€)</label><input type="text" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} readOnly={isCashWithdrawal} style={isCashWithdrawal ? { backgroundColor: '#f0f0f0' } : {}}/></div>
        {isCashWithdrawal && (<div className="form-control"><label>Denominations</label><DenominationSelector onTotalChange={setAmount} onDenominationsChange={setDenominationsData} initialDenominations={denominationsData}/></div>)}
        <div className="form-control"><label htmlFor="date">Datum</label><input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} required /></div>
        <div className="form-control"><label htmlFor="person">Person</label><div className="custom-select-wrapper"><select id="person" value={person} onChange={(e) => setPerson(e.target.value)}>{householdMembers.map(member => <option key={member} value={member}>{member}</option>)}</select></div></div>
        <div className="form-control"><label htmlFor="category">Category</label><div className="custom-select-wrapper"><select id="category" value={category || ''} onChange={(e) => setCategory(e.target.value)}>{type === 'income' ? incomeCategories.map(cat => <option key={cat} value={cat}>{cat}</option>) : expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div></div>
        <div className="form-buttons"><button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Update Transaction'}</button><button type="button" className="cancel-btn" onClick={() => navigate('/transactions')}>Cancel</button></div>
      </form>
    </div>
  );
};
export default EditTransactionPage;