
'use client';

import { useState, useEffect, Suspense, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { quests } from '@/lib/quests';
import type { Character } from '@/lib/types';
import { CheckCircle2, Lock, ArrowRight, ChevronsRight, RefreshCw, QrCode } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { ref, onValue, set } from 'firebase/database';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const ConfettiPiece = ({ id }: { id: number }) => {
    const style = {
        '--angle-start': `${Math.random() * 360}deg`,
        '--angle-end': `${Math.random() * 360}deg`,
        '--distance': `${Math.random() * 40 + 50}px`,
        backgroundColor: ['#E89C27', '#3F7242', '#FFD700', '#FFFFFF'][Math.floor(Math.random() * 4)],
    } as React.CSSProperties;

    return <div key={id} className="animate-burst w-2 h-2 rounded-full" style={style} />;
};

const StageClearAnimation = ({ position }: { position: { top: string, left: string } | null }) => {
    if (!position) return null;
    return (
        <div className="absolute z-50 pointer-events-none" style={{ top: position.top, left: position.left, transform: 'translate(-50%, -50%)' }}>
            <div className="relative">
                {Array.from({ length: 50 }).map((_, i) => (
                    <ConfettiPiece key={i} id={i} />
                ))}
            </div>
        </div>
    );
};

const GameWonOverlay = () => {
  const router = useRouter();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex flex-col items-center justify-center animate-fade-in overflow-hidden">
      <div className="relative z-10 flex flex-col items-center">
        <Image
          src="https://firebasestorage.googleapis.com/v0/b/discovers-1logj.firebasestorage.app/o/Dino%20Hunter%2Ffinish.png?alt=media&token=0c1d433e-6a1a-4201-b0b7-8cb07d55a1c9"
          width={300}
          height={300}
          alt="Game Finish"
          className="animate-stamp w-[300px] h-auto object-contain"
          data-ai-hint="finish stamp"
        />
        <Button
          onClick={() => router.push('/rewards')}
          size="lg"
          className="mt-8 animate-button-pop-in px-10 py-5 text-xl shadow-lg [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)]"
        >
          쿠폰받기
        </Button>
      </div>
      <style jsx>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        @keyframes stamp {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-stamp {
          animation: stamp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          animation-delay: 0.3s;
        }
        @keyframes button-pop-in {
            0% { transform: scale(0); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
        }
        .animate-button-pop-in {
            animation: button-pop-in 0.5s ease-out 1s forwards;
            transform: scale(0);
            opacity: 0;
        }
      `}</style>
    </div>
  );
};

const hunterStartPositions = {
    female: { top: '-6%', left: '-30%' },
    male: { top: '-6%', left: '-30%' },
};

const questPositions = [
    { top: '0%', left: '50%' },   // Stage 1
    { top: '17%', left: '50%' },  // Stage 2
    { top: '35%', left: '50%' },  // Stage 3
    { top: '52%', left: '50%' },  // Stage 4
    { top: '70%', left: '50%' },  // Stage 5
    { top: '88%', left: '50%' },  // Stage 6 (placeholder)
];


function QuestPageContent() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [unlockedStages, setUnlockedStages] = useState(0);
  const [character, setCharacter] = useState<Character>('female');
  const [loading, setLoading] = useState(true);

  const prevUnlockedStages = usePrevious(unlockedStages);
  const [showConfettiAt, setShowConfettiAt] = useState<{ top: string, left: string } | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setLoading(false);
      return;
    }
    
    if (authLoading) return;
    if (!user) {
      router.replace('/');
      return;
    }

    const progressRef = ref(db, `userProgress/${user.uid}`);
    const unsubscribe = onValue(progressRef, (snapshot) => {
      const data = snapshot.val();
      const stages = data?.unlockedStages ?? 0;
      setUnlockedStages(stages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, router]);
  
  
   useEffect(() => {
    if (typeof prevUnlockedStages !== 'undefined' && unlockedStages > prevUnlockedStages) {
      const completedStageIndex = prevUnlockedStages;
      if (completedStageIndex < questPositions.length) {
        const confettiPosition = questPositions[completedStageIndex];
        setShowConfettiAt(confettiPosition);
        const timer = setTimeout(() => setShowConfettiAt(null), 2000); 
        return () => clearTimeout(timer);
      }
    }
  }, [unlockedStages, prevUnlockedStages]);

  const hunterImages = {
    female: "https://firebasestorage.googleapis.com/v0/b/discovers-1logj.firebasestorage.app/o/Dino%20Hunter%2Fgirlhunter.png?alt=media&token=135375c6-9dc3-44e1-9df1-31bc58746e27",
    male: "https://firebasestorage.googleapis.com/v0/b/discovers-1logj.firebasestorage.app/o/Dino%20Hunter%2Fboyhunter.png?alt=media&token=e5611cef-127c-4e19-9bd1-cb4369818fb1",
  };
  
  const handleGenderToggle = () => {
    setCharacter(prev => (prev === 'male' ? 'female' : 'male'));
  };

  const currentHunterPosition = useMemo(() => {
    if (unlockedStages === 0) {
      return hunterStartPositions[character];
    }
    return questPositions[Math.min(unlockedStages, questPositions.length - 1)];
  }, [unlockedStages, character]);

  const currentQuestPosition = useMemo(() => {
    if (unlockedStages >= quests.length) {
      return null;
    }
    return questPositions[unlockedStages];
  }, [unlockedStages]);

  const progressPercentage = quests.length > 0 ? (unlockedStages / quests.length) * 100 : 0;
  const allComplete = quests.length > 0 && unlockedStages >= quests.length;
  const boardImageUrl = `https://firebasestorage.googleapis.com/v0/b/discovers-1logj.firebasestorage.app/o/Dino%20Hunter%2Fstage-${quests.length}.png?alt=media&token=45046bb3-86c1-49e3-8f9e-5f2b3a219bae`;

  if (loading || authLoading) {
    return (
       <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-4 w-3/4 mx-auto" />
          <Skeleton className="h-64 w-full" />
           <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }
  
  return (
     <div className="w-full min-h-screen flex flex-col bg-black">
      {allComplete && <GameWonOverlay />}
       <div className="fixed inset-0 w-full h-full -z-10">
        <Image
          src="https://firebasestorage.googleapis.com/v0/b/discovers-1logj.firebasestorage.app/o/Dino%20Hunter%2Fgamebg2.jpg?alt=media&token=6ed03c96-691e-4c76-b787-1527b19fbe86"
          alt=""
          fill
          className="object-cover blur-sm scale-105"
          aria-hidden="true"
          priority
        />
      </div>
      
       <header className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-start bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex-grow mx-4">
          <h2 className="text-center font-bold text-lg text-primary-foreground mb-1 [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">
            스테이지 {Math.min(unlockedStages + 1, quests.length)} / {quests.length}
          </h2>
          <div className="relative">
            <Progress value={progressPercentage} className="[&>div]:bg-accent" aria-label={`${progressPercentage}% progress`} />
            <Button 
              onClick={handleGenderToggle} 
              variant="ghost" 
              size="sm" 
              className="absolute top-full right-0 mt-0.5 text-primary-foreground/80 hover:text-primary-foreground h-auto px-1 py-0 text-xs"
            >
              성별바꾸기
            </Button>
          </div>
        </div>
      </header>
          
      <main className="flex-grow w-full overflow-hidden">
        <div className="relative w-full h-full">
          <Image
            src="https://firebasestorage.googleapis.com/v0/b/discovers-1logj.firebasestorage.app/o/Dino%20Hunter%2Fgamebg2.jpg?alt=media&token=6ed03c96-691e-4c76-b787-1527b19fbe86"
            alt="Game background"
            width={1080}
            height={1920}
            className="w-full h-auto object-contain object-top"
            priority
          />
          <div className="absolute inset-0 pointer-events-none">
             <div
                className="relative w-full h-full flex justify-center items-start overflow-y-auto pointer-events-auto"
              >
              <div
                className="absolute top-[35%] w-[28%] h-auto"
              >
                 <Image
                    src={boardImageUrl}
                    alt={`Stage-${quests.length}`}
                    width={594} 
                    height={3840} 
                    className="w-full h-auto object-top"
                    data-ai-hint="stage background"
                  />
                  
                <StageClearAnimation position={showConfettiAt} />
                {!allComplete && (
                  <>
                    <div
                      key={unlockedStages}
                      className="absolute z-20 h-auto transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                      style={{
                        width: character === 'female' ? '71%' : '77.5%',
                        ...currentHunterPosition,
                        transition: 'top 1s ease-in-out, left 1s ease-in-out',
                      }}
                    >
                      <Image
                        src={hunterImages[character]}
                        width={140}
                        height={140}
                        alt={character === 'female' ? "여자 헌터 캐릭터" : "남자 헌터 캐릭터"}
                        className="w-full h-auto object-contain"
                        data-ai-hint={character === 'female' ? "female hunter" : "male hunter"}
                      />
                    </div>
                    
                    {currentQuestPosition && (
                      <div
                        className="absolute z-30 w-[40%] h-auto transform -translate-x-1/2 -translate-y-1/2"
                        style={{
                          ...currentQuestPosition,
                           transition: 'top 1s ease-in-out, left 1s ease-in-out'
                        }}
                      >
                         <Dialog>
                          <DialogTrigger asChild>
                            <button className="focus:outline-none animate-jump">
                              <Image
                                src="https://firebasestorage.googleapis.com/v0/b/discovers-1logj.firebasestorage.app/o/Dino%20Hunter%2Fquest.png?alt=media&token=105eaa91-5ac2-4048-bad8-8a0d7090f822"
                                width={50}
                                height={50}
                                alt="현재 퀘스트"
                                className="w-full h-auto cursor-pointer"
                                data-ai-hint="quest marker"
                              />
                            </button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md text-center bg-background">
                            <DialogHeader>
                              <DialogTitle>퀘스트</DialogTitle>
                              <DialogDescription className="pt-2">
                               {quests[unlockedStages]?.description || `스테이지 ${unlockedStages + 1} 퀘스트를 불러오는 중...`}
                              </DialogDescription>
                            </DialogHeader>
                            <Button asChild size="lg" className="mt-4 w-full">
                              <Link href={`/scan/${quests[unlockedStages]?.id}`}>
                                <QrCode className="mr-2 h-5 w-5" />
                                QR코드 찍기
                              </Link>
                            </Button>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function QuestsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading your adventure...</div>}>
      <QuestPageContent />
    </Suspense>
  );
}

    

    