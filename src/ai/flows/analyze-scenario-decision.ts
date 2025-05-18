// This is an experimental implementation of the analyze-scenario-decision flow.
'use server';
/**
 * @fileOverview 一個AI代理，分析德州撲克情境中用戶的決策並提供策略建議。
 *
 * - analyzeScenarioDecision - 分析情境和決策的函數。
 * - AnalyzeScenarioDecisionInput - analyzeScenarioDecision 函數的輸入類型。
 * - AnalyzeScenarioDecisionOutput - analyzeScenarioDecision 函數的返回類型。
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeScenarioDecisionInputSchema = z.object({
  scenario: z.string().describe('德州撲克情境的描述，包含玩家位置、籌碼量和之前的行動。'),
  userDecision: z.string().describe('使用者在該情境下的決策（例如，蓋牌、跟注、加注）。'),
  hand: z.string().describe('使用者的底牌。'),
  board: z.string().optional().describe('牌桌上的公共牌（若有）（例如，翻牌、轉牌、河牌）。'),
});
export type AnalyzeScenarioDecisionInput = z.infer<typeof AnalyzeScenarioDecisionInputSchema>;

const AnalyzeScenarioDecisionOutputSchema = z.object({
  recommendation: z.string().describe('AI根據情境和使用者決策給出的策略建議。'),
  reasoning: z.string().describe('AI對建議的解釋，說明考慮的因素。'),
  confidence: z.number().describe('信賴度評分（0-1），表示AI對其建議的確定程度。'),
});
export type AnalyzeScenarioDecisionOutput = z.infer<typeof AnalyzeScenarioDecisionOutputSchema>;

export async function analyzeScenarioDecision(input: AnalyzeScenarioDecisionInput): Promise<AnalyzeScenarioDecisionOutput> {
  return analyzeScenarioDecisionFlow(input);
}

const analyzeScenarioDecisionPrompt = ai.definePrompt({
  name: 'analyzeScenarioDecisionPrompt',
  input: {schema: AnalyzeScenarioDecisionInputSchema},
  output: {schema: AnalyzeScenarioDecisionOutputSchema},
  prompt: `你是一位德州撲克策略專家。請分析以下情境和使用者的決策，然後提供策略建議、你的理由以及一個信賴度分數。請用繁體中文回答。

情境: {{{scenario}}}
使用者手牌: {{{hand}}}
公共牌: {{{board}}}
使用者決策: {{{userDecision}}}

建議:  # 建議應為一個簡潔的最佳決策，避免解釋原因
理由: # 理由為建議提供詳細的解釋
信賴度: # 提供一個數字信賴度分數，表示你對建議的確定程度。解釋為什麼信賴度分數是這樣的。`,
});

const analyzeScenarioDecisionFlow = ai.defineFlow(
  {
    name: 'analyzeScenarioDecisionFlow',
    inputSchema: AnalyzeScenarioDecisionInputSchema,
    outputSchema: AnalyzeScenarioDecisionOutputSchema,
  },
  async input => {
    const {output} = await analyzeScenarioDecisionPrompt(input);
    return output!;
  }
);
