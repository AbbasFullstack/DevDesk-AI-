import express from 'express';
import { z } from 'zod';

const app = express();
const port = Number(process.env.API_PORT ?? 3001);

app.use(express.json({ limit: '12mb' }));

app.get('/health', (_req, res) => {
  res.json({ service: 'devdesk-api', status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/analysis/preview', (req, res) => {
  const input = z.object({ projectName: z.string().trim().min(1).max(120), question: z.string().trim().min(3).max(4000) }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'A project name and question are required.' });
  return res.json({ status: 'queued', projectName: input.data.projectName, message: 'Analysis route foundation is ready for the secure LLM adapter.' });
});

app.listen(port, () => console.log(`[devdesk-api] listening on ${port}`));
