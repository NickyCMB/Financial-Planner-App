// src/contexts/BalanceContext.jsx

import React, { createContext, useState, useEffect, useContext } from 'react';
import { useTransactions } from './TransactionContext.jsx';

const BalanceContext = createContext();

export const useBalance = () => {
  return useContext(BalanceContext);
};

export const BalanceProvider = ({ children }) => {
  const { transactions } = useTransactions();
  const [monthlySummaries, setMonthlySummaries] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (transactions.length > 0) {
      setLoading(true);
      
      // 1. Group transactions by month (e.g., "2025-08")
      const transactionsByMonth = transactions.reduce((acc, t) => {
        const month = t.createdAt.toDate().toISOString().slice(0, 7); // "YYYY-MM"
        if (!acc[month]) {
          acc[month] = [];
        }
        acc[month].push(t);
        return acc;
      }, {});

      // 2. Get a sorted list of months
      const sortedMonths = Object.keys(transactionsByMonth).sort();

      // 3. Calculate summaries for each month in order
      let lastMonthBalance = 0;
      const summaries = {};
      
      sortedMonths.forEach(month => {
        const openingBalance = lastMonthBalance;
        const monthTransactions = transactionsByMonth[month];
        
        const totalIncome = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
          
        const totalExpense = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
          
        const closingBalance = openingBalance + totalIncome - totalExpense;
        
        summaries[month] = {
          openingBalance,
          totalIncome,
          totalExpense,
          closingBalance,
        };
        
        // The closing balance of this month is the opening balance for the next
        lastMonthBalance = closingBalance;
      });

      setMonthlySummaries(summaries);
      setLoading(false);
    } else {
        setMonthlySummaries({});
        setLoading(false);
    }
  }, [transactions]); // Re-run this entire calculation whenever transactions change

  const value = {
    monthlySummaries,
    isBalanceLoading: loading,
  };

  return (
    <BalanceContext.Provider value={value}>
      {children}
    </BalanceContext.Provider>
  );
};