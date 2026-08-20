import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSourceAnalysisMessages } from './analysis-prompt';

test('source analysis names the imported repository and prevents DevDesk identity confusion', () => {
  const messages = buildSourceAnalysisMessages({
    projectName: 'AbbasAI',
    branch: 'main',
    question: 'Which DevDesk files implement chat routing?',
    context: 'FILE: App.tsx\nexport default function App() {}',
  });

  assert.match(messages[0]!.content, /imported repository is not DevDesk AI itself/i);
  assert.match(messages[0]!.content, /scope mismatch/i);
  assert.match(messages[0]!.content, /Never relabel imported code as DevDesk code/i);
  assert.match(messages[1]!.content, /Imported project: AbbasAI/);
  assert.match(messages[1]!.content, /Question: Which DevDesk files implement chat routing/);
});
