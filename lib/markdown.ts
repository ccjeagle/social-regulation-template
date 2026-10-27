// Minimal parser for the subset of markdown used by the templates:
// headings, paragraphs, ordered lists, bullets, **bold**.
export type Run = { text: string; bold?: boolean };
export type Block =
  | { type: "heading"; level: 1 | 2; runs: Run[] }
  | { type: "paragraph"; runs: Run[] }
  | { type: "bullet"; runs: Run[] }
  | { type: "item"; n: number; runs: Run[] };

export function parseInline(s: string): Run[] {
  return s
    .split(/(\*\*[^*]+\*\*)/)
    .filter(Boolean)
    .map((p) =>
      p.startsWith("**") ? { text: p.slice(2, -2), bold: true } : { text: p },
    );
}

export function parseMarkdown(md: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of md.split("\n")) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    const bullet = line.match(/^[-*]\s+(.*)/);
    if (bullet) {
      blocks.push({ type: "bullet", runs: parseInline(bullet[1]) });
      continue;
    }
    const h = line.match(/^(#{1,2})\s+(.*)/);
    if (h) blocks.push({ type: "heading", level: h[1].length as 1 | 2, runs: parseInline(h[2]) });
    else {
      const li = line.match(/^(\d+)\.\s+(.*)/);
      if (li) blocks.push({ type: "item", n: Number(li[1]), runs: parseInline(li[2]) });
      else blocks.push({ type: "paragraph", runs: parseInline(line) });
    }
  }
  return blocks;
}

const text = (runs: Run[]) => runs.map((r) => r.text).join("");

// Plain text for pasting into LINE / Facebook, which do not render markdown.
export function toPlainText(md: string): string {
  const blocks = parseMarkdown(md);
  return blocks
    .map((b, i) => {
      const line =
        b.type === "heading"
          ? b.level === 1 ? text(b.runs) : `【${text(b.runs)}】`
          : b.type === "item" ? `${b.n}. ${text(b.runs)}` : b.type === "bullet" ? `• ${text(b.runs)}` : text(b.runs);
      const tight = (b.type === "item" || b.type === "bullet") && blocks[i - 1]?.type === b.type;
      return (i === 0 ? "" : tight ? "\n" : "\n\n") + line;
    })
    .join("");
}
