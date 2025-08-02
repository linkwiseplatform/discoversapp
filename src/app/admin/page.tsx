
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, User } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { ref, get, set, remove, query, orderByChild, limitToLast, onValue } from 'firebase/database';
import type { Admin, GameConfig, UserProgress } from '@/lib/types';
import QRCode from 'qrcode';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Trash2, UserPlus, Download, Loader2, Users } from 'lucide-react';

const DEFAULT_QUEST = { description: '', qrCode: '' };
const DEFAULT_CONFIG: GameConfig = {
    numberOfStages: 3,
    quests: Array(3).fill(DEFAULT_QUEST),
    couponTitle: '보상 쿠폰',
    couponSubtitle: '모험을 완료해주셔서 감사합니다!',
    adminCode: '1234',
    gameStartCode: 'START',
};

const KakaoIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.477 2 2 5.79 2 10.286C2 13.537 4.021 16.365 6.929 17.84L5.683 22L9.827 19.58C10.518 19.714 11.246 19.786 12 19.786C17.523 19.786 22 16.006 22 11.5C22 6.994 17.523 2 12 2Z" fill="#391B1B"/>
    </svg>
);

function AdminLoginPage({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-2xl">관리자 로그인</CardTitle>
          <CardDescription>
            관리자 페이지에 접근하려면 로그인이 필요합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onLogin} className="w-full gap-2">
            <KakaoIcon />
            카카오 계정으로 로그인
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminDashboard({ currentUser }: { currentUser: User }) {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<Record<string, Admin>>({});
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [qrCodeUrls, setQrCodeUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminId, setNewAdminId] = useState('');

  const [recentUsers, setRecentUsers] = useState<UserProgress[]>([]);

  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (isDevelopment) {
      setAdmins({ 'dev-id': {id: 'dev-user', name: '개발자' }});
      setConfig(DEFAULT_CONFIG);
      return;
    }

    const fetchData = async () => {
      try {
        const adminRef = ref(db, 'admins');
        const configRef = ref(db, 'config');
        
        const [adminSnapshot, configSnapshot] = await Promise.all([get(adminRef), get(configRef)]);

        if (adminSnapshot.exists()) {
          setAdmins(adminSnapshot.val());
        } else {
           setAdmins({});
        }
        
        let fetchedConfig: GameConfig;
        if (configSnapshot.exists()) {
           fetchedConfig = configSnapshot.val();
        } else {
           fetchedConfig = DEFAULT_CONFIG;
        }
        
        const numStages = fetchedConfig.numberOfStages || 3;
        const quests = fetchedConfig.quests || [];
        while (quests.length < numStages) quests.push({...DEFAULT_QUEST});
        fetchedConfig.quests = quests.slice(0, numStages);
        
        setConfig(fetchedConfig);

      } catch (error) {
        toast({ variant: 'destructive', title: '오류', description: '데이터를 불러오는 데 실패했습니다.' });
        console.error(error);
      }
    };
    fetchData();
  }, [isDevelopment, toast]);
  
  useEffect(() => {
    if (config?.quests) {
      const generateUrls = async () => {
        const urls = await Promise.all(config.quests.map(q => 
          q.qrCode ? QRCode.toDataURL(q.qrCode, { width: 1000 }) : Promise.resolve('')
        ));
        setQrCodeUrls(urls);
      };
      generateUrls();
    }
  }, [config?.quests]);

  const handleNumberOfStagesChange = (value: string) => {
    if (!config) return;
    const num = parseInt(value, 10);
    const newQuests = [...config.quests];
    while (newQuests.length < num) newQuests.push(DEFAULT_QUEST);
    setConfig({ ...config, numberOfStages: num, quests: newQuests.slice(0, num) });
  };

  const handleQuestChange = (index: number, field: 'description' | 'qrCode', value: string) => {
    if (!config) return;
    const newQuests = [...config.quests];
    newQuests[index] = { ...newQuests[index], [field]: value };
    setConfig({ ...config, quests: newQuests });
  };
  
  const handleDownloadQrCode = (url: string, index: number) => {
      if (!url) return;
      const link = document.createElement('a');
      link.href = url;
      link.download = `quest-${index + 1}-qrcode.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };
  
  const handleSaveAll = async () => {
    if (isDevelopment) {
        toast({ title: '성공 (개발 모드)', description: '저장되었습니다.' });
        return;
    }
    setSaving(true);
    try {
        await set(ref(db, 'config'), config);
        await set(ref(db, 'admins'), admins);
        toast({ title: '성공', description: '모든 설정이 저장되었습니다.' });
    } catch (error) {
        toast({ variant: 'destructive', title: '저장 실패', description: '설정 저장 중 오류가 발생했습니다.' });
        console.error(error);
    } finally {
        setSaving(false);
    }
  };

  const handleAddAdmin = () => {
    if (!newAdminName || !newAdminId) {
        toast({ variant: 'destructive', title: '입력 오류', description: '이름과 카카오 고유ID를 모두 입력해주세요.' });
        return;
    }
    const newKey = newAdminId.replace(/[.#$[\]/]/g, '_'); // Sanitize key
    setAdmins(prev => ({...prev, [newKey]: { id: newAdminId, name: newAdminName }}));
    setNewAdminName('');
    setNewAdminId('');
    toast({ title: '성공', description: '새 관리자가 추가되었습니다. 저장 버튼을 눌러 확정하세요.' });
  };
  
  const handleDeleteAdmin = (key: string) => {
      if (Object.keys(admins).length <= 1) {
          toast({ variant: 'destructive', title: '삭제 불가', description: '최소 한 명의 관리자는 있어야 합니다.'});
          return;
      }
      setAdmins(prev => {
          const newAdmins = {...prev};
          delete newAdmins[key];
          return newAdmins;
      });
      toast({ title: '성공', description: '관리자가 삭제되었습니다. 저장 버튼을 눌러 확정하세요.'});
  };

  const fetchRecentUsers = useCallback(() => {
    const fourHoursAgo = new Date().getTime() - (4 * 60 * 60 * 1000);
    const usersQuery = query(ref(db, 'userProgress'), orderByChild('lastPlayed'), limitToLast(100));

    onValue(usersQuery, (snapshot) => {
        const users: UserProgress[] = [];
        if (snapshot.exists()) {
            snapshot.forEach(childSnapshot => {
                const user = childSnapshot.val();
                if (user.lastPlayed >= fourHoursAgo) {
                    users.push({ ...user, uid: childSnapshot.key as string });
                }
            });
        }
        setRecentUsers(users.reverse());
    });
  }, []);

  const handleResetUser = async (uid: string) => {
      try {
          await remove(ref(db, `userProgress/${uid}`));
          toast({title: "초기화 성공", description: "사용자 진행 상황이 초기화되었습니다."});
          fetchRecentUsers(); // Refresh list
      } catch (error) {
          toast({variant: "destructive", title: "초기화 실패", description: "사용자 정보 삭제 중 오류가 발생했습니다."});
      }
  };

  if (!config) {
    return (
      <div className="container py-8 space-y-6">
        <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-10 w-36" />
        </div>
        <Card><CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader><CardContent><Skeleton className="h-36 w-full" /></CardContent></Card>
        <Card><CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
        <Card><CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-headline text-4xl">관리자 페이지</h1>
        <Button onClick={handleSaveAll} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          모든 설정 저장
        </Button>
      </div>
      
      {/* 관리자 관리 */}
      <Card>
        <CardHeader>
          <CardTitle>관리자 관리</CardTitle>
          <CardDescription>현재 로그인: {currentUser.displayName} ({currentUser.uid})</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex gap-4">
                <Input placeholder="새 관리자 이름" value={newAdminName} onChange={e => setNewAdminName(e.target.value)} />
                <Input placeholder="새 관리자 고유ID" value={newAdminId} onChange={e => setNewAdminId(e.target.value)} />
                <Button onClick={handleAddAdmin}><UserPlus className="mr-2"/>추가</Button>
            </div>
            <div>
                <h4 className="font-semibold mb-2">등록된 관리자 목록</h4>
                <div className="space-y-2">
                {Object.entries(admins).map(([key, admin]) => (
                    <div key={key} className="flex justify-between items-center p-2 border rounded-md">
                        <span>{admin.name} ({admin.id})</span>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteAdmin(key)}><Trash2 className="text-destructive h-4 w-4"/></Button>
                    </div>
                ))}
                </div>
            </div>
        </CardContent>
      </Card>
      
      {/* 게임 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>게임 설정</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>퀘스트 수</Label>
            <Select value={String(config.numberOfStages)} onValueChange={handleNumberOfStagesChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 8 }, (_, i) => i + 3).map(num => (
                  <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>관리자 번호 (4자리)</Label>
            <Input value={config.adminCode} maxLength={4} onChange={e => setConfig({ ...config, adminCode: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>쿠폰 제목</Label>
            <Input value={config.couponTitle} onChange={e => setConfig({ ...config, couponTitle: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>쿠폰 부제</Label>
            <Input value={config.couponSubtitle} onChange={e => setConfig({ ...config, couponSubtitle: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      {/* 퀘스트 상세정보 */}
      <Card>
        <CardHeader><CardTitle>퀘스트 상세정보</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {config.quests.map((quest, index) => (
            <div key={index} className="border p-4 rounded-md space-y-4">
              <h4 className="font-bold text-lg">Quest {index + 1}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>퀘스트 내용</Label>
                    <Input value={quest.description} onChange={e => handleQuestChange(index, 'description', e.target.value)} />
                    <Label>QR코드 값</Label>
                    <Input value={quest.qrCode} onChange={e => handleQuestChange(index, 'qrCode', e.target.value)} />
                  </div>
                  <div className="text-center space-y-2">
                    {qrCodeUrls[index] ? (
                        <>
                        <img src={qrCodeUrls[index]} alt={`QR Code for Quest ${index + 1}`} className="mx-auto border rounded-md" />
                        <Button onClick={() => handleDownloadQrCode(qrCodeUrls[index], index)} size="sm"><Download className="mr-2"/>다운로드</Button>
                        </>
                    ) : <div className="w-full aspect-square bg-muted rounded-md flex items-center justify-center text-muted-foreground">QR 코드를 생성하려면 값을 입력하세요.</div>}
                  </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      
       {/* 관리자 기능 */}
      <Card>
        <CardHeader><CardTitle>관리자 기능</CardTitle></CardHeader>
        <CardContent className="space-y-4">
             <div className="space-y-2">
                <Label>게임 시작 코드</Label>
                <Input value={config.gameStartCode} onChange={e => setConfig({ ...config, gameStartCode: e.target.value })} />
             </div>
             
             <Dialog onOpenChange={(open) => open && fetchRecentUsers()}>
                <DialogTrigger asChild>
                    <Button variant="destructive"><Users className="mr-2"/>특정 사용자 초기화</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>사용자 진행상황 초기화</DialogTitle>
                        <DialogDescription>
                            초기화할 사용자를 선택하세요. 이 작업은 되돌릴 수 없습니다. (최근 4시간 접속자)
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-64 overflow-y-auto space-y-2 p-1">
                        {recentUsers.length > 0 ? recentUsers.map(u => (
                            <div key={u.uid} className="flex justify-between items-center p-2 border rounded-md">
                                <div>
                                    <p className="font-semibold">{u.name}</p>
                                    <p className="text-sm text-muted-foreground">진행: {u.unlockedStages} 스테이지</p>
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="destructive" size="sm">초기화</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>정말로 초기화하시겠습니까?</DialogTitle>
                                            <DialogDescription>
                                                {u.name}님의 데이터를 삭제합니다. 이 작업은 되돌릴 수 없습니다.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button variant="ghost">취소</Button>
                                            </DialogClose>
                                            <DialogClose asChild>
                                                <Button variant="destructive" onClick={() => handleResetUser(u.uid)}>확인</Button>
                                            </DialogClose>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        )) : <p>최근 접속한 사용자가 없습니다.</p>}
                    </div>
                </DialogContent>
             </Dialog>

        </CardContent>
      </Card>

    </div>
  );
}

function Page() {
  const { user, loading, loginWithGoogle, isAdmin, isAdminLoading } = useAuth();
  const router = useRouter();

  if (loading || isAdminLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return <AdminLoginPage onLogin={loginWithGoogle} />;
  }

  if (!isAdmin) {
    router.replace('/');
    return (
       <div className="flex h-screen items-center justify-center">
         <p>관리자 권한이 없습니다. 메인 페이지로 이동합니다.</p>
      </div>
    );
  }

  return <AdminDashboard currentUser={user} />;
}

export default function AdminPage() {
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
    return <AdminDashboard currentUser={devUser} />;
  }

  return <Page />;
}
