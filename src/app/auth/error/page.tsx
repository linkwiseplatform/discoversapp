
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

function ErrorDisplay() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const error = searchParams.get('error');
    const details = searchParams.get('details');

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto w-fit rounded-full bg-destructive/10 p-3">
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                    </div>
                    <CardTitle className="mt-4 text-2xl">로그인 오류</CardTitle>
                    <CardDescription>
                        로그인 과정에서 문제가 발생했습니다.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 rounded-md bg-muted p-3 text-left text-sm text-muted-foreground">
                        <p><strong>오류:</strong> {error || '알 수 없는 오류'}</p>
                        {details && <p className="mt-2"><strong>상세정보:</strong> {details}</p>}
                    </div>
                    <Button onClick={() => router.replace('/')} className="w-full">
                        메인으로 돌아가기
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}


export default function AuthErrorPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">오류 정보를 불러오는 중...</div>}>
            <ErrorDisplay />
        </Suspense>
    );
}

