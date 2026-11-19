import {
  AirSnapshot,
  CityInfo,
  CommunityGroup,
  ForecastHour,
  RoomHack,
  SaansProfile,
} from '../types/saans';
import { calculateCpcbAqi } from '../utils/saansEngine';

export const INDIAN_CITIES: CityInfo[] = [
  { id: 'delhi', name: 'New Delhi', area: 'South Delhi / RK Puram', state: 'Delhi NCR', lat: 28.5672, lon: 77.21 },
  { id: 'gurugram', name: 'Gurugram', area: 'DLF Phase 4', state: 'Haryana', lat: 28.4595, lon: 77.0266 },
  { id: 'noida', name: 'Noida', area: 'Sector 62', state: 'Uttar Pradesh', lat: 28.6279, lon: 77.3649 },
  { id: 'ahmedabad', name: 'Ahmedabad', area: 'Navrangpura', state: 'Gujarat', lat: 23.0372, lon: 72.5612 },
  { id: 'lucknow', name: 'Lucknow', area: 'Gomti Nagar', state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462 },
  { id: 'mumbai', name: 'Mumbai', area: 'Bandra Kurla Complex', state: 'Maharashtra', lat: 19.0653, lon: 72.8685 },
  { id: 'kolkata', name: 'Kolkata', area: 'Ballygunge', state: 'West Bengal', lat: 22.528, lon: 88.3659 },
  { id: 'bengaluru', name: 'Bengaluru', area: 'Indiranagar', state: 'Karnataka', lat: 12.9784, lon: 77.6408 },
];

export const DEFAULT_SAANS_PROFILE: SaansProfile = {
  completedOnboarding: false,
  userName: 'Priya',
  city: INDIAN_CITIES[0],
  adults: 2,
  kids: [{ name: 'Aarav', age: 6 }],
  elders: 1,
  conditions: ['asthma'],
  hasPets: false,
  commuteMode: 'car',
  commuteDistanceKm: 14,
  wfhDaysPerWeek: 1,
  cookingFuel: 'lpg',
  heating: 'electric_heater',
  hasPurifier: false,
  homeType: 'flat',
  floorNumber: 3,
  windowExposure: 'main_road',
  goal: 'all',
  alertThresholdAqi: 250,
};

function build48hCurve(basePm25: number): ForecastHour[] {
  const hourlyMultipliers = [
    1.18, 1.2, 1.18, 1.15, 1.18, 1.26, 1.35, 1.38, 1.28, 1.1, 0.92, 0.78,
    0.66, 0.56, 0.54, 0.6, 0.74, 0.94, 1.12, 1.24, 1.32, 1.3, 1.25, 1.2,
  ];
  const points: ForecastHour[] = [];
  const now = new Date();
  for (let i = 0; i < 48; i++) {
    const h = i % 24;
    const dayOffset = i >= 24 ? 1 : 0;
    const dayScale = dayOffset === 1 ? 0.94 : 1.0;
    const pm25 = Math.round(basePm25 * hourlyMultipliers[h] * dayScale * 10) / 10;
    const pm10 = Math.round(pm25 * 1.58 * 10) / 10;
    const dt = new Date(now.getTime() + i * 3600 * 1000);
    points.push({
      isoTime: dt.toISOString(),
      label: `${String(h).padStart(2, '0')}:00`,
      dayLabel: dayOffset === 0 ? 'Today' : 'Tomorrow',
      hourIndex: i,
      hourOfDay: h,
      pm25,
      pm10,
      aqi: calculateCpcbAqi(pm25, pm10),
    });
  }
  return points;
}

/**
 * Deterministic "Demo: Delhi Winter Smog" scenario (AQI 386, Severe Winter Inversion)
 * so judges and users can test Smog Emergency Mode reliably anytime.
 */
export function getDemoDelhiSevereSnapshot(): AirSnapshot {
  const delhi = INDIAN_CITIES[0];
  const pm25 = 232;
  const pm10 = 378;
  return {
    city: delhi,
    source: 'demo-delhi-severe',
    updatedAt: new Date().toISOString(),
    aqi: calculateCpcbAqi(pm25, pm10),
    pm25,
    pm10,
    no2: 78,
    o3: 24,
    tempC: 11.4,
    humidityPct: 79,
    windKmh: 4.2,
    mixingHeightM: 210,
    forecast48h: build48hCurve(215),
  };
}

const CITY_FALLBACK_PM25: Record<string, { pm25: number; tempC: number; windKmh: number; rh: number }> = {
  delhi: { pm25: 178, tempC: 14, windKmh: 5.8, rh: 72 },
  gurugram: { pm25: 162, tempC: 14, windKmh: 6.2, rh: 70 },
  noida: { pm25: 184, tempC: 13.5, windKmh: 5.5, rh: 74 },
  ahmedabad: { pm25: 94, tempC: 21, windKmh: 9.4, rh: 52 },
  lucknow: { pm25: 152, tempC: 15, windKmh: 5.1, rh: 75 },
  mumbai: { pm25: 76, tempC: 26, windKmh: 12.2, rh: 68 },
  kolkata: { pm25: 118, tempC: 20, windKmh: 6.8, rh: 71 },
  bengaluru: { pm25: 44, tempC: 22, windKmh: 11.5, rh: 64 },
};

export function getFallbackAirSnapshot(city: CityInfo): AirSnapshot {
  const base = CITY_FALLBACK_PM25[city.id] ?? { pm25: 98, tempC: 17, windKmh: 7.5, rh: 65 };
  const pm10 = Math.round(base.pm25 * 1.56 * 10) / 10;
  return {
    city,
    source: 'cached-fallback',
    updatedAt: new Date().toISOString(),
    aqi: calculateCpcbAqi(base.pm25, pm10),
    pm25: base.pm25,
    pm10,
    no2: Math.round(base.pm25 * 0.36),
    o3: 32,
    tempC: base.tempC,
    humidityPct: base.rh,
    windKmh: base.windKmh,
    mixingHeightM: Math.max(180, Math.round(140 + base.windKmh * 32)),
    forecast48h: build48hCurve(base.pm25),
  };
}

export const ROOM_INDOOR_HACKS: RoomHack[] = [
  {
    id: 'bedroom-cadr-diy',
    room: 'bedroom',
    title: 'Purifier Placement + DIY MERV-13 Box Filter',
    costLabel: '₹0 placement / ₹3,500 DIY',
    pm25CutPct: 68,
    effort: 'medium',
    summary:
      'Keep your purifier 30 cm away from curtains/walls and run continuously overnight with doors closed. No commercial HEPA? Build a 4-filter Corsi-Rosenthal MERV-13 box fan purifier.',
    steps: [
      'Calculate needed CADR using Room sq ft × 1.35 (e.g., 120 sq ft room → ≥165 m³/h CADR).',
      'Always choose True HEPA (H13) mechanical filtration; avoid ozone-emitting ionizers.',
      'Run on high 30 minutes before bedtime, then quiet sleep/medium mode all night.',
    ],
    source: 'US EPA Indoor Air & ASHRAE CADR Guide',
    imageUrl: '/src/assets/images/hack_diy_purifier_1795064168031.jpg',
  },
  {
    id: 'bedroom-damp-seal',
    room: 'bedroom',
    title: 'Damp Cloth Window Seal & Timed Midday Airing',
    costLabel: '₹0 Zero-Cost',
    pm25CutPct: 32,
    effort: 'easy',
    mythBuster:
      'Indoor Plants Myth: Snake plants & areca palms do NOT meaningfully remove winter PM2.5—studies show you would need 100+ plants per m² to match one HEPA filter. Focus on sealing + filtration!',
    summary:
      'Press damp rolled towels along leaky balcony door tracks and under-door gaps during AQI > 300 nights. Crack windows for 10–15 minutes only during the afternoon clean dip.',
    steps: [
      'Check the Today tab for the cleanest afternoon window (typically 13:00–15:30).',
      'Open opposite windows briefly for 10 minutes to clear stale CO₂, then latch tightly before 16:30.',
      'Lay rolled damp towels or ₹250 EPDM foam weatherstrip along balcony sliding gaps.',
    ],
    source: 'CPCB Winter Advisory & Peer-Reviewed IAQ Studies',
  },
  {
    id: 'kitchen-chimney-tadka',
    room: 'kitchen',
    title: 'Kitchen Chimney Discipline & Low-Smoke Cooking',
    costLabel: '₹0 habits / ₹2,500 induction',
    pm25CutPct: 54,
    effort: 'easy',
    summary:
      'High-heat tadka/frying and LPG gas burners spike indoor PM2.5 above 250 µg/m³ and NO₂ past 100 µg/m³ inside closed winter flats.',
    steps: [
      'Switch on your chimney/exhaust fan 5 minutes BEFORE lighting the stove and keep it running 10 minutes after.',
      'Close the kitchen door while cooking so fumes do not drift into kids’ or elders’ bedrooms.',
      'Use covered pressure cookers, steaming, or an electric kettle/induction burner on Severe smog evenings.',
    ],
    source: 'IIT-Delhi Kitchen IAQ Study & WHO NO₂ Guidelines',
    imageUrl: '/src/assets/images/hack_clean_kitchen_1795064169824.jpg',
  },
  {
    id: 'kitchen-zero-incense',
    room: 'kitchen',
    title: 'Zero Indoor Combustion (Pause Agarbatti & Dhoop)',
    costLabel: '₹0 Zero-Cost',
    pm25CutPct: 30,
    effort: 'easy',
    summary:
      'Burning one incense stick, dhoop cone, or mosquito coil in a closed room adds PM2.5 equivalent to hours of heavy highway smog.',
    steps: [
      'Pause agarbatti, dhoop, scented candles, and coil repellents throughout November–January smog spikes.',
      'Use electric liquid vaporizers only in ventilated areas or mosquito nets for kids’ beds.',
      'Use plain warm LED diyas during winter evenings indoors.',
    ],
    source: 'MoHFW / ICMR Indoor Air Advisory',
  },
  {
    id: 'kids-wet-mop',
    room: 'kids_room',
    title: 'Wet Microfiber Mopping & Entry Shoe-Off Zone',
    costLabel: '₹0 Zero-Cost',
    pm25CutPct: 24,
    effort: 'easy',
    summary:
      'Dry sweeping kicks toxic road soot and heavy metals right back into children’s breathing height (under 4 feet).',
    steps: [
      'Keep all outdoor shoes, school bags, and coats on a dedicated mat outside or at the entrance.',
      'Damp-mop bedroom and playroom floors once daily with plain warm water instead of dry brooming.',
      'Wipe window sills, study desks, and soft toys regularly during high-AQI weeks.',
    ],
    source: 'ICMR Pediatric Respiratory Safety Guidance',
  },
  {
    id: 'kids-n95-mask-fit',
    room: 'kids_room',
    title: 'Child-Sized N95/KF94 Mask Fit & School Commute Rule',
    costLabel: '₹40–₹90 / mask',
    pm25CutPct: 82,
    effort: 'easy',
    mythBuster:
      'Cloth/Surgical Mask Myth: Loose cloth scarves and blue surgical masks leak >60% of PM2.5 through side gaps. Only a snug N95/KF94/N99 respirator blocks fine smog.',
    summary:
      'On AQI > 200 days, fit a child-sized KF94/N95 over the nose bridge for school bus waits and walks; keep rescue inhalers packed if asthmatic.',
    steps: [
      'Pinch the metal nose clip gently until glasses no longer fog up—fogging indicates side air leaks.',
      'Replace disposable N95 masks after ~30–40 hours of cumulative use or once straps loosen.',
      'At AQI > 300, request school admins to move morning assembly and PT indoors.',
    ],
    source: 'MoHFW & US EPA Respirator Fit Guidance',
  },
];

export const SEED_COMMUNITIES: CommunityGroup[] = [
  {
    id: 'rwa-green-park',
    name: 'Green Park Extension RWA',
    type: 'rwa',
    city: 'New Delhi',
    inviteCode: 'GP-RWA-2026',
    membersCount: 64,
    totalCo2AvoidedKg: 2840,
    collectiveExposureCutPct: 48,
    weeklyChallenge: 'Zero Waste-Burning & 50% Metro/Carpool School Runs',
    challengeProgressPct: 76,
    leaderboard: [
      { name: 'Block C — Sharma Family', actionsDone: 28, co2SavedKg: 112, smogScore: 92 },
      { name: 'Block A — Mehta Household', actionsDone: 24, co2SavedKg: 96, smogScore: 88 },
      { name: 'Block D — Patel Family', actionsDone: 21, co2SavedKg: 84, smogScore: 84 },
    ],
  },
  {
    id: 'school-vasant-parents',
    name: 'Vasant Valley Parents Clean-Air Circle',
    type: 'school',
    city: 'New Delhi',
    inviteCode: 'VV-SCHOOL-88',
    membersCount: 42,
    totalCo2AvoidedKg: 1920,
    collectiveExposureCutPct: 52,
    weeklyChallenge: 'No-Idling School Gate + 4-Family Carpool Pods',
    challengeProgressPct: 82,
    leaderboard: [
      { name: 'Grade 1 Carpool Pod A', actionsDone: 31, co2SavedKg: 138, smogScore: 94 },
      { name: 'Grade 4 Walking Bus', actionsDone: 25, co2SavedKg: 104, smogScore: 89 },
      { name: 'Nursery Clean-Room Team', actionsDone: 19, co2SavedKg: 76, smogScore: 83 },
    ],
  },
  {
    id: 'family-ahmedabad',
    name: 'Navrangpura Extended Family',
    type: 'family',
    city: 'Ahmedabad',
    inviteCode: 'AMD-FAM-12',
    membersCount: 11,
    totalCo2AvoidedKg: 410,
    collectiveExposureCutPct: 44,
    weeklyChallenge: '7-Day Damp Mop + Evening Exhaust Streak',
    challengeProgressPct: 68,
    leaderboard: [
      { name: 'Kiran & Family', actionsDone: 18, co2SavedKg: 62, smogScore: 86 },
      { name: 'Dada & Dadi Home', actionsDone: 15, co2SavedKg: 48, smogScore: 82 },
    ],
  },
];

export const BADGE_DEFINITIONS = [
  {
    id: 'clean-commuter',
    title: 'Clean Commuter',
    criteria: 'Complete a low-emission commute swap',
    check: (doneIds: string[], streak: number) => doneIds.includes('commute-swap') || streak >= 3,
  },
  {
    id: 'mask-pro',
    title: 'Mask Pro',
    criteria: 'Maintain ≥75% N95 protection on high-AQI days',
    check: (_doneIds: string[], _streak: number, maskPct: number) => maskPct >= 75,
  },
  {
    id: 'clean-kitchen',
    title: 'Smoke-Free Kitchen',
    criteria: 'Complete the evening clean-cooking & exhaust swap',
    check: (doneIds: string[]) => doneIds.includes('evening-kitchen'),
  },
  {
    id: 'smog-shield',
    title: 'Smog Shield Streak',
    criteria: 'Complete 3+ protective actions in a day',
    check: (doneIds: string[]) => doneIds.length >= 3,
  },
];
