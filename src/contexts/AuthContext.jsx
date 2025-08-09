import React, { createContext, useState, useEffect, useContext } from 'react';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import '../firebase.js';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const auth = getAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const signInWithGoogle = async () => { try { const provider = new GoogleAuthProvider(); await signInWithPopup(auth, provider); } catch (error) { console.error("Error signing in with Google: ", error); } };
  const signOutUser = async () => { try { await signOut(auth); } catch (error) { console.error("Error signing out: ", error); } };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, [auth]);

  const value = { user, loading, signInWithGoogle, signOutUser };
  return (<AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>);
};