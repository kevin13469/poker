
'use client';

import { useState, useEffect } from 'react';
import { mockScenarios, mockLessons, BASIC_KNOWLEDGE_CHAPTER } from '@/lib/mock-data';
import type { Scenario } from '@/types';
import { ScenarioCard } from '@/components/features/scenarios/scenario-card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function ScenariosPage() {
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const { user, loading: authLoading } = useAuth();
  const [completedLessonsData, setCompletedLessonsData] = useState<Record<string, boolean>>({});
  const [basicKnowledgeCompleted, setBasicKnowledgeCompleted] = useState(false);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    const fetchUserProgress = async () => {
      setIsLoadingProgress(true);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const lessonsMap = userData.completedLessons || {};
            setCompletedLessonsData(lessonsMap);

            const basicLessons = mockLessons.filter(l => l.chapter === BASIC_KNOWLEDGE_CHAPTER);
            const allBasicDone = basicLessons.length > 0 && basicLessons.every(l => !!lessonsMap[l.id]);
            setBasicKnowledgeCompleted(allBasicDone);
          } else {
            setCompletedLessonsData({});
            setBasicKnowledgeCompleted(false);
          }
        } catch (error) {
          console.error("Error fetching user lesson progress:", error);
          setCompletedLessonsData({});
          setBasicKnowledgeCompleted(false);
        }
      } else {
        setCompletedLessonsData({});
        setBasicKnowledgeCompleted(false);
      }
      setIsLoadingProgress(false);
    };

    fetchUserProgress();
  }, [user, authLoading]);

  const filteredScenarios = mockScenarios.filter(scenario => {
    const difficultyMatch = difficultyFilter === 'all' || scenario.difficulty === difficultyFilter;
    const searchTermMatch = scenario.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            scenario.description.toLowerCase().includes(searchTerm.toLowerCase());
    return difficultyMatch && searchTermMatch;
  });

  if (authLoading || isLoadingProgress) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <Icons.Loader className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">正在載入情境測驗...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">測試您的技能</h1>
        <p className="text-muted-foreground mt-1">
          透過各種德州撲克情境挑戰自己。做出您的決策並獲取 AI 提供的回饋。
        </p>
      </div>

      {!user && (
        <Card className="bg-accent/50 border-accent">
          <CardHeader>
            <CardTitle className="text-accent-foreground">提示</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-accent-foreground/90">
              <Link href="/login?redirect=/scenarios" className="underline font-semibold">登入</Link> 或 <Link href="/register?redirect=/scenarios" className="underline font-semibold">註冊</Link> 以追蹤您的答題進度並解鎖所有情境。
            </p>
          </CardContent>
        </Card>
      )}

      {user && !basicKnowledgeCompleted && (
        <Card className="bg-muted/50 border-border">
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <Icons.Lock className="w-6 h-6 text-primary" />
            <CardTitle className="text-primary">進階情境已鎖定</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              請先完成所有「{BASIC_KNOWLEDGE_CHAPTER}」章節的教學課程，才能解鎖中等和困難等級的情境測驗。
              <Button variant="link" asChild className="px-1">
                <Link href="/tutorials">前往教學課程</Link>
              </Button>
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <Input
          placeholder="搜尋情境..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="按難易度篩選" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有難易度</SelectItem>
            <SelectItem value="簡單">簡單</SelectItem>
            <SelectItem value="中等">中等</SelectItem>
            <SelectItem value="困難">困難</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredScenarios.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredScenarios.map((scenario) => {
            const isScenarioLocked =
              user &&
              (scenario.difficulty === '中等' || scenario.difficulty === '困難') &&
              !basicKnowledgeCompleted;
            return (
              <ScenarioCard key={scenario.id} scenario={scenario} isLocked={isScenarioLocked} />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Icons.HelpCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-xl font-semibold">未找到情境</p>
          <p className="text-muted-foreground">請嘗試調整您的篩選條件或搜尋詞。</p>
          { (difficultyFilter !== 'all' || searchTerm !== '') && (
            <Button variant="link" onClick={() => { setDifficultyFilter('all'); setSearchTerm(''); }} className="mt-4">
              清除篩選
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
