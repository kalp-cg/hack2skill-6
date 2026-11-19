import { AlertCircle, Mic, MicOff, Send, Volume2, VolumeX } from 'lucide-react';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { LANG_LABELS, UI_COPY } from '../../data/i18n';
import type { AppLanguage, ChatTurn, SituationObject } from '../../types/saans';
import { layout, text } from '../ui/styles';

interface AskTabProps {
  language: AppLanguage;
  situation: SituationObject;
  messages: ChatTurn[];
  onChangeLanguage: (lang: AppLanguage) => void;
  onSendMessage: (text: string) => Promise<void>;
  isSending: boolean;
}

const QUICK_PROMPTS: Record<AppLanguage, string[]> = {
  en: [
    'Can my 6-year-old go to school today?',
    'Which purifier CADR for a 120 sq ft bedroom?',
    'Is it ok to jog outside right now?',
    'My child has wheezing and chest tightness—what should I do?',
  ],
  hi: [
    'क्या मेरा 6 साल का बच्चा आज स्कूल जा सकता है?',
    '120 sq ft कमरे के लिए कौन सा एयर प्यूरीफायर CADR चाहिए?',
    'क्या अभी बाहर जॉगिंग करना सुरक्षित है?',
  ],
  gu: ['શું મારું 6 વર્ષનું બાળક આજે શાળાએ જઈ શકે?', '120 sq ft રૂમ માટે કેટલું CADR પ્યુરિફાયર જોઈએ?', 'શું અત્યારે બહાર દોડવું સુરક્ષિત છે?'],
};

interface MinimalSpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

export function AskTab({ language, situation, messages, onChangeLanguage, onSendMessage, isSending }: AskTabProps) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const copy = UI_COPY[language];

  // Keep the newest message (or the typing indicator) in view.
  // biome-ignore lint/correctness/useExhaustiveDependencies: both values are scroll triggers, not inputs.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isSending]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q || isSending) return;
    setInput('');
    await onSendMessage(q);
  }

  function handleToggleMic() {
    setVoiceNotice(null);
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const win = window as unknown as {
      SpeechRecognition?: new () => MinimalSpeechRecognition;
      webkitSpeechRecognition?: new () => MinimalSpeechRecognition;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) {
      setVoiceNotice('Voice input is not supported in this browser; please type your question.');
      return;
    }

    const rec = new SpeechRec();
    rec.lang = language === 'hi' ? 'hi-IN' : language === 'gu' ? 'gu-IN' : 'en-IN';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? '';
      if (transcript) {
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    };
    rec.onerror = () => {
      setIsListening(false);
      setVoiceNotice('Could not capture voice audio. Check microphone permissions or type below.');
    };
    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
    setIsListening(true);
    rec.start();
  }

  function handleSpeak(turn: ChatTurn) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setVoiceNotice('Voice playback is unavailable in this browser.');
      return;
    }
    if (speakingId === turn.id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(turn.text);
    utter.lang = language === 'hi' ? 'hi-IN' : language === 'gu' ? 'gu-IN' : 'en-IN';
    utter.onend = () => setSpeakingId(null);
    utter.onerror = () => setSpeakingId(null);
    setSpeakingId(turn.id);
    window.speechSynthesis.speak(utter);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header & Language Switcher */}
      <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
        <div className={layout.headerRow}>
          <div>
            <p className="text-xs font-medium text-teal-800 dark:text-teal-400">
              Grounded in {situation.air.city} AQI {situation.air.aqi} · CPCB / WHO / ICMR RAG
            </p>
            <h1 className={text.pageTitle}>Ask SaansSaathi (Chat + Voice)</h1>
          </div>

          <fieldset
            aria-label="Assistant language"
            className="min-w-0 flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 self-start"
          >
            {(['en', 'hi', 'gu'] as AppLanguage[]).map((code) => (
              <button
                key={code}
                type="button"
                aria-pressed={language === code}
                onClick={() => onChangeLanguage(code)}
                className={`min-h-[36px] rounded-lg px-3 text-xs font-semibold cursor-pointer transition-colors ${
                  language === code
                    ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {LANG_LABELS[code]}
              </button>
            ))}
          </fieldset>
        </div>

        {/* Quick Questions */}
        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK_PROMPTS[language].map((q) => (
            <button
              key={q}
              type="button"
              disabled={isSending}
              onClick={() => onSendMessage(q)}
              className="min-h-[38px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-teal-600 hover:text-teal-800 dark:hover:text-teal-300 cursor-pointer transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </section>

      {/* Conversation Thread */}
      <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
        <div className="space-y-4 max-h-[52vh] overflow-y-auto pr-1">
          {messages.map((turn) => {
            const isUser = turn.role === 'user';
            return (
              <div key={turn.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[92%] sm:max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-teal-700 text-white'
                      : turn.error
                        ? 'border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200'
                        : 'border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 text-slate-900 dark:text-slate-100'
                  }`}
                >
                  <p className="whitespace-pre-line">{turn.text}</p>

                  {!isUser && !turn.error && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 dark:border-slate-800 pt-2.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <div className="space-y-0.5">
                        <div>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Source: </span>
                          {turn.dataSource || 'SaansSaathi Engine + CPCB/WHO KB'} ·{' '}
                          {new Date(turn.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div>
                          Confidence: {turn.confidence || 'High'}
                          {turn.citations && turn.citations.length > 0 ? ` · Cited: ${turn.citations.join(', ')}` : ''}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSpeak(turn)}
                        aria-label={speakingId === turn.id ? 'Stop reading aloud' : 'Read reply aloud'}
                        className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        {speakingId === turn.id ? (
                          <>
                            <VolumeX className="h-3.5 w-3.5" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-3.5 w-3.5" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex items-start">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                Checking live AQI, household profile, and CPCB/WHO/ICMR guidelines...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {voiceNotice && <p className="mt-3 text-xs text-amber-800 dark:text-amber-300">{voiceNotice}</p>}

        {/* Composer */}
        <form
          onSubmit={handleSubmit}
          className="mt-4 flex items-center gap-2 border-t border-slate-200 dark:border-slate-800 pt-4"
        >
          <button
            type="button"
            onClick={handleToggleMic}
            aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
            aria-pressed={isListening}
            className={`flex min-h-[46px] min-w-[46px] items-center justify-center rounded-xl border cursor-pointer transition-colors ${
              isListening
                ? 'border-rose-600 bg-rose-600 text-white'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          <label htmlFor="ask-saans-input" className="sr-only">
            Ask SaansSaathi a question
          </label>
          <input
            id="ask-saans-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={copy.askPlaceholder}
            className="h-[46px] flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 text-sm text-slate-900 dark:text-white"
          />

          <button
            type="submit"
            aria-label="Ask"
            disabled={isSending || !input.trim()}
            className="inline-flex min-h-[46px] items-center gap-1.5 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </form>

        {/* Medical Disclaimer */}
        <div className="mt-4 flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{copy.medicalDisclaimer}</span>
        </div>
      </section>
    </div>
  );
}
