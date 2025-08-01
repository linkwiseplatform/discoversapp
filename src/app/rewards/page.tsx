
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Ticket, Scissors, ShieldCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import type { GameConfig } from '@/lib/types';

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
          <p className="mt-4 font-bold text-destructive text-xl">COUPON USED</p>
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
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && process.env.NODE_ENV !== 'development') {
      router.replace('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
     const fetchGameConfig = async () => {
      const configRef = ref(db, 'config');
      const snapshot = await get(configRef);
      if (snapshot.exists()) {
        setGameConfig(snapshot.val());
      }
    };
    fetchGameConfig();
  }, []);


  useEffect(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    setExpiryDate(today.toLocaleString());
  }, []);

  const handleAdminValidate = () => {
    if (adminCode === gameConfig?.adminCode) {
      setCouponDisabled(true);
      toast({
        title: 'Coupon Disabled',
        description: 'The reward coupon has been marked as used.',
      });
    } else {
       toast({
        title: 'Invalid Admin Code',
        variant: 'destructive',
      });
    }
  };
  
  if (loading || !gameConfig) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
      <div className="container py-8 text-center">
        <h1 className="font-headline text-4xl mb-2">You've Earned a Reward!</h1>
        <p className="text-muted-foreground mb-8">Present this coupon to claim your prize.</p>
        
        <CouponCard isDisabled={couponDisabled} expiryDate={expiryDate} config={gameConfig} />
        
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle className="font-headline flex items-center justify-center gap-2">
              <ShieldCheck /> Admin Validation
            </CardTitle>
            <CardDescription>For staff use only. Enter code to redeem coupon.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input 
              placeholder="Admin Code"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              disabled={couponDisabled}
            />
            <Button onClick={handleAdminValidate} disabled={couponDisabled}>
              Validate
            </Button>
          </CardContent>
        </Card>
      </div>
  );
}
