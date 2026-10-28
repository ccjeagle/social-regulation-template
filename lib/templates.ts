import { readFile } from "node:fs/promises";
import path from "node:path";

export type Audience = "internal" | "public";
export type Size = "small" | "large";

const DIR = path.join(process.cwd(), "content", "released");
const FILES: Record<Audience, { main: string; pin: string }> = {
  internal: { main: "internal.md", pin: "internal.pin.md" },
  public: { main: "public.md", pin: "public.pin.md" },
};

// Leading `---` block with simple `key: value` lines; returns the body and the metadata.
function splitFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return { meta: {}, body: raw };
  const meta = Object.fromEntries(
    m[1].split("\n").map((l) => l.split(/:\s*/, 2) as [string, string]),
  );
  return { meta, body: raw.slice(m[0].length) };
}

// <!-- if:small --> ... <!-- endif --> keeps the block only when the flag is on.
function applyBlocks(src: string, flags: Set<string>): string {
  const out: string[] = [];
  let keep = true;
  for (const line of src.split("\n")) {
    const open = line.match(/^<!--\s*if:(\w+)\s*-->$/);
    if (open) {
      keep = flags.has(open[1]);
      continue;
    }
    if (/^<!--\s*endif\s*-->$/.test(line)) {
      keep = true;
      continue;
    }
    if (keep) out.push(line);
  }
  return out.join("\n");
}

function tidy(src: string): string {
  return src
    .replace(/^<!--.*-->\n*/gm, "") // leading admin notes
    .replace(/\n{3,}/g, "\n\n")
    .trim() + "\n";
}

export async function renderTemplates(opts: {
  name: string;
  audience: Audience;
  size: Size;
}) {
  const flags = new Set<string>(opts.audience === "internal" ? [opts.size] : []);
  const load = async (file: string) => {
    const { meta, body } = splitFrontmatter(await readFile(path.join(DIR, file), "utf8"));
    return { text: tidy(applyBlocks(body, flags).replaceAll("{{社群名稱}}", opts.name)), version: meta.version ?? "" };
  };
  const files = FILES[opts.audience];
  const [main, pin] = await Promise.all([load(files.main), load(files.pin)]);
  // The version is part of the document so a pasted or downloaded copy can be traced back.
  const stamped = `${main.text}\n-- 版本：${main.version} --\n`;
  return { main: stamped, pin: pin.text, version: main.version, pinVersion: pin.version };
}
