'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Icons } from '@/components/icons';

const loginSchema = z.object({
  email: z.string().email({ message: '請輸入有效的電子郵件地址。' }),
  password: z.string().min(6, { message: '密碼必須至少為6個字符。' }),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: '登入成功',
        description: '歡迎回來！正在將您重定向...',
      });
      const redirectUrl = searchParams.get('redirect') || '/dashboard';
      router.push(redirectUrl);
    } catch (error: any) {
      let errorMessage = '登入失敗。請檢查您的憑證。如果問題持續，請確認應用程式的 Firebase 設定是否正確。';
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = '電子郵件或密碼錯誤。請重試。';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '電子郵件格式無效。';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = '此帳戶已被禁用。';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = '電子郵件/密碼登入方式未啟用。請檢查 Firebase 控制台中的驗證設定。';
      }
      
      // Log the full error to the console for developer debugging
      console.error("登入錯誤詳細資料:", { code: error.code, message: error.message, fullError: error });
      
      toast({
        title: '登入錯誤',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">電子郵件</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register('email')}
          className={errors.email ? 'border-destructive' : ''}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">密碼</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register('password')}
          className={errors.password ? 'border-destructive' : ''}
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Icons.Loader className="mr-2 h-4 w-4 animate-spin" />}
        登入
      </Button>
    </form>
  );
}
