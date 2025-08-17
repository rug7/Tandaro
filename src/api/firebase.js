// src/api/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAXV84WYTeTp-SnqJAaBrBlJY8LKACk1sY",
  authDomain: "tandaro.firebaseapp.com",
  projectId: "tandaro",
  storageBucket: "tandaro.firebasestorage.app",
  messagingSenderId: "328289905839",
  appId: "1:328289905839:web:0ec823ba46bc580036f85a",
  measurementId: "G-X7BWLWPFYG"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { db, storage, auth };