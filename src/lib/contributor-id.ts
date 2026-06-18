"use client";

const STORAGE_KEY = "kws_contributor_id";

/** Generates a UUID using the best available browser API. */
function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Returns the persistent anonymous contributor ID for this browser.
 * Mints a new UUID on first call and stores it in localStorage.
 * Safe to call server-side — returns empty string if localStorage is unavailable.
 */
export function getContributorId(): string {
  if (typeof localStorage === "undefined") return "";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return stored;
  const id = generateUUID();
  localStorage.setItem(STORAGE_KEY, id);
  return id;
}
