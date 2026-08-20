'use client';

import { ImageIcon, LoaderCircle, Mic, PhoneCall, PhoneOff, Plus, Sparkles, Volume2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type SpeechResultEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type SpeechRecognitionLike = { lang: string; continuous: boolean; interimResults: boolean; start: () => void; stop: () => void; onresult?: (event: SpeechResultEvent) => void; onerror?: () => void; onend?: () => void };
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function writeToComposer(text: string) {
  const composer = document.querySelector<HTMLTextAreaElement>('#chat-composer');
  if (!composer) return;
  const next = `${composer.value}${composer.value.trim() ? ' ' : ''}${text}`;
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  setter?.call(composer, next);
  composer.dispatchEvent(new Event('input', { bubbles: true }));
}

export function ComposerMediaPortal({ latestAssistantMessage }: { latestAssistantMessage?: string }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [voiceCallActive, setVoiceCallActive] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState('');
  const [imagePanel, setImagePanel] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const latestMessageRef = useRef<string | undefined>(undefined);

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

  function stopVoiceCall() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    window.speechSynthesis?.cancel();
    setVoiceCallActive(false);
    setVoiceNotice('Voice call ended.');
  }

  function listenForVoiceCall() {
    const browser = window as typeof window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
    const Recognition = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!Recognition || !window.speechSynthesis) {
      setVoiceCallActive(false);
      setVoiceNotice('Voice call needs speech recognition and speech playback. Open this in current Chrome and allow microphone access.');
      return;
    }
    const recognition = new Recognition();
    recognition.lang = navigator.language || 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const spoken = event.results[event.results.length - 1]?.[0]?.transcript?.trim();
      if (!spoken) return;
      writeToComposer(spoken);
      setVoiceNotice('Message heard. DevDesk is answering aloud.');
      window.setTimeout(() => document.querySelector<HTMLButtonElement>('.send-button')?.click(), 120);
    };
    recognition.onerror = () => setVoiceNotice('Voice call could not hear that. Tap Voice call again and allow microphone access.');
    recognition.onend = () => { recognitionRef.current = null; };
    recognitionRef.current = recognition;
    try { recognition.start(); setVoiceNotice('Voice call is listening…'); } catch { setVoiceNotice('Voice call could not start. Try again.'); }
  }

  function startVoiceCall() {
    if (voiceCallActive) { stopVoiceCall(); return; }
    setVoiceCallActive(true);
    setOpen(true);
    listenForVoiceCall();
  }

  useEffect(() => {
    if (!voiceCallActive || !latestAssistantMessage || latestAssistantMessage === latestMessageRef.current || !window.speechSynthesis) return;
    latestMessageRef.current = latestAssistantMessage;
    const utterance = new SpeechSynthesisUtterance(latestAssistantMessage.slice(0, 2200));
    utterance.rate = 1;
    utterance.onend = () => { if (voiceCallActive) listenForVoiceCall(); };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setVoiceNotice('DevDesk is speaking. It will listen again afterwards.');
  }, [latestAssistantMessage, voiceCallActive]);

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
  return createPortal(<div className="composer-media-menu"><button className={open ? 'composer-plus-button active' : 'composer-plus-button'} onClick={() => setOpen((value) => !value)} aria-label="Open media tools" aria-expanded={open}>{open ? <X size={16} /> : <Plus size={17} />}</button>{open && <div className="composer-media-popover"><div className="composer-media-head"><span><Sparkles size={13} /> CREATE & VOICE</span><button onClick={() => setOpen(false)} aria-label="Close media tools"><X size={13} /></button></div><button className={voiceCallActive ? 'media-action voice-active' : 'media-action'} onClick={startVoiceCall}>{voiceCallActive ? <PhoneOff size={16} /> : <PhoneCall size={16} />}<span><b>{voiceCallActive ? 'End voice call' : 'Voice call'}</b><small>{voiceCallActive ? 'Listening and speaking' : 'Talk with DevDesk by voice'}</small></span></button>{voiceNotice && <p className="voice-call-notice"><Mic size={12} /> {voiceNotice}</p>}<button className="media-action" onClick={() => { setImagePanel((value) => !value); setImageError(''); }}><ImageIcon size={16} /><span><b>Image generation</b><small>Create an image from a prompt</small></span></button>{imagePanel && <form className="image-generation-form" onSubmit={(event) => void generateImage(event)}><textarea value={imagePrompt} onChange={(event) => setImagePrompt(event.target.value)} placeholder="Describe the image you want to create…" rows={3} maxLength={1000} /><div><select value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value)} aria-label="Image aspect ratio"><option value="1:1">Square</option><option value="4:3">Landscape</option><option value="3:4">Portrait</option><option value="16:9">Wide</option><option value="9:16">Story</option></select><button disabled={imageLoading}>{imageLoading ? <><LoaderCircle size={13} className="spin" /> Creating…</> : <><ImageIcon size={13} /> Generate</>}</button></div>{imageError && <p className="media-error">{imageError}</p>}{imageDataUrl && <figure className="generated-image-result"><img src={imageDataUrl} alt={imagePrompt || 'AI generated image'} /><figcaption><Volume2 size={12} /> Generated securely on the server <a href={imageDataUrl} download="devdesk-ai-image.png">Download</a></figcaption></figure>}</form>}</div>}</div>, target);
}
