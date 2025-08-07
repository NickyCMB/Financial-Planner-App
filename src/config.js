// src/config.js

export const ADMIN_EMAIL = "tabea.nicole@gmail.com";

export const USER_MAP = {
  "tabea.nicole@gmail.com": "Nicky",
  "repinsascha@gmail.com": "Alex",
};

export const householdMembers = ['Nicky', 'Alex'];

// UPDATED: New color scheme
export const PERSON_COLORS = {
  Nicky: {
    primary: '#000080',
    background: '#a1c6e0ff', // New Background
    backgroundLogged: '#8faac0', 
  },
  Alex: {
    primary: '#6500a7', // New Name Color
    background: '#CCCCFF', // New Background
    backgroundLogged: '#a1a1e0',
  },
};

export const incomeCategories = [ 'Salary / Work', 'Other Income' ];
export const expenseCategories = [ 'Home / Housing', 'Transportation', 'Groceries', 'Personal / Health', 'Leisure / Entertainment', 'Shopping / Other' ];