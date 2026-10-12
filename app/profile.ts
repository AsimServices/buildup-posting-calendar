export const PROFILE_KEY = "buildup-posting-profile-v1";
export const NAME_MAX = 80;
export const EMAIL_MAX = 120;
export const NOTE_MAX = 1000;

export type Profile = {id: string; name: string; email: string; note: string; start: string; synced: boolean};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const isValidName = (name: string) => name.trim().length > 0 && name.trim().length <= NAME_MAX;
export const isValidEmail = (email: string) => email.trim().length <= EMAIL_MAX && EMAIL_PATTERN.test(email.trim());
export const isValidStart = (start: string) => DATE_PATTERN.test(start) && !Number.isNaN(Date.parse(start));
export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";

export function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function readProfile(raw: string | null): Profile | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return null;
    const {id, name, email, note, start, synced} = data;
    if (typeof id !== "string" || !id || typeof name !== "string" || !isValidName(name) || typeof email !== "string" || !isValidEmail(email) || typeof start !== "string" || !isValidStart(start)) return null;
    return {id, name, email, note: typeof note === "string" ? note : "", start, synced: synced === true};
  } catch {
    return null;
  }
}

const WEBHOOK_URL = "https://n8n.asimservices.com/webhook/buildup-90day-calendar";

// A failed attempt is retried on the next visit, so the receiving workflow should de-duplicate on `id`.
export async function sendToSheet(profile: Profile): Promise<boolean> {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({id: profile.id, name: profile.name.trim(), email: profile.email.trim(), note: profile.note.trim()}),
      signal: AbortSignal.timeout(10000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
