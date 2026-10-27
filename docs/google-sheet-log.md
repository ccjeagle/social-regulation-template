# 產生紀錄：Google Sheet 設定

每次按下「產生」，後端會在 Google Sheet 新增一列（時間、社群名稱、對象、用途、版本）。
以下改寫自 expense-line-message-api 的 README。**這個專案請用獨立的 GCP project 與 service account**，不要與其他專案共用。

## 1. 建立 GCP project 並啟用 Sheets API

```bash
gcloud projects create social-regulation-log --name="Social Regulation Log"
gcloud config set project social-regulation-log
gcloud services enable sheets.googleapis.com
```

（project ID 全球唯一，被占用時換一個名字，下列指令的 `YOUR_PROJECT_ID` 同步更換。）

## 2. 建立 service account 與金鑰

```bash
gcloud iam service-accounts create sheets-writer --display-name="Sheets Writer"

gcloud iam service-accounts keys create sheets-key.json \
  --iam-account=sheets-writer@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

`sheets-key.json` 內有兩個要用的值：

```json
{
  "client_email": "sheets-writer@xxx.iam.gserviceaccount.com",  // → GOOGLE_SERVICE_ACCOUNT_EMAIL
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",            // → GOOGLE_PRIVATE_KEY
  ...
}
```

**重要：** `sheets-key.json` 不要放進這個 repo（請存在別處）；把值複製到 Vercel 環境變數後即可刪除。

## 3. 建立 Google Sheet

1. 建立新的試算表，把第一個分頁命名為 `Log`（或用 `GOOGLE_SHEET_TAB` 指定其他名稱）。
2. 第 1 列填標題：`時間 | 社群名稱 | 對象 | 用途 | 版本`
3. 「共用」給 service account 的 email，權限選「編輯者」。
4. 從網址複製試算表 ID：`https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`

欄位內容：時間為 ISO 格式（UTC）；對象為 `internal`／`public`；用途為 `small`／`large`（公開版留空）；版本為模板 frontmatter 的 `version`。

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
紀錄失敗不會擋住使用者產生內容。
