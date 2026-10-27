import { after, NextResponse } from "next/server";
import { isValidKey } from "@/lib/access";
import { logGeneration } from "@/lib/log";
import { tooMany } from "@/lib/ratelimit";
import { renderTemplates, type Audience, type Size } from "@/lib/templates";

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (tooMany(ip)) return bad("操作太頻繁，請稍後再試", 429);

  const body = await req.json().catch(() => null);
  if (!body) return bad("格式錯誤");
  if (!isValidKey(body.id)) return bad("網址已失效，請聯絡資訊委員會，取得最新網址。", 403);
  if (body.consent !== true) return bad("請先勾選紀錄說明");

  // Collapse whitespace and drop template/control characters so the name cannot alter the template.
  const name = String(body.name ?? "").replace(/[\u0000-\u001f{}<>]/g, " ").replace(/\s+/g, " ").trim();
  if (!name || name.length > 60) return bad("請輸入 1–60 字的社群名稱");

  const audience: Audience = body.audience === "public" ? "public" : "internal";
  const size: Size = body.size === "large" ? "large" : "small";

  const out = await renderTemplates({ name, audience, size });
  // Runs after the response is sent, so a slow or failing Sheet never reaches the user.
  after(() =>
    logGeneration({
      name,
      audience,
      size: audience === "internal" ? size : "",
      version: out.version,
      pinVersion: out.pinVersion,
    }),
  );
  return NextResponse.json(out, { headers: { "Cache-Control": "no-store" } });
}
