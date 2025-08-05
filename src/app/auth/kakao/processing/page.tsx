
'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { ref, set, get } from 'firebase/database';
import { Loader2 } from 'lucide-react';

function ProcessingComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const isAdminLogin = searchParams.has('admin');

  useEffect(() => {
    const token = searchParams.get('token');
    const displayName = searchParams.get('displayName');
    const uid = searchParams.get('uid');
    const error = searchParams.get('error');

    if (error) {
      const details = searchParams.get('details');
      console.error('Login error from server:', error, details);
      alert(`로그인 중 서버에서 오류가 발생했습니다: ${details || error}`);
      router.replace('/');
      return;
    }

    if (token && displayName && uid) {
      const handleLogin = async () => {
        try {
          const loggedInUser = await login(token);

          if (loggedInUser) {
            const userProgressRef = ref(db, `userProgress/${loggedInUser.uid}`);
            const snapshot = await get(userProgressRef);

            if (!snapshot.exists()) {
              await set(userProgressRef, {
                uid: loggedInUser.uid,
                name: displayName || `탐험가${loggedInUser.uid.substring(0,4)}`,
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
    } else {
        // If token is missing, redirect to home
        alert('로그인 정보가 올바르지 않습니다. 다시 시도해주세요.');
        router.replace('/');
    }
  }, [searchParams, router, login, isAdminLogin]);

  return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">로그인 정보를 처리 중입니다...</p>
      </div>
  );
}

export default function ProcessingPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
            <ProcessingComponent />
        </Suspense>
    )
}
