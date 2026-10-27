import { JWT } from "google-auth-library";

export type LogEntry = {
  name: string;
  audience: string;
  size: string;
  version: string;
  pinVersion: string;
};

// Cells starting with these characters would be evaluated as formulas by Sheets.
const safe = (s: string) => (/^[=+\-@]/.test(s) ? `'${s}` : s);

// Appends one row to the log sheet. Never throws: a logging outage must not block generation.
export async function logGeneration(entry: LogEntry) {
  // Always leave a trace in the Vercel runtime logs, even if the Sheet write fails.
  console.log("[generation]", JSON.stringify(entry));
  const { GOOGLE_SERVICE_ACCOUNT_EMAIL: email, GOOGLE_PRIVATE_KEY: key, GOOGLE_SHEET_ID: sheet } = process.env;
  if (!email || !key || !sheet) {
    console.warn("[log] Google Sheet env vars missing; entry only in Vercel logs");
    return;
  }
  try {
    const auth = new JWT({
      email,
      key: key.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const tab = process.env.GOOGLE_SHEET_TAB ?? "Log";
    await auth.request({
      url: `https://sheets.googleapis.com/v4/spreadsheets/${sheet}/values/${encodeURIComponent(tab)}!A:F:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      method: "POST",
      timeout: 5000,
      data: {
        values: [[new Date().toISOString(), safe(entry.name), entry.audience, entry.size, entry.version, entry.pinVersion]],
      },
    });
  } catch (e) {
    console.error("[log] append failed; entry only in Vercel logs:", e instanceof Error ? e.message : e);
  }
}
