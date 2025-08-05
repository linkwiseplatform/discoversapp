
'use server';

import admin from 'firebase-admin';

// 서비스 계정 키를 직접 코드에 포함합니다.
// 보안 참고: 이 파일은 'use server' 지시어로 인해 서버에서만 실행되므로,
// 이 정보가 클라이언트로 유출되지 않습니다.
const serviceAccount = {
  "type": "service_account",
  "project_id": "discoversapp",
  "private_key_id": "b18b57743d04369e5d3264426b3e6e87f17b385e",
  "private_key": process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  "client_email": "firebase-adminsdk-3y0k1@discoversapp.iam.gserviceaccount.com",
  "client_id": "104961732971217086884",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-3y0k1%40discoversapp.iam.gserviceaccount.com"
};


// 앱이 이미 초기화되었는지 확인하여 중복 초기화를 방지합니다.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://discoversapp-default-rtdb.asia-southeast1.firebasedatabase.app"
  });
}

const adminAuth = admin.auth();
const adminDb = admin.database();

export { adminAuth, adminDb };
