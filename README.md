# 社群交流基本規範產生器

Next.js app（部署於 Vercel）：輸入社群名稱與選項，產生天帝教社群交流基本規範與置頂精簡版。

## 內容來源（markdown 為原稿）

- `content/released/`：已發布版本，只有這裡會被打包進 `/api/generate`。`internal.md`／`internal.pin.md`（對教內同奮，原 v3-D）、`public.md`／`public.pin.md`（公開，原 v3-E）。
- `content/draft/`：管理指引（草稿，不對外）。`content/archive/`、`content/reference/`：歷史版本與參考資料。
- `content/` 不在 `public/`，不會被網站直接提供。
- 模板標記：`{{社群名稱}}`；`<!-- if:small -->…<!-- endif -->`、`<!-- if:large -->…<!-- endif -->` 依「社群用途」保留區塊；其餘 `<!-- 單行註解 -->` 會被移除。
- 置頂精簡版為獨立檔案（`*.pin.md`）。
- 版本：每個檔案開頭 frontmatter 的 `version`（目前 3.1），各檔可獨立調整，不使用 git tag。輸出的規範末尾會印出「版本」，置頂版的版本顯示在畫面上；兩者都寫入 Sheet 紀錄。發布新版：改內容、調整 `version`，檔名不變。

## 環境變數

見 `.env.example`；Google Sheet 紀錄的設定步驟見 [docs/google-sheet-log.md](docs/google-sheet-log.md)。`ACCESS_KEYS` 決定 `/?id=…` 的有效金鑰（可用逗號放多組以便輪替）。

## 開發

```
npm run dev
```
