export type AppLanguage = 'en' | 'hi' | 'gu';
export type HomeTab = 'today' | 'plan' | 'impact' | 'ask' | 'community';

export type CommuteMode = 'car' | 'bike' | 'metro' | 'bus' | 'carpool' | 'cycle' | 'walk';
export type CookingFuel = 'lpg' | 'induction' | 'biomass';
export type HeatingType = 'none' | 'electric_heater' | 'wood_coal';
export type HomeType = 'flat' | 'house';
export type GoalType = 'health' | 'emissions' | 'money' | 'all';
export type HealthCondition = 'asthma' | 'copd' | 'heart' | 'pregnancy';

export interface CityInfo {
  id: string;
  name: string;
  area: string;
  state: string;
  lat: number;
  lon: number;
}

export interface KidMember {
  name: string;
  age: number;
}

export interface SaansProfile {
  completedOnboarding: boolean;
  userName: string;
  city: CityInfo;
  adults: number;
  kids: KidMember[];
  elders: number;
  conditions: HealthCondition[];
  hasPets: boolean;
  commuteMode: CommuteMode;
  commuteDistanceKm: number;
  wfhDaysPerWeek: number;
  cookingFuel: CookingFuel;
  heating: HeatingType;
  hasPurifier: boolean;
  homeType: HomeType;
  floorNumber: number;
  windowExposure: 'main_road' | 'courtyard' | 'park_facing';
  goal: GoalType;
  alertThresholdAqi: number;
}

export interface ForecastHour {
  isoTime: string;
  label: string; // e.g. "14:00"
  dayLabel: string; // "Today" | "Tomorrow"
  hourIndex: number; // 0..47
  hourOfDay: number; // 0..23
  aqi: number;
  pm25: number;
  pm10: number;
}

export interface AirSnapshot {
  city: CityInfo;
  source: 'open-meteo-live' | 'demo-delhi-severe' | 'cached-fallback';
  updatedAt: string;
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  o3: number;
  tempC: number;
  humidityPct: number;
  windKmh: number;
  mixingHeightM: number;
  forecast48h: ForecastHour[];
}

export interface AqiBand {
  label: string;
  shortLabel: string;
  band: 'good' | 'satisfactory' | 'moderate' | 'poor' | 'very_poor' | 'severe';
  colorHex: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  isEmergency: boolean;
  advisory: string;
}

export interface MemberRisk {
  memberLabel: string;
  risk: 'Low' | 'Moderate' | 'High' | 'Critical';
  guidance: string;
}

export interface InversionWarning {
  active: boolean;
  severity: 'Low' | 'Moderate' | 'Severe';
  mixingHeightM: number;
  headline: string;
  explanation: string;
}

export interface BestWorstHours {
  bestStartLabel: string;
  bestEndLabel: string;
  bestAvgAqi: number;
  bestAvgPm25: number;
  worstLabel: string;
  worstAqi: number;
  tomorrowBestLabel: string;
  tomorrowBestAqi: number;
}

export interface CommuteOptionComparison {
  mode: CommuteMode;
  label: string;
  monthlyCostInr: number;
  monthlySavingsInr: number;
  oneWayMins: number;
  commutePm25UgM3: number;
  monthlyCo2SavedKg: number;
  isCurrent: boolean;
  recommended: boolean;
}

export interface PlanImpactMetrics {
  pm25_ug: number; // estimated ug/m3 exposure avoided
  co2_kg: number; // kg CO2 saved per week/day
  inr: number; // INR saved per month or week
  cigarettes_approx: number; // Berkeley Earth approximation
}

export interface PlanRecommendation {
  id: string;
  period: 'Morning' | 'Commute' | 'Afternoon' | 'Evening' | 'Night';
  timeRange: string;
  action: string;
  why: string;
  impact: PlanImpactMetrics;
  effort: 'easy' | 'medium' | 'hard';
  category: 'routine' | 'indoor' | 'sustainable';
  evidence_source: string;
  confidence: 'High' | 'Medium';
}

export interface ActionFeedbackState {
  doneIds: string[];
  skippedIds: string[];
  thumbs: Record<string, 'up' | 'down'>;
}

export interface DailyPlanData {
  oneLineSummary: string;
  blocks: PlanRecommendation[];
  top3Actions: string[];
  todaysWin: string;
  adaptedNote?: string;
  generatedAt: string;
  source: 'gemini-ai' | 'deterministic-engine';
  ragSources: string[];
}

export interface WhatIfInputs {
  commuteMode: CommuteMode;
  purifierHours: number; // 0..24
  maskCompliancePct: number; // 0..100
  cleanCookingAndSeal: boolean;
}

export interface ImpactReport {
  smogScore: number; // 0..100
  weeklyTrend: Array<{ day: string; score: number; exposureUg: number }>;
  baselineIndoorPm25: number;
  projectedIndoorPm25: number;
  exposureCutPct: number;
  pm25AvoidedUgM3: number;
  dailyInhaledAvoidedUg: number;
  cigarettesAvoidedPerWeekApprox: number;
  monthlyCo2SavedKg: number;
  monthlyMoneySavedInr: number;
  top3CutPct: number;
  formulas: Array<{ name: string; formula: string; assumption: string }>;
}

export interface SituationObject {
  profile: SaansProfile;
  air: {
    city: string;
    source: AirSnapshot['source'];
    updatedAt: string;
    aqi: number;
    band: string;
    isEmergency: boolean;
    pm25: number;
    pm10: number;
    no2: number;
    o3: number;
    tempC: number;
    humidityPct: number;
    windKmh: number;
    mixingHeightM: number;
  };
  inversion: InversionWarning;
  bestWorstHours: BestWorstHours;
  memberRisks: MemberRisk[];
  commuteAlternatives: CommuteOptionComparison[];
  engineEstimates: {
    baselineIndoorPm25: number;
    smogScore: number;
    recommendedCadr150SqFt: number;
  };
  feedbackSummary: {
    completedCount: number;
    skippedIds: string[];
    dislikedIds: string[];
  };
  language: AppLanguage;
}

export interface RoomHack {
  id: string;
  room: 'bedroom' | 'kitchen' | 'kids_room';
  title: string;
  costLabel: string;
  pm25CutPct: number;
  effort: 'easy' | 'medium';
  mythBuster?: string;
  summary: string;
  steps: string[];
  source: string;
  imageUrl?: string;
}

export interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  dataSource?: string;
  confidence?: string;
  citations?: string[];
  error?: boolean;
}

export interface CommunityMemberRank {
  name: string;
  actionsDone: number;
  co2SavedKg: number;
  smogScore: number;
}

export interface CommunityGroup {
  id: string;
  name: string;
  type: 'family' | 'rwa' | 'school';
  city: string;
  inviteCode: string;
  membersCount: number;
  totalCo2AvoidedKg: number;
  collectiveExposureCutPct: number;
  weeklyChallenge: string;
  challengeProgressPct: number;
  leaderboard: CommunityMemberRank[];
}
