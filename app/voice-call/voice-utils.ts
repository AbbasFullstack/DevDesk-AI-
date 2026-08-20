export const VOICE_LANGUAGES = [
  { value: 'auto', label: 'Auto / device language' },
  { value: 'ur-PK', label: 'Urdu (Pakistan)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'hi-IN', label: 'Hindi' },
  { value: 'ar-SA', label: 'Arabic' },
] as const;

export const VOICE_STYLES = [
  { value: 'girl', label: 'Girl', hint: 'Bright, lighter device voice' },
  { value: 'boy', label: 'Boy', hint: 'Bright, lighter device voice' },
  { value: 'woman', label: 'Woman', hint: 'Warm device voice' },
  { value: 'man', label: 'Man', hint: 'Deep device voice' },
  { value: 'adult', label: 'Adult', hint: 'Balanced device voice' },
  { value: 'senior', label: 'Senior', hint: 'Calmer device voice' },
] as const;

export type VoiceStyle = (typeof VOICE_STYLES)[number]['value'];

export function speechLanguage(language: string, deviceLanguage = 'en-US') {
  return language === 'auto' ? deviceLanguage : language;
}

export function toSpeechText(content: string) {
  return content
    .replace(/```[\s\S]*?```/g, ' Code is available in the chat. ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*#_>[\]()-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function preferredVoiceTerms(style: VoiceStyle) {
  if (style === 'girl' || style === 'woman') return ['female', 'woman', 'zira', 'susan', 'samantha', 'aria', 'jenny', 'sonia'];
  if (style === 'boy' || style === 'man') return ['male', 'man', 'david', 'daniel', 'george', 'guy', 'ryan'];
  if (style === 'senior') return ['grand', 'elder', 'old', 'mature'];
  return [];
}
