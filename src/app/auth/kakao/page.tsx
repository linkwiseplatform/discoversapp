
'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { ref, set, get } from 'firebase/database';
import { Loader2 } from 'lucide-react';

const KAKAO_REST_API_KEY = '5709fa620b0746a1eda6be7699017fa1';
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
       // The server now handles the code exchange and redirects to a processing page
       // with the token. This component might not be needed anymore if the redirect
       // goes straight to /auth/kakao/processing. However, keeping it for now
       // in case the KAKAO_AUTH_URL brings the user here first.
       // The logic will be handled by KakaoAuthPageInternal.
    }
  }, [searchParams, router, login, isAdminLogin]);

  return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">로그인 처리 중...</p>
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

  // If there's a code, it means we've just come back from Kakao.
  // The server-side route will handle this and redirect to /auth/kakao/processing
  // This component will briefly show a loading spinner.
  if (code) {
      return <AuthCallback />;
  }

  // If there's no code, it means we need to initiate the login.
  return <KakaoLogin />;
}
