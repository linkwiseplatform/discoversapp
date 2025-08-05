
import { initializeApp, getApp, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';

let adminApp: App;

// App Hosting 환경에서는 인자 없이 initializeApp()을 호출하면
// 자동으로 올바른 프로젝트 설정과 인증 정보를 찾습니다.
if (!getApps().length) {
  adminApp = initializeApp();
} else {
  adminApp = getApp();
}

export const adminAuth = getAuth(adminApp);
export const adminDb = getDatabase(adminApp);
