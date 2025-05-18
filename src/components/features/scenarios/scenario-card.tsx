
import Link from 'next/link';
import type { Scenario } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { parseHand, parseBoard, type ParsedCard } from '@/lib/card-utils';
import { PlayingCard } from '@/components/ui/playing-card';
import { cn } from '@/lib/utils';

interface ScenarioCardProps {
  scenario: Scenario;
  isLocked?: boolean;
}

export function ScenarioCard({ scenario, isLocked = false }: ScenarioCardProps) {
  const playerHandCards = parseHand(scenario.playerHand);
  const boardPreviewCards = parseBoard(scenario.boardCards.slice(0,3)); // Show up to 3 board cards for preview

  return (
    <Card className={cn(
      "flex flex-col h-full hover:shadow-xl transition-shadow duration-300 bg-card",
      isLocked && "opacity-60 pointer-events-none_ bg-muted/30" // pointer-events-none is tricky with NextLink
    )}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl mb-1 text-primary">{scenario.title}</CardTitle>
          <div className="flex items-center gap-2">
            {isLocked && <Icons.Lock className="h-5 w-5 text-muted-foreground" title="請先完成基礎教學" />}
            <Badge
              variant={scenario.difficulty === '簡單' ? 'default' : scenario.difficulty === '中等' ? 'secondary' : 'destructive'}
              className={cn(
                "capitalize text-xs px-2 py-0.5",
                scenario.difficulty === '簡單' && 'bg-green-500 hover:bg-green-600 text-white',
                scenario.difficulty === '中等' && 'bg-yellow-500 hover:bg-yellow-600 text-card-foreground',
                scenario.difficulty === '困難' && 'bg-red-500 hover:bg-red-600 text-white'
              )}
            >
              {scenario.difficulty}
            </Badge>
          </div>
        </div>
        <CardDescription className="text-sm line-clamp-2 text-muted-foreground">{scenario.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <div className="space-y-1 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Icons.Users className="h-4 w-4 mr-2 text-primary" />
            <span>{scenario.numberOfPlayers} 位玩家</span>
          </div>
          <div className="flex items-center">
            <Icons.Replace className="h-4 w-4 mr-2 text-primary" />
            <span>階段: {scenario.stage}</span>
          </div>
        </div>
        <div>
          <span className="text-xs font-medium text-muted-foreground">您的手牌:</span>
          <div className="flex space-x-1 mt-1">
            {playerHandCards.map((card, index) => card && <PlayingCard key={`${card.original}-player-${index}`} card={card} size="sm" />)}
          </div>
        </div>
        {boardPreviewCards.length > 0 && (
           <div>
            <span className="text-xs font-medium text-muted-foreground">公共牌預覽:</span>
            <div className="flex space-x-1 mt-1">
              {boardPreviewCards.map((card, index) => card && <PlayingCard key={`${card.original}-board-${index}`} card={card} size="sm" />)}
              {scenario.boardCards.length > 3 && <span className="text-xs self-end ml-1 text-muted-foreground">...</span>}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {isLocked ? (
          <Button className="w-full" disabled>
            <Icons.Lock className="mr-2 h-4 w-4" />
            已鎖定
          </Button>
        ) : (
          <Button asChild className="w-full">
            <Link href={`/scenarios/${scenario.id}`}>
              開始情境 <Icons.ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
