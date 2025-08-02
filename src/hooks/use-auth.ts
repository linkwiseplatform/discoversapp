
'use client';

import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signInWithCustomToken, signOut, User } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import type { Admin } from '@/lib/types';
import { useToast } from './use-toast';

export type { User };

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        setIsAdminLoading(true);
        try {
          const adminsRef = ref(db, 'admins');
          const snapshot = await get(adminsRef);
          if (snapshot.exists()) {
            const admins = snapshot.val() as Record<string, Admin>;
            const isAdminUser = Object.values(admins).some(admin => admin.id === user.uid);
            setIsAdmin(isAdminUser);
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        } finally {
          setIsAdminLoading(false);
        }
      } else {
        setIsAdmin(false);
        setIsAdminLoading(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = useCallback(async (token: string) => {
    try {
      const result = await signInWithCustomToken(auth, token);
      return result.user;
    } catch (error) {
      console.error("Custom token sign-in failed:", error);
      toast({
        title: '로그인 실패',
        description: '다시 시도해주세요.',
        variant: 'destructive'
      });
      return null;
    }
  }, [toast]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error("Sign-out failed:", error);
    }
  }, []);

  return { user, loading, isAdmin, isAdminLoading, login, logout };
}
