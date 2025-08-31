// src/contexts/BalanceContext.jsx

import React, { createContext, useState, useEffect, useContext } from 'react';
import { useTransactions } from './TransactionContext.jsx';
import { householdMembers } from '../config.js';

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
      
      const transactionsByMonth = transactions.reduce((acc, t) => {
        const month = t.createdAt.toDate().toISOString().slice(0, 7);
        if (!acc[month]) acc[month] = [];
        acc[month].push(t);
        return acc;
      }, {});

      const sortedMonths = Object.keys(transactionsByMonth).sort();
      const summaries = {};
      
      // Keep track of the last balance for each person and the household
      const lastBalances = {};
      householdMembers.forEach(member => { lastBalances[member] = 0; });
      lastBalances['Household'] = 0;

      sortedMonths.forEach(month => {
        summaries[month] = {};
        
        // Calculate for each individual member
        householdMembers.forEach(member => {
          const openingBalance = lastBalances[member];
          const memberTransactions = transactionsByMonth[month].filter(t => t.person === member);
          
          const totalIncome = memberTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
          const totalExpense = memberTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
          const closingBalance = openingBalance + totalIncome - totalExpense;
          
          summaries[month][member] = { openingBalance, totalIncome, totalExpense, closingBalance };
          lastBalances[member] = closingBalance;
        });

        // Calculate for the whole household
        const householdOpening = lastBalances['Household'];
        const householdIncome = transactionsByMonth[month].filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const householdExpense = transactionsByMonth[month].filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const householdClosing = householdOpening + householdIncome - householdExpense;
        
        summaries[month]['Household'] = { openingBalance: householdOpening, totalIncome: householdIncome, totalExpense: householdExpense, closingBalance: householdClosing };
        lastBalances['Household'] = householdClosing;
      });

      setMonthlySummaries(summaries);
      setLoading(false);
    } else {
        setMonthlySummaries({});
        setLoading(false);
    }
  }, [transactions]);

  const value = { monthlySummaries, isBalanceLoading: loading };

  return (
    <BalanceContext.Provider value={value}>
      {children}
    </BalanceContext.Provider>
  );
};