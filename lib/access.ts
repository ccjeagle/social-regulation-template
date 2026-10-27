import { timingSafeEqual } from "node:crypto";

// ACCESS_KEYS: one or more keys, comma-separated, so a key can be rotated without downtime.
export function isValidKey(candidate: unknown): boolean {
  if (typeof candidate !== "string" || candidate.length < 8) return false;
  const keys = (process.env.ACCESS_KEYS ?? "").split(",").map((k) => k.trim()).filter(Boolean);
  const a = Buffer.from(candidate);
  return keys.some((k) => {
    const b = Buffer.from(k);
    return a.length === b.length && timingSafeEqual(a, b);
  });
}
