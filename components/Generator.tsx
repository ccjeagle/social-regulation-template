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

const FAIL = "產生失敗，請稍後再試；若持續發生，請聯絡資訊委員會。";

export function Generator({ accessKey }: { accessKey: string }) {
  const [name, setName] = useState("");
  const [audience, setAudience] = useState<Audience>("internal");
  const [size, setSize] = useState<Size>("small");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [consentError, setConsentError] = useState("");
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [resultKey, setResultKey] = useState("");
  const resultRef = useRef<HTMLElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);

  // What the current inputs would produce; size only matters for internal groups.
  const inputKey = JSON.stringify([name.trim(), audience, audience === "internal" ? size : ""]);
  const stale = result !== null && resultKey !== inputKey;
  // Looks disabled until complete, but stays clickable so a press explains what is missing.
  const ready = name.trim().length > 0 && consent;

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const missingName = name.trim().length === 0;
    setNameError(missingName ? "請輸入社群名稱" : "");
    setConsentError(consent ? "" : "請勾選上方說明，才能產生");
    if (missingName || !consent) {
      (missingName ? nameRef : consentRef).current?.focus();
      return;
    }

    setBusy(true);
    setError("");
    setStatus("正在產生，請稍候");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Same inputs as the result on screen: the server skips the log row.
        body: JSON.stringify({ id: accessKey, name, audience, size, consent, repeat: result !== null && resultKey === inputKey }),
      });
      // A non-JSON body (e.g. a platform 500 page) must not surface as a parse error.
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? FAIL);
      setResult({ ...data, name: name.trim() });
      setResultKey(inputKey);
      setStatus("已產生，結果在下方");
      const motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      requestAnimationFrame(() => {
        resultRef.current?.focus({ preventScroll: true });
        resultRef.current?.scrollIntoView({ behavior: motion, block: "start" });
      });
    } catch (err) {
      setStatus("");
      setError(err instanceof TypeError ? "無法連線，請檢查網路後再試。" : err instanceof Error ? err.message : FAIL);
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

      <form onSubmit={generate} className="space-y-8 rounded-3xl border border-line bg-paper p-6 shadow-[0_2px_6px_-2px_rgba(53,93,83,0.14)] sm:p-9">
        <div>
          <label htmlFor="name" className="mb-2 block font-medium">社群名稱</label>
          <input
            id="name"
            ref={nameRef}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameError("");
            }}
            maxLength={60}
            placeholder="例如：○○教院同奮交流群"
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? "name-error" : undefined}
            className={`w-full rounded-2xl border bg-white px-4 py-3 text-lg placeholder:text-ink-soft/60 focus:border-jade focus:outline-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-jade/20 ${nameError ? "border-red-700" : "border-line"}`}
          />
          {nameError && <p id="name-error" className="mt-2 text-sm text-red-800">{nameError}</p>}
        </div>

        <Choice legend="適用對象" name="audience" value={audience} onChange={setAudience} options={AUDIENCES} />

        {audience === "internal" && (
          <Choice legend="社群的用途" name="size" value={size} onChange={setSize} options={SIZES} />
        )}

        <div>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-jade-wash/60 p-4 text-[0.95rem]">
            <input
              ref={consentRef}
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                setConsentError("");
              }}
              aria-invalid={consentError ? true : undefined}
              aria-describedby={consentError ? "consent-error" : undefined}
              className="mt-1 size-6 shrink-0 accent-jade"
            />
            <span>我了解系統會記錄本次產生的內容（社群名稱、選項與時間），僅供內部統計與報告使用。</span>
          </label>
          {consentError && <p id="consent-error" className="mt-2 text-sm text-red-800">{consentError}</p>}
        </div>

        {error && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-red-800">{error}</p>}

        <div>
          <button
            type="submit"
            disabled={busy}
            aria-disabled={!ready && !busy ? true : undefined}
            className={`w-full rounded-2xl px-6 py-4 text-lg font-medium transition disabled:cursor-wait disabled:opacity-70 ${ready || busy ? "bg-jade-deep text-white hover:bg-jade" : "bg-line text-[#4d5d58]"}`}
          >
            {busy ? "正在產生…" : result ? "重新產生" : "產生"}
          </button>
          {stale && !busy && <p className="mt-3 text-center text-sm text-ink-soft">內容已修改，按「重新產生」更新下方結果。</p>}
        </div>
      </form>

      <p role="status" className="sr-only">{status}</p>

      {result && (
        <section ref={resultRef} tabIndex={-1} aria-label="產生結果" className="mt-14 scroll-mt-6 space-y-8 focus:outline-none">
          <Panel
            id="print-area"
            title="交流基本規範全文"
            subtitle={`版本 ${result.version}`}
            copyText={toPlainText(result.main)}
            actions={<SmallButton onClick={() => window.print()}>列印／存成 PDF</SmallButton>}
          >
            <Preview markdown={result.main} label="交流基本規範全文" />
          </Panel>

          <Panel
            tone="pin"
            title="置頂精簡版"
            subtitle={`版本 ${result.pinVersion}・複製後貼到 LINE 記事本或社群置頂貼文`}
            copyText={toPlainText(result.pin)}
          >
            <Preview markdown={result.pin} label="置頂精簡版" />
          </Panel>

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
            className="cursor-pointer rounded-2xl border border-line bg-white p-4 transition has-checked:border-jade has-checked:bg-jade-wash/70 has-checked:ring-1 has-checked:ring-jade has-focus-visible:ring-4 has-focus-visible:ring-jade/25"
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
  id, tone, title, subtitle, copyText, actions, children,
}: {
  id?: string; tone?: "pin"; title: string; subtitle?: string; copyText: string; actions?: React.ReactNode; children: React.ReactNode;
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
    <article id={id} className={`rounded-3xl border p-6 shadow-[0_2px_6px_-2px_rgba(53,93,83,0.14)] sm:p-9 ${tone === "pin" ? "border-apricot bg-apricot/20" : "border-line bg-paper"}`}>
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
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-line bg-white px-4 text-sm transition hover:border-jade hover:bg-jade-wash/60"
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
    <button type="button" onClick={onClick} className="min-h-11 rounded-xl border border-line bg-white px-4 text-sm transition hover:border-jade hover:bg-jade-wash/60">
      {children}
    </button>
  );
}

const Runs = ({ runs }: { runs: Run[] }) => (
  <>{runs.map((r, i) => (r.bold ? <strong key={i}>{r.text}</strong> : <span key={i}>{r.text}</span>))}</>
);

function Preview({ markdown, label }: { markdown: string; label: string }) {
  const blocks = parseMarkdown(markdown);
  return (
    // On phones the text flows with the page; a nested scroll box only appears from sm up.
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="space-y-3 leading-8 sm:max-h-[70vh] sm:overflow-y-auto sm:pr-2 print:max-h-none print:overflow-visible"
    >
      {blocks.map((b, i) => {
        const list = (x?: Block) => x?.type === "item" || x?.type === "bullet";
        // consecutive list entries sit closer together than paragraphs
        return (
          <div key={i} className={list(b) && list(blocks[i - 1]) ? "-mt-1.5" : undefined}>
            <BlockView b={b} />
          </div>
        );
      })}
    </div>
  );
}

function BlockView({ b }: { b: Block }) {
  switch (b.type) {
    case "heading":
      return b.level === 1
        ? <h3 className="border-b border-line pb-3 font-serif text-2xl text-jade-deep"><Runs runs={b.runs} /></h3>
        : <h4 className="pt-3 font-serif text-lg text-jade-deep"><Runs runs={b.runs} /></h4>;
    case "item":
      return <p className="pl-6 -indent-5"><span className="mr-1 text-jade">{b.n}.</span><Runs runs={b.runs} /></p>;
    case "bullet":
      return <p className="pl-6 -indent-4"><span className="mr-1.5 text-jade">•</span><Runs runs={b.runs} /></p>;
    default: {
      // "-- 範本版本：x --" footer stamp: set apart from the content
      const stamp = /^-- .* --$/.test(b.runs.map((r) => r.text).join(""));
      return stamp
        ? <p className="mt-4 border-t border-line pt-3 text-right text-sm text-ink-soft"><Runs runs={b.runs} /></p>
        : <p><Runs runs={b.runs} /></p>;
    }
  }
}

const iconProps = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;
const CopyIcon = () => (<svg {...iconProps}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></svg>);
const CheckIcon = () => (<svg {...iconProps}><path d="M5 12.5 10 17.5 19 7" /></svg>);
