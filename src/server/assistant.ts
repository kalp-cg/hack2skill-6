import type { DailyPlanData, SituationObject } from '../types/saans.js';
import { MAX_HISTORY_TURN_CHARS, MAX_HISTORY_TURNS, MAX_SITUATION_CHARS } from './config.js';
import { generateContentWithResilience, getGeminiClient } from './gemini.js';
import { buildChatPrompt, buildPlanPrompt, formatKnowledge, PLAN_RESPONSE_SCHEMA, SYSTEM_PROMPT } from './prompts.js';
import { retrieveKnowledge } from './rag.js';
import { sanitizeUserText } from './security.js';

const uniqueSources = (chunks: { sourceName: string }[]) => Array.from(new Set(chunks.map((c) => c.sourceName)));

/** Serializes the client-built situation for a prompt, or returns null if it is not an object or too large. */
export function serializeSituation(situation: unknown): string | null {
  if (!situation || typeof situation !== 'object' || Array.isArray(situation)) return null;
  const json = JSON.stringify(situation, null, 2);
  return json.length <= MAX_SITUATION_CHARS ? json : null;
}

/**
 * Generates a RAG-grounded, schema-constrained daily smog plan with Gemini.
 * Used by POST /api/plan and by the live mode of scripts/eval.ts.
 */
export async function generateAiPlan(situation: SituationObject): Promise<DailyPlanData> {
  const ai = getGeminiClient();
  const { air, profile } = situation;
  const ragQuery = `${air.band} AQI ${air.aqi} ${profile.conditions.join(' ')} ${profile.cookingFuel} ${profile.commuteMode} CADR purifier mask inversion`;
  const chunks = retrieveKnowledge(ragQuery, 4);

  const response = await generateContentWithResilience(ai, {
    contents: buildPlanPrompt(situation, formatKnowledge(chunks)),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      responseSchema: PLAN_RESPONSE_SCHEMA,
    },
  });

  const plan = JSON.parse((response.text ?? '{}').trim()) as DailyPlanData;
  return { ...plan, generatedAt: new Date().toISOString(), source: 'gemini-ai', ragSources: uniqueSources(chunks) };
}

/** The subset of the client situation the chat reply metadata depends on. */
interface ChatContext {
  language?: unknown;
  air?: { source?: string; city?: string };
}

export interface ChatTurnInput {
  role?: string;
  text?: unknown;
}

export interface ChatReply {
  answer: string;
  dataSource: string;
  confidence: string;
  citations: string[];
  timestamp: string;
}

/** Renders the last few turns as plain text; turn content is sanitized because it is user-controlled. */
function formatHistory(history: unknown): string {
  if (!Array.isArray(history)) return '';
  return (history as ChatTurnInput[])
    .slice(-MAX_HISTORY_TURNS)
    .map(
      (turn) =>
        `${turn.role === 'user' ? 'User' : 'SaansSaathi'}: ${sanitizeUserText(turn.text, MAX_HISTORY_TURN_CHARS)}`
    )
    .join('\n');
}

/**
 * Answers a free-text question grounded in the situation object and the retrieved knowledge base.
 * Returns null when the model produced no text.
 */
export async function answerQuestion(input: {
  question: string;
  history: unknown;
  situation: ChatContext | undefined;
  situationJson: string;
}): Promise<ChatReply | null> {
  const ai = getGeminiClient();
  const chunks = retrieveKnowledge(input.question, 3);
  const response = await generateContentWithResilience(ai, {
    contents: buildChatPrompt({
      question: input.question,
      language: input.situation?.language,
      knowledge: formatKnowledge(chunks),
      situationJson: input.situationJson,
      history: formatHistory(input.history),
    }),
    config: { systemInstruction: SYSTEM_PROMPT },
  });

  const answer = (response.text ?? '').trim();
  if (!answer) return null;

  const air = input.situation?.air;
  return {
    answer,
    dataSource:
      air?.source === 'demo-delhi-severe'
        ? 'Demo: Delhi Winter Smog + CPCB/WHO KB'
        : `Open-Meteo Live AQI (${air?.city ?? 'Local'}) + CPCB/WHO KB`,
    confidence: air?.source === 'open-meteo-live' ? 'High (Live Telemetry + RAG)' : 'High (Engine + RAG)',
    citations: uniqueSources(chunks),
    timestamp: new Date().toISOString(),
  };
}
