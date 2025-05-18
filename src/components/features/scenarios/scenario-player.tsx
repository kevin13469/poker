
'use client';

import { useState, useTransition } from 'react';
import type { Scenario, ScenarioDecisionOption, ScenarioFeedback } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { submitScenarioDecision } from '@/app/scenarios/[scenarioId]/actions';
import { useToast } from "@/hooks/use-toast";
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Check, X, List } from 'lucide-react';
import { parseCard, parseHand, parseBoard, type ParsedCard } from '@/lib/card-utils';
import { PlayingCard } from '@/components/ui/playing-card';
import Link from 'next/link';


interface ScenarioPlayerProps {
  scenario: Scenario;
  userId: string | null; // Add userId prop
}

export function ScenarioPlayer({ scenario, userId }: ScenarioPlayerProps) { // Destructure userId
  const [selectedDecision, setSelectedDecision] = useState<ScenarioDecisionOption | null>(null);
  const [feedback, setFeedback] = useState<ScenarioFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [, startTransition] = useTransition();
  const { toast } = useToast();

  const playerHandCards = parseHand(scenario.playerHand);
  const boardDisplayCards = parseBoard(scenario.boardCards);

  const handleDecision = (decision: ScenarioDecisionOption) => {
    setSelectedDecision(decision);
    setIsLoading(true);
    setFeedback(null);

    startTransition(async () => {
      // Pass userId to submitScenarioDecision
      const result = await submitScenarioDecision(scenario.id, decision, userId);

      if ('error' in result) {
        toast({
          title: "錯誤",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setFeedback(result);
         toast({
          title: "決策已提交",
          description: `您的得分是 ${result.score}/100。查看AI的分析。`,
          variant: result.score === 100 ? "default" : (result.score > 0 ? "default" : "destructive"),
        });
      }
      setIsLoading(false);
    });
  };

  const getConfidenceColor = (confidence?: number) => {
    if (confidence === undefined) return 'bg-gray-500';
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const resetPlayer = () => {
    setSelectedDecision(null);
    setFeedback(null);
    setIsLoading(false);
  }

  const isCorrect = feedback && feedback.score === 100;

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-2xl md:text-3xl text-primary">{scenario.title}</CardTitle>
            <Badge
              variant={scenario.difficulty === '簡單' ? 'default' : scenario.difficulty === '中等' ? 'secondary' : 'destructive'}
               className={cn(
                scenario.difficulty === '簡單' && 'bg-green-600 text-white',
                scenario.difficulty === '中等' && 'bg-yellow-500 text-black',
                scenario.difficulty === '困難' && 'bg-red-600 text-white',
                "capitalize text-sm px-3 py-1"
              )}
            >
              {scenario.difficulty}
            </Badge>
          </div>
          <CardDescription className="text-base pt-2">{scenario.description}</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <InfoItem icon={<Icons.Users className="h-5 w-5 text-primary" />} label="玩家數量" value={`${scenario.numberOfPlayers}`} />
            <InfoItem icon={<Icons.Replace className="h-5 w-5 text-primary" />} label="階段" value={scenario.stage} />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">您的手牌:</h3>
            <div className="flex space-x-2">
              {playerHandCards.map((card, index) => card && <PlayingCard key={`${card.original}-playerhand-${index}`} card={card} size="md" />)}
            </div>
          </div>

          {boardDisplayCards.length > 0 && (
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">公共牌:</h3>
                <div className="flex flex-wrap gap-2">
                    {boardDisplayCards.map((card, index) => card && <PlayingCard key={`${card.original}-board-${index}`} card={card} size="lg" />)}
                </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!feedback && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">您的行動是？</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {scenario.options.map((option) => (
              <Button
                key={option.text}
                onClick={() => handleDecision(option)}
                disabled={isLoading || !userId} // Disable if no userId (not logged in)
                size="lg"
                className="w-full h-12 text-base"
                variant={option.action === "FOLD" ? "destructive" : option.action === "CALL" ? "secondary" : "default"}
                title={!userId ? "請先登入以儲存進度" : ""}
              >
                {isLoading && selectedDecision?.text === option.text ? (<><Icons.Loader className="mr-2 h-4 w-4 animate-spin" />分析中...</>) : option.text}
              </Button>
            ))}
             {!userId && <p className="text-sm text-muted-foreground col-span-full text-center mt-2">請登入以儲存您的答題進度。</p>}
          </CardContent>
        </Card>
      )}

      { isLoading && !feedback && (
        <div className="flex flex-col items-center justify-center p-8 bg-card rounded-lg shadow-md">
          <Icons.Brain className="h-12 w-12 text-primary animate-pulse mb-4" />
          <p className="text-lg text-muted-foreground">AI顧問正在思考... 正在計算得分...</p>
          <Progress value={50} className="w-full max-w-md mt-4 animate-pulse h-2" />
        </div>
      )}


      {feedback && (
        <>
        <Card className={cn("border-2 shadow-2xl", isCorrect ? "border-green-500" : "border-red-500")}>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className={cn("text-2xl flex items-center", isCorrect ? "text-green-500" : "text-red-500")}>
                        {isCorrect ? <Check className="h-7 w-7 mr-2" /> : <X className="h-7 w-7 mr-2" />}
                        {isCorrect ? "正確!" : " suboptimal"}
                    </CardTitle>
                    <Badge variant={isCorrect ? "default" : "destructive"} className={cn(isCorrect ? "bg-green-600" : "bg-red-600", "text-white text-lg px-4 py-1")}>
                        得分: {feedback.score}/100
                    </Badge>
                </div>
                <CardDescription>您選擇了: <span className="font-semibold text-foreground">{feedback.userFullDecisionText}</span></CardDescription>
                {!isCorrect && scenario.idealDecisionContext && (
                    <CardDescription className="pt-1">
                        最佳行動是: <span className="font-semibold text-foreground">
                            {scenario.options.find(opt => opt.action === scenario.idealDecisionContext.action && (scenario.idealDecisionContext.value === undefined || opt.value === scenario.idealDecisionContext.value))?.text || scenario.idealDecisionContext.action}
                        </span>
                    </CardDescription>
                )}
            </CardHeader>
        </Card>

        <div className="mt-6 space-y-3">
            <h3 className="text-lg font-semibold text-primary">詳細分解:</h3>
            {scenario.options.map((option) => {
            const isUserChoice = selectedDecision?.text === option.text;
            const isCorrectChoice =
                scenario.idealDecisionContext?.action === option.action &&
                (scenario.idealDecisionContext.value === undefined || scenario.idealDecisionContext.value === option.value || (option.action === "RAISE" && scenario.idealDecisionContext.value === "ALL-IN" && option.value === "ALL-IN"));


            let itemBorderColor = 'border-border';
            let icon = null;
            let badgeText: string | null = null;
            let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "outline";

            if (isCorrectChoice) {
                itemBorderColor = 'border-green-500';
                icon = <Check className="mr-2 h-5 w-5 text-green-500 shrink-0" />;
                badgeText = "正確行動";
                badgeVariant = "default";
            }

            if (isUserChoice) {
                if (isCorrectChoice) {
                    badgeText = "您的選擇 (正確)";
                } else {
                    itemBorderColor = 'border-red-500';
                    icon = <X className="mr-2 h-5 w-5 text-red-500 shrink-0" />;
                    badgeText = "您的選擇 (錯誤)";
                    badgeVariant = "destructive";
                }
            }


            return (
                <Card key={option.text} className={cn("p-3", itemBorderColor, icon || isUserChoice ? 'border-2' : 'border')}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                    {icon}
                    <span>{option.text}</span>
                    </div>
                    {badgeText && <Badge variant={badgeVariant} className={cn(isCorrectChoice && !isUserChoice ? "text-green-600 border-green-600" : "")}>{badgeText}</Badge>}
                </div>
                </Card>
            );
            })}
        </div>


        <Card className="border-primary shadow-xl mt-6">
          <CardHeader>
            <CardTitle className="text-2xl text-primary flex items-center">
              <Icons.Lightbulb className="h-7 w-7 mr-2" /> AI顧問分析
            </CardTitle>
            <CardDescription className="text-sm pt-1">
              AI 基於其模型提供策略分析。您的得分是根據本情境預設的最佳答案計算的。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant={feedback.aiConfidence && feedback.aiConfidence > 0.7 ? "default" : "destructive"} className={feedback.aiConfidence && feedback.aiConfidence > 0.7 ? "border-green-500" : feedback.aiConfidence && feedback.aiConfidence < 0.4 ? "border-red-500" : "border-yellow-500"}>
                <Icons.ShieldCheck className={cn("h-5 w-5", feedback.aiConfidence && feedback.aiConfidence > 0.7 ? "text-green-500" : feedback.aiConfidence && feedback.aiConfidence < 0.4 ? "text-red-500" : "text-yellow-500")} />
                <AlertTitle className="font-semibold text-lg">AI建議: {feedback.aiRecommendation}</AlertTitle>
                <AlertDescription className="mt-1">
                    {feedback.aiReasoning}
                </AlertDescription>
            </Alert>

            <div className="pt-2">
              <h4 className="font-semibold mb-1 text-muted-foreground">AI對其建議的信賴度:</h4>
              <div className="flex items-center">
                <Progress value={(feedback.aiConfidence || 0) * 100} className="w-full h-3 mr-2" indicatorClassName={getConfidenceColor(feedback.aiConfidence)} />
                <span className="font-bold text-foreground">{((feedback.aiConfidence || 0) * 100).toFixed(0)}%</span>
              </div>
            </div>

          </CardContent>
          <CardFooter className="flex-col sm:flex-row gap-2">
            <Button onClick={resetPlayer} variant="outline" className="w-full sm:w-auto">
              再玩一次 / 嘗試其他決策
            </Button>
            <Button asChild variant="default" className="w-full sm:w-auto">
              <Link href="/scenarios">
                <List className="mr-2 h-4 w-4" />
                返回情境列表
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {feedback.historicalContext && scenario.difficulty === '困難' && (
          <Card className="mt-6 bg-card border-secondary shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-secondary flex items-center">
                <Icons.History className="h-6 w-6 mr-2" /> 牌局背景故事
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-line">{feedback.historicalContext}</p>
            </CardContent>
          </Card>
        )}
        </>
      )}
    </div>
  );
}

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon, label, value, className }) => (
  <div className={cn("flex items-start p-3 bg-card rounded-md shadow-sm border border-border/50", className)}>
    <span className="mr-3 mt-1 shrink-0">{icon}</span>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  </div>
);

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');
