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
    <td align="center"><img src="./dark-post.webp" alt="ダークモードの記事"><br>ダークモードの記事</td>
    <td align="center"><img src="./light-post.webp" alt="ライトモードの記事"><br>ライトモードの記事</td>
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

## 🚀 クイックスタート

### 環境要件

- Node.js ≥ 22.14.0
- Astro ≥ 7.2.9

### ローカル開発環境のセットアップ

1. リポジトリをクローンします：

```bash
git clone https://github.com/rightdoor/citrus-grid.git
cd citrus-grid
```

2. 依存関係をインストールします：

```bash
# このプロジェクトは pnpm を使用します。インストールされていない場合は先にインストールしてください。
npm install -g pnpm

pnpm install
```

3. ブログを設定します：

`src/site.config.ts` を編集して、ブログの設定をカスタマイズします。

4. 開発サーバーを起動します：

```bash
pnpm dev
```

`http://localhost:4321` にアクセスしてブログをプレビューします。

### プラットフォームへのデプロイ

- [Astro デプロイガイド](https://docs.astro.build/guides/deploy/)
- Web デプロイの場合は、`pnpm build` でサイトをビルドし、生成された `dist` ディレクトリを対象プラットフォームにデプロイしてください。

## 📖 設定説明

詳細は設定ファイル [site.config.ts](../src/site.config.ts) を参照してください。

## ⚙️ 記事の Frontmatter

```markdown
---
title: example
slug: example
index: 0
description:  example description
category: example
tags: [example, example1]
published: 2026-01-01 00:01:02
updated: 2026-01-01 00:01:03
draft: false
---
```

| フィールド | 必須か | 例 | 説明 |
| --- | --- | --- | --- |
| `title` | はい | "example" | 記事のタイトル |
| `slug` | はい | example | 実行時に自動生成されます。手動で設定する場合は `-` で単語を区切ってください |
| `index` | はい | 0 | デフォルトの 0 はトップ固定なしを意味します。0 より大きい整数を指定すると記事がトップ固定され、数値が大きいほど上位に表示されます |
| `description` | はい | "Markdown 構文のさまざまなタイプと例を示します" | 記事の説明 |
| `category` | はい | "例" | 記事のカテゴリ |
| `tags` | はい | [Markdown] | 記事のタグ。複数ある場合はカンマで区切ります |
| `published` | はい | 2026-01-01 00:01:02 | 公開日時。形式は `YYYY-MM-DD HH:mm:ss` で、スクリプトにより自動生成されます |
| `updated` | いいえ | 2026-01-01 00:01:03 | 更新日時。形式は `YYYY-MM-DD HH:mm:ss` で、起動時およびビルド時に、スクリプトによってファイルの変更時刻に基づいて自動的に書き込まれます（site.config.tsで無効化できます） |
| `draft` | いいえ | false | 下書きかどうか。自動生成されません |

## 🧞 コマンド一覧

| コマンド | 説明 |
| --- | --- |
| `pnpm dev` / `start` | 開発サーバーを起動します |
| `pnpm build` | 本番ビルドを実行し、その後 `modulepreload` を自動注入し、インラインスクリプトを圧縮し、`pagefind` を実行してサイト内検索インデックスを生成します |
| `pnpm preview` | `dist` ビルド成果物をプレビューします |
| `pnpm check` | Astro の型チェック（`astro check`）を実行します |
| `pnpm type-check` | TypeScript の型チェック（`tsc --noEmit`、`src` と `scripts` を対象）を実行します |
| `pnpm new-post [slug]` | 新しい記事テンプレートを作成します（下記参照） |
| `pnpm format-post-meta` | 全記事の frontmatter フィールドの順序を一括で整列します |
| `pnpm format` | Biome を使用して `src` をフォーマットします |
| `pnpm format:all` | Biome を使用してプロジェクト全体（src、scripts、ルート設定ファイル）をチェックし修正します |
| `pnpm lint` | Biome を使用して `src` をチェックし修正します |
| `preinstall` | `only-allow pnpm` を自動実行し、pnpm の使用を強制します |

## 機能

- [x] i18n サポート（zh、en、ja）
- [x] GFM 構文サポート
- [x] KaTeX 数式サポート
- [x] ライト/ダークテーマ切り替え
- [x] 検索機能（pagefind）
- [x] コメント機能（コメントシステムはプラグイン可能で、現在は utterances に適応）
- [x] 目次機能（デスクトップではサイドバー固定、モバイルではポップアップ）
- [x] RSS フィード機能
- [x] フレンドリンク機能
- [x] コードハイライト（Prism によるビルド時ハイライト、クライアント側 JavaScript ゼロ）とコードコピーボタン
- [x] 画像ライトボックス（PhotoSwipe）と LQIP グラデーションスケルトンプレースホルダー
- [x] 閲覧統計（インターフェースは予約済み）

## プラグイン

### コメントプラグイン

現在は utterances コメントシステムに適応しています。カスタムコメントプラグインをサポートします。

カスタムコメントプラグインの詳細は [コメントプラグイン](../src/comments/usageRules.md) を参照してください。

### 統計プラグイン

グローバルおよび記事単位の PV/UV 統計をサポートし、インターフェースは予約済みです。

デフォルトで同梱されている統計プラグインは `visitor-stats.ts` で、プロジェクトは [visitor-stats](https://github.com/rightdoor/visitor-stats) にあります。Cloudflare Workers に統計サービスを自前でデプロイする必要があります。

カスタム統計プラグインの詳細は [統計プラグイン](../src/stats/usageRules.md) を参照してください。

## ライセンス

このプロジェクトは [MIT License](../LICENSE.txt) の下でオープンソース化されています。詳細な条項については、プロジェクトのルートディレクトリにある `LICENSE.txt` ファイルをご参照ください。
