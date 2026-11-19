/** Per-household-member health risk at a given AQI. */
import type { MemberRisk, SaansProfile } from '../../types/saans.js';

export function computeMemberRisks(aqi: number, profile: SaansProfile): MemberRisk[] {
  const risks: MemberRisk[] = [];
  const hasRespCond = profile.conditions.includes('asthma') || profile.conditions.includes('copd');
  const hasCardioOrPreg = profile.conditions.includes('heart') || profile.conditions.includes('pregnancy');

  for (const kid of profile.kids) {
    const risk: MemberRisk['risk'] =
      aqi > 300 || (aqi > 200 && hasRespCond) ? 'Critical' : aqi > 150 ? 'High' : aqi > 80 ? 'Moderate' : 'Low';
    const guidance =
      risk === 'Critical'
        ? `Keep ${kid.name} (${kid.age}y) indoors for play; no outdoor sports and keep windows sealed.`
        : risk === 'High'
          ? `Shorten ${kid.name}'s outdoor time to the afternoon dip; use child-sized N95 on school commute.`
          : `${kid.name} (${kid.age}y) can play outdoors away from busy main roads.`;
    risks.push({ memberLabel: `${kid.name} (${kid.age} yrs)`, risk, guidance });
  }

  if (profile.elders > 0) {
    const risk: MemberRisk['risk'] =
      aqi > 280 || (aqi > 180 && (hasRespCond || hasCardioOrPreg))
        ? 'Critical'
        : aqi > 130
          ? 'High'
          : aqi > 75
            ? 'Moderate'
            : 'Low';
    risks.push({
      memberLabel: `Elders (${profile.elders})`,
      risk,
      guidance:
        risk === 'Critical' || risk === 'High'
          ? 'Skip early morning park walks; do gentle indoor stretches and monitor blood pressure/breathing.'
          : 'Afternoon strolls are safe; keep rescue medications handy.',
    });
  }

  if (profile.conditions.length > 0) {
    const condNames = profile.conditions.map((c) => c.toUpperCase()).join(', ');
    const risk: MemberRisk['risk'] = aqi > 250 ? 'Critical' : aqi > 120 ? 'High' : 'Moderate';
    risks.push({
      memberLabel: `Sensitive Health (${condNames})`,
      risk,
      guidance:
        risk === 'Critical'
          ? 'Stay in filtered room, keep prescribed inhalers ready, and consult a doctor immediately for wheezing or chest tightness.'
          : 'Wear well-sealed N95/N99 outdoors and avoid kitchen smoke/incense.',
    });
  }

  risks.push({
    memberLabel: `Adults (${profile.adults})`,
    risk: aqi > 350 ? 'Critical' : aqi > 200 ? 'High' : aqi > 100 ? 'Moderate' : 'Low',
    guidance:
      aqi > 300
        ? 'Move morning workouts indoors; use metro/WFH and N95 mask for any essential trip.'
        : aqi > 150
          ? 'Avoid vigorous roadside jogging; shift outdoor errands to cleanest afternoon hours.'
          : 'Normal routine with low-emission transit preference.',
  });

  if (profile.hasPets) {
    risks.push({
      memberLabel: 'Family Pets',
      risk: aqi > 300 ? 'High' : aqi > 180 ? 'Moderate' : 'Low',
      guidance:
        aqi > 250
          ? 'Limit walks to 5–10 min midday breaks and wipe paws/coat with a damp cloth on return.'
          : 'Standard walks away from idling traffic.',
    });
  }

  return risks;
}
