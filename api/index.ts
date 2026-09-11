import express, { Request, Response } from 'express';
import { createApiRouter } from '../src/server/api.ts';

const app = express();

app.use(express.json({ limit: '10mb' }));

// Mount API router for both /api prefix and root prefix
app.use('/api', createApiRouter());
app.use('/', createApiRouter());

export { app };

export default function handler(req: Request, res: Response) {
  return app(req, res);
}
