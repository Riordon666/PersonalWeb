# Riordon's Personal Website

个人网站（起始页 + 博客），使用原生 HTML + CSS + JavaScript 构建，无框架依赖。

## 项目结构

```
d:\HomePage\
├── index.html            # 起始页（WebGL 流体背景 + 贪吃蛇网格）
├── site.config.js        # 起始页配置（标题、签名、链接等）
├── vite.config.js        # Vite 构建配置（自动收集 blog/**/index.html 为入口）
├── content/
│   ├── posts/            # 博客文章（Markdown，写作入口）
│   ├── projects/         # 项目展示条目（Markdown）
│   └── changelog/        # 更新日志条目（Markdown）
├── scripts/
│   ├── generate-blog.mjs # 博客静态生成器（dev/build 前自动运行）
│   └── convert-images.mjs# 背景图转 WebP + 生成缩略图（需 sharp）
├── blog/                 # 生成的博客页面（勿手动编辑）
├── public/
│   ├── avatar.jpg / background.png / favicon.ico
│   └── blog/             # 博客静态资源
│       ├── blog.css / blog.js        # 博客全局样式与交互
│       ├── post.css / archives.css / tags.css / changelog.css
│       ├── backgrounds/  # 背景图库（含 thumbs/ 缩略图）
│       ├── background-config.json    # 默认外观（背景图/透明度等）
│       └── search-index.json         # 全站搜索索引（生成）
└── src/
    ├── css/style.css     # 起始页样式
    └── js/
        ├── main.js       # 起始页逻辑（页面切换、网格贪吃蛇）
        └── background.js # WebGL 流体背景
```

## 功能特性

### 起始页
- **流体背景动画** - WebGL 交互式流体效果
- **页面切换动画** - intro → 主卡片的 SVG 波浪过渡
- **网格贪吃蛇** - 鼠标/触摸跟随，可吃食物成长

### 博客
- **静态生成** - Markdown 写作，支持列表 / 引用 / 表格 / 嵌套代码围栏 / 图片懒加载
- **项目展示** - /blog/projects/，content/projects/*.md 驱动（技术栈标签、源码/演示链接、状态徽章）
- **小游戏专区** - /blog/games/ 共 **60 款**，分街机动作 / 益智解谜 / 棋牌对弈 / 消除匹配 / 反应训练 / 休闲创意六类，支持分类筛选。含俄罗斯方块、数独、中国象棋（AI）、纸牌接龙、消消乐、合成大西瓜、节奏大师等。每款独立模块按需加载，配色跟随主题色，支持键鼠与触屏，最高分本地保存
  - 新增游戏只需在 `scripts/games-catalog.mjs` 加一条目 + 写 `public/blog/games-lib/<slug>.js`
- **暗色模式** - 跟随系统 / 浅色 / 深色三态，外观面板切换，无闪烁恢复
- **代码高亮** - highlight.js 在生成时完成，浏览器零高亮 JS
- **SPA 导航** - 顶部进度条 + 页面淡入淡出过渡，悬停预取 + 页面缓存
- **全站搜索** - `Ctrl+K` 或 `/` 唤起，标题/标签/正文全文检索，关键词高亮，键盘导航
- **文章体验** - 目录（TOC）滚动高亮、阅读进度条、代码一键复制（带语言标签）、图片灯箱、上一篇/下一篇、字数与阅读时长
- **外观面板** - 一个卡片里同时配置主题色（HSL 色轮 + 明度）与背景（纯色 / 图库任选），并可调卡片透明度、背景虚化、背景亮度，localStorage 持久化
- **更多** - 交错入场动画、RSS（/blog/feed.xml）、sitemap.xml、响应式移动端适配、prefers-reduced-motion 支持

## 快速开始

```bash
npm install
npm run dev        # 开发模式（自动生成博客页面），访问 http://localhost:8080
npm run build      # 构建生产版本到 dist/（包含全部博客页面）
npm run preview    # 预览构建结果
npm run gen:blog   # 手动重新生成博客页面
```

## 写文章

在 `content/posts/` 新建 `.md` 文件：

```markdown
---
title: 文章标题
date: 2026-03-01
tags: [标签1, 标签2]
cover: /images/cover.png   # 可选
slug: custom-url           # 可选
---

# 文章标题

正文内容……
```

保存后运行 `npm run dev` 或 `npm run gen:blog` 即可。详见站内《博客文章写作教程》。

## 技术栈

- **Vite** - 构建工具
- **原生 HTML/CSS/JS** - 无框架依赖
- **WebGL** - 流体背景
- **anime.js** - 起始页动画
- **sharp** - 图片处理（WebP 转换 / 缩略图）

## License

MIT
