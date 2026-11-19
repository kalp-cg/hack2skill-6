import { Router } from 'express';
import type { CommunityStore } from '../communityStore.js';
import { rateLimit } from '../http.js';
import { clampInt, sanitizeLabel, validateCommunityName } from '../security.js';

/** Clean-air circles: list, create, join and contribute. */
export function communityRouter(store: CommunityStore): Router {
  const router = Router();

  router.get('/community', (_req, res) => {
    res.json({ communities: store.list() });
  });

  router.post('/community', rateLimit('community', 'Too many community updates. Please retry shortly.'), (req, res) => {
    const { action, name, type, city, communityId, memberName, co2SavedKg, smogScore } = req.body ?? {};

    if (action === 'create') {
      const validated = validateCommunityName(name);
      if (!validated.ok) {
        res.status(400).json({ error: validated.error });
        return;
      }
      const community = store.create({
        name: validated.name,
        type: type === 'rwa' || type === 'school' ? type : 'family',
        city: sanitizeLabel(city, 'New Delhi'),
        founderName: sanitizeLabel(memberName, 'Founder Household'),
        co2SavedKg: clampInt(co2SavedKg, 24, 12, 5000),
        smogScore: clampInt(smogScore, 78, 10, 100),
      });
      res.json({ community, communities: store.list() });
      return;
    }

    if (action === 'join' || action === 'contribute') {
      const community = store.contribute(communityId, {
        memberName: sanitizeLabel(memberName, 'Your Household'),
        co2SavedKg: clampInt(co2SavedKg, 18, 4, 500),
        smogScore: clampInt(smogScore, 80, 10, 100),
        isNewMember: action === 'join',
      });
      if (!community) {
        res.status(404).json({ error: 'Community group not found.' });
        return;
      }
      res.json({ community, communities: store.list() });
      return;
    }

    res.status(400).json({ error: 'Invalid community action.' });
  });

  return router;
}
