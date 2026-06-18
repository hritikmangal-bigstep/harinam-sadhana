import { generateUUID } from "@/lib/uuid";

const STORAGE_KEY = "kws_contributor_id";

export function getContributorId(): string {
  if (typeof window === "undefined") return "";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return stored;
  const id = generateUUID();
  localStorage.setItem(STORAGE_KEY, id);
  return id;
}
