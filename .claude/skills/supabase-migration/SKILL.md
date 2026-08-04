---
name: supabase-migration
description: Supabase のデータベーススキーマを変更する手順。テーブル・カラム・インデックス・RLS ポリシー・Edge Functions の追加や変更、ローカル環境での検証、検証プロジェクトと本番プロジェクトへの適用を含む。「テーブルを追加」「カラムを増やす」「スキーマを変更」「マイグレーション」「RLS」「Supabase の設定を変える」と言われたときに使用する。
---

# Supabase マイグレーション手順

**すべてのコマンドは PowerShell 前提。本番への適用は必ず人間の明示的承認を得ること。**

---

## 環境構成

| 環境 | 実体 | 用途 |
|---|---|---|
| Local | `supabase start`（Docker Desktop 必須） | 日常の開発・マイグレーション試行 |
| Staging | 本番と同一の Supabase プロジェクトを共用 | develop / `/dev/` が参照 |
| Production | 同一の Supabase プロジェクト | main / `/` が参照 |

**昇格は Local → Staging → Production の一方通行。逆流させない。**

> Staging と Production は同一プロジェクトを共用する。詳細は下記「2. Staging /
> Production へ適用」参照。

---

## 鉄則

1. **スキーマ変更は必ずマイグレーションファイル経由。** Supabase の Web UI
   （Table Editor）で直接変更しない。UI で試した場合は必ず `supabase db diff` で
   ファイル化してからコミットする。
2. **適用済みマイグレーションファイルを編集しない。** 修正は新しいファイルで行う。
3. **全テーブルに RLS を設定する。** ポリシー無しのテーブルを作らない。
4. **本番データを検証環境にコピーしない。** テストデータは `supabase/seed.sql` で作る。

---

## 手順

### 1. ローカルで作成・検証

```powershell
supabase start
supabase migration new <スネークケースの名前>
```

`supabase/migrations/<timestamp>_<名前>.sql` を編集する。**テーブル作成時は
RLS 有効化とポリシーを同一ファイルに必ず含める。**

```sql
create table public.items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  created_at  timestamptz not null default now()
);

-- RLS は必須。これを書かないと anon キーで全データが読める。
alter table public.items enable row level security;

create policy "items_select_own" on public.items
  for select using (auth.uid() = user_id);

create policy "items_insert_own" on public.items
  for insert with check (auth.uid() = user_id);

create policy "items_update_own" on public.items
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "items_delete_own" on public.items
  for delete using (auth.uid() = user_id);

create index items_user_id_created_at_idx on public.items (user_id, created_at desc);
```

ローカルに適用して確認する。

```powershell
supabase db reset   # 全マイグレーションを最初から流し直す。順序不整合をここで検出する
```

型定義を再生成する。

```powershell
supabase gen types typescript --local > src/types/database.ts
```

### 2. Staging / Production へ適用

Staging（`/dev/`）と Production（`/`）は同一の Supabase プロジェクトを共用して
いるため、この適用が**そのまま本番にも反映される。** Staging 用の別プロジェクトは
存在しない。

**この操作の前に、必ず人間に「本番 DB に直接適用してよいか」を確認すること。**

```powershell
supabase link --project-ref <PROJECT_REF>
supabase db push
```

適用は**アプリのデプロイより先**。ただし旧バージョンのアプリでも動く内容に限る
（詳細は `.claude/skills/release/SKILL.md` の「DB を伴うリリース」）。
適用後、`/dev/` で動作確認してから `main` へのマージ・デプロイに進む。

> **破壊的変更（下記）は `develop` からの日常運用で不用意に流さない。**
> 本番リリースのタイミングに合わせて実施する。
> 検証で作るデータはテスト専用アカウントに限定し、RLS で本番データと分離する。
> 同一プロジェクトを共用するため、ローカル（`supabase start`）での検証を
> 通常より厚く行うこと。

---

## 破壊的変更の扱い

以下は**単独で実行してはならない**。実行前に人間へ警告し、2リリースへの分割を提案する。

- `drop table` / `drop column`
- カラムのリネーム
- 型の変更（互換性のないもの）
- `not null` 制約の追加（既存行に null がある場合）
- 一意制約の追加（既存行に重複がある場合）

### 安全な分割パターン（例: カラムのリネーム）

- リリース A: 新カラムを追加 → 両方に書き込むコード → 既存データをバックフィル
- リリース B: 旧カラムを読まなくなったことを確認 → 旧カラムを削除

---

## Edge Functions

`service_role` キーや外部 API キーが必要な処理はここに置く。フロントエンドには置かない。

```powershell
supabase functions new <name>
supabase functions serve <name>                                  # ローカル
supabase secrets set EXTERNAL_API_KEY=xxxx --project-ref <ref>   # 環境変数
supabase functions deploy <name> --project-ref <ref>
```

シークレットは `supabase secrets set` で設定する。**コードに直書きしない。**

---

## Auth 設定（マイグレーションでは管理されない）

Supabase ダッシュボードでの手動設定が必要。変更したら `docs/SETUP.md` に記録すること。

- Site URL / Redirect URLs に本番・検証**両方**のオリジンを登録
  - `https://<user>.github.io/<repo>/`
  - `https://<user>.github.io/<repo>/dev/`
- ローカル開発用に `http://localhost:5173/` も登録
