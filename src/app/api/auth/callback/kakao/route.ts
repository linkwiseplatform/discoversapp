
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { ref, get } from 'firebase/database';

const KAKAO_REST_API_KEY = '5709fa620b0746a1eda6be7699017fa1';
const KAKAO_CLIENT_SECRET = 'M3TG2xVZwEw4xaISTzuDZmht5TYCXFpm';
const KAKAO_REDIRECT_URI = 'https://www.viscope.kr/api/auth/callback/kakao';

async function verifyIsAdmin(uid: string): Promise<boolean> {
    try {
        const adminRef = ref(adminDb, 'admins');
        const snapshot = await get(adminRef);
        if (snapshot.exists()) {
            const admins = snapshot.val() as Record<string, { id: string }>;
            return Object.values(admins).some(admin => admin.id === uid);
        }
        return false;
    } catch (error) {
        console.error("Error verifying admin status:", error);
        return false;
    }
}


export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get('code');
    const isAdminLogin = req.nextUrl.searchParams.get('admin') === 'true';

    if (!code) {
        return NextResponse.json({ error: 'Authorization code not provided' }, { status: 400 });
    }

    try {
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
            const errorUrl = new URL('/auth/error', req.nextUrl.origin);
            errorUrl.searchParams.set('error', 'Kakao Token Exchange Failed');
            errorUrl.searchParams.set('details', tokenData.error_description);
            return NextResponse.redirect(errorUrl);
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
             const errorUrl = new URL('/auth/error', req.nextUrl.origin);
             errorUrl.searchParams.set('error', 'Failed to get user info from Kakao');
             errorUrl.searchParams.set('details', userData.msg);
             return NextResponse.redirect(errorUrl);
        }

        const uid = `kakao:${userData.id}`;
        const displayName = userData.properties.nickname;
        const photoURL = userData.properties.profile_image;

        if (isAdminLogin) {
            const isVerifiedAdmin = await verifyIsAdmin(uid);
            if (!isVerifiedAdmin) {
                 const errorUrl = new URL('/auth/error', req.nextUrl.origin);
                 errorUrl.searchParams.set('error', 'Access Denied');
                 errorUrl.searchParams.set('details', 'You are not a registered administrator.');
                 return NextResponse.redirect(errorUrl);
            }
        }
        
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
                const errorUrl = new URL('/auth/error', req.nextUrl.origin);
                errorUrl.searchParams.set('error', 'Firebase user operation failed');
                errorUrl.searchParams.set('details', `Code: ${error.code}`);
                return NextResponse.redirect(errorUrl);
            }
        }
        
        // 4. Create custom token and redirect
        const customToken = await adminAuth.createCustomToken(uid);
        
        const targetUrl = new URL(isAdminLogin ? '/admin' : '/auth/kakao/processing', req.nextUrl.origin);
        targetUrl.searchParams.set('token', customToken);
        targetUrl.searchParams.set('displayName', displayName);
        targetUrl.searchParams.set('uid', uid);
        
        if (isAdminLogin) {
            targetUrl.searchParams.set('admin', 'true');
        }

        return NextResponse.redirect(targetUrl);

    } catch (error: any) {
        console.error('Auth callback internal error:', error);
        
        const errorUrl = new URL('/auth/error', req.nextUrl.origin);
        errorUrl.searchParams.set('error', 'Internal Server Error');
        errorUrl.searchParams.set('details', error.message);
        return NextResponse.redirect(errorUrl);
    }
}
