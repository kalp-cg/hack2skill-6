import { z } from 'zod';
import type { DailyPlanData, SituationObject } from '../types/saans.js';

/**
 * Runtime contracts for everything that crosses a trust boundary: request bodies from the
 * browser and the JSON plan returned by Gemini. TypeScript types alone are erased at runtime.
 */

const LANGUAGES = ['en', 'hi', 'gu'] as const;
const label = z.string().max(80);
const actionId = z.string().max(64);

/**
 * The client builds the situation object with the same engine as the server. We validate the
 * fields server code reads; the rest is embedded in the prompt as (size-capped) data only.
 */
const SituationSchema = z.looseObject({
  profile: z.looseObject({
    kids: z.array(z.looseObject({ name: label, age: z.number() })).max(12),
    conditions: z.array(z.enum(['asthma', 'copd', 'heart', 'pregnancy'])).max(4),
    cookingFuel: z.enum(['lpg', 'induction', 'biomass']),
    commuteMode: z.enum(['car', 'bike', 'metro', 'bus', 'carpool', 'cycle', 'walk']),
  }),
  air: z.looseObject({ aqi: z.number().min(0).max(1000), band: label, pm25: z.number().min(0) }),
  feedbackSummary: z.looseObject({ skippedIds: z.array(actionId).max(50), dislikedIds: z.array(actionId).max(50) }),
  language: z.enum(LANGUAGES),
});

/** Validated situation, or null when required fields are missing or malformed. */
export function parseSituation(input: unknown): SituationObject | null {
  return SituationSchema.safeParse(input).success ? (input as SituationObject) : null;
}

export const PlanRequestSchema = z.object({ situation: z.unknown() });

export const ChatRequestSchema = z.object({
  message: z.string().max(4000),
  history: z
    .array(z.object({ role: z.enum(['user', 'assistant']), text: z.string().max(4000) }))
    .max(50)
    .optional(),
  /** Optional context: only language and data-source labels are read; the rest is prompt data. */
  situation: z
    .looseObject({
      language: z.enum(LANGUAGES).optional(),
      air: z.looseObject({ source: label.optional(), city: label.optional() }).optional(),
    })
    .optional(),
});

const memberFields = {
  memberName: z.string().max(200).optional(),
  co2SavedKg: z.number().finite().optional(),
  smogScore: z.number().finite().optional(),
};

export const CommunityRequestSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('create'),
    name: z.string().max(200),
    type: z.enum(['family', 'rwa', 'school']).optional(),
    city: z.string().max(200).optional(),
    ...memberFields,
  }),
  z.object({ action: z.literal('join'), communityId: z.string().max(64), ...memberFields }),
  z.object({ action: z.literal('contribute'), communityId: z.string().max(64), ...memberFields }),
]);

const PlanBlockSchema = z.object({
  id: z.string(),
  period: z.enum(['Morning', 'Commute', 'Afternoon', 'Evening', 'Night']),
  timeRange: z.string(),
  action: z.string().min(1),
  why: z.string(),
  impact: z.object({ pm25_ug: z.number(), co2_kg: z.number(), inr: z.number(), cigarettes_approx: z.number() }),
  effort: z.enum(['easy', 'medium', 'hard']),
  category: z.enum(['routine', 'indoor', 'sustainable']),
  evidence_source: z.string(),
  confidence: z.enum(['High', 'Medium']),
});

/** Gemini's structured output; anything else is rejected rather than shown to users. */
const AiPlanSchema = z.object({
  oneLineSummary: z.string().min(1),
  adaptedNote: z.string().optional(),
  blocks: z.array(PlanBlockSchema).length(5),
  top3Actions: z.array(z.string()).length(3),
  todaysWin: z.string().min(1),
});

export type AiPlan = Omit<DailyPlanData, 'generatedAt' | 'source' | 'ragSources'>;

/** Parses and validates the model's JSON text; throws if it does not match the plan contract. */
export function parseAiPlan(text: string): AiPlan {
  const result = AiPlanSchema.safeParse(JSON.parse(text));
  if (!result.success) throw new Error('AI plan did not match the expected schema.');
  return result.data;
}
