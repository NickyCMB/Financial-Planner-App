import React, { createContext, useContext, useState, useCallback } from 'react';

// 1. Create the Context
const ToastContext = createContext();

// 2. Custom Hook to easily use the Toast anywhere
export const useToast = () => {
    return useContext(ToastContext);
};

// 3. The Provider Component
export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState(null); // Will hold { message, type }

    // Function to show the toast, defaulting to an 'info' type
    const showToast = useCallback((message, type = 'info') => {
        setToast({ message, type });
        
        // Automatically hide the toast after 3 seconds (3000 milliseconds)
        setTimeout(() => {
            setToast(null);
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            
            {/* If a toast exists in state, render the UI pop-up */}
            {toast && (
                <div className={`toast-notification toast-${toast.type}`}>
                    {toast.message}
                </div>
            )}
        </ToastContext.Provider>
    );
};