"use client";

import { useRef, useState } from "react";
import { parseMarkdown, toPlainText, type Block, type Run } from "@/lib/markdown";

type Audience = "internal" | "public";
type Size = "small" | "large";
type Result = { main: string; pin: string; name: string; version: string; pinVersion: string };

const AUDIENCES: { value: Audience; label: string; hint: string }[] = [
  { value: "internal", label: "對教內同奮", hint: "內部社群，可稱「同奮」「師尊」" },
  { value: "public", label: "公開", hint: "任何人都能瀏覽或留言" },
];
const SIZES: { value: Size; label: string; hint: string }[] = [
  { value: "small", label: "小型・交流用", hint: "數十人，互相分享與提問" },
  { value: "large", label: "大型・公告性質", hint: "數百人以上，以傳遞訊息為主" },
];

export function Generator({ accessKey }: { accessKey: string }) {
  const [name, setName] = useState("");
  const [audience, setAudience] = useState<Audience>("internal");
  const [size, setSize] = useState<Size>("small");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const resultRef = useRef<HTMLElement>(null);

  const ready = name.trim().length > 0 && consent && !busy;

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: accessKey, name, audience, size, consent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "產生失敗");
      setResult({ ...data, name: name.trim() });
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "產生失敗，請稍後再試");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header className="mb-10 text-center">
        <h1 className="font-serif text-3xl tracking-wide text-jade-deep sm:text-4xl">社群交流基本規範產生器</h1>
        <p className="mx-auto mt-4 max-w-md text-ink-soft">
          填入社群名稱，選擇適用對象，即可取得
          <br />
          專屬於您社群的交流基本規範與置頂訊息。
        </p>
      </header>

      <form onSubmit={generate} className="space-y-8 rounded-3xl border border-line bg-paper p-6 shadow-[0_8px_30px_-12px_rgba(53,93,83,0.18)] sm:p-9">
        <div>
          <label htmlFor="name" className="mb-2 block font-medium">社群名稱</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            placeholder="例如：○○教院同奮交流群"
            className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-lg placeholder:text-ink-soft/60 focus:border-jade focus:outline-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-jade/20"
          />
        </div>

        <Choice legend="適用對象" name="audience" value={audience} onChange={setAudience} options={AUDIENCES} />

        {audience === "internal" && (
          <Choice legend="社群的用途" name="size" value={size} onChange={setSize} options={SIZES} />
        )}

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-jade-wash/60 p-4 text-[0.95rem]">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1.5 size-5 shrink-0 accent-jade"
          />
          <span>我了解系統會記錄本次產生的內容（社群名稱、選項與時間），僅供內部統計與報告使用。</span>
        </label>

        {error && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-red-800">{error}</p>}

        <button
          type="submit"
          disabled={!ready}
          className="w-full rounded-2xl bg-jade-deep px-6 py-4 text-lg font-medium text-white transition hover:bg-jade disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-soft"
        >
          {busy ? "產生中…" : "產生"}
        </button>
      </form>

      {result && (
        <section ref={resultRef} aria-label="產生結果" className="mt-14 scroll-mt-6 space-y-8">
          <Panel
            id="print-area"
            title="交流基本規範全文"
            subtitle={`版本 ${result.version}`}
            copyText={toPlainText(result.main)}
            actions={<SmallButton onClick={() => window.print()}>產生 PDF</SmallButton>}
          >
            <Preview markdown={result.main} />
          </Panel>

          <Panel title="置頂精簡版" subtitle={`版本 ${result.pinVersion}・貼到 LINE 記事本或社群置頂貼文`} copyText={toPlainText(result.pin)}>
            <Preview markdown={result.pin} />
          </Panel>

          <p className="text-center text-sm text-ink-soft">
            內容僅在您的瀏覽器中轉成檔案，不會上傳或保存。
          </p>
        </section>
      )}
    </>
  );
}

function Choice<T extends string>({
  legend, name, value, onChange, options,
}: {
  legend: string; name: string; value: T; onChange: (v: T) => void;
  options: { value: T; label: string; hint: string }[];
}) {
  return (
    <fieldset>
      <legend className="mb-2 font-medium">{legend}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((o) => (
          <label
            key={o.value}
            className="cursor-pointer rounded-2xl border border-line bg-white p-4 transition has-[:checked]:border-jade has-[:checked]:bg-jade-wash/70 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-jade/25"
          >
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="sr-only" />
            <span className="block font-medium">{o.label}</span>
            <span className="block text-sm text-ink-soft">{o.hint}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Panel({
  id, title, subtitle, copyText, actions, children,
}: {
  id?: string; title: string; subtitle?: string; copyText: string; actions?: React.ReactNode; children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: leave button unchanged */
    }
  }
  return (
    <article id={id} className="rounded-3xl border border-line bg-paper p-6 shadow-[0_8px_30px_-12px_rgba(53,93,83,0.18)] sm:p-9">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <h2 className="font-serif text-xl text-jade-deep">{title}</h2>
          {subtitle && <p className="text-sm text-ink-soft">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          <button
            type="button"
            onClick={copy}
            aria-label={`複製${title}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-sm transition hover:border-jade hover:bg-jade-wash/60"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            <span aria-live="polite">{copied ? "已複製" : "複製"}</span>
          </button>
        </div>
      </div>
      {children}
    </article>
  );
}

function SmallButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="rounded-xl border border-line bg-white px-3 py-2 text-sm transition hover:border-jade hover:bg-jade-wash/60">
      {children}
    </button>
  );
}

const Runs = ({ runs }: { runs: Run[] }) => (
  <>{runs.map((r, i) => (r.bold ? <strong key={i}>{r.text}</strong> : <span key={i}>{r.text}</span>))}</>
);

function Preview({ markdown }: { markdown: string }) {
  return (
    <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1 print:max-h-none print:overflow-visible">
      {parseMarkdown(markdown).map((b, i) => <BlockView key={i} b={b} />)}
    </div>
  );
}

function BlockView({ b }: { b: Block }) {
  switch (b.type) {
    case "heading":
      return b.level === 1
        ? <h3 className="font-serif text-2xl text-jade-deep"><Runs runs={b.runs} /></h3>
        : <h4 className="pt-3 font-serif text-lg text-jade-deep"><Runs runs={b.runs} /></h4>;
    case "item":
      return <p className="pl-6 -indent-5"><span className="mr-1 text-jade">{b.n}.</span><Runs runs={b.runs} /></p>;
    case "quote":
      return <p className="rounded-2xl bg-apricot/25 px-4 py-3 text-ink"><Runs runs={b.runs} /></p>;
    default:
      return <p><Runs runs={b.runs} /></p>;
  }
}

const iconProps = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;
const CopyIcon = () => (<svg {...iconProps}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></svg>);
const CheckIcon = () => (<svg {...iconProps}><path d="M5 12.5 10 17.5 19 7" /></svg>);
