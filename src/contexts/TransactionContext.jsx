import React, { createContext, useState, useEffect, useContext } from 'react';
import { db } from '../firebase.js';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useAuth } from './AuthContext.jsx';
import { HOUSEHOLD_ID } from '../config.js';

const TransactionContext = createContext();
export const useTransactions = () => useContext(TransactionContext);

export const TransactionProvider = ({ children }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && HOUSEHOLD_ID !== "PASTE_YOUR_USER_UID_HERE") {
      setLoading(true);
      const collectionRef = collection(db, 'users', HOUSEHOLD_ID, 'transactions');
      const q = query(collectionRef, orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setTransactions(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, createdAt: doc.data().createdAt })));
        setLoading(false);
      }, (error) => { console.error("Firestore listener error:", error); setLoading(false); });
      return () => unsubscribe();
    } else {
      setTransactions([]);
      setLoading(false);
    }
  }, [user]);

  const value = { transactions, loading };
  return (<TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>);
};