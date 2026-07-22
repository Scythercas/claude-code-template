# \<PROJECT_NAME\>

`<1〜2行の概要>`

| | URL |
|---|---|
| 本番（`main`） | https://\<GITHUB_USER\>.github.io/\<REPO_NAME\>/ |
| 検証（`develop`） | https://\<GITHUB_USER\>.github.io/\<REPO_NAME\>/dev/ |

対応環境: PC / モバイルの主要ブラウザ最新2バージョン

---

## 技術スタック

React + TypeScript + Vite + Tailwind CSS / Supabase（DB・認証） / GitHub Pages（GitHub Actions でデプロイ）

## セットアップ

このリポジトリは [claude-code-template](https://github.com/Scythercas/claude-code-template)
の「Use this template」から作成した、雛形（`package.json` / `vite.config.ts` /
`eslint.config.js` / `src/` 一式）を既に含む状態のプロジェクトである。
`npm create vite` 等でのゼロからの再生成は不要で、プレースホルダの置換と
`npm ci` だけで開発を開始できる。初回構築の詳しい手順は
**[docs/SETUP.md](docs/SETUP.md)** を参照。

```powershell
npm ci
Copy-Item .env.example .env.local   # 値を記入する
npm run dev
```

## スクリプト

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 本番ビルド |
| `npm run preview` | ビルド結果をローカル確認 |
| `npm run lint` | ESLint |
| `npm run typecheck` | 型チェック |
| `npm run test` | テスト |

## 開発ルール

ブランチ運用・コミット規約・リリース手順・禁止事項は **[CLAUDE.md](CLAUDE.md)** に集約している。
Claude Code / 人間を問わず、作業前に必ず読むこと。

| ドキュメント | 内容 |
|---|---|
| [CLAUDE.md](CLAUDE.md) | 開発ルール全般（ブランチ・コミット・デプロイ・セキュリティ・DoD） |
| [CHANGELOG.md](CHANGELOG.md) | 変更履歴 |
| [TODO.md](TODO.md) | 未対応事項 |
| [docs/SETUP.md](docs/SETUP.md) | 初回セットアップ |

---

## 更新履歴

最新3件のみ記載する。全履歴は **[CHANGELOG.md](CHANGELOG.md)** を参照。

| バージョン | 日付 | 概要 |
|---|---|---|
| [v0.1.0](CHANGELOG.md#010---yyyy-mm-dd) | YYYY-MM-DD | プロジェクト初期構成を作成。 |

## ライセンス

[MIT](LICENSE)
