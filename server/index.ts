import express from 'express';
import { z } from 'zod';
import { askDevDesk } from './ai';
import { env } from './env';

const app = express();
const port = env.apiPort;

app.use(express.json({ limit: '12mb' }));

app.get('/health', (_req, res) => {
  res.json({ service: 'devdesk-api', status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/chat', async (req, res) => {
  const input = z.object({
    projectId: z.string().uuid().optional(),
    messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().trim().min(1).max(env.maxInputCharacters) })).min(1).max(30),
  }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'Chat messages are invalid or too large.' });
  try {
    const text = await askDevDesk([
      { role: 'system', content: 'You are DevDesk AI, a precise senior engineer. Explain findings with evidence, ask clarifying questions when project context is missing, and never claim to have executed code you did not execute.' },
      ...input.data.messages,
    ]);
    return res.json({ text });
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : 'AI request failed.' });
  }
});

app.post('/api/analysis/preview', async (req, res) => {
  const input = z.object({ projectName: z.string().trim().min(1).max(120), question: z.string().trim().min(3).max(4000) }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'A project name and question are required.' });
  try {
    const text = await askDevDesk([
      { role: 'system', content: 'You analyze software projects. Return a concise answer with sections: Understanding, Questions, Findings, and Recommended fix.' },
      { role: 'user', content: `Project: ${input.data.projectName}\nQuestion: ${input.data.question}` },
    ]);
    return res.json({ status: 'complete', projectName: input.data.projectName, text });
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : 'Analysis request failed.' });
  }
});

app.listen(port, () => console.log(`[devdesk-api] listening on ${port}`));
