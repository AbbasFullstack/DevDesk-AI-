'use client';

import { useState } from 'react';
import { AuthControls } from './components/AuthControls';
import { Bot, ChevronDown, Code2, FileArchive, FileCode2, GitBranch, ImagePlus, LayoutDashboard, Mic, Paperclip, Play, Plus, Search, Send, Settings2, ShieldCheck, Sparkles, UploadCloud, WandSparkles, X } from 'lucide-react';

const nav = [
  { label: 'Workspace', icon: LayoutDashboard },
  { label: 'Projects', icon: FileCode2 },
  { label: 'Analyses', icon: Sparkles },
  { label: 'Connectors', icon: GitBranch },
];

const checks = [
  ['Architecture', 'Modular monolith with clear domain boundaries', '92%'],
  ['Security', '2 dependency risks and 1 exposed debug route', '76%'],
  ['Maintainability', 'Strong typing; tests missing around upload flow', '84%'],
];

export default function Home() {
  const [active, setActive] = useState('Workspace');
  const [prompt, setPrompt] = useState('');
  const [thinking, setThinking] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [preview, setPreview] = useState(true);
  const [message, setMessage] = useState('');

  const sendPrompt = () => {
    if (!prompt.trim()) return;
    setThinking(true);
    setMessage(prompt);
    setPrompt('');
    window.setTimeout(() => setThinking(false), 1100);
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Sparkles size={16} /></div><div><strong>DevDesk</strong><span>AI code intelligence</span></div></div>
        <button className="new-project" onClick={() => setShowUpload(true)}><Plus size={16} /> New project</button>
        <nav className="side-nav">{nav.map(({ label, icon: Icon }) => <button key={label} className={active === label ? 'active' : ''} onClick={() => setActive(label)}><Icon size={16} /> {label}{label === 'Analyses' && <em>3</em>}</button>)}</nav>
        <div className="sidebar-bottom"><div className="secure-note"><ShieldCheck size={15} /><span>Private by design<br /><small>Server-side AI boundary</small></span></div><button className="profile"><span className="avatar">A</span><span><b>Abbas Hussain</b><small>Developer</small></span><Settings2 size={15} /></button></div>
      </aside>

      <section className="workspace">
        <header className="topbar"><div className="mobile-brand"><Sparkles size={16} /> DEV DESK</div><div className="project-switcher"><span className="project-dot" /> OmniStore / main <ChevronDown size={14} /></div><div className="top-actions"><button aria-label="Search"><Search size={17} /></button><button aria-label="Settings"><Settings2 size={17} /></button><span className="online"><i /> AI online</span><AuthControls /></div></header>

        <div className="workspace-grid">
          <section className="chat-column">
            <div className="eyebrow">DEV DESK THINKING · PROJECT ANALYSIS</div>
            <h1>Understand your codebase.</h1>
            <p className="lede">Ask questions, attach context, and get a clear path from problem to solution.</p>
            <div className="analysis-strip"><div><span className="strip-icon"><Code2 size={15} /></span><span><b>OmniStore</b><small>TypeScript · Next.js · 86 files</small></span></div><span className="analysis-status"><i /> Analysis ready</span></div>
            <div className="chat-thread">
              <div className="message user-message"><span className="message-avatar user-avatar">A</span><div><small>YOU · 10:42 AM</small><p>{message || 'Review the authentication flow and tell me what I should improve before production.'}</p></div></div>
              <div className="message ai-message"><span className="message-avatar ai-avatar"><Sparkles size={14} /></span><div><small>DEV DESK · DEEP ANALYSIS</small><p>I found a strong foundation. The auth boundary is clear, but the refresh-token path needs an explicit replay check. I also found three opportunities to reduce client-side bundle weight.</p><div className="insight"><span>01</span><p><b>Recommended next step</b><br />Move token rotation into a single server procedure and add a deterministic expiry test.</p><button>Open finding <ChevronDown size={13} /></button></div></div></div>
              {thinking && <div className="thinking"><span><i /><i /><i /></span> Dev Desk is thinking through the repository...</div>}
            </div>
            <div className="composer-wrap"><div className="composer-tools"><button onClick={() => setShowUpload(true)}><Paperclip size={15} /> Attach</button><button><Mic size={15} /> Voice</button><span className="composer-hint">Ask about your project...</span><button className="send-button" onClick={sendPrompt}><Send size={16} /></button></div><textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendPrompt(); } }} placeholder="Ask DevDesk to explain, debug, or improve your code..." rows={2} /><div className="composer-footer"><span><WandSparkles size={13} /> DevDesk Thinking <ChevronDown size={12} /></span><small>Enter to send · Shift + Enter for a new line</small></div></div>
          </section>

          <aside className="inspector"><div className="inspector-head"><div><span className="eyebrow">PROJECT INTELLIGENCE</span><h2>OmniStore</h2></div><button><Plus size={16} /></button></div><div className="health-card"><div className="health-ring"><strong>84</strong><span>/100</span></div><div><b>Project health</b><p>Good foundation with focused fixes ahead.</p></div></div><div className="inspector-section"><div className="section-title"><span>Latest analysis</span><small>Just now</small></div>{checks.map(([label, desc, score]) => <div className="check-row" key={label}><div><b>{label}</b><p>{desc}</p></div><strong>{score}</strong></div>)}</div><div className="inspector-section"><div className="section-title"><span>Project files</span><button>View all</button></div><div className="file-row"><FileArchive size={16} /><span>omnistore-source.zip</span><small>4.2 MB</small></div><div className="file-row"><GitBranch size={16} /><span>github.com/abbas/omnistore</span><small>main</small></div></div><div className="preview-card"><div className="section-title"><span>Code preview</span><label><input type="checkbox" checked={preview} onChange={(e) => setPreview(e.target.checked)} /> Live</label></div>{preview ? <div className="mini-preview"><div className="mini-window"><span /><span /><span /></div><div className="preview-content"><div className="preview-line wide" /><div className="preview-line" /><div className="preview-box"><Code2 size={15} /><b>AuthBoundary</b><small>Preview component</small></div></div></div> : <div className="preview-paused"><Play size={14} /> Preview paused</div>}</div></aside>
        </div>
      </section>

      {showUpload && <div className="modal-backdrop" onClick={() => setShowUpload(false)}><div className="upload-modal" onClick={(e) => e.stopPropagation()}><button className="close-modal" onClick={() => setShowUpload(false)}><X size={17} /></button><span className="eyebrow">START A PROJECT</span><h2>Bring your codebase.</h2><p>Upload a ZIP, attach files, or connect GitHub. DevDesk will map the project before asking its first question.</p><div className="upload-grid"><button><UploadCloud size={21} /><b>Upload ZIP</b><small>Best for a complete project</small></button><button><GitBranch size={21} /><b>Connect GitHub</b><small>Import a repository branch</small></button><button><ImagePlus size={21} /><b>Upload files</b><small>Images, docs, and code</small></button></div><div className="drop-zone"><FileArchive size={22} /><span>Drop your project here or <b>browse files</b></span><small>ZIP, PDF, images, TXT, MD · up to 50 MB</small></div></div></div>}
    </main>
  );
}
