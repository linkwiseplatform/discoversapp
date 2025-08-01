
'use client';

import Link from 'next/link';
import { LogOut, MountainSnow } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from './ui/button';

function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/quests" className="flex items-center gap-2 font-headline text-2xl font-semibold text-primary mr-auto">
          <MountainSnow className="h-7 w-7" />
          <span>discoversapp</span>
        </Link>
        {user && (
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Logout</span>
          </Button>
        )}
      </div>
    </header>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  );
}
