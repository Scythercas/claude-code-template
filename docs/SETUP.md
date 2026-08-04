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
3. Settings > Branches で `main` と `develop` にブランチ保護ルール（Add branch
   protection rule）を追加する。「Branch name pattern」に `main` を入力し
   （`develop` の分は同じ手順をもう一度繰り返して別ルールとして追加する）、以下を設定する。
   - **Require a pull request before merging** をオン
   - **Require status checks to pass before merging** をオン
     - ただしこの時点では検索欄が **「No required checks」「No checks have been
       added」となり `CI / verify` を選べない。これは正常。** GitHub は
       そのリポジトリで一度も実行されたことのないチェックを候補に出さないため。
       先にこの保護ルールを **`CI / verify` の選択なしのまま一旦保存**し、
       手順6・7を終えて適当な `feature/xxx` ブランチから `develop` 宛に
       Pull Request を1つ出して CI を1回走らせる。その後この画面に戻り、
       検索欄に `verify` と入力すると `CI / verify` が選べるようになるので選択する。
   - 画面をさらに下までスクロールし、以下を確認する（「Require status checks」の
     チェック欄のすぐ下には出てこないので見落としやすい）。
     - **Allow force pushes: チェックを入れない**（＝force push 禁止のまま）
     - **Allow deletions: チェックを入れない**（＝削除禁止のまま）

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

**Supabase プロジェクトは常に1つだけ作成し、本番・検証で共用する。** 命名例:
`<project>`。Branching 機能（プランごとに検証用DBを自動生成する仕組み）は
使わない。

Settings > API から以下を控える。
- Project URL
- `anon` public key
- Project Reference ID

**`service_role` key は控えない・使わない・コピーしない。**
（必要になるのは Edge Functions 内のみで、そこでは自動的に注入される）

### Auth 設定

Authentication > URL Configuration に、本番・検証**両方**のオリジンを
1つのプロジェクトにまとめて登録する。

| Site URL | Redirect URLs |
|---|---|
| `https://<user>.github.io/<repo>/` | 同左, `https://<user>.github.io/<repo>/dev/`, `http://localhost:5173/` |

> 本番と検証で Auth のユーザーテーブルを共有する。`/dev/` で作ったテストアカウントが
> 本番と同じユーザー一覧に並ぶ点に注意（分離はしない前提）。運用ルールは
> `.claude/skills/supabase-migration/SKILL.md` 参照。

---

## 5. GitHub Actions の変数設定

Settings > Secrets and variables > Actions > **Variables** タブに以下を登録。

| 名前 | 値 |
|---|---|
| `PROD_SUPABASE_URL` | Supabase プロジェクトの Project URL |
| `PROD_SUPABASE_ANON_KEY` | 同上の anon key |
| `DEV_SUPABASE_URL` | `PROD_SUPABASE_URL` と完全に同じ値（同一プロジェクトのため） |
| `DEV_SUPABASE_ANON_KEY` | `PROD_SUPABASE_ANON_KEY` と完全に同じ値 |

> Secrets ではなく Variables を使う。anon key は公開前提の値であり（ビルド成果物に
> 含まれて全世界に配布される）、Secrets に入れるとログがマスクされて障害調査が
> 難しくなるだけで、秘匿性は 1 ミリも向上しない。**anon key を守るのは RLS であって
> 秘匿ではない。**
>
> `PROD_*`/`DEV_*` の名前を分けているのは、`deploy.yml` が本番ビルドと検証ビルドを
> 別々のステップとして組み立てる構成になっているため。プロジェクトが1つである
> ことに変わりはない。

---

## 6. ローカル環境

雛形（`package.json` / `vite.config.ts` / `eslint.config.js` / `src/` 一式）は
このテンプレートに既に含まれている。依存関係を再現インストールするだけでよい。

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

`vite.config.ts` は設定済み。`base` を環境変数 `VITE_BASE_PATH` から与えている
（GitHub Pages のサブパス公開に必須。これが無いとアセットが全て 404 になる）。
変更する場合を除き、このファイルは触らなくてよい。

> 本番/検証ビルドをローカルで再現するために `VITE_BASE_PATH` を手動指定する場合は
> **PowerShell を使うこと。** Git Bash では MSYS2 のパス自動変換により
> `VITE_BASE_PATH=/my-repo/` のような `/` 始まりの値が
> `C:/Program Files/Git/my-repo/` 等の Windows パスに化けて、ビルドが壊れた base で
> 実行される（GitHub Actions は Linux 上で動くため本番のデプロイには影響しない）。

---

## 8. Supabase クライアントの初期化

`src/lib/supabase.ts` は設定済み。`auth.storageKey` を環境ごとに変えている点だけ
把握しておくこと（理由は CLAUDE.md §7）。`supabase gen types typescript` を実行したら、
`src/types/database.ts` の中身（現状は空のプレースホルダ型）を生成結果で置き換える。

---

## 9. ルーティング

`src/App.tsx` は `createHashRouter` を使う設定済み。ページを追加する場合は
このルーター定義に `path` を足していく。**`BrowserRouter` に変更しないこと。**
GitHub Pages は SPA のパスを解決できず、`/<repo>/some/path` の直接アクセスと
リロードが 404 になる。

---

## 10. 動作確認チェックリスト

- [ ] `npm run dev` でローカル起動する
- [ ] `develop` に push → Actions が成功 → `/dev/` が表示される
- [ ] `main` に push → Actions が成功 → `/` が表示され、`/dev/` も消えていない
- [ ] `/` と `/dev/` で別々のアカウントに同時ログインできる（storageKey 分離の確認）
- [ ] ブラウザの DevTools で、ビルド成果物に `service_role` の文字列が無いこと
- [ ] RLS 未設定のテーブルが 1 つも無いこと
