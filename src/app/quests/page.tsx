'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { quests } from '@/lib/quests';
import type { Character } from '@/lib/types';
import { CheckCircle2, Lock, ArrowRight, ChevronsRight, RefreshCw } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { cn } from '@/lib/utils';

function QuestPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [completedQuests, setCompletedQuests] = useState<string[]>([]);
  const [character, setCharacter] = useState<Character>('female');

  useEffect(() => {
    const completedId = searchParams.get('completed');
    if (completedId && !completedQuests.includes(completedId)) {
      setCompletedQuests(prev => [...prev, completedId]);
      router.replace('/quests', { scroll: false });
    }
  }, [searchParams, completedQuests, router]);

  const progress = quests.length > 0 ? (completedQuests.length / quests.length) * 100 : 0;
  const allComplete = quests.length > 0 && completedQuests.length === quests.length;

  const toggleCharacter = () => {
    setCharacter(prev => (prev === 'male' ? 'female' : 'male'));
  };

  return (
    <AppLayout>
      <div className="container py-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-1 flex flex-col items-center gap-4">
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="font-headline text-center">Your Explorer</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                 <div className="relative h-48 w-48 rounded-full overflow-hidden border-4 border-primary shadow-lg">
                    <Image 
                      src={character === 'female' ? "https://placehold.co/200x200.png" : "https://placehold.co/201x201.png"} 
                      alt={character === 'female' ? 'Female explorer character' : 'Male explorer character'}
                      data-ai-hint="female explorer"
                      fill
                      className="object-cover"
                    />
                 </div>
                <Button onClick={toggleCharacter} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Switch Character
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="font-headline text-3xl">Adventure Progress</CardTitle>
                <CardDescription>{completedQuests.length} of {quests.length} quests completed</CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={progress} className="h-4" />
              </CardContent>
            </Card>

            {allComplete ? (
              <Card className="bg-primary text-primary-foreground text-center p-8 animate-in fade-in-50">
                <CardTitle className="font-headline text-4xl mb-4">Congratulations!</CardTitle>
                <CardDescription className="text-primary-foreground/80 text-lg mb-6">
                  You have completed all the quests. Your reward awaits!
                </CardDescription>
                <Button onClick={() => router.push('/rewards')} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Claim Your Reward <ChevronsRight className="ml-2 h-5 w-5" />
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {quests.map(quest => {
                  const isCompleted = completedQuests.includes(quest.id);
                  return (
                    <Card key={quest.id} className={cn("transition-all hover:shadow-lg hover:-translate-y-1", isCompleted && "bg-green-100 border-primary")}>
                      <CardHeader className="flex-row items-center gap-4 space-y-0 pb-2">
                        <quest.icon className={cn("h-8 w-8", isCompleted ? "text-primary" : "text-muted-foreground")} />
                        <CardTitle className="font-headline text-xl">{quest.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="mb-4">{quest.description}</CardDescription>
                         <Button asChild disabled={isCompleted} className="w-full">
                          <Link href={`/scan/${quest.id}`}>
                            {isCompleted ? <><CheckCircle2 className="mr-2"/> Completed</> : <>Start Quest <ArrowRight className="ml-2"/></>}
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default function QuestsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading your adventure...</div>}>
      <QuestPageContent />
    </Suspense>
  );
}
