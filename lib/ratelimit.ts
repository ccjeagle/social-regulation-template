// Best-effort per-IP limiter. Memory is per serverless instance, so this only slows down
// careless loops; the real guard is the access key (rotate it if the URL leaks).
const WINDOW_MS = 10 * 60_000;
const MAX = 15;
const hits = new Map<string, number[]>();

export function tooMany(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v[v.length - 1] > WINDOW_MS) hits.delete(k);
  return recent.length > MAX;
}
