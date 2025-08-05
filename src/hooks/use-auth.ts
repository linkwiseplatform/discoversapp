
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
      const provider = new OAuthProvider('oidc.kakao');
      // You can add custom parameters or scopes here if needed
      // provider.addScope('profile');
      // provider.setCustomParameters({ login_hint: 'user@example.com' });
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      console.error("Kakao OIDC sign-in initiation failed:", error);
      toast({
        title: "로그인 시작 실패",
        description: error.message,
        variant: "destructive"
      });
    }
  }, []);
  
  useEffect(() => {
    const processRedirect = async () => {
        try {
            const result = await getRedirectResult(auth);
            if (result) {
                // Successfully signed in.
                const credential = OAuthProvider.credentialFromResult(result);
                // You can get the OAuth access token and ID Token here.
                // const accessToken = credential.accessToken;
                // const idToken = credential.idToken;

                const isAdminLogin = sessionStorage.getItem('isAdminLogin') === 'true';
                sessionStorage.removeItem('isAdminLogin');
                
                toast({ title: "로그인 성공!", description: `${result.user.displayName}님 환영합니다.` });
                router.replace(isAdminLogin ? '/admin' : '/quests');
            }
        } catch(error) {
            const authError = error as AuthError;
            console.error("Error getting redirect result", authError);
            
            // Handle specific errors or show a generic message
            if (authError.code !== 'auth/web-storage-unsupported' && authError.code !== 'auth/internal-error') {
               toast({
                   title: "로그인 처리 중 오류 발생",
                   description: authError.message,
                   variant: "destructive"
               });
               router.push('/');
            }
        }
    };
    
    // Only run this on initial load
    if(!user) {
        processRedirect();
    }
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, toast, router]);

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
