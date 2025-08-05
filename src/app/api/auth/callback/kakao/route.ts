'use client';

import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithRedirect, 
  signOut, 
  User,
  OAuthProvider,
  getRedirectResult
} from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
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
          // Check admin status
          const adminsRef = ref(db, 'admins');
          const snapshot = await get(adminsRef);
          if (snapshot.exists()) {
            const admins = snapshot.val() as Record<string, Admin>;
            const isAdminUser = Object.values(admins).some(admin => admin.id === user.uid);
            setIsAdmin(isAdminUser);
          } else {
            setIsAdmin(false);
          }
          
          // Check and set user progress
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
              await set(ref(db, `userProgress/${user.uid}/lastPlayed`), Date.now());
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
      const provider = new OAuthProvider('oidc.kakao');
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      console.error("Kakao OIDC sign-in failed:", error);
       router.push(`/auth/error?error=${encodeURIComponent(error.code)}&details=${encodeURIComponent(error.message)}`);
    }
  }, [router]);
  
  useEffect(() => {
    const processRedirect = async () => {
        try {
            const result = await getRedirectResult(auth);
            if (result) {
                const isAdminLogin = sessionStorage.getItem('isAdminLogin') === 'true';
                sessionStorage.removeItem('isAdminLogin');
                
                toast({ title: "로그인 성공!", description: `${result.user.displayName}님 환영합니다.` });
                router.replace(isAdminLogin ? '/admin' : '/quests');
            }
        } catch(error: any) {
            console.error("Error getting redirect result", error);
            // Avoid showing toast for unsupported web storage which can be noisy.
            if (error.code !== 'auth/web-storage-unsupported' && error.code !== 'auth/internal-error') {
              router.push(`/auth/error?error=${encodeURIComponent(error.code)}&details=${encodeURIComponent(error.message)}`);
            }
        }
    };
    
    processRedirect();
    
  }, [toast, router]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error("Sign-out failed:", error);
    }
  }, [router]);

  return { user, loading, isAdmin, isAdminLoading, loginWithKakao, logout };
}