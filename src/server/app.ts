import express from 'express';
import { CommunityStore } from './communityStore.js';
import { BODY_LIMIT, TRUST_PROXY_HOPS } from './config.js';
import { jsonErrorHandler } from './http.js';
import { airQualityRouter } from './routes/airQuality.js';
import { assistantRouter } from './routes/assistant.js';
import { communityRouter } from './routes/community.js';
import { locationRouter } from './routes/location.js';
import { applySecurityHeaders } from './security.js';

/**
 * Builds the API. Shared by the local server (server.ts), the Vercel function (api/index.ts)
 * and the route tests, so all three run exactly the same middleware stack.
 */
export function createApp({ communityStore = new CommunityStore() } = {}): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', TRUST_PROXY_HOPS);
  app.use(applySecurityHeaders);
  app.use(express.json({ limit: BODY_LIMIT }));

  app.use('/api', locationRouter(), airQualityRouter(), assistantRouter(), communityRouter(communityStore));

  app.use(jsonErrorHandler);
  return app;
}
