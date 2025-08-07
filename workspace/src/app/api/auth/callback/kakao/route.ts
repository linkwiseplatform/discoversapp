
import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Authorization code not provided' }, { status: 400 });
    }

    // 1. Exchange authorization code for Kakao access token
    const tokenResponse = await axios.post(
      'https://kauth.kakao.com/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY!,
        redirect_uri: process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI!,
        code: code,
        client_secret: process.env.KAKAO_CLIENT_SECRET!,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
        }
      }
    );
    const { access_token } = tokenResponse.data;

    // 2. Use access token to get Kakao user info
    const userResponse = await axios.get(
        'https://kapi.kakao.com/v2/user/me', 
        {
          headers: {
            Authorization: `Bearer ${access_token}`
          }
        }
    );
    const kakaoUser = userResponse.data;
    const uid = `kakao:${kakaoUser.id}`;
    const displayName = kakaoUser.properties.nickname;
    const photoURL = kakaoUser.properties.profile_image;

    // 3. Update or create the user in Firebase Auth
    await adminAuth.updateUser(uid, {
        displayName: displayName,
        photoURL: photoURL,
    }).catch(async (error) => {
        if (error.code === 'auth/user-not-found') {
            return adminAuth.createUser({
                uid: uid,
                displayName: displayName,
                photoURL: photoURL,
            });
        }
        throw error;
    });

    // 4. Create a Firebase custom token
    const firebaseToken = await adminAuth.createCustomToken(uid);
    
    return NextResponse.json({ firebaseToken });

  } catch (error: any) {
    console.error('Authentication error:', error.response?.data || error.message);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
