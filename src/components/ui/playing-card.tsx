
'use client';

import type { ParsedCard } from '@/lib/card-utils';
import { cn } from '@/lib/utils';

interface PlayingCardProps {
  card: ParsedCard;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export function PlayingCard({ card, size = 'md' }: PlayingCardProps) {
  const sizeClasses = {
    xs: 'w-6 h-9 text-[8px] rounded-sm p-0.5 leading-tight', // Extra small for inline tutorial text
    sm: 'w-10 h-14 text-sm rounded',
    md: 'w-16 h-24 text-xl rounded-md',
    lg: 'w-20 h-28 text-2xl rounded-lg',
  };

  let symbolSizeClass = "text-3xl"; // For md, lg
  if (size === 'sm') symbolSizeClass = "text-2xl";
  else if (size === 'xs') symbolSizeClass = "text-base"; // Smaller symbol for xs cards

  const cornerTextClass = size === 'xs' ? 'font-semibold' : 'font-bold';

  return (
    <div
      className={cn(
        'bg-white border border-border shadow-md flex flex-col items-center justify-center relative select-none', // Explicitly setting bg-white
        sizeClasses[size],
        card.color // card.color is 'text-black' or 'text-red-500' from card-utils.ts
      )}
      aria-label={`牌 ${card.rank}${card.symbol}`}
    >
      <span className={cn("absolute top-0.5 left-0.5", cornerTextClass)}>{card.rank}</span>
      <span className={cn("absolute top-0.5 right-0.5", cornerTextClass)}>{card.symbol}</span>
      
      <span className={cn("group-hover:scale-110 transition-transform", symbolSizeClass, cornerTextClass)}>
        {card.symbol}
      </span>
      
      <span className={cn("absolute bottom-0.5 right-0.5 transform rotate-180", cornerTextClass)}>{card.rank}</span>
      <span className={cn("absolute bottom-0.5 left-0.5 transform rotate-180", cornerTextClass)}>{card.symbol}</span>
    </div>
  );
}
