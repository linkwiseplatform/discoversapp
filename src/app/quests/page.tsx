
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
import { ref, onValue, get, set, update } from 'firebase/database';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Character, GameConfig, UserProgress } from '@/lib/types';

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const ConfettiBurstPiece = ({ id }: { id: number }) => {
    const style = {
        '--angle-start': `${Math.random() * 360}deg`,
        '--angle-end': `${Math.random() * 360}deg`,
        '--distance': `${Math.random() * 40 + 50}px`,
        '--duration': `${Math.random() * 0.4 + 0.6}s`,
        backgroundColor: ['#E89C27', '#3F7242', '#FFD700', '#FFFFFF'][Math.floor(Math.random() * 4)],
    } as React.CSSProperties;

    return <div key={id} className="animate-burst w-2 h-2 rounded-full absolute" style={style} />;
};


const StageClearAnimation = ({ position }: { position: { top: string, left: string } | null }) => {
    if (!position) return null;
    return (
        <div className="absolute z-50 pointer-events-none" style={{ top: position.top, left: position.left, transform: 'translate(-50%, -50%)' }}>
            <div className="relative">
                {Array.from({ length: 50 }).map((_, i) => (
                    <ConfettiBurstPiece key={i} id={i} />
                ))}
            </div>
        </div>
    );
};

const ContinuousConfettiPiece = ({ id }: { id: number }) => {
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


const GameWonOverlay = () => {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center animate-fade-in overflow-hidden">
       {/* 50% Black Overlay */}
      <div className="absolute inset-0 bg-black/50 z-0"></div>

      {/* Confetti Animation Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {Array.from({ length: 150 }).map((_, i) => (
            <ContinuousConfettiPiece key={i} id={i} />
        ))}
      </div>
      
      {/* Content Layer */}
      <div className="relative z-20 flex flex-col items-center">
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
        @keyframes burst {
            0% { transform: rotate(var(--angle-start)) translate(0); opacity: 1; }
            100% { transform: rotate(var(--angle-end)) translate(var(--distance)); opacity: 0; }
        }
        .animate-burst { animation: burst var(--duration) ease-out forwards; }

        /* Continuous Confetti Keyframes */
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
        .confetti-piece {
            position: absolute;
            width: 8px;
            height: 16px;
            will-change: transform, opacity;
            animation: fall var(--duration) linear var(--delay) infinite;
        }
      `}</style>
    </div>
  );
};

// Character and Quest Positions
const hunterStartPositions = {
    female: { top: '-6%', left: '-30%' },
    male: { top: '-6%', left: '-30%' },
};

const questPositions = [
    { top: '-1%', left: '50%' },      // 1번 퀘스트
    { top: '16%', left: '50%' },   // 2번 퀘스트
    { top: '33%', left: '50%' },     // 3번 퀘스트
    { top: '50%', left: '50%' },   // 4번 퀘스트
    { top: '68%', left: '50%' },     // 5번 퀘스트
    { top: '86%', left: '50%' },   // 6번 퀘스트
    { top: '104%', left: '50%' },     // 7번 퀘스트
    { top: '122%', left: '50%' },   // 8번 퀘스트
    { top: '140%', left: '50%' },     // 9번 퀘스트
    { top: '158%', left: '50%' }    // 10번 퀘스트
];

const boardImageUrls: Record<number, string> = {
  3: "https://firebasestorage.googleapis.com/v0/b/discoversapp.firebasestorage.app/o/stage-3.png?alt=media&token=93db99fe-9373-47a2-93dd-029476c46c9d",
  4: "https://firebasestorage.googleapis.com/v0/b/discoversapp.firebasestorage.app/o/stage-4.png?alt=media&token=663982f1-f784-4084-99e2-24f56221378f",
  5: "https://firebasestorage.googleapis.com/v0/b/discoversapp.firebasestorage.app/o/stage-5.png?alt=media&token=abf50c63-7e7b-4b7e-a8cf-a11bb2af8c13",
  6: "https://firebasestorage.googleapis.com/v0/b/discoversapp.firebasestorage.app/o/stage-6.png?alt=media&token=828e4d6d-b322-4431-bd42-245a93464cf4",
  7: "https://firebasestorage.googleapis.com/v0/b/discoversapp.firebasestorage.app/o/stage-7.png?alt=media&token=f4d5b6b6-7371-4819-a322-91349f6f405d",
  8: "https://firebasestorage.googleapis.com/v0/b/discoversapp.firebasestorage.app/o/stage-8.png?alt=media&token=59326e20-d0ed-406c-b4c0-ff50cf4d5407",
  9: "https://firebasestorage.googleapis.com/v0/b/discoversapp.firebasestorage.app/o/stage-9.png?alt=media&token=83838acb-a7a2-4135-8f6a-cf053fbaf659",
  10: "https://firebasestorage.googleapis.com/v0/b/discoversapp.firebasestorage.app/o/stage-10.png?alt=media&token=770a3a99-8eba-47ed-a85e-852664ec71fd",
};


function QuestPageContent({ user }: { user: User | null }) {
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [pageLoading, setPageLoading] = useState(false);

  const prevUnlockedStages = usePrevious(userProgress?.unlockedStages);
  const [showConfettiAt, setShowConfettiAt] = useState<{ top: string, left: string } | null>(null);

  const isDevelopment = process.env.NODE_ENV === 'development';

  const unlockedStages = userProgress?.unlockedStages ?? 0;
  const totalStages = gameConfig?.numberOfStages ?? 0;

  useEffect(() => {
    if (isDevelopment) return;

    setPageLoading(true);
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
                couponTitle: '보상 쿠폰',
                couponSubtitle: '모험을 완료해주셔서 감사합니다!',
                adminCode: '0000',
                gameStartCode: 'START'
            };
        }
        setGameConfig(fetchedConfig);

        if (user) {
          const progressRef = ref(db, `userProgress/${user.uid}`);
          onValue(progressRef, (snapshot) => {
            if (snapshot.exists()) {
              const data: UserProgress = snapshot.val();
              setUserProgress(data);
               if (data.character) {
                  setCharacter(data.character);
              } else {
                  const newCharacter = Math.random() > 0.5 ? 'male' : 'female';
                  setCharacter(newCharacter);
                  update(progressRef, { character: newCharacter });
              }
            } else {
              const newCharacter = Math.random() > 0.5 ? 'male' : 'female';
              setCharacter(newCharacter);
              const initialProgress = { 
                  uid: user.uid, 
                  name: user.displayName || '탐험가', 
                  unlockedStages: 0, 
                  lastPlayed: Date.now(),
                  character: newCharacter
              };
              set(progressRef, initialProgress);
              setUserProgress(initialProgress);
            }
            setPageLoading(false);
          });
        } else {
           setPageLoading(false);
        }
      } catch (error) {
        console.error("Failed to fetch game config:", error);
        setPageLoading(false);
      }
    };
    
    fetchConfigAndProgress();

  }, [user, isDevelopment]);

  useEffect(() => {
    if(isDevelopment) {
      const devConfig = {
          numberOfStages: 6,
          quests: Array(6).fill({description: "개발용 퀘스트 설명입니다.", qrCode: "DEV_QR"}),
          couponTitle: '개발용 쿠폰',
          couponSubtitle: '개발을 완료해주셔서 감사합니다!',
          adminCode: '0000',
          gameStartCode: 'START'
      };
      setGameConfig(devConfig);
      setUserProgress({ uid: 'dev-user', name: '개발자', unlockedStages: 0, lastPlayed: Date.now() });
      setCharacter('female');
    }
  }, [isDevelopment]);
  
   useEffect(() => {
    if (typeof prevUnlockedStages !== 'undefined' && unlockedStages > prevUnlockedStages) {
      const completedStageIndex = prevUnlockedStages; // 0-indexed, so it's the stage that was just cleared
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
  
  const handleGenderToggle = async () => {
    if (!character) return;
    const newCharacter = character === 'male' ? 'female' : 'male';
    setCharacter(newCharacter); 
    if(user && !isDevelopment) {
        try {
            await update(ref(db, `userProgress/${user.uid}`), { character: newCharacter });
        } catch (error) {
            console.error("Failed to save character preference:", error);
        }
    }
  };

  const currentHunterPosition = useMemo(() => {
    if (!character) return null;
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
  const boardImageUrl = boardImageUrls[totalStages] || '';


  if (pageLoading || !character) {
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
                className="relative w-full h-full flex justify-center items-start overflow-y-auto"
              >
              <div
                className="absolute top-[35%] w-[28%] h-auto pointer-events-auto"
              >
                 {boardImageUrl ? <Image
                    src={boardImageUrl}
                    alt={`총 ${totalStages}개의 스테이지가 있는 게임 보드`}
                    width={594} 
                    height={3840} 
                    className="w-full h-auto object-top"
                    data-ai-hint="stage background"
                    priority
                  /> : <div className="w-full aspect-[594/3840] bg-muted/20 rounded-md flex items-center justify-center text-white">보드판을 불러오는 중...</div>}
                  
                <StageClearAnimation position={showConfettiAt} />
                {!allComplete && (
                  <>
                    {currentHunterPosition && (
                      <div
                        key={character} 
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
                          alt={character === 'female' ? "여자 탐험가 캐릭터" : "남자 탐험가 캐릭터"}
                          className="w-full h-auto object-contain"
                          data-ai-hint={character === 'female' ? "female explorer" : "male explorer"}
                        />
                      </div>
                    )}
                    
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
                            <button className="focus:outline-none animate-bounce">
                              <Image
                                src="https://firebasestorage.googleapis.com/v0/b/discoversapp.firebasestorage.app/o/quest.png?alt=media&token=e5dd45f9-a905-4475-bd03-c387bbb02a31"
                                width={50}
                                height={50}
                                alt="현재 퀘스트 위치를 나타내는 물음표 아이콘"
                                className="w-full h-auto cursor-pointer"
                                data-ai-hint="quest marker"
                              />
                            </button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md text-center bg-background">
                            <DialogHeader>
                              <DialogTitle className="font-headline">퀘스트 {unlockedStages + 1}</DialogTitle>
                              <DialogDescription className="pt-2 text-base">
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
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (isDevelopment) {
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
    return <QuestPageContent user={devUser} />;
  }
  
  return <Page />;
}
