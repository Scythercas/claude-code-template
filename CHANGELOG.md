# 変更履歴

このプロジェクトの主な変更点を記録する。
書式は [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に、
バージョン番号は [セマンティックバージョニング](https://semver.org/lang/ja/) に従う。

分類は `Added`（追加）/ `Changed`（変更）/ `Deprecated`（非推奨）/
`Removed`（削除）/ `Fixed`（修正）/ `Security`（セキュリティ）を使う。

---

## [Unreleased]

### Added

### Changed

### Fixed

---

## [0.2.0] - 2026-07-26

### Added

- Supabase Pro プラン以上向けに、Branching 機能を使った初回セットアップ手順
  （`docs/SETUP.md` §4-B）を追加。

### Changed

- Supabase Free プラン向けの初回セットアップ手順を、本番・検証を1プロジェクトで
  共用する構成に整理（`docs/SETUP.md` §4-A）。
- `CLAUDE.md` §7 と `.claude/skills/supabase-migration/SKILL.md` を、
  Free/Pro プランでの Supabase 環境構成の違いに合わせて更新。

### Fixed

- ブランチ保護ルール設定時、CI を一度も実行していないと `CI / verify` が
  ステータスチェックの候補に出ない問題への対処手順を追記（`docs/SETUP.md` §2）。
- ローカル環境構築手順・`.env.example` に残っていた「検証用プロジェクト」という
  単一プロジェクト前提の表現を、Free/Pro 分岐後の内容に合わせて修正。

---

## [0.1.0] - YYYY-MM-DD

### Added

- プロジェクトの初期構成を作成。

---

[Unreleased]: https://github.com/<GITHUB_USER>/<REPO_NAME>/compare/v0.2.0...develop
[0.2.0]: https://github.com/<GITHUB_USER>/<REPO_NAME>/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/<GITHUB_USER>/<REPO_NAME>/releases/tag/v0.1.0
