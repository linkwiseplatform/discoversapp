
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, User } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Ticket, Scissors, ShieldCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { ref, get, update } from 'firebase/database';
import type { GameConfig, UserProgress } from '@/lib/types';
import { isToday } from 'date-fns';

function CouponCard({ isDisabled, expiryDate, config }: { isDisabled: boolean, expiryDate: string, config: GameConfig | null }) {
  if (!config) return <Skeleton className="h-80 w-full max-w-md mx-auto" />;

  return (
    <div className={cn(
      "bg-accent/20 border-2 border-dashed border-accent p-6 rounded-lg shadow-lg max-w-md mx-auto relative transition-all duration-300",
      isDisabled && "bg-muted border-muted-foreground/50 opacity-60"
    )}>
      <div className="absolute -top-4 -left-4 bg-background p-1 rounded-full"><Scissors className="h-6 w-6 text-accent -rotate-90" /></div>
      <div className="absolute -top-4 -right-4 bg-background p-1 rounded-full"><Scissors className="h-6 w-6 text-accent rotate-90" /></div>
      <div className="absolute -bottom-4 -left-4 bg-background p-1 rounded-full"><Scissors className="h-6 w-6 text-accent -rotate-180" /></div>
      <div className="absolute -bottom-4 -right-4 bg-background p-1 rounded-full"><Scissors className="h-6 w-6 text-accent" /></div>
      
      <div className="text-center">
        <Ticket className="h-16 w-16 mx-auto text-primary mb-4" />
        <h3 className="font-headline text-2xl text-primary">{config.couponTitle}</h3>
        <p className="text-muted-foreground">{config.couponSubtitle}</p>

        <div className="my-6 bg-background rounded-md p-4">
          <p className="text-sm text-muted-foreground">Your Code</p>
          <p className="font-headline text-4xl tracking-widest">ADV-2024</p>
        </div>

        <p className="text-sm">
          Expires: <span className="font-semibold">{expiryDate}</span>
        </p>
        {isDisabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
             <p className="text-6xl font-black text-white/80 transform -rotate-12 select-none opacity-90">USED</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RewardsPage() {
  const [couponDisabled, setCouponDisabled] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const checkGameCompletion = useCallback(async (currentUser: User | null, config: GameConfig) => {
    if (isDevelopment) {
        setPageLoading(false);
        return;
    }
    
    if (!currentUser) {
       router.replace('/');
       return;
    }

    const progressRef = ref(db, `userProgress/${currentUser.uid}`);
    const snapshot = await get(progressRef);
    if (!snapshot.exists()) {
       router.replace('/');
       return;
    }
    const progress: UserProgress = snapshot.val();
    if (progress.unlockedStages < config.numberOfStages) {
      toast({ title: '아직 모든 퀘스트를 완료하지 않았습니다.', variant: 'destructive'});
      router.replace('/quests');
      return;
    }
    
    if(progress.couponUsedTimestamp && isToday(new Date(progress.couponUsedTimestamp))) {
        setCouponDisabled(true);
    }
    
    setPageLoading(false);
  }, [router, toast, isDevelopment]);

  useEffect(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    setExpiryDate(today.toLocaleString('ko-KR'));
    
    const fetchGameConfig = async () => {
      setPageLoading(true);
      try {
        const configRef = ref(db, 'config');
        const snapshot = await get(configRef);
        if (snapshot.exists()) {
          const config = snapshot.val();
          setGameConfig(config);

          if (isDevelopment) {
              await checkGameCompletion(null, config);
          } else if (!authLoading) {
              await checkGameCompletion(user, config);
          }
        } else {
           toast({ title: '게임 설정을 불러오지 못했습니다.', variant: 'destructive'});
           if (isDevelopment) setPageLoading(false);
           else router.replace('/');
        }
      } catch (error) {
        console.error(error);
        toast({ title: '오류가 발생했습니다.', variant: 'destructive'});
        if (isDevelopment) setPageLoading(false);
        else router.replace('/');
      }
    };
    
    fetchGameConfig();
  }, [user, authLoading, checkGameCompletion, isDevelopment, router, toast]);


  const handleAdminValidate = async () => {
    if (!user && !isDevelopment) {
        toast({ title: '로그인이 필요합니다.', variant: 'destructive' });
        return;
    }

    if (adminCode === gameConfig?.adminCode) {
      setCouponDisabled(true);
      
      if(user) {
          const progressRef = ref(db, `userProgress/${user.uid}`);
          await update(progressRef, { couponUsedTimestamp: new Date().getTime() });
      }

      toast({
        title: '쿠폰 사용 완료',
        description: '보상 쿠폰이 사용 처리되었습니다.',
      });
    } else {
       toast({
        title: '잘못된 관리자 코드입니다.',
        variant: 'destructive',
      });
      setAdminCode('');
    }
  };
  
  if (pageLoading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
      <div className="container py-8 text-center">
        <h1 className="font-headline text-4xl mb-2">모든 퀘스트 완료!</h1>
        <p className="text-muted-foreground mb-8">보상으로 쿠폰을 드립니다. 직원에게 이 화면을 보여주세요.</p>
        
        <CouponCard isDisabled={couponDisabled} expiryDate={expiryDate} config={gameConfig} />
        
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle className="font-headline flex items-center justify-center gap-2">
              <ShieldCheck /> 관리자 사용 확인
            </CardTitle>
            <CardDescription>직원용: 코드를 입력하여 쿠폰을 사용 처리하세요.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input 
              placeholder="관리자 코드"
              type="password"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              disabled={couponDisabled}
            />
            <Button onClick={handleAdminValidate} disabled={couponDisabled}>
              사용 확인
            </Button>
          </CardContent>
        </Card>
      </div>
  );
}
