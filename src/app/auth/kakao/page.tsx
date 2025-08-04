
'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { ref, set, get } from 'firebase/database';
import { Loader2 } from 'lucide-react';

const KAKAO_REST_API_KEY = '5709fa620b0746a1eda6be7699017fa1';
// This redirect URI must be exactly the same as the one registered in Kakao Dev Console
const KAKAO_REDIRECT_URI = 'https://www.viscope.kr/api/auth/callback/kakao';

function KakaoLogin() {
  const searchParams = useSearchParams();
  const isAdminLogin = searchParams.get('admin') === 'true';

  useEffect(() => {
    const adminQueryParam = isAdminLogin ? '&admin=true' : '';
    const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${KAKAO_REDIRECT_URI}&response_type=code${adminQueryParam}`;
    window.location.href = KAKAO_AUTH_URL;
  }, [isAdminLogin]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">카카오 로그인 페이지로 이동 중...</p>
    </div>
  );
}

function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const isAdminLogin = searchParams.has('admin');
  
  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        console.error('Kakao login error:', error);
        alert('카카오 로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
        router.replace('/');
        return;
    }

    if (code) {
      const handleLogin = async () => {
        try {
          const response = await fetch(`/api/auth/callback/kakao`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
          });
          
          const responseBody = await response.json();

          if (!response.ok) {
            console.error("Token exchange failed:", responseBody);
            throw new Error(responseBody.details || `로그인 서버 오류: ${response.status} - ${responseBody.error || 'Unknown error'}`);
          }

          const { token, user: apiUser } = responseBody;
          const loggedInUser = await login(token);

          if (loggedInUser) {
            const userProgressRef = ref(db, `userProgress/${loggedInUser.uid}`);
            const snapshot = await get(userProgressRef);

            if (!snapshot.exists()) {
              await set(userProgressRef, {
                uid: loggedInUser.uid,
                name: apiUser.displayName || `탐험가${loggedInUser.uid.substring(0,4)}`,
                unlockedStages: 0,
                lastPlayed: Date.now(),
              });
            }
            router.replace(isAdminLogin ? '/admin' : '/quests');
          } else {
             router.replace('/');
          }
        } catch (err: any) {
          console.error('Login process failed', err);
          alert(`로그인에 실패했습니다: ${err.message}`);
          router.replace('/');
        }
      };
      handleLogin();
    }
  }, [searchParams, router, login, isAdminLogin]);

  return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">로그인 중입니다...</p>
      </div>
  );
}

export default function KakaoAuthPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
            <KakaoAuthPageInternal />
        </Suspense>
    )
}

function KakaoAuthPageInternal() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  // If a code is in the URL, we're in the callback phase.
  // Otherwise, we need to initiate the login.
  return code ? <AuthCallback /> : <KakaoLogin />;
}
