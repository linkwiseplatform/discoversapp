
'use client';

import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithRedirect, 
  signOut, 
  User,
  OAuthProvider
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
            const isAdminUser = Object.values(admins).some(admin => admin.id === user.uid || `kakao:${user.providerData[0]?.uid}` === admin.id);
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
      // Store admin flag in session storage to retrieve after redirect
      sessionStorage.setItem('isAdminLogin', String(isAdminLogin));
      
      const provider = new OAuthProvider('oidc.kakao');
      provider.addScope('profile_image');
      provider.addScope('nickname');
      await signInWithRedirect(auth, provider);
      // Redirect will happen, code after this won't execute until user comes back.
    } catch (error) {
      console.error("Kakao OIDC sign-in failed:", error);
      toast({
        title: '카카오 로그인 실패',
        description: '로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        variant: 'destructive'
      });
    }
  }, [toast]);
  
  useEffect(() => {
      const handleLoginRedirect = async () => {
          try {
              const result = await auth.getRedirectResult();
              if (result) {
                  const isAdminLogin = sessionStorage.getItem('isAdminLogin') === 'true';
                  sessionStorage.removeItem('isAdminLogin'); // Clean up
                  
                   // After successful login, onAuthStateChanged will handle user setup.
                   // We just need to redirect to the correct page.
                   router.replace(isAdminLogin ? '/admin' : '/quests');
              }
          } catch(error: any) {
              console.error("Error getting redirect result", error);
              if(error.code !== 'auth/web-storage-unsupported') {
                toast({ title: "로그인 처리 오류", description: error.message, variant: "destructive"});
              }
          }
      }
      handleLoginRedirect();
  }, [toast, router]);


  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      // No need to set user/admin to null, onAuthStateChanged will handle it
    } catch (error) {
      console.error("Sign-out failed:", error);
    }
  }, []);

  return { user, loading, isAdmin, isAdminLoading, loginWithKakao, logout };
}
