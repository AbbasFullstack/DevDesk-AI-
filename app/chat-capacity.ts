export const CHAT_CAPACITY_COOLDOWN_SECONDS = 60;

export function cooldownUntilFromResponse(retryAfterSeconds: unknown, now = Date.now()) {
  const seconds = typeof retryAfterSeconds === 'number' && Number.isFinite(retryAfterSeconds)
    ? Math.max(0, Math.min(Math.floor(retryAfterSeconds), CHAT_CAPACITY_COOLDOWN_SECONDS))
    : 0;
  return seconds ? now + seconds * 1_000 : 0;
}

export function remainingCooldownSeconds(cooldownUntil: number, now = Date.now()) {
  return Math.max(0, Math.ceil((cooldownUntil - now) / 1_000));
}
