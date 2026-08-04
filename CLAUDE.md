# CLAUDE.md

このファイルは Claude Code に常時読み込まれる。**簡潔さを最優先**とし、長い手順は
`.claude/skills/` 配下の Skill、または `docs/` に切り出すこと。

---

## 0. プロジェクト概要

- プロジェクト名: `<PROJECT_NAME>`
- リポジトリ: `<GITHUB_USER>/<REPO_NAME>`
- 概要: `<1〜2行で記述>`
- 公開URL（本番）: `https://<GITHUB_USER>.github.io/<REPO_NAME>/`
- 公開URL（検証）: `https://<GITHUB_USER>.github.io/<REPO_NAME>/dev/`

---

## 1. 技術スタック（変更する場合は必ず人間の承認を得ること）

| 区分 | 採用 |
|---|---|
| ランタイム | Node.js（バージョンは `.nvmrc` に従う） |
| パッケージマネージャ | npm（`package-lock.json` を必ずコミット） |
| 言語 | TypeScript（`strict: true`） |
| フレームワーク | React + Vite |
| ルーティング | **HashRouter**（理由は §4） |
| スタイル | Tailwind CSS |
| BaaS | Supabase（DB / Auth / Storage / Edge Functions） |
| ホスティング | GitHub Pages（GitHub Actions 経由でのみデプロイ） |
| Lint / Format | ESLint + Prettier |
| テスト | Vitest |

**ライブラリを新規追加する前に、必ず人間に確認すること。** 無断で依存を増やさない。
雛形（`package.json` / `vite.config.ts` / `eslint.config.js` / `src/` 一式）は
このテンプレートに既に含まれているため、`npm create vite` 等での再生成は不要。

---

## 2. 開発環境の制約（Windows）

- 開発機は **Windows PC**。macOS 固有の手順・コマンドは提案しない。
- シェルは **PowerShell** を既定とする。`rm -rf`、`&&` の多用、`export VAR=...` などの
  Unix 前提コマンドを書かない。Unix 記法が必要な場合は Git Bash 使用を明示すること。
- **改行コードは LF に統一**。`.gitattributes` で強制済み。無効化しない。
- **大文字小文字の差異に注意**。Windows は区別しないが、GitHub Actions（Linux）と
  GitHub Pages は区別する。`import './Header'` と `header.tsx` の不一致は
  ローカルで通り本番で 404 になる典型事故。ファイル名とimportパスは常に完全一致させる。
- 長いパスで失敗する場合は `git config --global core.longpaths true`。
- **`VITE_BASE_PATH` 等 `/` 始まりの環境変数は Git Bash で export しない。**
  PowerShell を使う（MSYS2 のパス変換で値が壊れる。詳細は `docs/SETUP.md` §7）。

---

## 3. ブランチ運用

### ブランチ一覧

| ブランチ | 役割 | 分岐元 | マージ先 | 直接コミット |
|---|---|---|---|---|
| `main` | **本番**。常にリリース可能な状態 | — | — | 禁止 |
| `develop` | 統合。次リリースの最新 | `main` | `main` | 禁止 |
| `feature/xxx` | 機能追加 | `develop` | `develop` | 可 |
| `fix/xxx` | 不具合修正（緊急でないもの） | `develop` | `develop` | 可 |
| `refactor/xxx` | 挙動を変えない内部改善 | `develop` | `develop` | 可 |
| `docs/xxx` | ドキュメントのみ | `develop` | `develop` | 可 |
| `test/xxx` | テストの追加・修正 | `develop` | `develop` | 可 |
| `env/xxx` | 環境構築・依存更新・設定 | `develop` | `develop` | 可 |
| `chore/xxx` | 雑務（上記に当てはまらない） | `develop` | `develop` | 可 |
| `ci/xxx` | GitHub Actions / ワークフロー | `develop` | `develop` | 可 |
| `hotfix/xxx` | **本番の緊急修正** | `main` | `main` と `develop` の**両方** | 可 |

- ブランチ名は `<prefix>/<snake_case_の具体的作業内容>`。例: `feature/user_login_form`、
  `fix/mobile_layout_overflow`。日本語・空白・大文字は使わない。
- 上記に該当する接頭辞が無いと判断した場合、**勝手に新語を使わず人間に確認**し、
  合意後この表に追記すること。
- **マージ後もブランチは削除しない**（本プロジェクトの方針）。

### マージ方式

**すべてのマージで `--no-ff`（マージコミットを作る）を使う。** Squash merge は禁止。

> 理由: 本プロジェクトはマージ後もブランチを残す運用のため、Squash merge を使うと
> Git 上そのブランチが「未マージ」と判定され、再マージ時に同一変更が重複する。

```powershell
git switch develop
git merge --no-ff feature/user_login_form
```

### hotfix の手順

1. `main` から `hotfix/xxx` を切る
2. 修正 → `main` へ `--no-ff` マージ
3. パッチバージョンを上げてタグを打つ（§5）
4. **同じ `hotfix/xxx` を `develop` にも `--no-ff` マージする**（取り込み漏れ防止）

---

## 4. デプロイ（GitHub Pages）

### どのブランチへの push で何が起きるか

| push 先 | 実行ワークフロー | ビルド対象 | 公開先 | Supabase |
|---|---|---|---|---|
| `main` | `deploy.yml` | `main` と `develop` の両方 | `/` と `/dev/` を同時更新 | 本番 / 検証 それぞれ |
| `develop` | `deploy.yml` | `main` と `develop` の両方 | `/` と `/dev/` を同時更新 | 本番 / 検証 それぞれ |
| `feature/*` 等の作業ブランチ | `ci.yml` のみ | 当該ブランチ | **公開しない** | — |
| Pull Request | `ci.yml` のみ | 当該ブランチ | **公開しない** | — |

> **この方式（A案：パス分離）を崩さないこと。** 理由は `deploy.yml` 冒頭コメント参照。

### 重要な設定

- Vite の `base` は環境変数 `VITE_BASE_PATH` から与える。
  本番 `/<REPO_NAME>/`、検証 `/<REPO_NAME>/dev/`。
  （ユーザーページ `<user>.github.io` リポジトリの場合は `/` と `/dev/`）
- **ルーティングは HashRouter を使う。** GitHub Pages は SPA のパスを解決できず 404 を
  返す。`404.html` によるリダイレクト回避策はサブパス2系統と相性が悪いため採用しない。
- `.nojekyll` を出力ルートに必ず置く（`_` 始まりのファイルが無視されるのを防ぐ）。
- 手動 push によるデプロイ（`gh-pages` ブランチへの直接 push 等）は**禁止**。

---

## 5. バージョニングとリリース

- **セマンティックバージョニング** `MAJOR.MINOR.PATCH` に従う。
  - MAJOR: 後方互換のない変更（既存ユーザーのデータ移行や再ログインが必要など）
  - MINOR: 後方互換のある機能追加
  - PATCH: 後方互換のある不具合修正
- 正式リリース前は `0.y.z`。最初の一般公開時に `1.0.0` とする。
- バージョンの正は `package.json` の `version`。
- タグは `v` 付き（`v1.2.0`）で、**`main` のマージコミットに対して打つ**。
- 変更履歴は `CHANGELOG.md`（[Keep a Changelog] 形式）に記載する。
  README には最新数件の要約とリンクのみ。README に全履歴を書かない。
- **コミット接頭辞は Conventional Commits 非互換のため、CHANGELOG は手動更新。**
  自動生成ツールを導入しないこと。

詳細手順 → `.claude/skills/release/SKILL.md`

---

## 6. コミットメッセージ

書式: `[<prefix>] <日本語で1行、句点で終える>`

接頭辞は §3 のブランチ接頭辞と**同一語彙**を使う（`feature` / `fix` / `hotfix` /
`refactor` / `docs` / `test` / `env` / `chore` / `ci`）。加えてリリース時のみ
`[release]` を使用可。

```
[feature] ログインフォームを追加。
[fix] モバイル表示でヘッダーが見切れる問題を修正。
[env] Node.js を 22.14.0 に更新。
[release] v1.2.0。
```

- **`[TODO]` をコミット接頭辞として使わない。** 未対応事項は `TODO.md` または
  GitHub Issues に記録する。コミット履歴は「何をしたか」の記録であり、
  「何をしていないか」を混ぜると `git log` が機能しなくなる。
- 1コミット1目的。複数の接頭辞にまたがる変更は分割する。

---

## 7. セキュリティ（GitHub Pages + Supabase の前提）

**ビルド成果物は全文が公開される。フロントエンドに秘密は存在しない。**

- `service_role` キーをフロントエンドのコード・環境変数・リポジトリに**絶対に置かない**。
  サーバー権限が必要な処理は Supabase Edge Functions に実装する。
- **全テーブルで RLS を有効にする。ポリシー無しのテーブルを作らない。**
  `anon` キーは公開前提であり、RLS が無いテーブル = 全世界に公開されたテーブル。
  テーブル作成のマイグレーションには必ず `ENABLE ROW LEVEL SECURITY` と
  ポリシー定義をセットで含めること。
- 外部サービスの API キーが必要な処理は、必ず Edge Functions 側に置く。
- Supabase ダッシュボードの Auth 設定に、本番・検証**両方**のオリジンを
  Site URL / Redirect URLs として登録する。
- `.env*` はコミットしない（`.env.example` のみコミット）。

### 環境の切り替え

| | 本番 | 検証 |
|---|---|---|
| Supabase プロジェクト | 本番と検証で**同一プロジェクトを共用**（1プロジェクトのみ作成） | 同左 |
| 環境変数 | GitHub Actions Variables `PROD_*` | 同 `DEV_*`（値は `PROD_*` と同一） |
| Auth ストレージキー | `sb-production-auth` | `sb-development-auth` |

> 同一オリジンで localStorage を共有するため、`auth.storageKey` を分けないと
> 本番と検証でセッションが衝突する。実装例は `docs/SETUP.md` §8 参照。
> Supabase プロジェクトは常に1つだけ作成し、本番・検証で共用する。手順は
> `docs/SETUP.md` §4、マイグレーション運用は
> `.claude/skills/supabase-migration/SKILL.md` 参照。

---

## 8. 禁止事項

- `main` / `develop` への直接コミット・直接 push
- `main` / `develop` への force push（`--force`、`--force-with-lease` とも）
- `.env` / 秘密鍵 / `service_role` キーのコミット
- 人間の承認なしのライブラリ追加、フレームワーク変更、DB スキーマの破壊的変更
- Supabase 管理画面での本番スキーマの直接変更（必ずマイグレーション経由）
- 手動での GitHub Pages デプロイ
- Squash merge、マージ後のブランチ削除
- `[TODO]` 接頭辞のコミット

---

## 9. 完了の定義（DoD）

作業を「完了」と報告する前に、以下をすべて満たすこと。満たせない項目がある場合は
完了と言わず、何が残っているかを明示する。

1. `npm run lint` が通る
2. `npm run typecheck` が通る
3. `npm run test` が通る
4. `npm run build` が通る
5. `npm run preview` で実際に画面を開き、対象機能の動作を確認した
6. モバイル幅（375px）とPC幅（1280px）の両方でレイアウト崩れがないことを確認した
7. 変更内容が `CHANGELOG.md` の `[Unreleased]` に追記されている
8. 未対応事項が `TODO.md` に記録されている
9. 適切な接頭辞でコミット済み

---

## 10. 対応環境

- モバイル: iOS Safari 最新2バージョン / Android Chrome 最新2バージョン
- PC: Chrome / Edge / Firefox / Safari 各最新2バージョン
- ブレークポイント: `sm 640px` / `md 768px` / `lg 1024px` / `xl 1280px`
- **モバイルファースト**で実装する。

---

## 11. 関連ドキュメント

| ファイル | 内容 |
|---|---|
| `README.md` | プロジェクト概要・セットアップ手順の入口 |
| `CHANGELOG.md` | バージョンごとの変更履歴 |
| `TODO.md` | 未対応事項 |
| `docs/SETUP.md` | 初回セットアップ（GitHub / Supabase / ローカル） |
| `.claude/skills/release/SKILL.md` | リリース手順 |
| `.claude/skills/supabase-migration/SKILL.md` | DB マイグレーション手順 |

[Keep a Changelog]: https://keepachangelog.com/ja/1.1.0/
