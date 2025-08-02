
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth, User } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { ref, set, get, update } from 'firebase/database';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from 'next/image';
import { ArrowLeft, VideoOff, Loader2 } from 'lucide-react';
import jsQR from 'jsqr';
import { Input } from '@/components/ui/input';
import type { GameConfig } from '@/lib/types';

function ScanPageContent({ user }: { user: User | null }) {
  const router = useRouter();
  const params = useParams();
  const questIndex = parseInt(typeof params.questId === 'string' ? params.questId : '-1', 10);

  const { toast } = useToast();
  
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [devCode, setDevCode] = useState('');
  const [pageLoading, setPageLoading] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
     const fetchGameConfig = async () => {
      setPageLoading(true);
      try {
        const configRef = ref(db, 'config');
        const snapshot = await get(configRef);
        if (snapshot.exists()) {
          setGameConfig(snapshot.val());
        }
      } catch (e) {
        console.error("Failed to fetch game config", e)
      } finally {
        setPageLoading(false);
      }
    };
    if (!isDevelopment) {
      fetchGameConfig();
    } else {
        const devConfig = {
          numberOfStages: 6,
          quests: Array(6).fill(0).map((_, i) => ({description: `개발용 퀘스트 ${i+1}`, qrCode: `DEV_QR_${i+1}`})),
          couponTitle: '개발용 쿠폰',
          couponSubtitle: '개발을 완료해주셔서 감사합니다!',
          adminCode: '0000',
          gameStartCode: 'START'
      };
      setGameConfig(devConfig);
      setPageLoading(false);
    }
  }, [isDevelopment]);

  const handleValidate = useCallback(async (scannedCode: string) => {
    if (!gameConfig || questIndex < 0 || !scannedCode) return;
    
    setIsScanning(false);
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    
    const quest = gameConfig.quests[questIndex];
    if (!quest) {
        toast({ title: '오류', description: '존재하지 않는 퀘스트입니다.', variant: 'destructive' });
        router.push('/quests');
        return;
    }

    if (scannedCode.trim().toUpperCase() === quest.qrCode.toUpperCase()) {
      const updateUserProgress = async (uid: string) => {
         try {
          const progressRef = ref(db, `userProgress/${uid}`);
          const snapshot = await get(progressRef);
          const currentProgress = snapshot.val() ?? { unlockedStages: 0 };
          const currentStages = currentProgress.unlockedStages;

          if (questIndex === currentStages) {
            const newProgress = {
                ...currentProgress,
                unlockedStages: currentStages + 1,
                lastPlayed: new Date().getTime(),
            };
            await set(progressRef, newProgress);
            
            toast({
              title: '성공!',
              description: `퀘스트를 완료했습니다!`,
              className: 'bg-primary text-primary-foreground',
            });
            router.push('/quests');
          } else {
             toast({
              title: '아직 진행할 수 없는 퀘스트입니다',
              description: '이전 퀘스트를 먼저 완료해주세요.',
              variant: 'destructive',
            });
             setTimeout(() => setIsScanning(true), 2000);
          }
        } catch (error) {
           toast({
              title: '오류',
              description: '진행 상황 저장에 실패했습니다. 다시 시도해주세요.',
              variant: 'destructive',
            });
            setTimeout(() => setIsScanning(true), 2000);
        }
      }
      
      if(user) {
        await updateUserProgress(user.uid);
      } else if (isDevelopment) {
            toast({ title: '성공 (개발 모드)', description: '퀘스트를 완료했습니다!' });
            const devProgressRef = ref(db, `userProgress/dev-user`);
            update(devProgressRef, { unlockedStages: questIndex + 1 });
            router.push('/quests');
      }
    } else {
      toast({
        title: '잘못된 코드입니다',
        description: '올바른 QR 코드를 스캔해주세요.',
        variant: 'destructive',
      });
      setTimeout(() => setIsScanning(true), 2000);
    }
  }, [gameConfig, questIndex, user, toast, router, isDevelopment]);
  
  const tick = useCallback(() => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      if (canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code && code.data) {
            handleValidate(code.data);
            return;
          }
        }
      }
    }
    if (isScanning) {
       requestRef.current = requestAnimationFrame(tick);
    }
  }, [handleValidate, isScanning]);

  useEffect(() => {
    if (isDevelopment) {
      setHasCameraPermission(true); 
      setIsScanning(false);
      return;
    }

    let stream: MediaStream | null = null;
    const getCameraPermission = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
        setIsScanning(true);
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: '카메라 접근 거부됨',
          description: 'QR 코드를 스캔하려면 브라우저 설정에서 카메라 권한을 허용해주세요.',
        });
      }
    };

    getCameraPermission();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      setIsScanning(false);
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [isDevelopment, toast]);

  useEffect(() => {
    if (isScanning && hasCameraPermission && !isDevelopment) {
      requestRef.current = requestAnimationFrame(tick);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isScanning, hasCameraPermission, isDevelopment, tick]);

  if (pageLoading || !gameConfig) {
    return (
        <div className="flex h-screen items-center justify-center bg-black">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }
  
  const quest = gameConfig.quests[questIndex];
  if (!quest) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
            <h1 className="text-2xl font-bold">퀘스트를 찾을 수 없습니다!</h1>
            <Button onClick={() => router.push('/quests')} className="mt-4">퀘스트 목록으로 돌아가기</Button>
        </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 relative text-white bg-black">
      <Image
        src="https://firebasestorage.googleapis.com/v0/b/discoversapp.firebasestorage.app/o/qrbg.jpg?alt=media&token=9250ea32-db6b-49da-83b1-ac2f8ab2eace"
        alt="QR Scan Background"
        fill
        className="object-cover -z-10 opacity-70"
        data-ai-hint="dinosaur forest"
      />
       <Button
        variant="ghost"
        size="icon"
        className="absolute top-5 left-5 z-20 text-white hover:bg-white/20 h-10 w-10"
        onClick={() => router.push("/quests")}
      >
        <ArrowLeft className="w-6 h-6" />
      </Button>

      <div className="w-full max-w-md text-center">
        <p className="mb-6 [text-shadow:1px_1px_2px_rgba(0,0,0,0.7)] text-lg">
          {quest.description}
        </p>
        <div className="relative w-full max-w-sm aspect-square mx-auto flex items-center justify-center rounded-2xl overflow-hidden border-4 border-dashed border-accent/50 bg-black">
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          
          {!isDevelopment && !hasCameraPermission && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 p-4">
              <VideoOff className="w-16 h-16 text-red-500 mb-4" />
               <Alert variant="destructive">
                 <AlertTitle>카메라 접근이 필요합니다</AlertTitle>
                 <AlertDescription>
                   QR 코드를 스캔하려면 카메라 권한을 허용해주세요.
                 </AlertDescription>
               </Alert>
            </div>
          )}

          {(hasCameraPermission && isScanning && !isDevelopment) && (
            <div className="absolute top-0 left-0 w-full h-full animate-scan-line bg-gradient-to-b from-green-400/0 via-green-400 to-green-400/0 opacity-60"></div>
          )}
          
           {isDevelopment && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 p-4 gap-4">
                <p className='text-lg'>개발 모드</p>
                <p className='text-sm'>올바른 코드: {quest.qrCode}</p>
                 <Input 
                    value={devCode}
                    onChange={(e) => setDevCode(e.target.value)}
                    placeholder="코드를 입력하세요"
                    className="text-center text-black"
                 />
                <Button onClick={() => handleValidate(devCode)}>
                    검증하기
                </Button>
             </div>
          )}
        </div>
      </div>
      <style jsx>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
        .animate-scan-line {
          position: absolute;
          left: 0;
          width: 100%;
          height: 2px;
          animation: scan 3s linear infinite;
        }
      `}</style>
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

    if (!user && process.env.NODE_ENV !== 'development') {
        router.replace('/');
        return (
            <div className="flex h-screen items-center justify-center bg-black">
                <p className="text-white">로그인이 필요합니다. 메인 페이지로 이동합니다.</p>
            </div>
        );
    }
    
    return <ScanPageContent user={user} />;
}

export default function ScanPage() {
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
      return <ScanPageContent user={devUser} />;
    }
    
    return <Page />;
}
