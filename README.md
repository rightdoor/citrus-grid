<div align="center">
  <img src="./docs/logo.webp" alt="Logo 图片" />
  <h1 align="center">CitrusGrid 柑橘格子</h1>
  <p>基于 Astro 的轻量级静态博客主题，以<strong>柑橘色（#E86233）</strong>为主色调，方格草稿纸为背景样式，带来轻量级的 markdown 博客需求。</p>
  <img src="https://img.shields.io/badge/Node.js-%3E%3D22.14.0-brightgreen" alt="Node Version">
  <img src="https://img.shields.io/badge/Astro-%3E%3D7.2.9-brightgreen" alt="Astro Version">
  <img src="https://img.shields.io/github/license/rightdoor/citrus-grid" alt="GitHub License">
  <br>
  <a href="https://citrusgrid.pages.dev">Demo</a> | <a href="./docs/README.en.md">English</a> | <a href="./docs/README.ja.md">日本語</a>
</div>

---

<table width="100%" align="center" cellpadding="8" cellspacing="0">
  <tr>
    <th colspan="2" align="center">暗夜模式</th>
  </tr>
  <tr>
    <td align="center"><img src="./docs/dark.webp" alt="暗夜模式"><br>暗夜模式</td>
    <td align="center"><img src="./docs/light.webp" alt="白天模式"><br>白天模式</td>
  </tr>

  <tr>
    <td align="center"><img src="./docs/dark-post.webp" alt="暗夜模式"><br>暗夜模式文章</td>
    <td align="center"><img src="./docs/light-post.webp" alt="白天模式"><br>白天模式文章</td>
  </tr>

  <tr>
    <th colspan="2" align="center">PageSpeed Insights 性能测试</th>
  </tr>
  <tr>
    <td align="center"><img src="./docs/pagespeed-desktop.webp" alt="桌面端性能"><br>桌面端性能</td>
    <td align="center"><img src="./docs/pagespeed-mobile.webp" alt="手机性能"><br>手机性能</td>
  </tr>
</table>

---

## 快速开始

### 环境要求

- Node.js ≥ 22.14.0
- Astro ≥ 7.2.9

### 本地开发部署

1. 克隆仓库：

    ```bash
    git clone https://github.com/rightdoor/citrus-grid.git
    cd citrus-grid
    ```

2. 安装依赖

    ```bash
    # 本项目使用 pnpm 安装依赖，如果没有安装请先安装
    npm install -g pnpm

    pnpm install
    ```

3. 配置博客：

    编辑 `src/site.config.ts` 自定义博客设置

4. 启动开发服务器：

    ```bash
    pnpm dev
    ```

    访问 `http://localhost:4321` 即可查看博客效果

### 平台托管部署

- [Astro 部署指南](https://docs.astro.build/guides/deploy/)
- 网页部署请使用 `pnpm build` 命令构建网站，随后将 `dist` 目录部署至目标平台。

## 配置说明

详细内容请查看配置文件 [site.config.ts](src/site.config.ts)。

## 文章 Frontmatter

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

| 字段 | 是否必填 | 示例 | 描述 |
| --- | --- | --- | --- |
| `title` | 是 | "example" | 文章标题 |
| `slug` | 是 | example | 运行时自动生成，可手动填写，使用`-`分隔单词 |
| `index` | 是 | 0 | 默认为0不置顶，大于0的整数置顶，数值越大越靠前 |
| `description` | 是 | "展示 Markdown 语法的各种类型和示例" | 文章描述 |
| `category` | 是 | "示例" | 文章分类 |
| `tags` | 是 | [Markdown] | 文章标签，多个标签用逗号隔开 |
| `published` | 是 | 2026-01-01 00:01:02 | 文章发布时间，格式为`YYYY-MM-DD HH:mm:ss`，脚本生成自带 |
| `updated` | 否 | 2026-01-01 00:01:03 | 文章更新时间，格式为`YYYY-MM-DD HH:mm:ss`，启动和构建时由脚本按文件修改时间自动写入（可在 `site.config.ts` 关闭） |
| `draft` | 否 | false | 是否草稿，不自动生成 |

## 命令说明

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` / `start` | 启动开发服务器 |
| `pnpm build` | 生产构建，随后自动注入 `modulepreload`、压缩内联脚本，并执行 `pagefind` 生成站内搜索索引 |
| `pnpm preview` | 预览 `dist` 构建产物 |
| `pnpm check` | Astro 类型检查（`astro check`） |
| `pnpm type-check` | TypeScript 类型检查（`tsc --noEmit`，覆盖 `src` 与 `scripts`） |
| `pnpm check-i18n` | 校验 zh / ja / en 语言包键集合一致 |
| `pnpm check-swup-ignore` | 校验 `shouldIgnoreSwup` 内联正则与 `ASSET_EXT_RE` / `RESERVED_PATH_RE` 常量一致 |
| `pnpm new-post [slug]` | 新建文章模板 `src/content/posts/<slug>.md`（省略 slug 时按当天日期命名） |
| `pnpm format-post-meta` | 统一重排所有文章 frontmatter 字段顺序 |
| `pnpm format` | Biome 格式化 `src` |
| `pnpm format:all` | Biome 检查并修复全项目代码（src、scripts、根目录配置文件） |
| `pnpm lint` | Biome 检查并修复 `src` |
| `preinstall` | 自动执行 `only-allow pnpm`，强制使用 pnpm |

## 提交前检查

*文章写完提交前（`pnpm build` 会改写 md 补全 `slug`，必须在 commit 之前执行）：

```bash
pnpm format-post-meta
pnpm build
pnpm check
```

代码改完提交前：

```bash
pnpm format:all
pnpm check
pnpm type-check
```

- 改了 i18n 文案加跑 `pnpm check-i18n`；改了 `src/lib/url.ts` 加跑 `pnpm check-swup-ignore`。

## 功能

- [x] i18n 支持（zh、en、ja三语）
- [x] 支持 GFM 语法
- [x] 支持 KaTeX 数学公式
- [x] 明暗主题切换
- [x] 搜索功能（pagefind）
- [x] 评论功能（评论系统可插拔，当前适配 utterances）
- [x] 目录功能（桌面端侧边固定 + 移动端弹窗）
- [x] RSS 订阅功能
- [x] 友链功能
- [x] 代码高亮（Prism 构建期高亮，客户端零 JS）与代码复制按钮
- [x] 图片灯箱（PhotoSwipe）与 LQIP 渐变占位骨架
- [x] 阅读统计（已预留接口）
- [x] 文章相对链接自动转换
- [x] 音乐播放器组件

## 插件

### 评论插件

当前适配 utterances 评论系统，支持自定义评论插件。

支持自定义评论插件，详细参考 [评论插件](src/comments/使用规则.md)。

### 统计插件

支持全局和文章PV/UV统计，已预留接口。

当前自带统计插件有 `visitor-stats.ts`，项目地址为 [visitor-stats](https://github.com/rightdoor/visitor-stats)。需要在cloudflare worker中自行部署统计服务。

支持自定义统计插件，详细参考 [统计插件](src/stats/使用规则.md)。

## 二次开发文档

需要改造主题（换主色、改布局、加组件、接入评论/统计、排查构建问题）请查阅 [`src/content/posts/all/00-index.md`](src/content/posts/all/00-index.md)：

| 文档 | 内容 |
| --- | --- |
| [00-index.md](src/content/posts/all/00-index.md) | 总览与二次开发任务索引 |
| [01-项目结构.md](src/content/posts/all/01-项目结构.md) | 目录树、技术栈、构建流水线、数据流 |
| [02-组件说明.md](src/content/posts/all/02-组件说明.md) | 全部组件 Props 表、DOM 结构、事件协议、图标系统 |
| [03-主题与样式定制.md](src/content/posts/all/03-主题与样式定制.md) | `--wp-*` 变量全表、暗色模式、换肤步骤 |
| [04-站点配置.md](src/content/posts/all/04-站点配置.md) | `site.config.ts` 等 6 个配置文件的参数表 |
| [05-内容与Markdown.md](src/content/posts/all/05-内容与Markdown.md) | Frontmatter 表、markdown 插件链、图片与相对链接 |
| [06-构建与脚本.md](src/content/posts/all/06-构建与脚本.md) | 6 个构建脚本、产物结构、部署 |
| [07-页面与路由.md](src/content/posts/all/07-页面与路由.md) | 路由表、SEO、i18n 现状与扩展 |
| [08-插件系统.md](src/content/posts/all/08-插件系统.md) | 评论 / 统计插件契约、音乐播放器 |
| [09-常见改造与排错.md](src/content/posts/all/09-常见改造与排错.md) | 任务式改造速查、FAQ、自检清单 |

> 基于 `DeepSeek-V4.1-Flash` 检索生成+手动修改，仅供参考。

## 贡献者

<a href="https://github.com/rightdoor/citrus-grid/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=rightdoor/citrus-grid" />
</a>

## License

本项目使用 [MIT License](LICENSE.txt) 开源。详细条款请参阅项目根目录下的 `LICENSE.txt` 文件。
