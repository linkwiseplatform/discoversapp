
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/AppLayout';
import { quests } from '@/lib/quests';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';

const mockUsers = [
  { id: 'user-1', name: 'Explorer Alice', questsCompleted: 5, lastLogin: '2 hours ago' },
  { id: 'user-2', name: 'Adventurer Bob', questsCompleted: 3, lastLogin: '1 day ago' },
  { id: 'user-3', name: 'Trailblazer Carol', questsCompleted: 5, lastLogin: '5 minutes ago' },
];

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') return;
    if (!loading && !user) {
      router.replace('/');
    }
  }, [user, loading, router]);
  
  if (loading && process.env.NODE_ENV !== 'development') {
    return (
      <AppLayout>
        <div className="container py-8">
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </AppLayout>
    );
  }


  return (
    <AppLayout>
      <div className="container py-8">
        <h1 className="font-headline text-4xl mb-4">Admin Dashboard</h1>
        <p className="text-muted-foreground mb-6">Manage your discoversapp content and users.</p>

        <Tabs defaultValue="quests">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quests">Quests</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="quests">
            <Card>
              <CardHeader>
                <CardTitle>Manage Quests</CardTitle>
                <CardDescription>
                  View and edit the adventure quests. The number of quests is set here.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quest Title</TableHead>
                      <TableHead>Icon</TableHead>
                      <TableHead>QR Code</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quests.map((quest) => (
                      <TableRow key={quest.id}>
                        <TableCell className="font-medium">{quest.title}</TableCell>
                        <TableCell><quest.icon className="h-5 w-5" /></TableCell>
                        <TableCell><Badge variant="outline">{quest.qrCode}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Overview of all registered explorers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                 <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User Name</TableHead>
                      <TableHead>Quests Completed</TableHead>
                      <TableHead>Last Login</TableHead>
                       <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.questsCompleted} / {quests.length}</TableCell>
                        <TableCell>{user.lastLogin}</TableCell>
                        <TableCell className="text-right">
                           <Button variant="ghost" size="sm">View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
             <Card>
              <CardHeader>
                <CardTitle>App Settings</CardTitle>
                <CardDescription>
                  Global configurations for the application.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="appName">App Name</Label>
                  <Input id="appName" defaultValue="discoversapp" />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Temporarily disable access to the app for users.
                    </p>
                  </div>
                  <Switch />
                </div>
                 <Button>Save Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

    