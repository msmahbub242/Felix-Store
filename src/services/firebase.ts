import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBcGe5XKdnO1lCUDN8iJu05Sgazgk4QbsQ",
  authDomain: "soy-valve-xbcxw.firebaseapp.com",
  projectId: "soy-valve-xbcxw",
  storageBucket: "soy-valve-xbcxw.firebasestorage.app",
  messagingSenderId: "302765203301",
  appId: "1:302765203301:web:866c10e503d71eb7e64b8c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
