
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { URLSearchParams } from 'url';

const KAKAO_REST_API_KEY = '5709fa620b0746a1eda6be7699017fa1';
const KAKAO_CLIENT_SECRET = 'M3TG2xVZwEw4xaISTzuDZmht5TYCXFpm';

let KAKAO_REDIRECT_URI = 'https://www.viscope.kr/api/auth/callback/kakao';
if (process.env.NODE_ENV === 'development') {
    KAKAO_REDIRECT_URI = 'http://localhost:9002/api/auth/callback/kakao';
}


const firebaseConfig = {
  apiKey: "AIzaSyAF6_rVv7BXSKRv7VTsJaGbCemoOO7Ir3Q",
  authDomain: "discoversapp.firebaseapp.com",
  projectId: "discoversapp",
  storageBucket: "discoversapp.firebasestorage.app",
  messagingSenderId: "207214786584",
  appId: "1:207214786584:web:a3f9687b3072c7fae06b6d",
  databaseURL: "https://discoversapp-default-rtdb.asia-southeast1.firebasedatabase.app"
};

let adminApp: App;
try {
    if (!getApps().length) {
       if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
         const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
         adminApp = initializeApp({
            credential: cert(serviceAccount),
            databaseURL: firebaseConfig.databaseURL,
        });
       } else {
         adminApp = initializeApp({
            projectId: firebaseConfig.projectId,
            databaseURL: firebaseConfig.databaseURL,
        });
       }
    } else {
        adminApp = getApp();
    }
} catch (error: any) {
    console.error('Firebase Admin SDK initialization error', error);
}

export async function POST(req: NextRequest) {
    try {
        const { code, requestHost } = await req.json();

        let redirectUri = KAKAO_REDIRECT_URI;
        if (requestHost) {
          redirectUri = `${requestHost}/api/auth/callback/kakao`;
        }

        if (!code) {
            return NextResponse.json({ error: 'Authorization code not provided' }, { status: 400 });
        }

        // 1. Exchange authorization code for access token
        const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: KAKAO_REST_API_KEY,
                redirect_uri: redirectUri,
                client_secret: KAKAO_CLIENT_SECRET,
                code,
            }),
        });

        const tokenData = await tokenResponse.json();
        
        if (tokenData.error) {
            console.error('Kakao token error:', tokenData);
            return NextResponse.json({ error: tokenData.error_description || 'Failed to get access token' }, { status: 400 });
        }
        
        const { access_token } = tokenData;

        // 2. Get user info from Kakao
        const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });
        
        const userData = await userResponse.json();
        
        if (userData.code) {
             console.error('Kakao user info error:', userData);
             return NextResponse.json({ error: userData.msg || 'Failed to get user info' }, { status: 400 });
        }

        const uid = `kakao:${userData.id}`;
        const displayName = userData.properties.nickname;
        const photoURL = userData.properties.profile_image;

        const firebaseAuth = getAuth(adminApp);
        
        // 3. Update or create user in Firebase Auth
        try {
            await firebaseAuth.updateUser(uid, {
                displayName,
                photoURL,
            });
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                await firebaseAuth.createUser({
                    uid,
                    displayName,
                    photoURL,
                });
            } else {
                throw error;
            }
        }
        
        // 4. Create custom token
        const customToken = await firebaseAuth.createCustomToken(uid);

        return NextResponse.json({ token: customToken, user: userData });

    } catch (error: any) {
        console.error('Auth callback error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
