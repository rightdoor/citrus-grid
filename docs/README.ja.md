<div align="center">
  <img src="./logo.webp" alt="ロゴ画像" />
  <h1 align="center">CitrusGrid 柑橘格子</h1>
  <p>Astro ベースの軽量静的ブログテーマ。<strong>柑橘色（#E86233）</strong>をメインカラーに、方眼紙風の背景で、軽量な Markdown ブログのニーズを満たします。</p>
  <img src="https://img.shields.io/badge/Node.js-%3E%3D22.14.0-brightgreen" alt="Node Version">
  <img src="https://img.shields.io/badge/Astro-%3E%3D7.2.9-brightgreen" alt="Astro Version">
  <img src="https://img.shields.io/github/license/rightdoor/citrus-grid" alt="GitHub License">
  <br>
  <a href="https://citrusgrid.pages.dev">Demo</a> | <a href="../README.md">中文</a> | <a href="./README.en.md">English</a>
</div>

---

<table width="100%" align="center" cellpadding="8" cellspacing="0">
  <tr>
    <th colspan="2" align="center">ダークモード</th>
  </tr>
  <tr>
    <td align="center"><img src="./dark.webp" alt="ダークモード"><br>ダークモード</td>
    <td align="center"><img src="./light.webp" alt="ライトモード"><br>ライトモード</td>
  </tr>

  <tr>
    <th colspan="2" align="center">PageSpeed Insights パフォーマンステスト</th>
  </tr>
  <tr>
    <td align="center"><img src="./pagespeed-desktop.webp" alt="デスクトップパフォーマンス"><br>デスクトップパフォーマンス</td>
    <td align="center"><img src="./pagespeed-mobile.webp" alt="モバイルパフォーマンス"><br>モバイルパフォーマンス</td>
  </tr>
</table>

---

## クイックスタート

1. このリポジトリをクローン（スター👍もお願いします）

```bash
git clone https://github.com/rightdoor/citrus-grid.git
```

2. 依存関係をインストールして実行

```bash
pnpm install
pnpm dev
pnpm build
pnpm preview
```

## コマンド一覧

| コマンド | 説明 |
| --- | --- |
| `pnpm dev` / `start` | 開発サーバーを起動 |
| `pnpm build` | 本番ビルド。その後、`modulepreload` の自動注入、インラインスクリプトの圧縮、`pagefind` によるサイト内検索インデックスの生成を実行 |
| `pnpm preview` | `dist` ビルド成果物をプレビュー |
| `pnpm check` | Astro 型チェック（`astro check`） |
| `pnpm type-check` | TypeScript 型チェック（`tsc --noEmit`、`src` と `scripts` を対象） |
| `pnpm new-post [slug]` | 新規記事テンプレートを作成（下記参照） |
| `pnpm format-post-meta` | 全記事の frontmatter フィールド順序を統一して並べ替え |
| `pnpm format` | Biome による `src` のフォーマット |
| `pnpm format:all` | Biome でプロジェクト全体（src、scripts、ルート設定ファイル）をチェック＆修正 |
| `pnpm lint` | Biome で `src` をチェック＆修正 |
| `preinstall` | `only-allow pnpm` を自動実行し、pnpm の使用を強制 |

## 設定

詳細は設定ファイル [config.yaml](src/config.yaml) を参照してください。デフォルト設定は `src/lib/siteConfig.ts` にあります。

## 記事の Frontmatter

| フィールド | 必須 | 例 | 説明 |
| --- | --- | --- | --- |
| `title` | はい | "example" | 記事のタイトル |
| `slug` | はい | example | 実行時に自動生成されます。手動で設定する場合は単語を `-` で区切ります |
| `index` | はい | 0 | デフォルトは 0（非固定）。正の整数で固定表示、数値が大きいほど上位に表示 |
| `description` | はい | "Markdown 構文のさまざまなタイプと例を紹介" | 記事の説明 |
| `category` | はい | "サンプル" | 記事のカテゴリ |
| `tags` | はい | [Markdown] | 記事のタグ。複数タグはカンマ区切り |
| `published` | はい | 2026-01-01 00:01:02 | 公開日時。形式 `YYYY-MM-DD HH:mm:ss`。スクリプトで自動生成 |
| `updated` | いいえ | 2026-01-01 00:01:03 | 更新日時。形式 `YYYY-MM-DD HH:mm:ss`。自動生成されません |
| `draft` | いいえ | false | 下書きフラグ。自動生成されません |

## 機能

- [x] GFM 構文サポート
- [x] KaTeX 数式サポート
- [x] 明暗テーマ切り替え
- [x] 検索機能（pagefind）
- [x] コメント機能（現時点では utterances のみ対応）
- [x] 目次機能（デスクトップではサイドバー固定、モバイルではモーダル）
- [x] RSS 配信機能
- [x] フレンドリンク機能
- [x] コードハイライト（Prism によるビルド時ハイライト、クライアント JS ゼロ）とコピーボタン
- [x] 画像ライトボックス（PhotoSwipe）と LQIP グラデーション配置スケルトン
- [x] 閲覧統計（API 予約済み）

## プラグイン

### 統計プラグイン

グローバルおよび記事ごとの PV/UV 統計をサポートし、API が予約されています。

付属の統計プラグインは `visitor-stats.ts`（プロジェクト: [visitor-stats](https://github.com/rightdoor/visitor-stats)）です。Cloudflare Worker に統計サービスを自前でデプロイする必要があります。

カスタム統計プラグインもサポートしています。詳細は [統計プラグイン](src/stats/使用規則.md) を参照してください。

## ライセンス

このプロジェクトは [MIT License](LICENSE.txt) の下でオープンソース化されています。詳細な条項については、プロジェクトのルートディレクトリにある `LICENSE.txt` ファイルをご参照ください。
