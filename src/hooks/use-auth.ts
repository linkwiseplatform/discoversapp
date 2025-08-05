
'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signOut, 
  User,
  OAuthProvider,
  signInWithPopup,
  AuthError
} from 'firebase/auth';
import { ref, get, set, update } from 'firebase/database';
import type { Admin } from '@/lib/types';
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

  const loginWithKakao = async (isAdminLogin: boolean = false) => {
    try {
      const result = await signInWithPopup(auth, kakaoProvider);
      // User is signed in.
      toast({ title: "로그인 성공!", description: `${result.user.displayName}님 환영합니다.` });
      router.replace(isAdminLogin ? '/admin' : '/quests');
    } catch (error) {
      const authError = error as AuthError;
      console.error("Kakao OIDC sign-in failed:", authError);

      // 사용자가 팝업을 닫는 등 일반적인 오류는 무시합니다.
      if (authError.code !== 'auth/popup-closed-by-user' && authError.code !== 'auth/cancelled-popup-request') {
        toast({
          title: "로그인 실패",
          description: "카카오 로그인 중 오류가 발생했습니다. 다시 시도해주세요.",
          variant: "destructive"
        });
      }
    }
  };

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

  return { user, loading, isAdmin, isAdminLoading, loginWithKakao, logout };
}
