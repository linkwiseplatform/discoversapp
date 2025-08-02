
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


const ConfettiPiece = ({ id }: { id: number }) => {
    const style = {
        '--angle-start': `${Math.random() * 360}deg`,
        '--angle-end': `${Math.random() * 360 + 360}deg`,
        '--x-start': `${Math.random() * 100}vw`,
        '--y-start': `${Math.random() * -20}vh`,
        '--duration': `${Math.random() * 3 + 4}s`,
        '--delay': `${Math.random() * 2}s`,
        backgroundColor: ['#E89C27', '#3F7242', '#FFD700', '#FFFFFF', '#fde047', '#f97316', '#4ade80'][Math.floor(Math.random() * 7)],
    } as React.CSSProperties;

    return <div key={id} className="confetti-piece" style={style} />;
};

const ConfettiAnimation = () => {
    return (
        <>
            <style jsx>{`
                @keyframes fall {
                    0% {
                        transform: translate(var(--x-start), var(--y-start)) rotate(var(--angle-start));
                        opacity: 1;
                    }
                    100% {
                        transform: translate(calc(var(--x-start) + ${Math.random() * 100 - 50}px), 110vh) rotate(var(--angle-end));
                        opacity: 0;
                    }
                }

                .confetti-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    overflow: hidden;
                    z-index: -1;
                }

                .confetti-piece {
                    position: absolute;
                    width: 8px;
                    height: 16px;
                    will-change: transform, opacity;
                    animation: fall var(--duration) linear var(--delay) infinite;
                }
            `}</style>
            <div className="confetti-container">
                {Array.from({ length: 100 }).map((_, i) => (
                    <ConfettiPiece key={i} id={i} />
                ))}
            </div>
        </>
    );
};


function CountdownTimer({ expiryTimestamp }: { expiryTimestamp: number }) {
  const calculateTimeLeft = () => {
    const difference = expiryTimestamp - new Date().getTime();
    let timeLeft = {
      hours: '00',
      minutes: '00',
      seconds: '00',
    };

    if (difference > 0) {
      timeLeft = {
        hours: String(Math.floor((difference / (1000 * 60 * 60)) % 24)).padStart(2, '0'),
        minutes: String(Math.floor((difference / 1000 / 60) % 60)).padStart(2, '0'),
        seconds: String(Math.floor((difference / 1000) % 60)).padStart(2, '0'),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryTimestamp]);

  return (
    <div className="my-4 bg-background/50 rounded-md p-3">
      <p className="text-sm text-muted-foreground">남은 시간</p>
      <p className="font-mono text-3xl tracking-widest">
        {timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}
      </p>
    </div>
  );
}

function CouponCard({ isDisabled, expiryDate, expiryTimestamp, config }: { isDisabled: boolean, expiryDate: string, expiryTimestamp: number, config: GameConfig | null }) {
  const dayColors = [
    { bg: 'bg-purple-200/50', border: 'border-purple-300', text: 'text-purple-800', scissors: 'text-purple-600' }, // Sunday
    { bg: 'bg-red-200/50', border: 'border-red-300', text: 'text-red-800', scissors: 'text-red-600' }, // Monday
    { bg: 'bg-orange-200/50', border: 'border-orange-300', text: 'text-orange-800', scissors: 'text-orange-600' }, // Tuesday
    { bg: 'bg-yellow-200/50', border: 'border-yellow-300', text: 'text-yellow-800', scissors: 'text-yellow-600' }, // Wednesday
    { bg: 'bg-green-200/50', border: 'border-green-300', text: 'text-green-800', scissors: 'text-green-600' }, // Thursday
    { bg: 'bg-blue-200/50', border: 'border-blue-300', text: 'text-blue-800', scissors: 'text-blue-600' }, // Friday
    { bg: 'bg-indigo-200/50', border: 'border-indigo-300', text: 'text-indigo-800', scissors: 'text-indigo-600' }, // Saturday
  ];

  const [currentColor, setCurrentColor] = useState(dayColors[new Date().getDay()]);

  useEffect(() => {
    const dayIndex = new Date().getDay();
    setCurrentColor(dayColors[dayIndex]);
  }, []);

  if (!config) return <Skeleton className="h-60 w-full max-w-md mx-auto" />;

  return (
    <div className={cn(
      "border-2 border-dashed p-4 rounded-lg shadow-lg max-w-md mx-auto relative transition-all duration-300",
      isDisabled ? "bg-muted border-muted-foreground/50 opacity-60" : `${currentColor.bg} ${currentColor.border} ${currentColor.text}`
    )}>
      <div className="absolute -top-4 -left-4 bg-background p-1 rounded-full"><Scissors className={cn("h-6 w-6 -rotate-90", isDisabled ? "text-muted-foreground" : currentColor.scissors)} /></div>
      <div className="absolute -top-4 -right-4 bg-background p-1 rounded-full"><Scissors className={cn("h-6 w-6 rotate-90", isDisabled ? "text-muted-foreground" : currentColor.scissors)} /></div>
      <div className="absolute -bottom-4 -left-4 bg-background p-1 rounded-full"><Scissors className={cn("h-6 w-6 -rotate-180", isDisabled ? "text-muted-foreground" : currentColor.scissors)} /></div>
      <div className="absolute -bottom-4 -right-4 bg-background p-1 rounded-full"><Scissors className={cn("h-6 w-6", isDisabled ? "text-muted-foreground" : currentColor.scissors)} /></div>
      
      <div className="text-center">
        <Ticket className="h-12 w-12 mx-auto mb-2" />
        <h3 className="font-headline text-xl">{config.couponTitle}</h3>
        <p className="text-current/80 text-sm">{config.couponSubtitle}</p>

        <CountdownTimer expiryTimestamp={expiryTimestamp} />

        <p className="text-xs">
          (만료: {expiryDate})
        </p>
        {isDisabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
             <p className="text-9xl font-black text-white/80 transform -rotate-12 select-none opacity-90">USED</p>
          </div>
        )}
      </div>
    </div>
  );
}

function RewardsPageContent({ user }: { user: User | null }) {
  const [couponDisabled, setCouponDisabled] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [expiryTimestamp, setExpiryTimestamp] = useState(0);
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  const { toast } = useToast();
  const router = useRouter();
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const checkGameCompletion = useCallback(async (currentUser: User, config: GameConfig) => {
    const progressRef = ref(db, `userProgress/${currentUser.uid}`);
    const snapshot = await get(progressRef);
    if (!snapshot.exists()) {
       router.replace('/');
       return false;
    }
    const progress: UserProgress = snapshot.val();
    if (progress.unlockedStages < config.numberOfStages) {
      toast({ title: '아직 모든 퀘스트를 완료하지 않았습니다.', variant: 'destructive'});
      router.replace('/quests');
      return false;
    }
    
    if(progress.couponUsedTimestamp && isToday(new Date(progress.couponUsedTimestamp))) {
        setCouponDisabled(true);
    }
    return true;
  }, [router, toast]);

  useEffect(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    setExpiryTimestamp(today.getTime());
    setExpiryDate(today.toLocaleString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
    
    const fetchGameConfig = async () => {
      try {
        const configRef = ref(db, 'config');
        const snapshot = await get(configRef);
        if (snapshot.exists()) {
          const config = snapshot.val();
          setGameConfig(config);
          
          if (user) {
            await checkGameCompletion(user, config);
          }
        } else {
           toast({ title: '게임 설정을 불러오지 못했습니다.', variant: 'destructive'});
        }
      } catch (error) {
        console.error(error);
        toast({ title: '오류가 발생했습니다.', variant: 'destructive'});
      } finally {
        setPageLoading(false);
      }
    };
    
    if (isDevelopment) {
        setGameConfig({
            numberOfStages: 3,
            quests: [],
            couponTitle: '개발용 쿠폰',
            couponSubtitle: '모든 퀘스트를 완료하셨습니다!',
            adminCode: '1234',
            gameStartCode: 'START'
        });
        setPageLoading(false);
    } else {
        fetchGameConfig();
    }
  }, [user, checkGameCompletion, toast, isDevelopment]);


  const handleAdminValidate = async () => {
    if (!user && !isDevelopment) {
       toast({ title: '로그인이 필요합니다.', variant: 'destructive' });
       return;
    }
    
    if (adminCode === gameConfig?.adminCode) {
      setCouponDisabled(true);
      toast({
        title: '쿠폰 사용 완료',
        description: '보상 쿠폰이 사용 처리되었습니다.',
      });
      
      if(user) {
        const progressRef = ref(db, `userProgress/${user.uid}`);
        await update(progressRef, { couponUsedTimestamp: new Date().getTime() });
      }

    } else {
       toast({
        title: '잘못된 관리자 코드입니다.',
        variant: 'destructive',
      });
    }
    setAdminCode('');
  };
  
  if (pageLoading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
      <div className="container py-8 text-center relative">
        <ConfettiAnimation />
        <h1 className="font-headline text-4xl mb-8">모든 퀘스트 완료!</h1>
        
        <CouponCard isDisabled={couponDisabled} expiryDate={expiryDate} expiryTimestamp={expiryTimestamp} config={gameConfig} />
        
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

function Page() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    if (authLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        router.replace('/');
        return (
            <div className="flex h-screen items-center justify-center">
                <p>로그인이 필요합니다. 메인 페이지로 이동합니다.</p>
            </div>
        );
    }
    
    return <RewardsPageContent user={user}/>;
}

export default function RewardsPage() {
  if (process.env.NODE_ENV === 'development') {
     const devUser: User = { 
      uid: 'dev-user', 
      displayName: '개발자',
      email: 'dev@example.com',
      emailVerified: true,
      isAnonymous: true,
      photoURL: '',
      providerData: [],
      metadata: {},
      providerId: 'password',
      tenantId: null,
      delete: async () => {},
      getIdToken: async () => '',
      getIdTokenResult: async () => ({} as any),
      reload: async () => {},
      toJSON: () => ({}),
    };
    return <RewardsPageContent user={devUser} />;
  }

  return <Page />;
}
