'use client';

import { LoginForm } from '@/components/auth/login-form';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function LoginPage() {
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
          <CardTitle className="text-2xl font-bold tracking-tight text-primary">登入您的帳戶</CardTitle>
          <CardDescription>
            歡迎回來！請輸入您的憑證。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            還沒有帳戶嗎？{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              立即註冊
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
