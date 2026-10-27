import { readFile } from "node:fs/promises";
import path from "node:path";

export type Audience = "internal" | "public";
export type Size = "small" | "large";

const DIR = path.join(process.cwd(), "content", "released");
const MAIN: Record<Audience, string> = {
  internal: "天帝教社群交流規範（範本）v3-D 興利導向版",
  public: "天帝教社群交流規範（範本）v3-E 公開社群興利版",
};

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
    .replace(/(\n>[ \t]*){2,}(?=\n)/g, "\n>") // collapse empty quote lines left by removed blocks
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
    const raw = await readFile(path.join(DIR, file), "utf8");
    return tidy(applyBlocks(raw, flags).replaceAll("{{社群名稱}}", opts.name));
  };
  const stem = MAIN[opts.audience];
  const [main, pin] = await Promise.all([
    load(`${stem}.md`),
    load(`${stem}．置頂精簡版.md`),
  ]);
  return { main, pin, version: opts.audience === "internal" ? "v3-D" : "v3-E" };
}
