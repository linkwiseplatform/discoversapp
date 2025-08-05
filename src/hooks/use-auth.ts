
'use client';

import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signOut, 
  User,
  signInWithCustomToken,
  AuthError
} from 'firebase/auth';
import { ref, get, set, update } from 'firebase/database';
import type { Admin } from '@/lib/types';
import { useToast } from './use-toast';
import { useRouter } from 'next/navigation';

export type { User };

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

  const loginWithKakao = (isAdminLogin: boolean = false) => {
    sessionStorage.setItem('isAdminLogin', isAdminLogin.toString());
    const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY}&redirect_uri=${process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI}&response_type=code`;
    window.location.href = KAKAO_AUTH_URL;
  };
  
  const customTokenSignIn = useCallback(async (token: string) => {
    try {
      const result = await signInWithCustomToken(auth, token);
      toast({ title: "로그인 성공!", description: `${result.user.displayName}님 환영합니다.` });
      const isAdminLogin = sessionStorage.getItem('isAdminLogin') === 'true';
      sessionStorage.removeItem('isAdminLogin');
      router.replace(isAdminLogin ? '/admin' : '/quests');
    } catch(error) {
      console.error("Custom token sign-in failed:", error);
      toast({
          title: "로그인 실패",
          description: "Firebase 인증에 실패했습니다.",
          variant: "destructive"
      });
      router.replace('/');
    }
  }, [router, toast]);

  const logout = async () => {
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
  };

  return { user, loading, isAdmin, isAdminLoading, loginWithKakao, customTokenSignIn, logout };
}
