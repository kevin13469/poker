
'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icons } from '@/components/icons';
import { db } from '@/lib/firebase'; // Import your Firestore instance
import { doc, setDoc } from 'firebase/firestore'; // Import Firestore functions


// 定義註冊表單的 Zod 驗證 schema
const registerSchema = z.object({
  email: z.string().email({ message: '請輸入有效的電子郵件地址。' }),
  password: z.string().min(6, { message: '密碼必須至少為6個字符。' }),
  confirmPassword: z.string().min(6, { message: '確認密碼必須至少為6個字符。' }),
}).refine(data => data.password === data.confirmPassword, {
  message: '密碼和確認密碼不符。',
  path: ['confirmPassword'], // path of error
});

// 推斷出表單輸入的 TypeScript 類型
type RegisterFormInputs = z.infer<typeof registerSchema>;

// 註冊表單組件
export function RegisterForm() {
  // 獲取 toast 函數用於顯示通知
  const { toast } = useToast();
  // 獲取 Next.js 路由器
  const router = useRouter();
  // 定義一個狀態來控制加載指示器
  const [isLoading, setIsLoading] = useState(false);

  const {
    register, // 用於註冊表單輸入
    handleSubmit, // 用於處理表單提交
    formState: { errors }, // 用於獲取表單驗證錯誤
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema), // 使用 Zod 作為驗證解析器
  });

  const onSubmit: SubmitHandler<RegisterFormInputs> = async (data) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // 在 Firestore 中創建一個新文檔，文檔 ID 為用戶 UID
      if (user) {
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          scenariosCompleted: 0, 
          tutorialsCompleted: 0, // This might become a count or be deprecated if using completedLessons map
          completedLessons: {}, // Initialize as an empty map for storing lesson completion status
          createdAt: new Date().toISOString(), 
        });
      }
      toast({
        title: '註冊成功',
        description: '您的帳戶已建立。正在將您重定向...',
      });
      router.push('/dashboard'); 
    } catch (error: any) {
      let errorMessage = '註冊失敗。請檢查您的 Firebase 設定並重試。';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = '此電子郵件地址已被註冊。';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = '密碼強度不足，請使用更強的密碼。';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '電子郵件地址格式無效。';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = '電子郵件/密碼帳戶未啟用。請檢查您的 Firebase 控制台。';
      }
      
      if (!['auth/email-already-in-use', 'auth/weak-password', 'auth/invalid-email', 'auth/operation-not-allowed'].includes(error.code)) {
         console.error("Registration error:", error.code, error.message);
      }

      toast({
        title: '註冊錯誤',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // 註冊表單
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">電子郵件</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register('email')}
          className={errors.email ? 'border-destructive' : ''}
          disabled={isLoading} 
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">密碼</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register('password')}
          className={errors.password ? 'border-destructive' : ''}
          disabled={isLoading} 
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">確認密碼</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...register('confirmPassword')}
          className={errors.confirmPassword ? 'border-destructive' : ''}
          disabled={isLoading} 
        />
        {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
         {isLoading && <Icons.Loader className="mr-2 h-4 w-4 animate-spin" />}
        註冊
      </Button>
    </form>
  );
}
