'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const KakaoIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.477 2 2 5.79 2 10.286C2 13.537 4.021 16.365 6.929 17.84L5.683 22L9.827 19.58C10.518 19.714 11.246 19.786 12 19.786C17.523 19.786 22 16.006 22 11.5C22 6.994 17.523 2 12 2Z" fill="#391B1B"/>
    </svg>
);

export default function Home() {
  const [step, setStep] = useState<'coupon' | 'login'>('coupon');
  const [couponCode, setCouponCode] = useState('');
  const router = useRouter();

  const handleCouponSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (couponCode.trim() !== '') {
      setStep('login');
    }
  };

  const handleKakaoLogin = () => {
    router.push('/quests');
  };

  return (
    <div className="relative min-h-screen w-full">
      <Image
        src="https://placehold.co/1920x1080.png"
        alt="A vibrant, illustrated forest background hinting at adventure."
        data-ai-hint="storybook forest"
        fill
        className="object-cover z-0"
      />
      <div className="relative z-10 flex min-h-screen w-full items-center justify-center bg-black/40 p-4">
        <Card className="w-full max-w-sm bg-background/80 backdrop-blur-sm animate-in fade-in zoom-in-95">
          <CardHeader className="text-center">
            <CardTitle className="font-headline text-4xl text-primary">discoversapp</CardTitle>
            <CardDescription className="text-lg">Your adventure starts here!</CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'coupon' ? (
              <form onSubmit={handleCouponSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="coupon" className="text-base">Enter Your Secret Code</Label>
                  <Input
                    id="coupon"
                    placeholder="e.g. ADVENTURE24"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    required
                    className="text-center text-lg"
                  />
                </div>
                <Button type="submit" className="w-full font-headline text-lg">
                  Start Adventure
                </Button>
              </form>
            ) : (
              <div className="flex flex-col items-center space-y-4 animate-in fade-in">
                <p className="text-center text-lg">Welcome, Explorer!</p>
                <Button onClick={handleKakaoLogin} className="w-full bg-[#FEE500] text-[#391B1B] hover:bg-[#FEE500]/90 font-headline text-lg">
                  <KakaoIcon />
                  <span>Login with Kakao</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
