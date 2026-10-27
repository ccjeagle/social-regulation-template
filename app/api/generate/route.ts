import { NextResponse } from "next/server";
import { isValidKey } from "@/lib/access";
import { logGeneration } from "@/lib/log";
import { renderTemplates, type Audience, type Size } from "@/lib/templates";

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
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
  await logGeneration({ name, audience, size: audience === "internal" ? size : "", version: out.version });
  return NextResponse.json(out, { headers: { "Cache-Control": "no-store" } });
}
