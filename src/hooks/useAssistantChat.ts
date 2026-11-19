import { useState } from 'react';
import { askAssistant } from '../lib/api';
import type { ChatTurn, SituationObject } from '../types/saans';

/** Turns of earlier conversation sent with each question, for follow-up context. */
const HISTORY_TURNS = 6;

const WELCOME_TURN: ChatTurn = {
  id: 'welcome-saans',
  role: 'assistant',
  text: 'Namaste! I am SaansSaathi, grounded in live local AQI plus CPCB, WHO 2021, and MoHFW/ICMR winter smog guidance. Ask me about school safety, purifier CADR sizing, mask fit, or commute swaps—in English, हिन्दी, or ગુજરાતી.',
  timestamp: new Date().toISOString(),
  dataSource: 'SaansSaathi RAG Knowledge Base',
  confidence: 'High',
  citations: ['CPCB National AQI & GRAP', 'WHO 2021 Air Quality Guidelines'],
};

/** Conversation state for the Ask tab. Failures become an error turn in the transcript, never an exception. */
export function useAssistantChat() {
  const [messages, setMessages] = useState<ChatTurn[]>([WELCOME_TURN]);
  const [isSending, setIsSending] = useState(false);

  async function send(text: string, situation: SituationObject) {
    const history = messages.slice(-HISTORY_TURNS).map(({ role, text: turnText }) => ({ role, text: turnText }));
    setMessages((previous) => [
      ...previous,
      { id: `user-${Date.now()}`, role: 'user', text, timestamp: new Date().toISOString() },
    ]);
    setIsSending(true);
    try {
      const reply = await askAssistant(text, history, situation);
      setMessages((previous) => [
        ...previous,
        {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          text: reply.answer,
          timestamp: reply.timestamp,
          dataSource: reply.dataSource,
          confidence: reply.confidence,
          citations: reply.citations,
        },
      ]);
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Network error reaching assistant.';
      setMessages((previous) => [
        ...previous,
        { id: `err-${Date.now()}`, role: 'assistant', text, timestamp: new Date().toISOString(), error: true },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return { messages, isSending, send };
}
