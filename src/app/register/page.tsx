'use client';

import { RegisterForm } from '@/components/auth/register-form';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function RegisterPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard'); // Redirect to dashboard if already logged in
    }
  }, [user, loading, router]);

  if (loading || (!loading && user)) {
    return <div className="flex justify-center items-center min-h-screen"><p>載入中...</p></div>;
  }
  
  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-primary">建立新帳戶</CardTitle>
          <CardDescription>
            加入我們，開始您的撲克學習之旅！
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            已經有帳戶了？{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              點此登入
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
