
'use client';

import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithRedirect, 
  signOut, 
  User,
  OAuthProvider,
  getRedirectResult,
  AuthError
} from 'firebase/auth';
import { ref, get, set, update } from 'firebase/database';
import type { Admin, UserProgress } from '@/lib/types';
import { useToast } from './use-toast';
import { useRouter } from 'next/navigation';

export type { User };

// provider를 훅의 바깥이나 최상단에서 한 번만 생성합니다.
// 이렇게 하면 앱 전체에서 안정적인 단일 인스턴스를 사용하게 됩니다.
const kakaoProvider = new OAuthProvider('oidc.kakao');

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        setIsAdminLoading(true);
        try {
          const adminsRef = ref(db, 'admins');
          const snapshot = await get(adminsRef);
          const isAdminUser = snapshot.exists() && Object.values(snapshot.val() as Record<string, Admin>).some(admin => admin.id === user.uid);
          setIsAdmin(isAdminUser);
          
          const userProgressRef = ref(db, `userProgress/${user.uid}`);
          const progressSnapshot = await get(userProgressRef);
          if (!progressSnapshot.exists()) {
              await set(userProgressRef, {
                uid: user.uid,
                name: user.displayName || `탐험가${user.uid.substring(0,4)}`,
                unlockedStages: 0,
                lastPlayed: Date.now(),
              });
          } else {
              await update(userProgressRef, { lastPlayed: Date.now() });
          }
        } catch (error) {
          console.error("Error during auth state processing:", error);
          setIsAdmin(false);
          toast({ title: "오류", description: "사용자 정보를 확인하는 중 오류가 발생했습니다.", variant: "destructive" });
        } finally {
          setIsAdminLoading(false);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        setIsAdminLoading(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [toast]);

  const loginWithKakao = useCallback(async (isAdminLogin: boolean = false) => {
    try {
      sessionStorage.setItem('isAdminLogin', String(isAdminLogin));
      // 매번 새로 생성하는 대신, 미리 생성된 provider를 사용합니다.
      await signInWithRedirect(auth, kakaoProvider);
    } catch (error: any) {
      console.error("Kakao OIDC sign-in initiation failed:", error);
      toast({
        title: "로그인 시작 실패",
        description: "카카오 로그인 페이지로 이동하는 데 실패했습니다. 잠시 후 다시 시도해주세요.",
        variant: "destructive"
      });
    }
  }, [toast]);
  
  useEffect(() => {
    const processRedirect = async () => {
        try {
            const result = await getRedirectResult(auth);
            if (result) {
                const credential = OAuthProvider.credentialFromResult(result);
                // User is signed in.
                const isAdminLogin = sessionStorage.getItem('isAdminLogin') === 'true';
                sessionStorage.removeItem('isAdminLogin');
                
                toast({ title: "로그인 성공!", description: `${result.user.displayName}님 환영합니다.` });
                router.replace(isAdminLogin ? '/admin' : '/quests');
            }
        } catch(error) {
            const authError = error as AuthError;
            console.error("Error getting redirect result", authError);

            // 로그인 취소 등의 일반적인 오류는 무시하고, 심각한 오류만 사용자에게 알립니다.
            if (authError.code !== 'auth/cancelled-popup-request') {
               toast({
                   title: "로그인 처리 중 오류 발생",
                   description: authError.message || "로그인 결과를 처리하는 중 오류가 발생했습니다. 다시 로그인해주세요.",
                   variant: "destructive"
               });
               router.push('/');
            }
        }
    };
    
    processRedirect();
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast, router]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error("Sign-out failed:", error);
      toast({
          title: "로그아웃 실패",
          description: "로그아웃 중 문제가 발생했습니다.",
          variant: "destructive"
      });
    }
  }, [router, toast]);

  return { user, loading, isAdmin, isAdminLoading, loginWithKakao, logout };
}
