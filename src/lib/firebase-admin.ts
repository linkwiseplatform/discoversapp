
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import type { ServiceAccount } from 'firebase-admin/app';

let app: App;

if (!getApps().length) {
    // Ensure all required environment variables are present
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_DATABASE_URL) {
        throw new Error('Firebase Admin SDK environment variables are not set.');
    }

    const serviceAccount: ServiceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace escaped newlines from environment variable
        privateKey: (process.env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, '\n'),
    };

    app = initializeApp({
        credential: cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
} else {
    app = getApps()[0];
}

export const adminAuth = getAuth(app);
export const adminDb = getDatabase(app);
