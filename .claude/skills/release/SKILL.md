---
name: release
description: develop を main にマージして本番リリースする手順、および本番の緊急修正（hotfix）手順。バージョン番号の決定、package.json の更新、CHANGELOG.md の確定、git tag の作成、GitHub Release の作成を含む。「リリースして」「バージョンを上げて」「main にマージして」「タグを打って」「hotfix」と言われたとき、またはリリース作業に着手するときに使用する。
---

# リリース手順

**すべてのコマンドは PowerShell 前提。実行前に必ず人間の確認を取ること。**

---

## 前提チェック（1つでも欠けたら中断して報告）

1. `develop` の CI が成功している
2. 検証URL `/dev/` で対象機能の動作確認が済んでいる
3. `CHANGELOG.md` の `[Unreleased]` に今回の変更がすべて記載されている
4. 検証用 Supabase に適用したマイグレーションが、本番にも適用可能な状態である
   （破壊的変更を含む場合は §「DB を伴うリリース」を先に読むこと）
5. 作業ツリーがクリーン（`git status` が空）

---

## 1. バージョン番号を決める

`CHANGELOG.md` の `[Unreleased]` の内容から判断する。

| 含まれる変更 | 上げる箇所 |
|---|---|
| 後方互換のない変更（データ移行・再ログインが必要、URL 構造変更など） | MAJOR |
| 機能追加（`Added` / `Changed` の非破壊なもの） | MINOR |
| 不具合修正のみ（`Fixed` / `Security`） | PATCH |

- `0.y.z` の間は、破壊的変更でも MINOR を上げる（`0.3.0` → `0.4.0`）。
- 判断が割れる場合は上げ幅の大きい方を選び、理由を添えて人間に確認する。

## 2. リリース準備コミット（develop 上で行う）

```powershell
git switch develop
git pull

# package.json の version を更新（タグとコミットは作らせない）
npm version <new-version> --no-git-tag-version
```

`CHANGELOG.md` を編集する。

- `## [Unreleased]` の下に `## [<new-version>] - YYYY-MM-DD` を新設し、内容を移す
- `[Unreleased]` は見出しだけ残して空にする
- ファイル末尾の比較リンクを更新する

`README.md` の「更新履歴」節に最新1件を追記し、`CHANGELOG.md` へのリンクを維持する。

```powershell
git add package.json package-lock.json CHANGELOG.md README.md
git commit -m "[release] v<new-version>。"
git push origin develop
```

## 3. main へマージ

```powershell
git switch main
git pull
git merge --no-ff develop -m "[release] v<new-version> をリリース。"
```

**Squash merge は使わない。ブランチは削除しない。**

## 4. タグを作成

```powershell
git tag -a v<new-version> -m "v<new-version>"
git push origin main
git push origin v<new-version>
```

- タグは必ず注釈付き（`-a`）。軽量タグは使わない。
- タグ名は `v` 付き（`v1.2.0`）。`package.json` の `version` は `v` 無し（`1.2.0`）。
- **一度 push したタグは付け替えない。** 誤ったら次のパッチバージョンで直す。

## 5. デプロイ確認

`main` への push で `deploy.yml` が起動する。Actions の完了を待ち、
本番URL `/` と検証URL `/dev/` の**両方**が正常に表示されることを確認する。

> `deploy.yml` は毎回サイト全体を作り直すため、`/dev/` も同時に更新される。
> `/dev/` が 404 になっていたらワークフローが途中で失敗している。

## 6. GitHub Release を作成

タグ `v<new-version>` に対して Release を作成し、本文に `CHANGELOG.md` の
該当バージョンの節をそのまま貼る。タイトルは `v<new-version>`。

## 7. TODO.md の整理

今回のリリースで解消した項目を `TODO.md` から削除する。

---

## hotfix（本番の緊急修正）

```powershell
git switch main
git pull
git switch -c hotfix/<内容>
# 修正・コミット（接頭辞は [hotfix]）

git switch main
git merge --no-ff hotfix/<内容>
```

その後、**PATCH を上げて** §1〜§6 と同じ手順（`package.json` 更新、`CHANGELOG.md`
確定、タグ作成、Release 作成）を `main` 上で実施する。

最後に **develop への取り込みを必ず行う**（これを忘れると次のリリースで修正が消える）。

```powershell
git switch develop
git merge --no-ff hotfix/<内容>
git push origin develop
```

---

## DB を伴うリリース

マイグレーションを含む場合、**適用順序を誤ると本番が壊れる**。

1. アプリのデプロイ**より先に**本番 DB のマイグレーションを適用する
2. ただし、そのマイグレーションは**旧バージョンのアプリでも動く**内容に限る
   （カラム追加は可、カラム削除・リネーム・NOT NULL 追加は不可）
3. 破壊的変更が必要な場合は 2 リリースに分ける
   - リリース A: 新カラム追加 + 両対応のコード
   - リリース B: 旧カラム削除

破壊的変更を 1 リリースで行おうとしている場合は、**実行前に必ず人間に警告すること。**

詳細は `.claude/skills/supabase-migration/SKILL.md` を参照。
