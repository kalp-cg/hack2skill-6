import type { AirSnapshot, ChatTurn, CityInfo, CommunityGroup, DailyPlanData, SituationObject } from '../types/saans';

/** Typed client for the SaansSaathi API. Every call rejects with an Error whose message is user-safe. */

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return data;
}

const postJson = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

export async function searchCities(query: string): Promise<CityInfo[]> {
  const { results } = await request<{ results?: CityInfo[] }>(`/api/geocode?q=${encodeURIComponent(query)}`);
  return results ?? [];
}

export async function reverseGeocode(lat: number, lon: number): Promise<CityInfo> {
  const { city } = await request<{ city?: CityInfo }>(`/api/reverse-geocode?lat=${lat}&lon=${lon}`);
  if (!city) throw new Error('Could not resolve your location.');
  return city;
}

export async function fetchLiveAir(city: CityInfo): Promise<AirSnapshot> {
  const telemetry = await request<Omit<AirSnapshot, 'city'>>(`/api/aqi?lat=${city.lat}&lon=${city.lon}`);
  return { ...telemetry, city, source: 'open-meteo-live' };
}

export async function requestAiPlan(situation: SituationObject): Promise<DailyPlanData> {
  const { plan } = await postJson<{ plan?: DailyPlanData }>('/api/plan', { situation });
  if (!plan) throw new Error('Could not personalize the plan right now.');
  return plan;
}

export type ChatReply = Required<Pick<ChatTurn, 'dataSource' | 'confidence' | 'citations'>> & {
  answer: string;
  timestamp: string;
};

export function askAssistant(
  message: string,
  history: Pick<ChatTurn, 'role' | 'text'>[],
  situation: SituationObject
): Promise<ChatReply> {
  return postJson<ChatReply>('/api/chat', { message, history, situation });
}

export async function fetchCommunities(): Promise<CommunityGroup[]> {
  const { communities } = await request<{ communities?: CommunityGroup[] }>('/api/community');
  return communities ?? [];
}

export type CommunityAction =
  | { action: 'create'; name: string; type: CommunityGroup['type']; city: string }
  | { action: 'join'; communityId: string };

export interface CommunityUpdate {
  community: CommunityGroup;
  communities: CommunityGroup[];
}

export function updateCommunity(
  action: CommunityAction,
  member: { memberName: string; co2SavedKg: number; smogScore: number }
): Promise<CommunityUpdate> {
  return postJson<CommunityUpdate>('/api/community', { ...action, ...member });
}
