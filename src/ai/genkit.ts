import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// For server-side Next.js, .env*. files are automatically loaded.
// For Genkit dev server (src/ai/dev.ts), dotenv is used which loads .env.

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
  // This warning will appear in the server console during Next.js startup or Genkit dev server startup
  // if the key is missing.
  console.warn(
    '警告：GOOGLE_API_KEY 未設定。 AI 功能可能無法運作。' +
    '請確保它已存在於您的 .env 檔案或環境變數中。'
  );
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey, // Explicitly pass the API key
    }),
  ],
  model: 'googleai/gemini-2.0-flash', // Default model for the application
});
