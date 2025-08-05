
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { credential } from 'firebase-admin';

const KAKAO_REST_API_KEY = '5709fa620b0746a1eda6be7699017fa1';
const KAKAO_CLIENT_SECRET = 'M3TG2xVZwEw4xaISTzuDZmht5TYCXFpm';
const KAKAO_REDIRECT_URI = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI || 'https://discovers-2a970.web.app/api/auth/callback/kakao';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  initializeApp();
}

const adminAuth = getAuth();


export async function POST(req: NextRequest) {
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
        
        // 3. Update or create user in Firebase Auth
        try {
            await adminAuth.updateUser(uid, {
                displayName,
                photoURL,
            });
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                await adminAuth.createUser({
                    uid,
                    displayName,
                    photoURL,
                });
            } else {
                console.error("Firebase updateUser/createUser error:", error);
                throw new Error(`Firebase user operation failed: ${error.message} (Code: ${error.code})`);
            }
        }
        
        // 4. Create custom token
        const customToken = await adminAuth.createCustomToken(uid);

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
        // Redirect to the appropriate frontend page with the code.
        const targetUrl = new URL(isAdmin ? '/admin' : '/auth/kakao', req.nextUrl.origin);
        targetUrl.searchParams.set('code', code);
        
        if (isAdmin) {
            targetUrl.searchParams.set('admin', 'true');
        }
        return NextResponse.redirect(targetUrl);
    }
    
    return NextResponse.json({ error: 'Authorization code not found in GET request' }, { status: 400 });
}
