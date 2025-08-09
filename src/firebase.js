import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDyuQRjoPKS3CdlwX8OUbSk0LY0bG5Ja9k",
  authDomain: "household-finance-app-75eb4.firebaseapp.com",
  projectId: "household-finance-app-75eb4",
  storageBucket: "household-finance-app-75eb4.firebasestorage.app",
  messagingSenderId: "886615228671",
  appId: "1:886615228671:web:06ae7b5148765466980cca"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);