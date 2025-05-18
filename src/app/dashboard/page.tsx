
'use client';

import { useState, useEffect } from "react";
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { mockLessons, mockScenarios } from '@/lib/mock-data';
import { format } from 'date-fns';
import { analyzeOverallPerformance, type OverallPerformanceAnalysisInput, type ScenarioScoreForAnalysis } from '@/ai/flows/analyze-overall-performance';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Icons } from "@/components/icons";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

interface ScenarioScore {
  id: string;
  scenarioTitle: string;
  score: number;
  submittedAt: string; // ISO string
  userFullDecisionText: string;
  aiRecommendation?: string;
  aiReasoning?: string;
  userDecision?: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [scenariosCompleted, setScenariosCompleted] = useState<number | null>(null);
  const [scenariosLoading, setScenariosLoading] = useState(true);

  const [tutorialsCompletedCount, setTutorialsCompletedCount] = useState<number>(0);
  const [totalTutorialsCount, setTotalTutorialsCount] = useState<number>(0);
  const [tutorialsLoading, setTutorialsLoading] = useState(true);

  const [scenarioScores, setScenarioScores] = useState<ScenarioScore[]>([]);
  const [scoresLoading, setScoresLoading] = useState(true);

  const [overallAnalysis, setOverallAnalysis] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const totalScenarios = mockScenarios.length;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    setTotalTutorialsCount(mockLessons.length);

    const fetchUserData = async () => {
      if (user) {
        setScenariosLoading(true);
        setTutorialsLoading(true);
        setScoresLoading(true);
        setAnalysisLoading(true); // Start loading analysis
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setScenariosCompleted(data.scenariosCompleted || 0);

            const completedLessons = data.completedLessons || {};
            const completedCount = Object.values(completedLessons).filter(status => status === true).length;
            setTutorialsCompletedCount(completedCount);
          } else {
            setScenariosCompleted(0);
            setTutorialsCompletedCount(0);
          }

          const scoresCollectionRef = collection(db, 'users', user.uid, 'scenarioScores');
          const scoresQuery = query(scoresCollectionRef, orderBy('submittedAt', 'desc'));
          const querySnapshot = await getDocs(scoresQuery);
          const fetchedScores: ScenarioScore[] = [];
          querySnapshot.forEach((docSnap) => {
            fetchedScores.push({ id: docSnap.id, ...docSnap.data() } as ScenarioScore);
          });
          setScenarioScores(fetchedScores);

          if (fetchedScores.length > 0) {
            const analysisInput: OverallPerformanceAnalysisInput = {
              scores: fetchedScores.map(s => ({
                scenarioTitle: s.scenarioTitle,
                score: s.score,
                userFullDecisionText: s.userFullDecisionText,
                aiRecommendation: s.aiRecommendation,
                aiReasoning: s.aiReasoning,
              }))
            };
            try {
              const analysisResult = await analyzeOverallPerformance(analysisInput);
              setOverallAnalysis(analysisResult.analysisText);
            } catch (aiError) {
              console.error("AI 分析整體表現時出錯:", aiError);
              setOverallAnalysis("AI 分析生成失敗，請稍後再試。");
            }
          } else {
            setOverallAnalysis(null); // No scores, no analysis
          }

        } catch (error) {
          console.error("讀取用戶數據、情境得分或生成AI分析時出錯:", error);
          setScenariosCompleted(0);
          setTutorialsCompletedCount(0);
          setScenarioScores([]);
          setOverallAnalysis("讀取數據或分析時發生錯誤。");
        } finally {
          setScenariosLoading(false);
          setTutorialsLoading(false);
          setScoresLoading(false);
          setAnalysisLoading(false); // Finish loading analysis
        }
      } else {
        setScenariosLoading(false);
        setTutorialsLoading(false);
        setScoresLoading(false);
        setAnalysisLoading(false);
        setScenariosCompleted(0);
        setTutorialsCompletedCount(0);
        setScenarioScores([]);
        setOverallAnalysis(null);
      }
    };
    fetchUserData();
  }, [user]);

  if (authLoading || (!user && !authLoading) || scenariosLoading || tutorialsLoading || scoresLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <Icons.Loader className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">正在載入紀錄...</p>
      </div>
    );
  }

  const tutorialProgressPercentage = totalTutorialsCount > 0 ? (tutorialsCompletedCount / totalTutorialsCount) * 100 : 0;

  // Helper to render analysis text with markdown-like formatting
  const renderAnalysisContent = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((paragraph, index) => {
      if (paragraph.startsWith('### ')) {
        return <h3 key={index} className="text-lg font-semibold mt-3 mb-1 text-primary">{paragraph.substring(4)}</h3>;
      }
      if (paragraph.startsWith('- **') || paragraph.startsWith('* **')) {
        const boldText = paragraph.replace(/(\*\*|__)(.*?)\1/g, '$2'); // Remove markdown bold for manual styling
        const content = boldText.substring(paragraph.startsWith('- **') ? 4 : (paragraph.startsWith('* **') ? 4 : 2));
        return (
          <p key={index} className="mb-1 pl-4">
            <span className="font-semibold">{content.split(':')[0]}:</span>
            {content.split(':').slice(1).join(':')}
          </p>
        );
      }
      if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
        return <li key={index} className="mb-1 ml-4 list-disc">{paragraph.substring(2)}</li>;
      }
      return <p key={index} className="mb-2 text-foreground/90">{paragraph}</p>;
    });
  };


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-primary">您的進度紀錄</h1>
      <p className="text-muted-foreground">
        追蹤您的學習旅程和撲克技能發展。
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已完成教學</CardTitle>
            <Icons.BookOpen className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(tutorialProgressPercentage)}%</div>
            <Progress value={tutorialProgressPercentage} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {tutorialsCompletedCount} / {totalTutorialsCount} 門課程已完成。
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已掌握情境</CardTitle>
            <Icons.Puzzle className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scenariosCompleted !== null ? scenariosCompleted : '-'} / {totalScenarios}</div>
            <p className="text-xs text-muted-foreground mt-1">
              用更多情境挑戰自己！
            </p>
          </CardContent>
        </Card>
      </div>

      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary flex items-center">
              <Icons.Brain className="mr-2 h-6 w-6" />
              AI 整體表現分析
            </CardTitle>
            <CardDescription>
              AI 教練根據您完成的情境測驗結果，提供個人化的表現分析與學習建議。
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            {analysisLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Icons.Loader className="h-10 w-10 animate-spin text-primary mb-3" />
                <p className="text-muted-foreground">AI 教練正在分析您的表現...</p>
              </div>
            ) : overallAnalysis ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {renderAnalysisContent(overallAnalysis)}
              </div>
            ) : scenarioScores.length > 0 ? (
               <div className="text-center py-12">
                <Icons.HelpCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">AI 分析生成失敗或暫無分析。請稍後再試或完成更多測驗。</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <Icons.BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">完成一些情境測驗後，AI 將在此提供您的整體表現分析。</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>情境測驗得分紀錄</CardTitle>
          <CardDescription>
            查看您在各個情境測驗中的得分和提交時間。
          </CardDescription>
        </CardHeader>
        <CardContent className="py-6">
          {scoresLoading && !scenarioScores.length ? ( // Show loader only if scores are loading and not yet available
             <div className="flex items-center justify-center py-12">
                <Icons.Loader className="h-8 w-8 animate-spin text-primary mr-2" />
                <p className="text-muted-foreground">正在載入得分紀錄...</p>
            </div>
          ) : scenarioScores.length === 0 ? (
            <div className="text-center py-12">
              <Icons.HelpCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">您尚未完成任何情境測驗。</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>情境標題</TableHead>
                  <TableHead className="text-right">得分</TableHead>
                  <TableHead className="text-right">提交時間</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scenarioScores.map((scoreItem) => (
                  <TableRow key={scoreItem.id}>
                    <TableCell className="font-medium">{scoreItem.scenarioTitle}</TableCell>
                    <TableCell className="text-right">{scoreItem.score}</TableCell>
                    <TableCell className="text-right">
                      {format(new Date(scoreItem.submittedAt), 'yyyy/MM/dd HH:mm')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

