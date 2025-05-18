
'use server';

import { analyzeScenarioDecision, type AnalyzeScenarioDecisionInput } from '@/ai/flows/analyze-scenario-decision';
import { db } from '@/lib/firebase';
import { doc, updateDoc, setDoc, getDoc, increment } from 'firebase/firestore';
import type { Scenario, ScenarioDecisionOption, ScenarioFeedback } from '@/types';
import { mockScenarios } from '@/lib/mock-data';

export async function submitScenarioDecision(
  scenarioId: string,
  userDecision: ScenarioDecisionOption,
  userId: string | null // Pass userId from client
): Promise<ScenarioFeedback | { error: string }> {
  
  const scenarioData = mockScenarios.find(s => s.id === scenarioId);

  if (!scenarioData) {
    return { error: '情境未找到。' };
  }
  if (!scenarioData.idealDecisionContext) {
    return { error: '情境未配置評分（缺少 idealDecisionContext）。' };
  }

  // Scoring logic
  let score = 0;
  const ideal = scenarioData.idealDecisionContext;
  if (userDecision.action === ideal.action) {
    if (ideal.action === 'FOLD' || ideal.action === 'CHECK') {
      score = 100;
    } else if (ideal.value !== undefined) {
      if (ideal.value === "ALL-IN" && userDecision.value === "ALL-IN") {
        score = 100;
      } else if (typeof ideal.value === 'number' && typeof userDecision.value === 'number' && userDecision.value === ideal.value) {
        score = 100;
      } else if (typeof ideal.value === 'number' && typeof userDecision.value === 'number' && userDecision.value !== ideal.value) {
        score = 25; 
      } else if (ideal.value === "ALL-IN" && userDecision.value !== "ALL-IN") {
        score = 25; 
      } else {
        score = 25; 
      }
    } else {
      // This case implies CALL, or RAISE without a specific value (e.g. a generic "Raise Pot" which might not have a pre-defined value in options)
      // If action matches and it's not FOLD/CHECK and value isn't an issue, consider it correct.
      // For simple "CALL" or "RAISE" where value matching isn't specified as critical in idealDecisionContext.
      score = 100; 
    }
  } else {
    score = 0; // Incorrect action
  }

  const aiInput: AnalyzeScenarioDecisionInput = {
    scenario: scenarioData.description,
    userDecision: `${userDecision.action}${userDecision.value ? ` ${userDecision.value}` : ''}`,
    hand: scenarioData.playerHand,
    board: scenarioData.boardCards.join(', ') || undefined,
  };
  
  let aiRecommendation = "AI 分析未能執行或失敗。";
  let aiReasoning = "由於錯誤，無法獲取AI的理由。";
  let aiConfidence = 0;

  try {
    const aiOutput = await analyzeScenarioDecision(aiInput);
    aiRecommendation = aiOutput.recommendation;
    aiReasoning = aiOutput.reasoning;
    aiConfidence = aiOutput.confidence;
  } catch (error) {
    console.error("分析情境決策時 AI 出錯:", error);
    // aiRecommendation, aiReasoning, aiConfidence will use default error values
  }
    
  const feedbackResult: ScenarioFeedback = {
    scenarioId,
    userDecision: userDecision.action,
    userFullDecisionText: userDecision.text,
    score,
    aiRecommendation,
    aiReasoning,
    aiConfidence,
    historicalContext: scenarioData.historicalContext,
    submittedAt: new Date().toISOString(),
  };
  
  // Firestore update logic
  if (userId) {
    const userDocRef = doc(db, "users", userId);
    const scenarioScoreDocRef = doc(db, "users", userId, "scenarioScores", scenarioId); 

    try {
      const userDocSnap = await getDoc(userDocRef);
      const scenarioScoreSnap = await getDoc(scenarioScoreDocRef);
      
      if (!userDocSnap.exists()) {
        // This case should ideally not happen if user is registered properly.
        // Create the user doc with initial values. Email is set during registration.
        console.warn(`User document for ${userId} not found. Creating with initial values.`);
        const initialScenariosCompleted = feedbackResult.score === 100 ? 1 : 0;
        await setDoc(userDocRef, {
            // Email is set upon registration and should not be managed here.
            scenariosCompleted: initialScenariosCompleted,
            tutorialsCompleted: 0, 
            createdAt: new Date().toISOString(),
        });
      } else {
        // User document exists. Check if scenario was previously mastered.
        const previousScore = scenarioScoreSnap.exists() ? scenarioScoreSnap.data()?.score : -1; // Use -1 or undefined if not played
        const wasPreviouslyMastered = previousScore === 100;

        if (feedbackResult.score === 100 && !wasPreviouslyMastered) {
            // Scenario is now mastered (score 100) AND was not mastered before.
            await updateDoc(userDocRef, {
              scenariosCompleted: increment(1)
            });
        }
      }
      
      // Save/update the score and details for this specific scenario
      await setDoc(scenarioScoreDocRef, {
        score: feedbackResult.score,
        userDecision: feedbackResult.userDecision,
        userFullDecisionText: feedbackResult.userFullDecisionText,
        aiRecommendation: feedbackResult.aiRecommendation,
        aiReasoning: feedbackResult.aiReasoning,
        aiConfidence: feedbackResult.aiConfidence,
        submittedAt: feedbackResult.submittedAt,
        scenarioTitle: scenarioData.title, 
        historicalContext: scenarioData.historicalContext || null,
      });
      console.log("Firestore update/set successful for user:", userId, "scenario:", scenarioId);
    } catch (dbError) {
      console.error("Failed to update Firestore for user:", userId, "scenario:", scenarioId, dbError);
    }
  } else {
    console.warn("No authenticated user ID provided to update Firestore. Scenario progress not saved.");
  }

  return feedbackResult;
}

