import { AppLanguage } from '../types/saans';

export const LANG_LABELS: Record<AppLanguage, string> = {
  en: 'English',
  hi: 'हिन्दी',
  gu: 'ગુજરાતી',
};

export const UI_COPY: Record<
  AppLanguage,
  {
    tagline: string;
    splashSubtitle: string;
    startSetup: string;
    tryDemoSevere: string;
    tabs: {
      today: string;
      plan: string;
      impact: string;
      ask: string;
      community: string;
    };
    bestTimeOut: string;
    emergencyBanner: string;
    emergencyBtn: string;
    todaysPlanTitle: string;
    generateAiPlan: string;
    askPlaceholder: string;
    medicalDisclaimer: string;
  }
> = {
  en: {
    tagline: 'Breath Companion for Winter Smog',
    splashSubtitle:
      'Personalized low-emission routines, indoor air hacks, and clear impact math for Indian families and communities.',
    startSetup: 'Start 60-Second Setup',
    tryDemoSevere: 'Demo: Delhi Winter Smog (AQI 386)',
    tabs: {
      today: 'Today',
      plan: 'Plan',
      impact: 'Impact',
      ask: 'Ask',
      community: 'Community',
    },
    bestTimeOut: 'Best outdoor window',
    emergencyBanner: 'Smog Emergency Mode Active (AQI > 300)',
    emergencyBtn: 'Open Emergency Guide',
    todaysPlanTitle: "Today's Smog Plan",
    generateAiPlan: 'Personalize with AI',
    askPlaceholder: 'Ask: "Can my 6-year-old go to school?" or "Which purifier for 120 sq ft?"',
    medicalDisclaimer:
      'SaansSaathi is an air-quality coach, not a doctor. For breathing difficulty, wheezing, or chest pain, seek medical care immediately.',
  },
  hi: {
    tagline: 'सर्दियों के स्मॉग में आपका सांस साथी',
    splashSubtitle:
      'परिवारों और सोसायटी के लिए कम-प्रदूषण दिनचर्या, घर की हवा साफ रखने के उपाय और सटीक असर।',
    startSetup: '60 सेकंड में सेटअप शुरू करें',
    tryDemoSevere: 'डेमो: दिल्ली सर्दियों का स्मॉग (AQI 386)',
    tabs: {
      today: 'आज',
      plan: 'योजना',
      impact: 'असर',
      ask: 'पूछें',
      community: 'समुदाय',
    },
    bestTimeOut: 'बाहर जाने का सबसे सुरक्षित समय',
    emergencyBanner: 'स्मॉग इमरजेंसी मोड सक्रिय (AQI > 300)',
    emergencyBtn: 'इमरजेंसी गाइड खोलें',
    todaysPlanTitle: 'आज का स्मॉग प्लान',
    generateAiPlan: 'AI से पर्सनलाइज़ करें',
    askPlaceholder: 'पूछें: "क्या मेरा 6 साल का बच्चा आज स्कूल जा सकता है?"',
    medicalDisclaimer:
      'सांससाथी डॉक्टर नहीं है। सांस फूलने, घरघराहट या सीने में दर्द होने पर तुरंत डॉक्टर से मिलें।',
  },
  gu: {
    tagline: 'શિયાળાના સ્મોગમાં તમારો શ્વાસ સાથી',
    splashSubtitle:
      'પરિવારો અને સોસાયટી માટે ઓછા પ્રદૂષણની દિનચર્યા, ઘરની હવા શુદ્ધ કરવાના ઉપાયો અને સ્પષ્ટ અસર.',
    startSetup: '60 સેકન્ડમાં સેટઅપ શરૂ કરો',
    tryDemoSevere: 'ડેમો: દિલ્હી શિયાળુ સ્મોગ (AQI 386)',
    tabs: {
      today: 'આજે',
      plan: 'યોજના',
      impact: 'અસર',
      ask: 'પૂછો',
      community: 'સમુદાય',
    },
    bestTimeOut: 'બહાર જવાનો શ્રેષ્ઠ સમય',
    emergencyBanner: 'સ્મોગ ઇમરજન્સી મોડ સક્રિય (AQI > 300)',
    emergencyBtn: 'ઇમરજન્સી ગાઇડ ખોલો',
    todaysPlanTitle: 'આજનો સ્મોગ પ્લાન',
    generateAiPlan: 'AI વડે પર્સનલાઇઝ કરો',
    askPlaceholder: 'પૂછો: "શું મારું 6 વર્ષનું બાળક આજે શાળાએ જઈ શકે?"',
    medicalDisclaimer:
      'સાંસસાથી ડોક્ટર નથી. શ્વાસ લેવામાં તકલીફ કે છાતીમાં દુખાવો થાય તો તરત ડોક્ટરનો સંપર્ક કરો.',
  },
};
