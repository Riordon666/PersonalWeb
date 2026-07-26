---
name: Cloud Mail for HarmonyOS
slug: cloud-mail-harmonyos
tagline: 从零重写的鸿蒙原生邮件客户端
repo: https://github.com/Riordon666/cloud-mail-for-harmonyos
demo: https://mail.riordon.xyz
tech: [ArkTS, ArkUI, HarmonyOS, HDS, Cloudflare Workers]
status: 持续开发中
featured: true
year: 2026
---

把 Cloud Mail（原 Vue 3 + Cloudflare Workers 邮件服务）完整移植为 HarmonyOS 原生应用。不是网页套壳，而是基于 ArkUI 声明式 UI 与 ArkTS，采用华为 HDS 设计语言从零重写。

- **邮件核心**：收件箱 / 已发送 / 星标 / 草稿箱四大分类，LazyForEach 虚拟滚动保证 60fps
- **写信体验**：收件人/抄送/密送、附件上传、本地草稿自动保存
- **用户体系**：登录注册、会话刷新、副邮箱管理、个人设置
- **管理后台**：用户管理、全局邮件、角色权限、数据分析、注册码共 5 个页面
- **原生质感**：沉浸式全屏、HdsTabs 底部导航、深色模式与平板断点适配
