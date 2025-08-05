
'use server';

import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import serviceAccount from './firebase-service-account.json';

let app: App;

if (!getApps().length) {
    // The type assertion is necessary because the service account is a plain object
    // from a .ts file, not a JSON module.
    app = initializeApp({
        credential: cert(serviceAccount as any),
        databaseURL: "https://discoversapp-default-rtdb.asia-southeast1.firebasedatabase.app",
    });
} else {
    app = getApps()[0];
}

export const adminAuth = getAuth(app);
export const adminDb = getDatabase(app);
