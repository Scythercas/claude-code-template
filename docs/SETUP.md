# 初回セットアップ

**このドキュメントはプロジェクト立ち上げ時に一度だけ実行する手順。**
継続開発時のルールは `CLAUDE.md` を参照。

前提: Windows PC / PowerShell / Git for Windows / Node.js（`.nvmrc` のバージョン）/
Docker Desktop（Supabase ローカル用）

---

## 1. Git のローカル設定

```powershell
git config --global core.autocrlf false
git config --global core.longpaths true
git config --global init.defaultBranch main
```

`core.autocrlf` を `false` にするのは、`.gitattributes` の `eol=lf` と競合させないため。

---

## 2. リポジトリと保護設定

1. [Scythercas/claude-code-template](https://github.com/Scythercas/claude-code-template)
   を開き、**「Use this template」→「Create a new repository」**で新規リポジトリを作成する
   （`main` がデフォルトブランチになる）。
   **「Include all branches」に必ずチェックを入れる。** 付け忘れると `develop` が
   コピーされず、`deploy.yml` が初回 push で失敗する（気づかず単体で `main` のみ作った
   場合は、手順2で改めて `develop` を作成すること）。
2. `develop` ブランチが存在しない場合のみ、`main` から作成して push
3. Settings > Branches で `main` と `develop` にブランチ保護ルールを設定
   - Require a pull request before merging
   - Require status checks to pass（`CI / verify` を選択）
   - **Do not allow force pushes**
   - Allow deletions: オフ

---

## 3. GitHub Pages の有効化

Settings > Pages で **Source を "GitHub Actions"** にする。
"Deploy from a branch" は選ばない（`deploy.yml` が機能しなくなる）。

公開URL:
- 本番: `https://<user>.github.io/<repo>/`
- 検証: `https://<user>.github.io/<repo>/dev/`

> リポジトリ名が `<user>.github.io` の場合、URL は `https://<user>.github.io/` と
> `https://<user>.github.io/dev/` になる。この場合 `deploy.yml` の
> `VITE_BASE_PATH` を `/` と `/dev/` に書き換えること。

---

## 4. Supabase プロジェクトの作成

本番用と検証用の **2 プロジェクト**を作成する。命名例: `<project>-prod` / `<project>-dev`。

各プロジェクトの Settings > API から以下を控える。
- Project URL
- `anon` public key
- Project Reference ID

**`service_role` key は控えない・使わない・コピーしない。**
（必要になるのは Edge Functions 内のみで、そこでは自動的に注入される）

### Auth 設定

Authentication > URL Configuration に以下を登録する。

| プロジェクト | Site URL | Redirect URLs |
|---|---|---|
| 本番 | `https://<user>.github.io/<repo>/` | 同左, `http://localhost:5173/` |
| 検証 | `https://<user>.github.io/<repo>/dev/` | 同左, `http://localhost:5173/` |

---

## 5. GitHub Actions の変数設定

Settings > Secrets and variables > Actions > **Variables** タブに以下を登録。

| 名前 | 値 |
|---|---|
| `PROD_SUPABASE_URL` | 本番プロジェクトの Project URL |
| `PROD_SUPABASE_ANON_KEY` | 本番プロジェクトの anon key |
| `DEV_SUPABASE_URL` | 検証プロジェクトの Project URL |
| `DEV_SUPABASE_ANON_KEY` | 検証プロジェクトの anon key |

> Secrets ではなく Variables を使う。anon key は公開前提の値であり（ビルド成果物に
> 含まれて全世界に配布される）、Secrets に入れるとログがマスクされて障害調査が
> 難しくなるだけで、秘匿性は 1 ミリも向上しない。**anon key を守るのは RLS であって
> 秘匿ではない。**

---

## 6. ローカル環境

```powershell
npm ci
Copy-Item .env.example .env.local
```

`.env.local` に検証用プロジェクトの値を記入する。`.env.local` は `.gitignore` 済み。

```powershell
supabase start        # ローカル DB を起動（Docker Desktop が必要）
npm run dev
```

---

## 7. Vite の設定

`vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages のサブパス公開に必須。これが無いとアセットが全て 404 になる。
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react()],
});
```

> 本番/検証ビルドをローカルで再現するために `VITE_BASE_PATH` を手動指定する場合は
> **PowerShell を使うこと。** Git Bash では MSYS2 のパス自動変換により
> `VITE_BASE_PATH=/my-repo/` のような `/` 始まりの値が
> `C:/Program Files/Git/my-repo/` 等の Windows パスに化けて、ビルドが壊れた base で
> 実行される（GitHub Actions は Linux 上で動くため本番のデプロイには影響しない）。

---

## 8. Supabase クライアントの初期化

`src/lib/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const env = import.meta.env.VITE_APP_ENV ?? 'development';

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      // 本番(/)と検証(/dev/)は同一オリジンのため localStorage を共有する。
      // storageKey を分けないとセッションが相互に上書きされる。
      storageKey: `sb-${env}-auth`,
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);
```

---

## 9. ルーティング

GitHub Pages は SPA のパスを解決できないため **HashRouter** を使う。

```tsx
import { createHashRouter, RouterProvider } from 'react-router-dom';
```

`BrowserRouter` を使うと `/<repo>/some/path` の直接アクセスとリロードが 404 になる。

---

## 10. 動作確認チェックリスト

- [ ] `npm run dev` でローカル起動する
- [ ] `develop` に push → Actions が成功 → `/dev/` が表示される
- [ ] `main` に push → Actions が成功 → `/` が表示され、`/dev/` も消えていない
- [ ] `/` と `/dev/` で別々のアカウントに同時ログインできる（storageKey 分離の確認）
- [ ] ブラウザの DevTools で、ビルド成果物に `service_role` の文字列が無いこと
- [ ] RLS 未設定のテーブルが 1 つも無いこと
