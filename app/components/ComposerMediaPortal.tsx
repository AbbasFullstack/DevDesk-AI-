'use client';

import { ImageIcon, LoaderCircle, PhoneCall, Plus, Sparkles, Volume2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export function ComposerMediaPortal() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [imagePanel, setImagePanel] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState('');

  useEffect(() => {
    const tools = document.querySelector<HTMLElement>('.composer-tools');
    const send = tools?.querySelector<HTMLElement>('.send-button');
    if (!tools || !send) return;
    const host = document.createElement('div');
    host.className = 'composer-media-portal-host';
    tools.insertBefore(host, send);
    setTarget(host);
    return () => { host.remove(); setTarget(null); };
  }, []);


  async function generateImage(event: React.FormEvent) {
    event.preventDefault();
    if (imageLoading) return;
    setImageLoading(true); setImageError(''); setImageDataUrl('');
    try {
      const response = await fetch('/api/images/generate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: imagePrompt, aspectRatio }) });
      const payload = await response.json();
      if (!response.ok || !payload.imageDataUrl) throw new Error(payload.error ?? 'Image generation could not complete.');
      setImageDataUrl(payload.imageDataUrl);
    } catch (error) { setImageError(error instanceof Error ? error.message : 'Image generation could not complete.'); } finally { setImageLoading(false); }
  }

  if (!target) return null;
  return createPortal(<div className="composer-media-menu"><button className={open ? 'composer-plus-button active' : 'composer-plus-button'} onClick={() => setOpen((value) => !value)} aria-label="Open media tools" aria-expanded={open}>{open ? <X size={16} /> : <Plus size={17} />}</button>{open && <div className="composer-media-popover"><div className="composer-media-head"><span><Sparkles size={13} /> CREATE & VOICE</span><button onClick={() => setOpen(false)} aria-label="Close media tools"><X size={13} /></button></div><button className="media-action" onClick={() => { window.location.href = '/voice-call'; }}><PhoneCall size={16} /><span><b>Voice call</b><small>Open full-screen AI voice conversation</small></span></button><button className="media-action" onClick={() => { setImagePanel((value) => !value); setImageError(''); }}><ImageIcon size={16} /><span><b>Image generation</b><small>Create an image from a prompt</small></span></button>{imagePanel && <form className="image-generation-form" onSubmit={(event) => void generateImage(event)}><textarea value={imagePrompt} onChange={(event) => setImagePrompt(event.target.value)} placeholder="Describe the image you want to create…" rows={3} maxLength={1000} /><div><select value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value)} aria-label="Image aspect ratio"><option value="1:1">Square</option><option value="4:3">Landscape</option><option value="3:4">Portrait</option><option value="16:9">Wide</option><option value="9:16">Story</option></select><button disabled={imageLoading}>{imageLoading ? <><LoaderCircle size={13} className="spin" /> Creating…</> : <><ImageIcon size={13} /> Generate</>}</button></div>{imageError && <p className="media-error">{imageError}</p>}{imageDataUrl && <figure className="generated-image-result"><img src={imageDataUrl} alt={imagePrompt || 'AI generated image'} /><figcaption><Volume2 size={12} /> Generated securely on the server <a href={imageDataUrl} download="devdesk-ai-image.png">Download</a></figcaption></figure>}</form>}</div>}</div>, target);
}
