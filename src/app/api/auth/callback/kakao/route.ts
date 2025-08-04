
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { URLSearchParams } from 'url';

const KAKAO_REST_API_KEY = '5709fa620b0746a1eda6be7699017fa1';
const KAKAO_CLIENT_SECRET = 'M3TG2xVZwEw4xaISTzuDZmht5TYCXFpm';
const KAKAO_REDIRECT_URI = 'https://www.viscope.kr/api/auth/callback/kakao';

// Initialize Firebase Admin SDK
let adminApp: App;
try {
  if (!getApps().length) {
    // In App Hosting, initializeApp() with no args will use the runtime service account
    // and automatically discover the databaseURL.
    adminApp = initializeApp();
  } else {
    adminApp = getApp();
  }
} catch (error: any) {
  console.error('Firebase Admin SDK initialization error', error);
  // If initialization fails, we should not proceed.
  // This helps in logging the root cause during deployment or runtime.
}


export async function POST(req: NextRequest) {
    if (!adminApp) {
        console.error("Fatal: Firebase Admin SDK is not initialized.");
        return NextResponse.json({ error: 'Internal Server Error', details: 'Firebase Admin SDK failed to initialize.' }, { status: 500 });
    }

    try {
        const { code } = await req.json();

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
                redirect_uri: KAKAO_REDIRECT_URI,
                client_secret: KAKAO_CLIENT_SECRET,
                code,
            }),
        });

        const tokenData = await tokenResponse.json();
        
        if (tokenData.error) {
            console.error('Kakao token exchange error:', tokenData);
            return NextResponse.json({ error: 'Failed to exchange Kakao token', details: tokenData.error_description }, { status: 400 });
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
             return NextResponse.json({ error: 'Failed to get user info from Kakao', details: userData.msg }, { status: 400 });
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
                console.error("Firebase updateUser error:", error);
                throw error; // Rethrow other errors
            }
        }
        
        // 4. Create custom token
        const customToken = await firebaseAuth.createCustomToken(uid);

        return NextResponse.json({ token: customToken, user: { uid, displayName, photoURL } });

    } catch (error: any) {
        console.error('Auth callback internal error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get('code');
    const isAdmin = req.nextUrl.searchParams.get('admin');

    if (code) {
        // Use a fixed, known origin instead of the dynamic one from the request.
        const fixedOrigin = 'https://www.viscope.kr';
        const targetUrl = new URL(isAdmin ? '/admin' : '/auth/kakao', fixedOrigin);
        targetUrl.searchParams.set('code', code);
        
        if (isAdmin) {
            targetUrl.searchParams.set('admin', 'true');
        }
        return NextResponse.redirect(targetUrl);
    }
    
    return NextResponse.json({ error: 'Authorization code not found in GET request' }, { status: 400 });
}
