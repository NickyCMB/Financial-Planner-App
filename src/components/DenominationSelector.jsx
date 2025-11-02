import React, { useEffect, useState } from 'react';
import { denominations, BILL_COLORS } from '../config.js';

const DenominationSelector = ({ onTotalChange, onDenominationsChange, initialDenominations }) => {
  
  const getInitialState = () => {
    if (initialDenominations) return initialDenominations;
    const state = {};
    denominations.forEach(bill => { state[bill] = 0; });
    return state;
  };
  
  const [counts, setCounts] = useState(getInitialState);

  const updateCount = (bill, change) => {
    setCounts(prevCounts => {
      const newCount = Math.max(0, (prevCounts[bill] || 0) + change);
      return { ...prevCounts, [bill]: newCount };
    });
  };

  useEffect(() => {
    const total = denominations.reduce((sum, bill) => {
      return sum + (counts[bill] || 0) * bill;
    }, 0);
    
    onTotalChange(total.toString().replace('.', ','));
    onDenominationsChange(counts);
  }, [counts, onTotalChange, onDenominationsChange]);

  return (
    <div className="denomination-selector">
      {denominations.map(bill => (
        <div key={bill} className="denomination-row">
          {/* Added 'btn-minus' class and emoji */}
          <button type="button" className="denomination-btn btn-minus" onClick={() => updateCount(bill, -1)}>
            ➖
          </button>
          
          <div className="bill-rectangle" style={{ backgroundColor: BILL_COLORS[bill] }}>
            <span className="bill-amount">€{bill}</span>
          </div>

          {/* Added 'btn-plus' class and emoji */}
          <button type="button" className="denomination-btn btn-plus" onClick={() => updateCount(bill, 1)}>
            ➕
          </button>
          <span className="denomination-count">
            x {counts[bill] || 0}
          </span>
        </div>
      ))}
    </div>
  );
};

export default DenominationSelector;