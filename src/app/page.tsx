
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { ref, get, set } from 'firebase/database';
import type { GameConfig } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const KakaoIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.477 2 2 5.79 2 10.286C2 13.537 4.021 16.365 6.929 17.84L5.683 22L9.827 19.58C10.518 19.714 11.246 19.786 12 19.786C17.523 19.786 22 16.006 22 11.5C22 6.994 17.523 2 12 2Z" fill="#391B1B"/>
    </svg>
);

function GameInstructionsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="font-headline text-lg text-white cursor-pointer hover:underline">게임 방법</button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">게임 설명</DialogTitle>
          <DialogDescription>
            discoversapp에 오신 것을 환영합니다! 모험을 시작하는 방법은 다음과 같습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-1">
            <h4 className="font-headline text-lg text-primary">1. 스테이지 탐험</h4>
            <p className="text-muted-foreground">게임 보드에서 흥미진진한 스테이지들을 탐색하세요.</p>
          </div>
          <div className="space-y-1">
            <h4 className="font-headline text-lg text-primary">2. QR 코드 스캔</h4>
            <p className="text-muted-foreground">각 스테이지에서 숨겨진 QR 코드를 찾아 스캔하여 퀘스트를 완료하세요.</p>
          </div>
          <div className="space-y-1">
            <h4 className="font-headline text-lg text-primary">3. 보상 획득</h4>
            <p className="text-muted-foreground">모든 스테이지를 완료하여 특별 쿠폰을 받으세요!</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Home() {
  const [startCode, setStartCode] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user, loginAnonymously, loading: authLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchGameConfig = async () => {
      try {
        const configRef = ref(db, 'config');
        const snapshot = await get(configRef);
        if (snapshot.exists()) {
          setGameConfig(snapshot.val());
        }
      } catch (error) {
        console.error("Error fetching game config:", error);
        toast({
          title: '설정 오류',
          description: '게임 설정을 불러오는 데 실패했습니다.',
          variant: 'destructive',
        });
      }
    };
    fetchGameConfig();
  }, [toast]);
  
  useEffect(() => {
    if (authLoading) return; // Wait for auth state to be confirmed
    
    if (user) {
      router.push('/quests');
    } else {
      setIsLoading(false); // Only stop loading if user is not logged in
    }
  }, [user, authLoading, router]);

  const handleStartCodeChange = (value: string) => {
    setStartCode(value);
    if (!gameConfig) return;

    if (process.env.NODE_ENV === 'development' || value.trim() === gameConfig.gameStartCode) {
      setShowLogin(true);
    } else {
      setShowLogin(false);
    }
  };

  const handleStartCodeSubmit = () => {
    if (!gameConfig) return;
    if (startCode.trim() !== gameConfig.gameStartCode) {
         toast({
            title: '코드 오류',
            description: '시작 코드가 올바르지 않습니다.',
            variant: 'destructive',
        });
    }
  };

  const handleLogin = async () => {
    const loggedInUser = await loginAnonymously();
    if (loggedInUser) {
        const userProgressRef = ref(db, `userProgress/${loggedInUser.uid}`);
        const userName = loggedInUser.displayName || `익명_${loggedInUser.uid.substring(0, 5)}`;
        
        const snapshot = await get(userProgressRef);
        if (!snapshot.exists()) {
             await set(userProgressRef, { 
                unlockedStages: 0,
                lastPlayed: new Date().getTime(),
                name: userName,
                uid: loggedInUser.uid
             });
        }
      // The useEffect hook will handle the redirect
    } else {
      toast({
        title: '로그인 실패',
        description: '익명 로그인에 실패했습니다. 다시 시도해 주세요.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
        <div className="flex h-screen items-center justify-center">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full">
      <Image
        src="https://firebasestorage.googleapis.com/v0/b/discoversapp.firebasestorage.app/o/mainbg.jpg?alt=media&token=95d1f889-6d09-4342-b8ee-9e3c70cb522e"
        alt="모험을 암시하는 활기찬 일러스트 스타일의 숲 배경"
        data-ai-hint="storybook forest"
        fill
        className="object-cover z-0"
        priority
      />
      <div className="relative z-10 flex min-h-screen w-full items-end justify-center p-4 pb-32">
        <Card className="w-full max-w-sm bg-transparent border-none shadow-none animate-in fade-in zoom-in-95 text-white">
          <CardHeader className="text-center">
             <div className="flex justify-center">
               <GameInstructionsDialog />
             </div>
            <CardDescription className="text-sm pt-2 text-white/90">로그인 정보는 게임 진행 상황을 저장하기 위해서만 사용됩니다.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
             {showLogin ? (
                <Button onClick={handleLogin} className="w-full gap-2 h-12 text-lg">
                    <KakaoIcon />
                    카카오 로그인으로 시작
                </Button>
             ) : (
              <div className="space-y-4">
                <Input
                  id="start-code"
                  placeholder="시작 코드를 입력하세요"
                  value={startCode}
                  onChange={(e) => handleStartCodeChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStartCodeSubmit()}
                  required
                  className="text-center text-lg h-12"
                />
              </div>
             )}
             <p className="text-xs text-white/70 pt-4">© Discovers Uiwang. All Rights Reserved.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
