import { Router } from 'express';
import type { CommunityStore } from '../communityStore.js';
import { rateLimit } from '../http.js';
import { CommunityRequestSchema } from '../schemas.js';
import { clampInt, sanitizeLabel, validateCommunityName } from '../security.js';

/** Clean-air circles: list, create, join and contribute. */
export function communityRouter(store: CommunityStore): Router {
  const router = Router();

  router.get('/community', (_req, res) => {
    res.json({ communities: store.list() });
  });

  router.post('/community', rateLimit('community', 'Too many community updates. Please retry shortly.'), (req, res) => {
    const parsed = CommunityRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid community action.' });
      return;
    }
    const request = parsed.data;

    if (request.action === 'create') {
      const validated = validateCommunityName(request.name);
      if (!validated.ok) {
        res.status(400).json({ error: validated.error });
        return;
      }
      const community = store.create({
        name: validated.name,
        type: request.type ?? 'family',
        city: sanitizeLabel(request.city, 'New Delhi'),
        founderName: sanitizeLabel(request.memberName, 'Founder Household'),
        co2SavedKg: clampInt(request.co2SavedKg, 24, 12, 5000),
        smogScore: clampInt(request.smogScore, 78, 10, 100),
      });
      res.json({ community, communities: store.list() });
      return;
    }

    const community = store.contribute(request.communityId, {
      memberName: sanitizeLabel(request.memberName, 'Your Household'),
      co2SavedKg: clampInt(request.co2SavedKg, 18, 4, 500),
      smogScore: clampInt(request.smogScore, 80, 10, 100),
      isNewMember: request.action === 'join',
    });
    if (!community) {
      res.status(404).json({ error: 'Community group not found.' });
      return;
    }
    res.json({ community, communities: store.list() });
  });

  return router;
}
