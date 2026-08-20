'use client';

import Link from 'next/link';
import { ArrowLeft, ChevronDown, CircleStop, Headphones, Mic, MicOff, PhoneOff, SlidersHorizontal, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { preferredVoiceTerms, speechLanguage, toSpeechText, VOICE_LANGUAGES, VOICE_STYLES, type VoiceStyle } from './voice-utils';

type SpeechResultEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type SpeechRecognitionLike = { lang: string; continuous: boolean; interimResults: boolean; start: () => void; stop: () => void; onresult?: (event: SpeechResultEvent) => void; onerror?: (event: { error?: string }) => void; onend?: () => void };
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type CallMessage = { role: 'user' | 'assistant'; content: string };

function selectVoice(voices: SpeechSynthesisVoice[], language: string, style: VoiceStyle) {
  const target = language.toLowerCase().split('-')[0];
  const languageMatches = voices.filter((voice) => voice.lang.toLowerCase().startsWith(target));
  const pool = languageMatches.length ? languageMatches : voices;
  const terms = preferredVoiceTerms(style);
  return pool.find((voice) => terms.some((term) => voice.name.toLowerCase().includes(term))) ?? pool[0];
}

export default function VoiceCallPage() {
  const [callActive, setCallActive] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [language, setLanguage] = useState('auto');
  const [style, setStyle] = useState<VoiceStyle>('adult');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [notice, setNotice] = useState('Choose a voice style, then start a private AI call.');
  const [messages, setMessages] = useState<CallMessage[]>([]);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const activeRef = useRef(false);
  const busyRef = useRef(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const updateVoices = () => { const list = window.speechSynthesis.getVoices(); voicesRef.current = list; setVoices(list); };
    updateVoices();
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
  }, []);

  const callLanguage = useCallback(() => speechLanguage(language, navigator.language || 'en-US'), [language]);

  const beginListening = useCallback(() => {
    if (!activeRef.current || busyRef.current || muted) return;
    const browser = window as typeof window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
    const Recognition = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!Recognition || !window.speechSynthesis) {
      setNotice('This device needs Chrome/Samsung Internet speech recognition and speech playback. Allow microphone access, then try again.');
      setCallActive(false); activeRef.current = false; return;
    }
    if (recognitionRef.current) return;
    const recognition = new Recognition();
    recognition.lang = callLanguage(); recognition.continuous = false; recognition.interimResults = false;
    recognition.onresult = async (event) => {
      const transcript = event.results[event.results.length - 1]?.[0]?.transcript?.trim();
      if (!transcript) return;
      recognitionRef.current = null; setListening(false); busyRef.current = true; setThinking(true);
      const userMessage: CallMessage = { role: 'user', content: transcript };
      setMessages((previous) => [...previous, userMessage]); setNotice('DevDesk is thinking…');
      try {
        const response = await fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: [...messages, userMessage] }) });
        const payload = await response.json();
        if (!response.ok || !payload.text) throw new Error(payload.error ?? 'DevDesk could not respond.');
        const assistantMessage: CallMessage = { role: 'assistant', content: payload.text };
        setMessages((previous) => [...previous, assistantMessage]);
        const utterance = new SpeechSynthesisUtterance(toSpeechText(payload.text));
        utterance.lang = callLanguage(); utterance.rate = style === 'senior' ? 0.86 : style === 'girl' || style === 'boy' ? 1.08 : 0.96;
        const chosen = selectVoice(voicesRef.current, utterance.lang, style); if (chosen) utterance.voice = chosen;
        utterance.onstart = () => { setSpeaking(true); setNotice(`DevDesk is speaking${chosen ? ` with ${chosen.name}` : ''}…`); };
        utterance.onend = () => { setSpeaking(false); busyRef.current = false; if (activeRef.current) { setNotice('Your turn — DevDesk is listening.'); window.setTimeout(beginListening, 280); } };
        utterance.onerror = () => { setSpeaking(false); busyRef.current = false; setNotice('Speech playback stopped. Tap the microphone to continue.'); };
        window.speechSynthesis.cancel(); window.speechSynthesis.speak(utterance);
      } catch (error) { busyRef.current = false; setNotice(error instanceof Error ? error.message : 'DevDesk could not respond. Try again.'); if (activeRef.current) window.setTimeout(beginListening, 400); } finally { setThinking(false); }
    };
    recognition.onerror = (event) => { recognitionRef.current = null; setListening(false); setNotice(event.error === 'not-allowed' ? 'Microphone is blocked. Allow mic permission in Chrome settings, then tap the mic.' : 'DevDesk did not hear that. Tap the microphone and speak again.'); };
    recognition.onend = () => { recognitionRef.current = null; setListening(false); };
    recognitionRef.current = recognition;
    try { recognition.start(); setListening(true); setNotice('Listening… speak naturally.'); } catch { recognitionRef.current = null; setNotice('Microphone could not start. Try again.'); }
  }, [callLanguage, messages, muted, style]);

  useEffect(() => { if (callActive && !listening && !speaking && !thinking && !muted) beginListening(); }, [beginListening, callActive, listening, muted, speaking, thinking]);

  function startCall() { activeRef.current = true; setCallActive(true); setNotice('Connecting secure DevDesk AI voice call…'); }
  function endCall() { activeRef.current = false; busyRef.current = false; recognitionRef.current?.stop(); recognitionRef.current = null; window.speechSynthesis?.cancel(); setListening(false); setSpeaking(false); setThinking(false); setCallActive(false); setNotice('Call ended. Start a new call whenever you are ready.'); }
  function toggleMute() { setMuted((value) => !value); recognitionRef.current?.stop(); if (!muted) setNotice('Microphone muted. DevDesk can still speak.'); }

  const selectedVoice = selectVoice(voices, callLanguage(), style);
  const status = speaking ? 'DevDesk is speaking' : thinking ? 'DevDesk is thinking' : listening ? 'Listening to you' : callActive ? 'Voice call connected' : 'Ready for a voice call';

  return <main className="voice-call-shell"><header className="voice-call-topbar"><Link href="/" aria-label="Back to DevDesk workspace"><ArrowLeft size={20} /></Link><div><span>DEV DESK · VOICE CALL</span><small>{status}</small></div><button onClick={() => setShowSettings((value) => !value)} aria-label="Open voice settings"><SlidersHorizontal size={19} /></button></header>{showSettings && <aside className="voice-settings"><div className="voice-settings-head"><div><b>Voice & language</b><small>DevDesk uses voices installed on this device.</small></div><button onClick={() => setShowSettings(false)}>Done</button></div><label>Speaking language<select value={language} onChange={(event) => setLanguage(event.target.value)}>{VOICE_LANGUAGES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label>Available device voice<select value={selectedVoice?.name ?? ''} onChange={(event) => { const exact = voices.find((voice) => voice.name === event.target.value); if (exact) { const nextLanguage = VOICE_LANGUAGES.find((item) => exact.lang.toLowerCase().startsWith(item.value.split('-')[0]))?.value; if (nextLanguage) setLanguage(nextLanguage); } }}>{selectedVoice ? <option value={selectedVoice.name}>{selectedVoice.name} · {selectedVoice.lang}</option> : <option value="">No matching voice installed</option>}{voices.filter((voice) => voice.name !== selectedVoice?.name).map((voice) => <option key={`${voice.name}-${voice.lang}`} value={voice.name}>{voice.name} · {voice.lang}</option>)}</select></label><div className="voice-style-grid">{VOICE_STYLES.map((option) => <button className={style === option.value ? 'active' : ''} key={option.value} onClick={() => setStyle(option.value)}><b>{option.label}</b><small>{option.hint}</small></button>)}</div><p>Exact gender and age voices depend on the voices installed in Chrome or Android. DevDesk chooses the closest installed voice for the selected style and language.</p></aside>}<section className="voice-call-stage"><div className={callActive ? 'call-orbit active' : 'call-orbit'}><div className="call-avatar"><img src="/brand/devdesk-logo.png" alt="DevDesk AI" /></div></div><h1>DevDesk AI</h1><p className="voice-call-state"><i className={listening ? 'pulse' : ''} /> {status}</p><div className="voice-caption">{notice}</div>{messages.length > 0 && <div className="voice-transcript" aria-live="polite">{messages.slice(-4).map((message, index) => <p className={message.role} key={`${message.role}-${index}`}><b>{message.role === 'user' ? 'You' : 'DevDesk'}</b>{message.content}</p>)}</div>}</section><footer className="voice-call-controls"><button className={muted ? 'call-control muted' : 'call-control'} onClick={toggleMute} disabled={!callActive}>{muted ? <MicOff size={21} /> : <Mic size={21} />}<span>{muted ? 'Unmute' : 'Mute'}</span></button>{callActive ? <button className="call-end" onClick={endCall}><PhoneOff size={23} /><span>End call</span></button> : <button className="call-start" onClick={startCall}><Headphones size={23} /><span>Start voice call</span></button>}<button className="call-control" onClick={() => setShowSettings(true)}><Volume2 size={21} /><span>Voice</span></button></footer></main>;
}
