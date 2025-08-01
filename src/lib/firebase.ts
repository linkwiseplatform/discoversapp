
'use client';

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAF6_rVv7BXSKRv7VTsJaGbCemoOO7Ir3Q",
  authDomain: "discoversapp.firebaseapp.com",
  projectId: "discoversapp",
  storageBucket: "discoversapp.firebasestorage.app",
  messagingSenderId: "207214786584",
  appId: "1:207214786584:web:a3f9687b3072c7fae06b6d",
  databaseURL: "https://discoversapp-default-rtdb.firebaseio.com"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getDatabase(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
