import { Router } from 'express';
import { answerQuestion, generateAiPlan, serializeSituation } from '../assistant.js';
import { MAX_QUESTION_CHARS } from '../config.js';
import { geminiErrorToHttp } from '../gemini.js';
import { rateLimit } from '../http.js';
import { sanitizeUserText } from '../security.js';

/** GenAI endpoints: the daily smog plan and the grounded multilingual chat. */
export function assistantRouter(): Router {
  const router = Router();

  router.post(
    '/plan',
    rateLimit('plan', 'Too many plan requests. Please wait a moment and retry.'),
    async (req, res) => {
      const { situation } = req.body ?? {};
      if (!situation?.profile || !situation?.air || serializeSituation(situation) === null) {
        res.status(400).json({ error: 'A valid SituationObject is required.' });
        return;
      }
      try {
        res.json({ plan: await generateAiPlan(situation) });
      } catch (err) {
        const { status, message } = geminiErrorToHttp(err);
        res.status(status).json({ error: message });
      }
    }
  );

  router.post(
    '/chat',
    rateLimit('chat', 'Too many chat requests. Please wait a moment and retry.'),
    async (req, res) => {
      const { message, history, situation } = req.body ?? {};
      const question = sanitizeUserText(message, MAX_QUESTION_CHARS);
      if (!question) {
        res.status(400).json({ error: 'Please type or speak a question.' });
        return;
      }
      const situationJson = situation === undefined ? '{}' : serializeSituation(situation);
      if (situationJson === null) {
        res.status(400).json({ error: 'Situation context is invalid or too large.' });
        return;
      }
      try {
        const reply = await answerQuestion({ question, history, situation, situationJson });
        if (!reply) {
          res.status(502).json({ error: 'Empty response from assistant. Please retry.' });
          return;
        }
        res.json(reply);
      } catch (err) {
        const { status, message: errorMessage } = geminiErrorToHttp(err);
        res.status(status).json({ error: errorMessage });
      }
    }
  );

  return router;
}
