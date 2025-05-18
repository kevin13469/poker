
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { mockLessons, BASIC_KNOWLEDGE_CHAPTER, CORE_STRATEGY_CHAPTER, ADVANCED_STRATEGY_CHAPTER, GAME_VARIANTS_AND_ADVANCED_CONCEPTS_CHAPTER } from "@/lib/mock-data";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge'; // For "已完成" badge

export default function TutorialsPage() {
  const { user, loading: authLoading } = useAuth();
  const [completedLessonsData, setCompletedLessonsData] = useState<Record<string, boolean>>({});
  const [basicKnowledgeCompleted, setBasicKnowledgeCompleted] = useState(false);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);

  useEffect(() => {
    if (authLoading) return; // Wait for auth state to resolve

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
            const allBasicDone = basicLessons.length > 0 && basicLessons.every(l => lessonsMap[l.id]);
            setBasicKnowledgeCompleted(allBasicDone);
          } else {
            // User doc doesn't exist, treat as no progress
            setCompletedLessonsData({});
            setBasicKnowledgeCompleted(false);
          }
        } catch (error) {
          console.error("Error fetching user lesson progress:", error);
          setCompletedLessonsData({}); // Fallback on error
          setBasicKnowledgeCompleted(false);
        }
      } else {
        // No user logged in, no progress
        setCompletedLessonsData({});
        setBasicKnowledgeCompleted(false);
      }
      setIsLoadingProgress(false);
    };

    fetchUserProgress();
  }, [user, authLoading]);

  const groupedLessons = mockLessons.reduce((acc, lesson) => {
    if (!acc[lesson.chapter]) {
      acc[lesson.chapter] = [];
    }
    acc[lesson.chapter].push(lesson);
    return acc;
  }, {} as Record<string, typeof mockLessons>);

  if (authLoading || isLoadingProgress) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <Icons.Loader className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">正在載入教學課程...</p>
      </div>
    );
  }

  const chapterOrder = [BASIC_KNOWLEDGE_CHAPTER, CORE_STRATEGY_CHAPTER, ADVANCED_STRATEGY_CHAPTER, GAME_VARIANTS_AND_ADVANCED_CONCEPTS_CHAPTER];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-primary">撲克教學</h1>
      <p className="text-muted-foreground">
        學習德州撲克的從基礎到進階策略的一切知識。
      </p>
      
      {!user && (
        <Card className="bg-accent/50 border-accent">
          <CardHeader>
            <CardTitle className="text-accent-foreground">提示</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-accent-foreground/90">
              <Link href="/login?redirect=/tutorials" className="underline font-semibold">登入</Link> 或 <Link href="/register?redirect=/tutorials" className="underline font-semibold">註冊</Link> 以追蹤您的學習進度並解鎖所有教學課程。
            </p>
          </CardContent>
        </Card>
      )}

      {chapterOrder.map((chapter) => {
        const lessons = groupedLessons[chapter] || [];
        if (lessons.length === 0) return null;

        const isChapterLocked = 
          (chapter === CORE_STRATEGY_CHAPTER || chapter === ADVANCED_STRATEGY_CHAPTER || chapter === GAME_VARIANTS_AND_ADVANCED_CONCEPTS_CHAPTER) && 
          !basicKnowledgeCompleted && 
          user; 

        return (
          <section key={chapter} className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2 border-border">
              <h2 className="text-2xl font-semibold">{chapter}</h2>
              {isChapterLocked && <Icons.Lock className="w-6 h-6 text-muted-foreground" title="請先完成基礎知識課程" />}
            </div>

            {isChapterLocked && (
                 <div className="p-4 bg-muted rounded-md text-center">
                    <Icons.Lock className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">完成所有「{BASIC_KNOWLEDGE_CHAPTER}」課程以解鎖此章節。</p>
                </div>
            )}

            <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${isChapterLocked ? 'opacity-50 pointer-events-none' : ''}`}>
              {lessons.sort((a, b) => a.order - b.order).map((lesson) => {
                const isLessonCompleted = !!completedLessonsData[lesson.id];
                // Lesson-specific lock (redundant if chapter is locked, but good for clarity)
                const isLessonIndividuallyLocked = isChapterLocked;

                return (
                  <Card key={lesson.id} className={`flex flex-col hover:shadow-lg transition-shadow ${isLessonIndividuallyLocked ? 'bg-muted/30' : ''}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl">{lesson.title}</CardTitle>
                        {isLessonCompleted && user && (
                          <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white text-xs">
                            <Icons.Completed className="mr-1 h-3 w-3" />
                            已完成
                          </Badge>
                        )}
                         {isLessonIndividuallyLocked && (
                            <Icons.Lock className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <CardDescription>順序: {lesson.order}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {lesson.content.substring(0, 150).replace(/#.*?\n/g, '').replace(/\*.*?\n/g, '')}...
                      </p>
                    </CardContent>
                    <CardFooter className="mt-auto">
                      <Button asChild variant="link" className="p-0 h-auto text-primary" disabled={isLessonIndividuallyLocked}>
                        <Link href={`/tutorials/${lesson.id}`} aria-disabled={isLessonIndividuallyLocked} tabIndex={isLessonIndividuallyLocked ? -1 : undefined}>
                          {isLessonIndividuallyLocked ? '已鎖定' : '閱讀課程'} <Icons.ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}
       <div className="mt-12 p-6 bg-card rounded-lg shadow">
        <h2 className="text-2xl font-semibold text-primary mb-4">更多內容即將推出！</h2>
        <p className="text-muted-foreground">
          我們正在不斷努力新增新的教學和進階內容。敬請期待！
        </p>
      </div>
    </div>
  );
}
