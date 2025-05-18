
'use client';

import React, { useEffect, useState } from 'react';
import { mockScenarios, mockLessons, BASIC_KNOWLEDGE_CHAPTER } from '@/lib/mock-data';
import { ScenarioPlayer } from '@/components/features/scenarios/scenario-player';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ScenarioPlayPage({ params }: { params: { scenarioId: string } }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const unwrappedParams = React.use(params);
  const scenario = mockScenarios.find(s => s.id === unwrappedParams.scenarioId);

  const userId = user?.uid || null;

  const [isAuthorizedForScenario, setIsAuthorizedForScenario] = useState(false);
  const [isLoadingAuthorization, setIsLoadingAuthorization] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    const checkAuthorization = async () => {
      setIsLoadingAuthorization(true);

      if (!scenario) {
        setIsLoadingAuthorization(false);
        return; // Scenario not found, will be handled by later check
      }

      if (!user) {
        // User not logged in
        if (scenario.difficulty === '中等' || scenario.difficulty === '困難') {
          toast({ title: "訪問受限", description: "請先登入以遊玩此難度的情境。", variant: "destructive" });
          router.push(`/login?redirect=${pathname}`);
          return;
        }
        setIsAuthorizedForScenario(true); // Simple scenarios accessible for guests
        setIsLoadingAuthorization(false);
        return;
      }

      // User is logged in
      if (scenario.difficulty === '簡單') {
        setIsAuthorizedForScenario(true);
        setIsLoadingAuthorization(false);
        return;
      }

      // For medium or difficult scenarios, check basic lesson completion
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        let userCompletedLessons: Record<string, boolean> = {};

        if (userDocSnap.exists()) {
          userCompletedLessons = userDocSnap.data()?.completedLessons || {};
        }

        const basicLessons = mockLessons.filter(l => l.chapter === BASIC_KNOWLEDGE_CHAPTER);
        const allBasicDone = basicLessons.length > 0 && basicLessons.every(l => !!userCompletedLessons[l.id]);

        if (allBasicDone) {
          setIsAuthorizedForScenario(true);
        } else {
          setIsAuthorizedForScenario(false);
          toast({
            title: "訪問受限",
            description: `請先完成所有「${BASIC_KNOWLEDGE_CHAPTER}」章節的教學課程，才能遊玩此難度的情境。`,
            variant: "destructive"
          });
          // No redirect here, will show access denied message
        }
      } catch (error) {
        console.error("Error fetching user progress for scenario authorization:", error);
        toast({ title: "錯誤", description: "無法驗證您的課程進度。", variant: "destructive" });
        setIsAuthorizedForScenario(false); // Deny access on error
      } finally {
        setIsLoadingAuthorization(false);
      }
    };

    checkAuthorization();

  }, [user, authLoading, router, pathname, scenario, toast, unwrappedParams.scenarioId]);


  if (authLoading || isLoadingAuthorization || (!user && !authLoading && scenario && (scenario.difficulty === '中等' || scenario.difficulty === '困難'))) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <Icons.Loader className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">正在載入情境...</p>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
        <Icons.HelpCircle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">未找到情境</h1>
        <p className="text-muted-foreground mb-6">
          您要查找的情境不存在或已被移動。
        </p>
        <Button asChild variant="outline">
          <Link href="/scenarios">
            <ArrowLeft className="mr-2 h-4 w-4" /> 返回情境列表
          </Link>
        </Button>
      </div>
    );
  }

  if (!isAuthorizedForScenario && !isLoadingAuthorization) {
     return (
      <div className="container mx-auto py-2 md:py-6 text-center">
        <Button asChild variant="outline" size="sm" className="mb-6 float-left">
          <Link href="/scenarios">
            <ArrowLeft className="mr-2 h-4 w-4" /> 返回情境列表
          </Link>
        </Button>
        <div className="clear-both"></div> {/* Clear float */}
        <Card className="max-w-lg mx-auto mt-10 shadow-lg border-destructive">
          <CardHeader>
            <CardTitle className="text-2xl text-destructive flex items-center justify-center">
              <Icons.Lock className="h-7 w-7 mr-2" />
              訪問受限
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              您需要先完成所有「{BASIC_KNOWLEDGE_CHAPTER}」章節的教學課程，才能遊玩「{scenario.difficulty}」難度的情境。
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button asChild variant="default">
                <Link href="/tutorials">
                  <Icons.BookOpen className="mr-2 h-4 w-4" /> 前往教學課程
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/scenarios">
                  <Icons.Puzzle className="mr-2 h-4 w-4" /> 查看其他情境
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2 md:py-6">
       <Button asChild variant="outline" size="sm" className="mb-6">
        <Link href="/scenarios">
          <ArrowLeft className="mr-2 h-4 w-4" /> 返回情境列表
        </Link>
      </Button>
      <ScenarioPlayer scenario={scenario} userId={userId} /> {/* Pass userId to ScenarioPlayer */}
    </div>
  );
}
