
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDQvdcuoUGEG3CAMyEB8uI3hHNyvTDFPvI",
  authDomain: "my-menu-64ae9.firebaseapp.com",
  projectId: "my-menu-64ae9",
  storageBucket: "my-menu-64ae9.firebasestorage.app",
  messagingSenderId: "209752048104",
  appId: "1:209752048104:web:cf67e48049a9b6714ea45d",
  measurementId: "G-1DSW0K99GD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
