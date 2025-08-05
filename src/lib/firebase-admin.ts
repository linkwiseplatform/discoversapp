
import { initializeApp, getApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';

// IMPORTANT: Path to the service account key file
// You need to upload this file to your server environment
// and set the GOOGLE_APPLICATION_CREDENTIALS environment variable.
// For Firebase App Hosting, you can set these as environment variables directly.

const serviceAccount = {
  projectId: process.env.GCLOUD_PROJECT,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

const databaseURL = process.env.FIREBASE_DATABASE_URL;

let adminApp;
if (!getApps().length) {
  adminApp = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: databaseURL,
  });
} else {
  adminApp = getApp();
}

export const adminAuth = getAuth(adminApp);
export const adminDb = getDatabase(adminApp);
