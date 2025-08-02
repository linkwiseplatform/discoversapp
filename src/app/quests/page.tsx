
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { QrCode, Loader2 } from 'lucide-react';
import { useAuth, User } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { ref, onValue, get } from 'firebase/database';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Character, GameConfig, UserProgress } from '@/lib/types';

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
          src="https://firebasestorage.googleapis.com/v0/b/discoversapp.firebasestorage.app/o/finish.png?alt=media&token=ae8be852-121b-448d-b6b5-e4be228f25b5"
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
          보상 받으러 가기
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
    { top: '0%', left: '50%' },
    { top: '10.5%', left: '50%' },
    { top: '21%', left: '50%' },
    { top: '31.5%', left: '50%' },
    { top: '42%', left: '50%' },
    { top: '52.5%', left: '50%' },
    { top: '63%', left: '50%' },
    { top: '73.5%', left: '50%' },
    { top: '84%', left: '50%' },
    { top: '94.5%', left: '50%' }
];


function QuestPageContent({ user }: { user: User | null }) {
  const [unlockedStages, setUnlockedStages] = useState(0);
  const [character, setCharacter] = useState<Character>('female');
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const prevUnlockedStages = usePrevious(unlockedStages);
  const [showConfettiAt, setShowConfettiAt] = useState<{ top: string, left: string } | null>(null);
  
  const totalStages = gameConfig?.numberOfStages ?? 0;

  useEffect(() => {
     if (Math.random() > 0.5) {
        setCharacter('male');
     }
  }, []);

  useEffect(() => {
    const fetchConfigAndProgress = async () => {
      try {
        const configRef = ref(db, 'config');
        const configSnapshot = await get(configRef);
        let fetchedConfig: GameConfig;
        if (configSnapshot.exists()) {
          fetchedConfig = configSnapshot.val();
        } else {
           fetchedConfig = {
                numberOfStages: 5,
                quests: Array(5).fill({description: "퀘스트 설명을 설정해주세요.", qrCode: "CHANGE_ME"}),
                couponTitle: 'Reward Coupon',
                couponSubtitle: 'Thanks for playing!',
                adminCode: '0000',
                gameStartCode: 'START'
            };
        }
        setGameConfig(fetchedConfig);

        if (user) {
          const progressRef = ref(db, `userProgress/${user.uid}`);
          onValue(progressRef, (snapshot) => {
            const data: UserProgress | null = snapshot.val();
            const stages = data?.unlockedStages ?? 0;
            setUnlockedStages(stages);
            if (data?.character) {
              setCharacter(data.character);
            }
          });
        }
      } catch (error) {
        console.error("Failed to fetch game config:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchConfigAndProgress();

  }, [user]);
  
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
    female: "https://firebasestorage.googleapis.com/v0/b/discoversapp.firebasestorage.app/o/girl.png?alt=media&token=99cbe3f4-6423-4196-b0ad-72600ded9605",
    male: "https://firebasestorage.googleapis.com/v0/b/discoversapp.firebasestorage.app/o/boy.png?alt=media&token=c96f6d8a-40b7-4b70-b1cb-b7d6e6759bf8",
  };
  
  const handleGenderToggle = () => {
    setCharacter(prev => (prev === 'male' ? 'female' : 'male'));
  };

  const currentHunterPosition = useMemo(() => {
    if (unlockedStages === 0) {
      return hunterStartPositions[character];
    }
    return questPositions[Math.min(unlockedStages -1, questPositions.length - 1)];
  }, [unlockedStages, character]);

  const currentQuestPosition = useMemo(() => {
    if (!gameConfig || unlockedStages >= gameConfig.numberOfStages) {
      return null;
    }
    return questPositions[unlockedStages];
  }, [unlockedStages, gameConfig]);

  const progressPercentage = totalStages > 0 ? (unlockedStages / totalStages) * 100 : 0;
  const allComplete = totalStages > 0 && unlockedStages >= totalStages;
  const boardImageUrl = totalStages > 0 ? `https://firebasestorage.googleapis.com/v0/b/discovers-1logj.firebasestorage.app/o/Dino%20Hunter%2Fstage-${totalStages}.png?alt=media` : '';


  if (loading) {
    return (
        <div className="flex h-screen items-center justify-center bg-black">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }
  
  return (
     <div className="w-full min-h-screen flex flex-col bg-black">
      {allComplete && <GameWonOverlay />}
       <div className="fixed inset-0 w-full h-full -z-10">
        <Image
          src="https://firebasestorage.googleapis.com/v0/b/discoversapp.firebasestorage.app/o/gamebg.jpg?alt=media&token=dd51f500-85fe-47b3-84c4-601b234ee3f1"
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
            퀘스트 {Math.min(unlockedStages + 1, totalStages)} / {totalStages}
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
            src="https://firebasestorage.googleapis.com/v0/b/discoversapp.firebasestorage.app/o/gamebg.jpg?alt=media&token=dd51f500-85fe-47b3-84c4-601b234ee3f1"
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
                 {boardImageUrl && <Image
                    src={boardImageUrl}
                    alt={`Stage-${totalStages}`}
                    width={594} 
                    height={3840} 
                    className="w-full h-auto object-top"
                    data-ai-hint="stage background"
                  />}
                  
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
                                src="https://firebasestorage.googleapis.com/v0/b/discoversapp.firebasestorage.app/o/quest.png?alt=media&token=e5dd45f9-a905-4475-bd03-c387bbb02a31"
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
                               {gameConfig?.quests[unlockedStages]?.description || `스테이지 ${unlockedStages + 1} 퀘스트를 불러오는 중...`}
                              </DialogDescription>
                            </DialogHeader>
                            <Button asChild size="lg" className="mt-4 w-full">
                              <Link href={`/scan/${unlockedStages}`}>
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

function Page() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    router.replace('/');
    return (
      <div className="flex h-screen items-center justify-center bg-black">
         <p className="text-white">로그인이 필요합니다. 메인 페이지로 이동합니다.</p>
      </div>
    );
  }
  
  return <QuestPageContent user={user}/>;
}

export default function QuestsPage() {
    if (process.env.NODE_ENV === 'development') {
      return <QuestPageContent user={null} />;
    }
    
    return <Page />;
}

    