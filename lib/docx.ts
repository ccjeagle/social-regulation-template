import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { parseMarkdown, type Block, type Run } from "./markdown";

const FONT = { ascii: "微軟正黑體", hAnsi: "微軟正黑體", eastAsia: "微軟正黑體" };
const runs = (rs: Run[], extra: { italics?: boolean } = {}) =>
  rs.map((r) => new TextRun({ text: r.text, bold: r.bold, font: FONT, size: 24, ...extra }));

function toParagraph(b: Block): Paragraph {
  const spacing = { after: 120, line: 360 };
  switch (b.type) {
    case "heading":
      return new Paragraph({
        heading: b.level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
        spacing: { before: b.level === 1 ? 0 : 240, after: 120 },
        children: b.runs.map((r) => new TextRun({ text: r.text, bold: true, font: FONT, size: b.level === 1 ? 36 : 28 })),
      });
    case "item":
      return new Paragraph({ spacing, indent: { left: 360 }, children: [new TextRun({ text: `${b.n}. `, font: FONT, size: 24 }), ...runs(b.runs)] });
    case "quote":
      return new Paragraph({ spacing, indent: { left: 360 }, children: runs(b.runs) });
    default:
      return new Paragraph({ spacing, children: runs(b.runs) });
  }
}

export async function downloadDocx(markdown: string, filename: string) {
  const doc = new Document({ sections: [{ children: parseMarkdown(markdown).map(toParagraph) }] });
  const blob = await Packer.toBlob(doc);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${filename}.docx`;
  a.click();
  URL.revokeObjectURL(a.href);
}
