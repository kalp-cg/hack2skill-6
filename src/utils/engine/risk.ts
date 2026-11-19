/** Per-household-member health risk at a given AQI. */
import type { MemberRisk, SaansProfile } from '../../types/saans.js';

type RiskLevel = MemberRisk['risk'];

/** Exclusive lower AQI bounds for each level; below every bound the level is `floor` (default 'Low'). */
interface RiskThresholds {
  critical?: number;
  high: number;
  moderate?: number;
  floor?: RiskLevel;
}

function classify(aqi: number, { critical, high, moderate, floor = 'Low' }: RiskThresholds): RiskLevel {
  if (critical !== undefined && aqi > critical) return 'Critical';
  if (aqi > high) return 'High';
  if (moderate !== undefined && aqi > moderate) return 'Moderate';
  return floor;
}

/** Vulnerable groups reach each level at a lower AQI; respiratory/cardiac conditions lower it further. */
const CHILD = { critical: 300, criticalIfRespiratory: 200, high: 150, moderate: 80 };
const ELDER = { critical: 280, criticalIfSensitive: 180, high: 130, moderate: 75 };
const SENSITIVE_HEALTH: RiskThresholds = { critical: 250, high: 120, floor: 'Moderate' };
const ADULT: RiskThresholds = { critical: 350, high: 200, moderate: 100 };
const PET: RiskThresholds = { high: 300, moderate: 180 };

function childRisk(kid: SaansProfile['kids'][number], aqi: number, respiratory: boolean): MemberRisk {
  const risk = classify(aqi, { ...CHILD, critical: respiratory ? CHILD.criticalIfRespiratory : CHILD.critical });
  const guidance: Record<RiskLevel, string> = {
    Critical: `Keep ${kid.name} (${kid.age}y) indoors for play; no outdoor sports and keep windows sealed.`,
    High: `Shorten ${kid.name}'s outdoor time to the afternoon dip; use child-sized N95 on school commute.`,
    Moderate: `${kid.name} (${kid.age}y) can play outdoors away from busy main roads.`,
    Low: `${kid.name} (${kid.age}y) can play outdoors away from busy main roads.`,
  };
  return { memberLabel: `${kid.name} (${kid.age} yrs)`, risk, guidance: guidance[risk] };
}

function elderRisk(count: number, aqi: number, sensitive: boolean): MemberRisk {
  const risk = classify(aqi, { ...ELDER, critical: sensitive ? ELDER.criticalIfSensitive : ELDER.critical });
  const guidance =
    risk === 'Critical' || risk === 'High'
      ? 'Skip early morning park walks; do gentle indoor stretches and monitor blood pressure/breathing.'
      : 'Afternoon strolls are safe; keep rescue medications handy.';
  return { memberLabel: `Elders (${count})`, risk, guidance };
}

function sensitiveHealthRisk(conditions: SaansProfile['conditions'], aqi: number): MemberRisk {
  const risk = classify(aqi, SENSITIVE_HEALTH);
  const guidance =
    risk === 'Critical'
      ? 'Stay in filtered room, keep prescribed inhalers ready, and consult a doctor immediately for wheezing or chest tightness.'
      : 'Wear well-sealed N95/N99 outdoors and avoid kitchen smoke/incense.';
  return { memberLabel: `Sensitive Health (${conditions.map((c) => c.toUpperCase()).join(', ')})`, risk, guidance };
}

function adultRisk(count: number, aqi: number): MemberRisk {
  let guidance = 'Normal routine with low-emission transit preference.';
  if (aqi > 300) guidance = 'Move morning workouts indoors; use metro/WFH and N95 mask for any essential trip.';
  else if (aqi > 150) guidance = 'Avoid vigorous roadside jogging; shift outdoor errands to cleanest afternoon hours.';
  return { memberLabel: `Adults (${count})`, risk: classify(aqi, ADULT), guidance };
}

function petRisk(aqi: number): MemberRisk {
  const guidance =
    aqi > 250
      ? 'Limit walks to 5–10 min midday breaks and wipe paws/coat with a damp cloth on return.'
      : 'Standard walks away from idling traffic.';
  return { memberLabel: 'Family Pets', risk: classify(aqi, PET), guidance };
}

/** One risk card per household group, most vulnerable first: children, elders, conditions, adults, pets. */
export function computeMemberRisks(aqi: number, profile: SaansProfile): MemberRisk[] {
  const has = (condition: SaansProfile['conditions'][number]) => profile.conditions.includes(condition);
  const respiratory = has('asthma') || has('copd');
  const cardiacOrPregnant = has('heart') || has('pregnancy');

  return [
    ...profile.kids.map((kid) => childRisk(kid, aqi, respiratory)),
    ...(profile.elders > 0 ? [elderRisk(profile.elders, aqi, respiratory || cardiacOrPregnant)] : []),
    ...(profile.conditions.length > 0 ? [sensitiveHealthRisk(profile.conditions, aqi)] : []),
    adultRisk(profile.adults, aqi),
    ...(profile.hasPets ? [petRisk(aqi)] : []),
  ];
}
