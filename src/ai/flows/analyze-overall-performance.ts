
'use server';
/**
 * @fileOverview 一個 AI 代理，分析使用者在多個德州撲克情境測驗中的整體表現，並提供總結與改進建議。
 *
 * - analyzeOverallPerformance - 分析整體表現的函數。
 * - OverallPerformanceAnalysisInput - analyzeOverallPerformance 函數的輸入類型。
 * - OverallPerformanceAnalysisOutput - analyzeOverallPerformance 函數的返回類型。
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScenarioScoreForAnalysisSchema = z.object({
  scenarioTitle: z.string().describe('情境的標題。'),
  score: z.number().describe('使用者在此情境中獲得的分數 (0-100)。'),
  userFullDecisionText: z.string().describe('使用者選擇的完整決策文字描述 (例如，「跟注 $20」)。'),
  aiRecommendation: z.string().optional().describe('先前AI對此單一情境的建議行動。'),
  aiReasoning: z.string().optional().describe('先前AI對此單一情境建議的理由。'),
  // 可以考慮加入 scenarioDifficulty 和 scenarioStage 以提供更細緻的分析
});
export type ScenarioScoreForAnalysis = z.infer<typeof ScenarioScoreForAnalysisSchema>;

const OverallPerformanceAnalysisInputSchema = z.object({
  scores: z.array(ScenarioScoreForAnalysisSchema).describe('使用者所有已完成情境測驗的得分紀錄列表。'),
});
export type OverallPerformanceAnalysisInput = z.infer<typeof OverallPerformanceAnalysisInputSchema>;

const OverallPerformanceAnalysisOutputSchema = z.object({
  analysisText: z.string().describe('AI 生成的關於使用者整體撲克表現的分析文字，包含優勢、弱點和改進建議。'),
});
export type OverallPerformanceAnalysisOutput = z.infer<typeof OverallPerformanceAnalysisOutputSchema>;

export async function analyzeOverallPerformance(input: OverallPerformanceAnalysisInput): Promise<OverallPerformanceAnalysisOutput> {
  if (!input.scores || input.scores.length === 0) {
    return { analysisText: "尚無足夠的情境測驗資料可供分析。請先完成一些測驗。" };
  }
  return analyzeOverallPerformanceFlow(input);
}

const analyzeOverallPerformancePrompt = ai.definePrompt({
  name: 'analyzeOverallPerformancePrompt',
  input: {schema: OverallPerformanceAnalysisInputSchema},
  output: {schema: OverallPerformanceAnalysisOutputSchema},
  prompt: `你是一位資深的德州撲克教練。請分析以下這位學生的情境測驗得分紀錄，並提供一份整體表現分析與具體的改進建議。請用繁體中文回答。

分析時請考慮以下幾點：
1.  **整體趨勢**：學生在哪些類型的決策上表現較好或較差（例如，翻牌前選擇、持續下注、價值下注、詐唬判斷、聽牌決策）？可以從他們在不同情境中的得分和選擇與AI建議的差異來判斷。
2.  **牌局階段**：根據情境標題和內容（如果能推斷），學生在不同牌局階段（翻牌前、翻牌、轉牌、河牌）的表現如何？
3.  **常見錯誤**：學生是否展現出一些常見的撲克錯誤（例如，玩過多弱牌、在不利位置過於激進、未能正確評估底池賠率、對強牌未能充分榨取價值、不適當的詐唬等）？
4.  **亮點**：學生是否有表現出色的地方，例如在高分情境中做出了與AI建議一致的決策？

基於以上分析，請提供一份結構化的報告，包含：
*   **整體總結** (以「### 整體總結」開頭)：對學生目前撲克水平的簡要評價。
*   **主要優點** (以「### 主要優點」開頭)：列出學生做得好的1-2個方面，並舉例說明。
*   **待改進領域** (以「### 待改進領域」開頭)：針對學生最需要加強的1-2個方面，提供具體的、可操作的建議。可以提及他們在哪些情境題中犯了相關錯誤作為例子。
*   **學習建議** (以「### 學習建議」開頭)：推薦學生可以複習哪些教學章節或概念來改進。
*   **鼓勵語** (以「### 鼓勵語」開頭)：以積極的語氣作結。

學生的情境測驗紀錄如下:
{{#each scores}}
- **情境**: {{this.scenarioTitle}}
  - **得分**: {{this.score}}/100
  - **您的決策**: {{this.userFullDecisionText}}
  {{#if this.aiRecommendation}}- **AI建議**: {{this.aiRecommendation}}{{/if}}
  {{#if this.aiReasoning}}- **AI理由**: {{this.aiReasoning}}{{/if}}
{{/each}}

請確保分析內容具體、有建設性，並且鼓勵學習者。`,
});

const analyzeOverallPerformanceFlow = ai.defineFlow(
  {
    name: 'analyzeOverallPerformanceFlow',
    inputSchema: OverallPerformanceAnalysisInputSchema,
    outputSchema: OverallPerformanceAnalysisOutputSchema,
  },
  async (input) => {
    // 篩選掉 score 為 null 或 undefined 的情況，儘管 schema 已定義為 number
    const validScores = input.scores.filter(score => typeof score.score === 'number');
    if (validScores.length === 0) {
        return { analysisText: "提供的測驗紀錄中沒有有效的分數資訊。" };
    }

    const {output} = await analyzeOverallPerformancePrompt({scores: validScores});
    if (!output || !output.analysisText) {
        return { analysisText: "AI 分析生成失敗，請稍後再試。" };
    }
    return output;
  }
);
