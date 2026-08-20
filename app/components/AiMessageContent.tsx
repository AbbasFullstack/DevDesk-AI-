'use client';

import { Check, Copy } from 'lucide-react';
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

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }
  return <section className="ai-code-block"><header><span>{language === 'code' ? 'CODE' : language.toUpperCase()}</span><button onClick={() => void copyCode()} aria-label="Copy code">{copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}</button></header><pre><HighlightedCode code={code} language={language} /></pre></section>;
}

export function AiMessageContent({ content }: { content: string }) {
  return <div className="ai-rich-content">{splitFencedCode(content).map((segment, index) => segment.type === 'code' ? <CodeBlock key={`${segment.language}-${index}`} code={segment.value} language={segment.language} /> : segment.value ? <p key={`text-${index}`}>{segment.value}</p> : null)}</div>;
}
