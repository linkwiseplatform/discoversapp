
import { initializeApp, getApp, getApps, App, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const firebaseConfig = {
  projectId: "discoversapp",
  databaseURL: "https://discoversapp-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase Admin SDK
let adminApp: App;
if (!getApps().length) {
  adminApp = initializeApp({
    credential: applicationDefault(),
    databaseURL: firebaseConfig.databaseURL,
    projectId: firebaseConfig.projectId
  });
} else {
  adminApp = getApp();
}

export const adminAuth = getAuth(adminApp);
export { adminApp };
