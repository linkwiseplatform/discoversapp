
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AppLayout } from '@/components/AppLayout';
import { Ticket, Scissors, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

function CouponCard({ isDisabled, expiryDate }: { isDisabled: boolean, expiryDate: string }) {
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
        <h3 className="font-headline text-2xl text-primary">Special Reward Coupon</h3>
        <p className="text-muted-foreground">Thank you for completing the adventure!</p>

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
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') return;
    if (!loading && !user) {
      router.replace('/');
    }
  }, [user, loading, router]);


  useEffect(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    setExpiryDate(today.toLocaleString());
  }, []);

  const handleAdminValidate = () => {
    if (adminCode.toUpperCase() === 'DISABLE') {
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
  
  if (loading && process.env.NODE_ENV !== 'development') {
    return (
      <AppLayout>
        <div className="container py-8 text-center space-y-4">
          <Skeleton className="h-10 w-2/3 mx-auto" />
          <Skeleton className="h-64 w-full max-w-md mx-auto" />
           <Skeleton className="h-48 w-full max-w-md mx-auto" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container py-8 text-center">
        <h1 className="font-headline text-4xl mb-2">You've Earned a Reward!</h1>
        <p className="text-muted-foreground mb-8">Present this coupon to claim your prize.</p>
        
        <CouponCard isDisabled={couponDisabled} expiryDate={expiryDate} />
        
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
    </AppLayout>
  );
}

    