
'use client';

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  projectId: "discoversapp",
  appId: "1:207214786584:web:75ecd930aa0ed8dfe06b6d",
  storageBucket: "discoversapp.firebasestorage.app",
  apiKey: "AIzaSyAF6_rVv7BXSKRv7VTsJaGbCemoOO7Ir3Q",
  authDomain: "discoversapp.firebaseapp.com",
  messagingSenderId: "207214786584",
  databaseURL: "https://discoversapp-default-rtdb.firebaseio.com"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getDatabase(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
