import express from 'express';
import { z } from 'zod';
import { askDevDesk, ProviderCapacityError } from './ai';
import { buildProjectManifest } from './ingestion';
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
    const answer = await askDevDesk([
      { role: 'system', content: 'You are DevDesk AI, a precise senior engineer. Explain findings with evidence, ask clarifying questions when project context is missing, and never claim to have executed code you did not execute.' },
      ...input.data.messages,
    ]);
    return res.json({ text: answer.text, model: answer.model, fallbackUsed: answer.attempts.length > 0, attemptCount: answer.attempts.length + 1 });
  } catch (error) {
    return res.status(503).json({ error: error instanceof Error ? error.message : 'DevDesk AI is temporarily busy. Please try again in a moment.', retryable: true });
  }
});

app.post('/api/projects/ingest', (req, res) => {
  const input = z.object({ name: z.string().trim().min(1).max(120), sourceType: z.enum(['zip', 'files', 'github']), files: z.array(z.object({ path: z.string().min(1).max(500), content: z.string().max(200_000).optional(), byteSize: z.number().int().nonnegative().optional() })).min(1).max(2_000) }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'Project name, source type, and files are required.' });
  try {
    const manifest = buildProjectManifest(input.data.files);
    return res.status(201).json({ name: input.data.name, sourceType: input.data.sourceType, fileCount: manifest.length, files: manifest.map(({ normalizedPath, language, byteSize }) => ({ path: normalizedPath, language, byteSize })) });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Project ingestion failed.' });
  }
});

app.post('/api/analysis/preview', async (req, res) => {
  const input = z.object({ projectName: z.string().trim().min(1).max(120), question: z.string().trim().min(3).max(4000), files: z.array(z.object({ path: z.string().max(500), excerpt: z.string().max(14_000) })).max(120).default([]) }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'A project name and question are required.' });
  try {
    const answer = await askDevDesk([
      { role: 'system', content: 'You analyze software projects. Return a concise answer with sections: Understanding, Questions, Findings, and Recommended fix.' },
      { role: 'user', content: `Project: ${input.data.projectName}\nQuestion: ${input.data.question}\n\nProject context:\n${input.data.files.map((file) => `FILE ${file.path}\n${file.excerpt}`).join('\n\n').slice(0, env.maxInputCharacters)}` },
    ], { allowEmergencyFallback: false, allowIndependentFallback: false, allowContinuityResponse: false });
    return res.json({ status: 'complete', projectName: input.data.projectName, text: answer.text, model: answer.model, fallbackUsed: answer.attempts.length > 0 });
  } catch (error) {
    if (error instanceof ProviderCapacityError) return res.status(503).json({ error: error.message, retryable: true });
    return res.status(502).json({ error: error instanceof Error ? error.message : 'Analysis request failed.' });
  }
});

app.listen(port, () => console.log(`[devdesk-api] listening on ${port}`));
