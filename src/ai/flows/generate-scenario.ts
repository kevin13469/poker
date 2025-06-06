// This is an autogenerated file from Firebase Studio.
'use server';

/**
 * @fileOverview 根據使用者輸入產生自訂的德州撲克情境。
 *
 * - generateScenario - 產生德州撲克情境的函數。
 * - GenerateScenarioInput - generateScenario 函數的輸入類型。
 * - GenerateScenarioOutput - generateScenario 函數的返回類型。
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateScenarioInputSchema = z.object({
  numberOfPlayers: z
    .number()
    .min(2)
    .max(10)
    .describe('情境中的玩家數量（2-10）。'),
  playerHand: z.string().describe('玩家手牌（例如，As, Kh）。'),
  boardCards: z
    .string()
    .optional()
    .describe('牌桌上的公共牌（翻牌、轉牌、河牌）（例如，Ad, Qd, Jd）。可選。'),
  stage: z
    .enum(['翻牌前', '翻牌圈', '轉牌圈', '河牌圈']) 
    .describe('遊戲的當前階段。'),
  description: z
    .string()
    .optional()
    .describe('關於情境的任何附加資訊。'),
});
export type GenerateScenarioInput = z.infer<typeof GenerateScenarioInputSchema>;

const GenerateScenarioOutputSchema = z.object({
  scenario: z.string().describe('產生情境的詳細描述。'),
  advice: z.string().describe('針對此情境中玩家的策略建議。'),
});
export type GenerateScenarioOutput = z.infer<typeof GenerateScenarioOutputSchema>;

export async function generateScenario(input: GenerateScenarioInput): Promise<GenerateScenarioOutput> {
  return generateScenarioFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateScenarioPrompt',
  input: {schema: GenerateScenarioInputSchema},
  output: {schema: GenerateScenarioOutputSchema},
  prompt: `你是一位德州撲克專家。請根據以下資訊產生一個情境，並提供策略建議。請用繁體中文回答。

玩家數量: {{{numberOfPlayers}}}
玩家手牌: {{{playerHand}}}
公共牌: {{{boardCards}}}
階段: {{{stage}}}
描述: {{{description}}}

情境:
建議: `,
});

const generateScenarioFlow = ai.defineFlow(
  {
    name: 'generateScenarioFlow',
    inputSchema: GenerateScenarioInputSchema,
    outputSchema: GenerateScenarioOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
