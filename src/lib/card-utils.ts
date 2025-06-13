
// src/lib/card-utils.ts

export interface ParsedCard {
  rank: string; // 將儲存 '10' 而不是 'T'
  suit: string; // 's', 'h', 'd', 'c'
  symbol: string; // '♠', '♥', '♦', '♣'
  color: 'text-red-500' | 'text-black'; // Tailwind color class for text
  original: string;
}

const suitSymbols: Record<string, string> = {
  s: '♠', // Spades
  h: '♥', // Hearts
  d: '♦', // Diamonds
  c: '♣',  // Clubs
};

const suitColors: Record<string, 'text-red-500' | 'text-black'> = {
  s: 'text-black',   // Spades are black text
  h: 'text-red-500',   // Hearts are red text
  d: 'text-red-500',   // Diamonds are red text
  c: 'text-black', // Clubs are black text
};

export function parseCard(cardString: string): ParsedCard | null {
  if (!cardString || cardString.length < 2 || cardString.length > 3) { // 長度 3 for "10s"
    console.warn(`Invalid card string: ${cardString}`);
    return null;
  }

  let rank = cardString.slice(0, -1).toUpperCase(); // 取得 rank, 轉換為大寫以處理 "T"
  const suit = cardString.slice(-1).toLowerCase();

  if (!suitSymbols[suit]) {
    console.warn(`Invalid suit in card string: ${cardString}`);
    return null;
  }

  // 將 'T' 標準化為 '10'
  if (rank === 'T') {
    rank = '10';
  }

  // 更新 validRanks, "10" 是標準形式。
  const validRanks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  if (!validRanks.includes(rank)) {
      console.warn(`Invalid rank in card string: ${cardString} (parsed rank: ${rank})`);
      return null;
  }


  return {
    rank: rank, // 儲存 '10'
    suit: suit,
    symbol: suitSymbols[suit],
    color: suitColors[suit],
    original: cardString,
  };
}

export function parseHand(handString: string): (ParsedCard | null)[] {
    if (!handString) return [];
    return handString.split(' ').map(cs => parseCard(cs.trim())).filter(Boolean);
}

export function parseBoard(boardCards: string[]): (ParsedCard | null)[] {
    if (!boardCards || boardCards.length === 0) return [];
    return boardCards.map(cs => parseCard(cs.trim())).filter(Boolean);
}
