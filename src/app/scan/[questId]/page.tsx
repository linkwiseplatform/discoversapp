'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { quests } from '@/lib/quests';
import { AppLayout } from '@/components/AppLayout';
import { Camera } from 'lucide-react';

export default function ScanPage({ params }: { params: { questId: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const quest = quests.find(q => q.id === params.questId);

  const handleValidate = () => {
    if (quest && code.trim().toUpperCase() === quest.qrCode) {
      toast({
        title: 'Success!',
        description: `You've completed the quest: ${quest.title}`,
        className: 'bg-primary text-primary-foreground',
      });
      router.push(`/quests?completed=${quest.id}`);
    } else {
      toast({
        title: 'Incorrect Code',
        description: 'That doesn\'t look right. Please try again!',
        variant: 'destructive',
      });
    }
  };

  if (!quest) {
    return (
      <AppLayout>
        <div className="container py-8 text-center">
          <h1 className="text-2xl font-bold">Quest not found!</h1>
          <Button onClick={() => router.push('/quests')} className="mt-4">Back to Quests</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container flex items-center justify-center py-8">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <div className="flex items-center gap-4">
              <quest.icon className="h-10 w-10 text-primary" />
              <div>
                <CardTitle className="font-headline text-3xl">{quest.title}</CardTitle>
                <CardDescription>Scan the QR code or enter it below.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="aspect-square w-full rounded-lg bg-muted flex flex-col items-center justify-center text-muted-foreground">
              <Camera className="h-24 w-24 mb-4" />
              <p>QR Scanner placeholder</p>
              <p className="text-sm">(Dev mode: Use the input below)</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="code-input" className="text-base">Enter Code Here</Label>
              <Input
                id="code-input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Type the code from the QR"
                className="text-center text-lg"
              />
            </div>

            <Button onClick={handleValidate} className="w-full text-lg font-headline">
              Validate Code
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
