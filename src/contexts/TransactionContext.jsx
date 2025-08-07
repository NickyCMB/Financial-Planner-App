import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const TransactionContext = createContext();

export const useTransactions = () => {
  return useContext(TransactionContext);
};

export const TransactionProvider = ({ children }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If there's no user, we clear transactions and stop.
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // This is the correct path to the user's private transactions.
    const collectionRef = collection(db, 'users', user.uid, 'transactions');
    const q = query(collectionRef, orderBy('createdAt', 'desc'));

    // onSnapshot provides real-time updates from Firestore.
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const transactionsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTransactions(transactionsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching transactions: ", error);
      setLoading(false);
    });

    // Clean up the listener when the component unmounts or the user logs out.
    return () => unsubscribe();
  }, [user]); // This effect re-runs whenever the user changes.

  return (
    <TransactionContext.Provider value={{ transactions, loading }}>
      {children}
    </TransactionContext.Provider>
  );
};