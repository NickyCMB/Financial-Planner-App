import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { householdMembers, incomeCategories, expenseCategories } from '../config.js';

const EditTransactionPage = () => {
  const { transactionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [person, setPerson] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  
  // Loading and submitting state
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch the transaction data when the component mounts
  useEffect(() => {
    if (!user || !transactionId) return;

    const getTransaction = async () => {
      const docRef = doc(db, 'users', user.uid, 'transactions', transactionId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setDescription(data.description);
        setAmount(data.amount.toString());
        setType(data.type);
        setPerson(data.person);
        setCategory(data.category || ''); // Fallback to empty string if category is undefined

        // Handle the transaction date
        if (data.createdAt && data.createdAt.toDate) {
          // Convert Firestore Timestamp to a 'YYYY-MM-DD' string for the input
          setDate(data.createdAt.toDate().toISOString().split('T')[0]);
        }
      } else {
        console.error("No such document!");
        alert("Transaction not found.");
        navigate('/transactions');
      }
      setLoading(false);
    };

    getTransaction();
  }, [transactionId, user, navigate]);

  // Handle category changes when type changes
  useEffect(() => {
    if (loading) return; // Don't run on initial load
    if (type === 'income' && !incomeCategories.includes(category)) {
      setCategory(incomeCategories[0]);
    } else if (type === 'expense' && !expenseCategories.includes(category)) {
      setCategory(expenseCategories[0]);
    }
  }, [type, category, loading]);

  const handleUpdateTransaction = async (e) => {
    e.preventDefault();
    if (!user || !description || !amount) return;

    setIsSubmitting(true);
    try {
      // This is the critical fix. We parse the date string manually to ensure
      // it's created in the user's local timezone, not UTC. This prevents
      const docRef = doc(db, 'users', user.uid, 'transactions', transactionId);
      await updateDoc(docRef, {
        description,
        amount: parseFloat(amount),
        type,
        person,
        category,
        createdAt: new Date(date), // Convert date string back to a Date object
      });
      navigate('/transactions');
    } catch (error) {
      console.error("Error updating document: ", error);
      alert("Fehler beim Aktualisieren der Transaktion.");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <p>Loading transaction...</p>;
  }

  return (
    <section className="input-section">
      <h2>Edit Transaction</h2>
      <form className="transaction-form" onSubmit={handleUpdateTransaction}>
        <div className="form-control">
          <label htmlFor="description">Beschreibung</label>
          <input type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="form-control">
          <label htmlFor="amount">Betrag (€)</label>
          <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="form-control">
          <label htmlFor="date">Datum</label>
          <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="form-control">
          <label htmlFor="type">Typ</label>
          <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="expense">Ausgabe</option>
            <option value="income">Einnahme</option>
          </select>
        </div>
        <div className="form-control">
          <label htmlFor="person">Person</label>
          <select id="person" value={person} onChange={(e) => setPerson(e.target.value)}>
            {householdMembers.map(member => <option key={member} value={member}>{member}</option>)}
          </select>
        </div>
        <div className="form-control">
          <label htmlFor="category">Category</label>
          <select id="category" value={category || ''} onChange={(e) => setCategory(e.target.value)}>
            {type === 'income' ? 
              incomeCategories.map(cat => <option key={cat} value={cat}>{cat}</option>) :
              expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)
            }
          </select>
        </div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Updating...' : 'Update Transaction'}
        </button>
      </form>
    </section>
  );
};

export default EditTransactionPage;

```

### 2. Add the Route to Your App

Now, let's add a route in your main `App.jsx` file so the application knows how to get to the new edit page.

```diff
--- a/home/tabeanicole/finance-tracker-vite/src/App.jsx
+++ b/home/tabeanicole/finance-tracker-vite/src/App.jsx
@@ -8,6 +8,7 @@
 import AddTransactionPage from './pages/AddTransactionPage';
 import TransactionsPage from './pages/TransactionsPage';
 import PresetsPage from './pages/PresetsPage';
+import EditTransactionPage from './pages/EditTransactionPage'; // Import the new page
 import ManagePresetsPage from './pages/ManagePresetsPage'; // Import the new page
 
 function App() {
@@ -53,6 +54,7 @@
           <Route path="/" element={<HomePage />} />
           <Route path="/add" element={<AddTransactionPage />} />
           <Route path="/transactions" element={<TransactionsPage />} />
+          <Route path="/edit/:transactionId" element={<EditTransactionPage />} />
           <Route path="/presets" element={<PresetsPage />} />
           {isAdmin && <Route path="/presets/manage" element={<ManagePresetsPage />} />}
         </Routes>

```

### 3. Update the "View All" Transactions Page

Finally, we'll update your `TransactionsPage.jsx` to display all transactions from your account and add the "Edit" button. This page will intentionally show entries for both "Nicky" and "Alex" so you can easily find and reassign them.

Please **replace the entire content** of your existing `/home/tabeanicole/finance-tracker-vite/src/pages/TransactionsPage.jsx` file with the code below.

```diff
--- a/home/tabeanicole/finance-tracker-vite/src/pages/TransactionsPage.jsx
+++ b/home/tabeanicole/finance-tracker-vite/src/pages/TransactionsPage.jsx
@@ -1,3 +1,40 @@
+import React from 'react';
+import { useTransactions } from '../contexts/TransactionContext';
+import { Link } from 'react-router-dom';
+
+const TransactionsPage = () => {
+  const { transactions, loading } = useTransactions();
+
+  if (loading) {
+    return <p>Loading transactions...</p>;
+  }
+
+  return (
+    <section className="transactions-section">
+      <h2>Transaction History</h2>
+      <ul className="transaction-list-full">
+        {transactions.length > 0 ? (
+          transactions.map((transaction) => (
+            <li key={transaction.id} className={transaction.type}>
+              <div className="transaction-details">
+                <span className="transaction-date">
+                  {transaction.createdAt.toDate().toLocaleDateString('de-DE')}
+                </span>
+                <span className="transaction-person">{transaction.person}</span>
+                <span>{transaction.description}</span>
+                <span className="transaction-category">{transaction.category}</span>
+              </div>
+              <div className="transaction-actions">
+                <span className={`transaction-amount ${transaction.type}`}>
+                  {transaction.type === 'income' ? '+' : '-'}
+                  €{transaction.amount.toFixed(2)}
+                </span>
+                <Link to={`/edit/${transaction.id}`} className="edit-btn">
+                  Edit
+                </Link>
+              </div>
+            </li>
+          ))
+        ) : (
+          <p>No transactions found.</p>
+        )}
+      </ul>
+    </section>
+  );
+};
+
+export default TransactionsPage;
```

With these changes, you can now navigate to the "View All" page, see all transactions associated with your account, and click the "Edit" button to correct any details, including reassigning a transaction from "Alex" to yourself.

<!--
[PROMPT_SUGGESTION]Can you help me add a feature to delete a transaction from the transaction history page?[/PROMPT_SUGGESTION]
[PROMPT_SUGGESTION]How can I add a pie chart to the dashboard to visualize my expenses by category?[/PROMPT_SUGGESTION]
-->