# 產生紀錄：Google Sheet 設定

每次按下「產生」，後端會在 Google Sheet 新增一列（時間、社群名稱、對象、用途、版本）。
以下改寫自 expense-line-message-api 的 README。**這個專案請用獨立的 service account**（不與其他專案共用）；GCP project 使用 tienti.org 的 IT 共用專案 `it-workspace-apps`（顯示名稱「IT Google Workspace」，位於資料夾「IT Commi」）。

## 1. GCP project 與 Sheets API

使用既有的 project `it-workspace-apps`（IT Google Workspace），不需另建；只要確認已啟用 Sheets API：

```bash
gcloud services enable sheets.googleapis.com --project=it-workspace-apps
```

## 2. 建立 service account 與金鑰

```bash
gcloud iam service-accounts create social-reg-sheets-writer \
  --display-name="Social Regulation Sheets Writer" \
  --project=it-workspace-apps

gcloud iam service-accounts keys create sheets-key.json \
  --iam-account=social-reg-sheets-writer@it-workspace-apps.iam.gserviceaccount.com
```

`sheets-key.json` 內有兩個要用的值（service account 不需授予任何 IAM 角色，只靠 Sheet 的共用權限寫入）：

```json
{
  "client_email": "social-reg-sheets-writer@it-workspace-apps.iam.gserviceaccount.com",  // → GOOGLE_SERVICE_ACCOUNT_EMAIL
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",            // → GOOGLE_PRIVATE_KEY
  ...
}
```

**重要：** `sheets-key.json` 不要放進這個 repo（請存在別處）；把值複製到 Vercel 環境變數後即可刪除。

## 3. 建立 Google Sheet

1. 建立新的試算表，把第一個分頁命名為 `Log`（或用 `GOOGLE_SHEET_TAB` 指定其他名稱）。
2. 第 1 列填標題：`時間 | 社群名稱 | 對象 | 用途 | 規範版本 | 置頂版版本`
3. 「共用」給 service account 的 email，權限選「編輯者」。
4. 從網址複製試算表 ID：`https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`

欄位內容：時間為 ISO 格式（UTC）；對象為 `internal`／`public`；用途為 `small`／`large`（公開版留空）；版本為各模板檔 frontmatter 的 `version`（規範與置頂版各自獨立）。

## 4. Vercel 環境變數

Project → Settings → Environment Variables（Production 與 Preview 視需要都加）：

| 變數 | 說明 |
|------|------|
| `ACCESS_KEYS` | `?id=` 的有效金鑰；可用逗號放多組以便輪替。產生：`openssl rand -hex 16` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | service account email |
| `GOOGLE_PRIVATE_KEY` | 私鑰，含 `-----BEGIN/END PRIVATE KEY-----`；換行可保留實際換行，或貼成字面的 `\n` 皆可 |
| `GOOGLE_SHEET_ID` | 試算表 ID |
| `GOOGLE_SHEET_TAB` | （選填）分頁名稱，預設 `Log` |

設定後需重新部署才會生效。

## 5. 驗證

用有效的 `?id=` 網址產生一次，確認 Sheet 多一列。若沒有：到 Vercel → Logs 搜尋 `[log]`；
`env vars missing` 代表變數沒設好，`append failed` 後面會有 Google 回傳的原因（常見：Sheet 沒共用給 service account、分頁名稱不符）。
紀錄在回應送出之後才執行，失敗不會影響使用者；每次產生也都會在 Vercel Logs 留下一行 `[generation]`（含社群名稱與選項），即使 Sheet 寫入失敗也有備查。
