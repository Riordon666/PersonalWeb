# Riordon's Personal Website

个人网站首页，使用原生 HTML + CSS + JavaScript 构建。

## 项目结构

```
d:\HomePage\
├── index.html          # 首页
├── site.config.js      # 站点配置（标题、签名、链接等）
├── vite.config.js      # Vite 构建配置
├── package.json        # 项目依赖
├── public/             # 静态资源
│   ├── avatar.jpg      # 头像
│   ├── background.png  # 背景纹理
│   └── favicon.ico     # 网站图标
└── src/
    ├── css/
    │   └── style.css   # 样式文件
    └── js/
        ├── main.js     # 主逻辑（页面切换、网格动画）
        └── background.js # 流体背景动画
```

## 功能特性

- **流体背景动画** - WebGL 实现的交互式流体效果
- **页面切换动画** - 平滑的 intro → main 过渡
- **网格蛇形动画** - 鼠标/触摸跟随的贪吃蛇效果
- **响应式设计** - 适配桌面和移动端
- **ICP备案** - 底部备案信息展示

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:8080

### 构建生产版本

```bash
npm run build
```

输出到 `dist/` 目录

### 预览构建结果

```bash
npm run preview
```

## 自定义配置

编辑 `site.config.js` 修改：

- 网站标题、描述
- 个人签名
- 头像链接
- 导航链接

## 技术栈

- **Vite** - 构建工具
- **原生 HTML/CSS/JS** - 无框架依赖
- **WebGL** - 流体背景
- **anime.js** - 动画库

## 备案信息

- ICP备案：蜀ICP备2026002494号-1
- 公安备案：川公网安备51111102000146号

## License

MIT
