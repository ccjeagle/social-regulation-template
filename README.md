# 社群交流規範產生器

Next.js app（部署於 Vercel）：輸入社群名稱與選項，產生天帝教社群交流規範與置頂精簡版。

## 內容來源（markdown 為原稿）

- `content/released/`：已發布版本（v3-D 內部、v3-E 公開），只有這裡會被打包進 `/api/generate`。
- `content/draft/`：管理指引（草稿，不對外）。`content/archive/`、`content/reference/`：歷史版本與參考資料。
- `content/` 不在 `public/`，不會被網站直接提供。
- 模板標記：`{{社群名稱}}`；`<!-- if:small -->…<!-- endif -->`、`<!-- if:large -->…<!-- endif -->` 依「社群用途」保留區塊。
- 置頂精簡版為獨立檔案（`…．置頂精簡版.md`）。

## 環境變數

見 `.env.example`。`ACCESS_KEYS` 決定 `/?id=…` 的有效金鑰（可用逗號放多組以便輪替）。

## 開發

```
npm run dev
```
