'use client';

import { Check, Copy, Eye, X } from 'lucide-react';
import { useState } from 'react';

type Segment = { type: 'text'; value: string } | { type: 'code'; language: string; value: string };

export function splitFencedCode(content: string): Segment[] {
  const segments: Segment[] = [];
  const fence = /```([a-zA-Z0-9_+#.-]*)\s*\n?([\s\S]*?)```/g;
  let cursor = 0;
  for (let match = fence.exec(content); match; match = fence.exec(content)) {
    if (match.index > cursor) segments.push({ type: 'text', value: content.slice(cursor, match.index) });
    segments.push({ type: 'code', language: match[1].trim().toLowerCase() || 'code', value: match[2].replace(/^\n|\n$/g, '') });
    cursor = match.index + match[0].length;
  }
  if (cursor < content.length) segments.push({ type: 'text', value: content.slice(cursor) });
  return segments.length ? segments : [{ type: 'text', value: content }];
}

function tokenClass(token: string, language: string) {
  if (/^(\/\/|\/\*|\*\/|#)/.test(token)) return 'token-comment';
  if (/^['"`]/.test(token)) return 'token-string';
  if (/^\d/.test(token)) return 'token-number';
  if (/^(true|false|null|undefined)$/i.test(token)) return 'token-literal';
  if (/^<\/?[A-Za-z!]/.test(token) || (/^(html|xml|svg|jsx|tsx)$/.test(language) && /^[-\w:]+(?==|\s|>)/.test(token))) return 'token-tag';
  if (/^(const|let|var|function|return|if|else|for|while|class|new|import|from|export|default|async|await|try|catch|throw|interface|type|public|private|static|void|int|string|boolean|def|lambda|print|SELECT|FROM|WHERE|INSERT|UPDATE|DELETE)$/i.test(token)) return 'token-keyword';
  if (/^(?:[A-Za-z_$][\w$]*)(?=\()/.test(token)) return 'token-function';
  return '';
}

function HighlightedCode({ code, language }: { code: string; language: string }) {
  const matcher = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*|`(?:\\.|[^`])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|<\/?[A-Za-z][^>]*>|\b\d+(?:\.\d+)?\b|\b(?:const|let|var|function|return|if|else|for|while|class|new|import|from|export|default|async|await|try|catch|throw|interface|type|public|private|static|void|int|string|boolean|def|lambda|print|SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|true|false|null|undefined)\b|\b[A-Za-z_$][\w$]*(?=\())/gi;
  const output: React.ReactNode[] = [];
  let cursor = 0;
  for (let match = matcher.exec(code); match; match = matcher.exec(code)) {
    if (match.index > cursor) output.push(code.slice(cursor, match.index));
    output.push(<span className={tokenClass(match[0], language)} key={`${match.index}-${match[0]}`}>{match[0]}</span>);
    cursor = match.index + match[0].length;
  }
  if (cursor < code.length) output.push(code.slice(cursor));
  return <code className={`language-${language}`}>{output}</code>;
}

export function createPreviewDocument(code: string, language: string) {
  if (['html', 'htm'].includes(language)) return code;
  if (['css'].includes(language)) return `<!doctype html><html><head><style>body{margin:0;padding:24px;background:#0a1116;color:#effbfc;font-family:system-ui,sans-serif}.preview-card{padding:24px;border:1px solid #4abac6;border-radius:16px;background:#13222b} ${code}</style></head><body><main class="preview-card"><h1>CSS live preview</h1><p>This isolated canvas applies the generated CSS safely.</p><button>Preview button</button></main></body></html>`;
  if (['js', 'javascript', 'ts', 'typescript'].includes(language)) return `<!doctype html><html><head><style>body{margin:0;padding:24px;background:#0a1116;color:#effbfc;font-family:system-ui,sans-serif}#app{padding:20px;border:1px solid #4abac6;border-radius:16px}</style></head><body><div id="app">JavaScript preview running…</div><script>${code}</script></body></html>`;
  return '';
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewDocument = createPreviewDocument(code, language);
  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }
  return <section className="ai-code-block"><header><span>{language === 'code' ? 'CODE' : language.toUpperCase()}</span><div className="code-block-actions">{previewDocument && <button onClick={() => setPreviewOpen(true)} aria-label="Preview code"><Eye size={13} /> Preview</button>}<button onClick={() => void copyCode()} aria-label="Copy code">{copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}</button></div></header><pre><HighlightedCode code={code} language={language} /></pre>{previewOpen && <div className="code-preview-backdrop" role="dialog" aria-modal="true" aria-label="Code preview"><section className="code-preview-modal"><header><div><span>ISOLATED LIVE PREVIEW</span><small>{language.toUpperCase()} runs in a sandboxed frame.</small></div><button onClick={() => setPreviewOpen(false)} aria-label="Close preview"><X size={16} /></button></header><iframe title={`${language} live preview`} sandbox="allow-scripts" srcDoc={previewDocument} /></section></div>}</section>;
}

export function AiMessageContent({ content }: { content: string }) {
  return <div className="ai-rich-content">{splitFencedCode(content).map((segment, index) => segment.type === 'code' ? <CodeBlock key={`${segment.language}-${index}`} code={segment.value} language={segment.language} /> : segment.value ? <p key={`text-${index}`}>{segment.value}</p> : null)}</div>;
}
