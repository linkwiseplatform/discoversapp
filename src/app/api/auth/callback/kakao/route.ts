
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import { ref, get } from 'firebase/database';

// Service account key directly in the server-side file.
// This file is only ever executed on the server, so this is safe.
const serviceAccount = {
  "type": "service_account",
  "project_id": "discoversapp",
  "private_key_id": "590e406017f588a25cb8e03c01ba04a67cb7880f",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCx5wkFpmhLcf6s\n4Y/tcPu21JGVcD+ur2zBKuHo1EKW0aGLhWwAsV3Pp4t7/o7hyBssgWkiybwxHT6i\n9mIkybzIBaP6eNppnDb4eECpw6x6SQnEmY0ao81nCjtc3hoptKT2KZzhEFs6vjtV\nlk6wv1j2JXg+wtjhCOdyh793d6DoHQ7Z1ruJlw8xYwRzXz4FcPzKoDbX1IOjZrOk\ni+jc5AQnKXAx+YikZNqe46anuMSGII4+W4wc+as/TsCYodHnq1d3rrgqZDXnuVUD\nseRSc/grO6NyXy4bQ9yJAeLK+5MqSEh5pdPUZHE0I04kZb8iSAeasWM7zbkmTxVt\nWl+S9VrNAgMBAAECggEAGYWlm7Pl3nz6Jl8twMims/IG+MNjv3HXTlcSlc5txylH\n3bZEak0HwlStBBre8LE+hMIEDUOXxgwGAmcKaXCvrppwjexsmR4aHMdTr4cs5VY5\nGoVU4u+A9jlXjtkmM7mAuPf7U6Z/EAxegsbPfzfUUWvKtmZJqu8WFS44X7E/2kyi\n/Gz/kYOFab4Pp5LpDN86Hmoph3gQJrxvGk0alrvVS9Rudt0W20b2/Hn56b74TA67\nDYanIu/eV5zRRjD+8bOenfRW9V6JG+q3lXDheLiXZ+JeknvA7WUAWRv/ygmcXJNf\nNe5gaWbvCtFBcYn99NMOAI+rAsVEUUE9BgMDizaCmQKBgQD3wQARPJ6fPZhovpUM\nKssZa9ghCK2XvvK0c1ZRNKVgdRueaqhYBN5LFBI6P/yAy5k4DIAIEtbA382eheAq\ns3CtPpsFygDRwtchVx66LkGnxdivQxlZIHjy+5rjUe8xS7JAQvyPrgK8vS6NQ3Fk\n4JBcMZLYQzBMUoxnGbGUOhex5wKBgQC30tzDt8jRLV3EH3RopKyPMLQn2CYBi1iq\nAJL2COS7Hvlx2G27lg4Yg/wbU7nQFunRei8ItPBmRpYTH+11rx9Dv1cyrxd3PvkW\nUVj68D5KgHUhQFz99EKBe6PbGEumXuSQbZ55eAefLdAY29nYktSCTnHRiOrHNfUn\nkT+moySfKwKBgQDsFXts8WjtsRI0bbc1uumCNePjxpM0kH5SOb287//O5IkG8fes\nuCbjQCMGYsbILDq60B6IkvsVG66iKkwsJIVwcMHkSFNzjsjVOmFLZJyntL4AdF4J\nMgpO8Dbt+ruFK+6Vkb99YoG1PEjJz8SULfEiCRM3BP9XGyozbKZs6tZ9bQKBgGhW\nCPQVxqfjxgrhh6M1hLQpgrfy2W+a9hJYDRIU7i6/X/ocS/xjKVEE6P1hwl+4AbLi\nVPvuJ10Fx3zHbHKVmXtMiWO9OeZ3Gc5vEcAsyE5lJxZef+ms0GrKELD000t1JOpN\nLdvoIvtYd3sEnltsy63CdJvnyMqVd7ajnKsqgkjNAoGAKf1+RMiVR14ife7lloaJ\nlM4soLQezRpnjAEdlXFTkvlplt2FJovzwg6D674iM5vppThmiiY6tQVVQT7PrDcC\n204jJSpYE8GpnzT56H1M2w5Z9GZfdwVb7M7N8bZtgnJHkW8qHokcJ7NTCUgRWXbe\nQ178DrEGsFmIb6g23eunrus=\n-----END PRIVATE KEY-----\n".replace(/\\n/g, '\n'),
  "client_email": "firebase-adminsdk-fbsvc@discoversapp.iam.gserviceaccount.com",
};

// Initialize Firebase Admin SDK
let app: App;
if (!getApps().length) {
    app = initializeApp({
        credential: cert(serviceAccount),
        databaseURL: "https://discoversapp-default-rtdb.asia-southeast1.firebasedatabase.app",
    });
} else {
    app = getApps()[0];
}

const adminAuth = getAuth(app);
const adminDb = getDatabase(app);


const KAKAO_REST_API_KEY = '5709fa620b0746a1eda6be7699017fa1';
const KAKAO_CLIENT_SECRET = 'M3TG2xVZwEw4xaISTzuDZmht5TYCXFpm';
const KAKAO_REDIRECT_URI = 'https://www.viscope.kr/api/auth/callback/kakao';

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get('code');
    const isAdminLogin = req.nextUrl.searchParams.get('admin') === 'true';

    if (!code) {
        return NextResponse.json({ error: 'Authorization code not provided' }, { status: 400 });
    }

    try {
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
            const adminRef = ref(adminDb, 'admins');
            const snapshot = await get(adminRef);
            let isVerifiedAdmin = false;
            if (snapshot.exists()) {
                 const admins = snapshot.val() as Record<string, { id: string, name: string }>;
                 isVerifiedAdmin = Object.values(admins).some(admin => admin.id === uid);
            }
           
            if (!isVerifiedAdmin) {
                 const errorUrl = new URL('/auth/error', req.nextUrl.origin);
                 errorUrl.searchParams.set('error', 'Access Denied');
                 errorUrl.searchParams.set('details', 'You are not a registered administrator.');
                 return NextResponse.redirect(errorUrl);
            }
        }
        
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

    