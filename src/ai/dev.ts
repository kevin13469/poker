
import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-scenario-decision.ts';
import '@/ai/flows/generate-scenario.ts';
import '@/ai/flows/analyze-overall-performance.ts'; // Import the new flow
