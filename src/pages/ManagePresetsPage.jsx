import React, { useState, useEffect } from 'react';
import { db } from '../firebase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNotification } from '../contexts/NotificationContext.jsx';
import { collection, addDoc, onSnapshot, orderBy, query, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { householdMembers, incomeCategories, expenseCategories, HOUSEHOLD_ID, paymentMethods } from '../config.js';
import Modal from '../components/Modal.jsx';

const ManagePresetsPage = () => {
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const [presets, setPresets] = useState([]);
    const [personFilter, setPersonFilter] = useState(householdMembers[0]);
    
    // Form State
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('expense');
    const [person, setPerson] = useState(householdMembers[0]);
    const [category, setCategory] = useState(expenseCategories[0]);
    const [isVariable, setIsVariable] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0]);

    const [editingPresetId, setEditingPresetId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [presetToDelete, setPresetToDelete] = useState(null);

    // This correctly fetches presets from the shared HOUSEHOLD_ID
    useEffect(() => {
        if (user) {
            const q = query(collection(db, 'users', HOUSEHOLD_ID, 'presets'), orderBy('description'));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                setPresets(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
            });
            return () => unsubscribe();
        }
    }, [user]);

   const openDeleteModal = (id) => { setPresetToDelete(id); setIsModalOpen(true); };
    const handleDeletePreset = async () => { if (!presetToDelete) return; await deleteDoc(doc(db, 'users', HOUSEHOLD_ID, 'presets', presetToDelete)); setIsModalOpen(false); setPresetToDelete(null); showNotification("Preset deleted"); };
    useEffect(() => { if (type === 'income') setCategory(incomeCategories[0]); else setCategory(expenseCategories[0]); }, [type]);
    useEffect(() => { if (isVariable) setAmount(''); }, [isVariable]);

    const resetForm = () => { setDescription(''); setAmount(''); setType('expense'); setPerson(householdMembers[0]); setCategory(expenseCategories[0]); setIsVariable(false); setPaymentMethod(paymentMethods[0]); setEditingPresetId(null); };
    const handleEditClick = (preset) => { setEditingPresetId(preset.id); setDescription(preset.description); setAmount(preset.amount.toString()); setType(preset.type); setPerson(preset.person); setCategory(preset.category); setIsVariable(preset.isVariable); setPaymentMethod(preset.paymentMethod || paymentMethods[0]); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    
    // This function now correctly adds AND updates to the shared HOUSEHOLD_ID
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!description) { alert('Please enter a description.'); return; }
        const presetData = { description, amount: isVariable ? 0 : parseFloat(amount.replace(',', '.') || 0), type, person, category, isVariable, };
        if (type === 'expense') {
            presetData.paymentMethod = paymentMethod;
        } else {
            presetData.paymentMethod = null;
        }
        
        if (editingPresetId) {
            // Corrected path for updating
            await updateDoc(doc(db, 'users', HOUSEHOLD_ID, 'presets', editingPresetId), presetData); showNotification("Preset successfully updated");
        } else {
            // Corrected path for adding
            await addDoc(collection(db, 'users', HOUSEHOLD_ID, 'presets'), presetData); showNotification("Preset successfully added");
        }
        resetForm();
    };
    
    const filteredPresets = presets.filter(p => p.person === personFilter);

    return (
        <>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleDeletePreset} title="Voreingestellte Transaktion löschen">Möchtest du das Preset wirklich löschen</Modal>
            <div className="page-content">
                <section className="input-section">
                    <form className="transaction-form" onSubmit={handleFormSubmit}>
                        <div className="form-control"><label htmlFor="preset-description">Description</label><input id="preset-description" type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Rent, Netflix..." required/></div>
                        <div className="form-control"><label htmlFor="preset-amount">Default Amount (€)</label><input id="preset-amount" type="text" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isVariable} required={!isVariable}/></div>
                        <div className="form-control checkbox-control"><input id="preset-isVariable" type="checkbox" checked={isVariable} onChange={(e) => setIsVariable(e.target.checked)} /><label htmlFor="preset-isVariable">Variable Amount</label></div>
                        <div className="form-control"><label htmlFor="preset-type">Type</label><div className="custom-select-wrapper"><select id="preset-type" value={type} onChange={(e) => setType(e.target.value)}><option value="expense">Expense</option><option value="income">Income</option></select></div></div>
                        <div className="form-control"><label htmlFor="preset-person">Person</label><div className="custom-select-wrapper"><select id="preset-person" value={person} onChange={(e) => setPerson(e.target.value)}>{householdMembers.map(member => <option key={member} value={member}>{member}</option>)}</select></div></div>
                        <div className="form-control"><label htmlFor="preset-category">Category</label><div className="custom-select-wrapper"><select id="preset-category" value={category} onChange={(e) => setCategory(e.target.value)}>{type === 'income' ? incomeCategories.map(cat => <option key={cat} value={cat}>{cat}</option>) : expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div></div>
                        {type === 'expense' && (<div className="form-control"><label htmlFor="preset-paymentMethod">Payment Method</label><div className="custom-select-wrapper"><select id="preset-paymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>{paymentMethods.map(method => (<option key={method} value={method}>{method}</option>))}</select></div></div>)}
                        <div className="form-buttons"><button type="submit">{editingPresetId ? 'Update Preset' : 'Add Preset'}</button>{editingPresetId && <button type="button" className="cancel-btn" onClick={resetForm}>Cancel</button>}</div>
                    </form>
                </section>
                <section className="list-section">
                    <div className="filter-controls">
                        <div className="tabs">{householdMembers.map(member => (<button key={member} className={personFilter === member ? 'active' : ''} onClick={() => setPersonFilter(member)}>{member}'s Presets</button>))}</div>
                    </div>
                    <h3>Your Saved Presets</h3>
                    <ul className="presets-list">
                        {filteredPresets.map(preset => {
                            // NEW: Logic to check if the preset is a cash transaction
                            const isCashPreset = 
                                (preset.type === 'income' && preset.category === 'Cash Deposit') || 
                                (preset.type === 'expense' && preset.paymentMethod === 'Cash Withdrawal');

                            return (
                                <li key={preset.id}>
                                    <div className="preset-info">
                                        {isCashPreset && <span className="cash-icon-preset">💸</span>}
                                        <div>
                                            <span className="preset-description">{preset.description}</span>
                                            <span className="preset-details">{preset.category} - {preset.person} - {preset.isVariable ? 'Variable' : `€${preset.amount.toLocaleString('de-DE', {minimumFractionDigits: 2})}`}</span>
                                        </div>
                                    </div>
                                    <div className="preset-actions">
                                        <button className="edit-btn" onClick={() => handleEditClick(preset)}>✏️</button>
                                        <button className="delete-btn-preset" onClick={() => openDeleteModal(preset.id)}>🗑️</button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            </div>
        </>
    );
};
export default ManagePresetsPage;

