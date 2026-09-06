export interface SocialLink {
  platform: string
  url: string
}

export interface FriendLinkRaw {
  url: string
  name?: string
  desc?: string
  icon?: string
}

export const siteConfig = {
  // 站点地址，用于 sitemap 、 RSS 等地方
  // Site URL used for sitemap, RSS, etc.
  // 例 e.g. https://example.com
  url: 'https://citrusgrid.pages.dev',

  // 站点信息 Site info
  title: 'CitrusGrid',
  subtitle: 'A pure static Astro blog theme',
  description: '这是一个基于 Astro 架构和 CitrusGrid主题的轻量级静态博客。',

  // 首页卡片的头像和网站图标 Logo ， public/ 下的静态路径，以 / 开头
  // Avatar and site logo for the home profile card. Static paths under public/, starting with /
  // 例 e.g. /avatar.webp 、 /logo.webp
  avatar: '/avatar.webp',
  logo: '/logo.webp',

  // 作者 Author name
  author: 'example name',

  // 默认语言： zh 、 ja 、 en
  // Default language: zh, ja, en
  defaultLang: 'zh' as 'zh' | 'ja' | 'en',

  // 默认主题： auto 、 light 、 dark
  // Default theme: auto, light, dark
  defaultTheme: 'auto' as 'auto' | 'light' | 'dark',

  // 首页每页文章数 Posts per page on the home page
  postsPerPage: 10,

  // 个人名片社交按钮，改为空数组 [] 则不显示社交按钮
  // Social buttons on the profile card. Set to an empty array [] to hide them
  // 支持 Supported: github 、 twitter 、 linkedin 、 youtube 、 instagram 、 facebook 、 devto 、 medium 、 rss 、 email 、 website
  // 没有独立设置图标的使用通用链接图标
  // Platforms without a dedicated icon fall back to a generic link icon
  socials: [
    { platform: 'github', url: 'https://github.com' },
    { platform: 'rss', url: '/rss.xml' },
  ] as SocialLink[],

  // 统计脚本，脚本位于 src/stats/ 目录，契约详见 src/stats/使用规则.md ，留空不启用
  // Statistics script. Scripts live in src/stats/, see src/stats/usageRules.md for the plugin contract. Leave empty to disable
  statsScript: 'random-visitor',

  // 友链，改为空数组 [] 显示空状态页。icon 放在 public/friends/ 下，引用以 /friends/文件名.后缀
  // Friend links. Set to an empty array [] to show an empty state. Icons go under public/friends/ and are referenced as /friends/filename.ext
  friends: [
    {
      url: 'https://example.com',
      name: 'test',
      desc: 'a desc',
      icon: '/friends/logo.webp',
    },
  ] as FriendLinkRaw[],

  // 评论脚本，脚本位于 src/comments/ 目录，契约详见 src/comments/使用规则.md ，留空不启用评论区
  // Comment script. Scripts live in src/comments/, see src/comments/usageRules.md for the adapter contract. Leave empty to disable the comment section
  commentScript: '',

  // 根据文件保存时间自动更新文章的 updated 字段，仅在启动和构建时更新
  // Auto-update each post's `updated` field from its file save time only updated during startup and build
  autoUpdatePostUpdated: true,
}
