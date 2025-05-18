
export type ScenarioDecisionOption = {
  text: string; // 例如, "跟注 $20"
  action: string; // 例如, "CALL", "RAISE", "FOLD"
  value?: number | string; // 例如, 20 代表加注金額, or "ALL-IN"
};

export type Scenario = {
  id: string;
  title: string;
  description: string; // 初始遊戲狀態，對手之前的行動等。
  playerHand: string; // 例如, "As Kh" (黑桃A, 紅心K)
  boardCards: string[]; // 例如, ["Ad", "Qd", "Jd"] 或 ["10s", "Jh", "Qc", "Ks"]
  stage: '翻牌前' | '翻牌圈' | '轉牌圈' | '河牌圈'; // 遊戲階段
  numberOfPlayers: number;
  difficulty: '簡單' | '中等' | '困難'; // 難易度
  options: ScenarioDecisionOption[]; // 用戶可能的行動
  // 此字段代表用於評分目的的最佳決策
  idealDecisionContext: {
    action: string; // "RAISE", "CALL", "FOLD"
    value?: number | string; // RAISE/CALL 的特定金額（如果適用）。FOLD 則未定義。
    reasoning?: string;
  };
  historicalContext?: string; // 困難情境的歷史背景故事
};

export type Lesson = {
  id:string;
  title: string;
  chapter: string;
  content: string; // 課程的 Markdown 或 HTML 內容
  order: number; // 用於在章節內對課程進行排序
};

export type QuizResult = {
  id: string; // 用於資料庫儲存
  scenarioId: string;
  // userId: string; // 待身份驗證功能新增
  userDecision: string; // 用戶採取的行動，例如 "CALL"
  userFullDecisionText: string; // 用戶點擊的按鈕文本，例如 "跟注 $20"
  score: number; // 分數現在是必需的
  aiRecommendation?: string;
  aiReasoning?: string;
  aiConfidence?: number;
  historicalContext?: string; // 困難情境的歷史背景故事，從Scenario傳遞
  submittedAt: string; // ISO 日期字串
};

// 顯示給使用者的回饋類型，分數在此處是必需的。
export type ScenarioFeedback = Omit<QuizResult, 'id' | 'userId'>;

export type UserProgress = {
  completedLessons: Record<string, boolean>; // lessonId: true
  scenarioResults: Record<string, QuizResult>; // scenarioId: QuizResult
};

