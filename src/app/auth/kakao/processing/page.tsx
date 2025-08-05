
'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

function ProcessingComponent() {
    const searchParams = useSearchParams();
    const { customTokenSignIn } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        const code = searchParams.get('code');

        if (code) {
            const exchangeCodeForToken = async () => {
                try {
                    const response = await fetch('/api/auth/callback/kakao', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code }),
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to exchange code for token');
                    }
                    
                    const { firebaseToken } = await response.json();
                    
                    if (firebaseToken) {
                        await customTokenSignIn(firebaseToken);
                    } else {
                         throw new Error('Firebase token not received');
                    }

                } catch (error) {
                    console.error(error);
                    toast({
                        title: '인증 실패',
                        description: '카카오 인증 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
                        variant: 'destructive',
                    });
                     // window.location.href = '/';
                }
            };
            exchangeCodeForToken();
        } else {
             const error = searchParams.get('error');
             toast({
                title: '카카오 인증 실패',
                description: error || '알 수 없는 오류가 발생했습니다.',
                variant: 'destructive'
             });
             // window.location.href = '/';
        }

    }, [searchParams, customTokenSignIn, toast]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-lg">카카오 로그인 중입니다. 잠시만 기다려주세요...</p>
        </div>
    );
}


export default function KakaoProcessingPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                 <p className="mt-4 text-lg">카카오 로그인 중입니다. 잠시만 기다려주세요...</p>
            </div>
        }>
            <ProcessingComponent />
        </Suspense>
    );
}
