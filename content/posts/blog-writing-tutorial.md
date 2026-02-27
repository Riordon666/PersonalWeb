---
title: 博客文章写作教程
date: 2026-02-27
tags: [教程, 博客]
---

# 博客文章写作教程

本博客使用 Markdown 格式编写文章，支持 Frontmatter 元数据配置。本文将详细介绍如何编写和发布文章。

## 文章文件位置

所有文章存放在 `content/posts/` 目录下，文件格式为 `.md`（Markdown 文件）。

```
content/posts/
├── hello-world.md
├── stock.md
└── your-new-post.md    # 新文章
```

## Frontmatter 配置

每篇文章开头可以添加 Frontmatter 元数据，用 `---` 包围：

```markdown
---
title: 文章标题
date: 2026-02-27
tags: [标签1, 标签2, 标签3]
cover: /images/cover.jpg
slug: custom-url
---

# 正文开始...
```

### 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `title` | 否 | 文章标题，不写则使用第一个 `# 标题` |
| `date` | 否 | 发布日期，格式 `YYYY-MM-DD`，不写则用文件修改时间 |
| `tags` | 否 | 标签数组，格式 `[标签1, 标签2]` |
| `cover` | 否 | 封面图片路径，如 `/images/cover.jpg` |
| `slug` | 否 | URL 路径，不写则用文件名 |

## Markdown 语法

### 标题

使用 `#` 符号表示标题级别：

```markdown
# 一级标题
## 二级标题
### 三级标题
```

### 文本样式

```markdown
**粗体文本**
*斜体文本*
`行内代码`
~~删除线~~
```

### 列表

无序列表：

```markdown
- 项目一
- 项目二
  - 嵌套项目
```

有序列表：

```markdown
1. 第一步
2. 第二步
3. 第三步
```

### 链接和图片

```markdown
[链接文字](https://example.com)

![图片描述](/images/your-image.jpg)
```

**图片存放位置**：将图片放在 `public/images/` 目录下，引用时使用 `/images/文件名.jpg`。

### 代码块

使用三个反引号包裹代码：

````markdown
```python
def hello():
    print("Hello, World!")
```
````

支持的语言高亮：`python`、`javascript`、`java`、`cpp`、`css`、`html` 等。

### 引用

```markdown
> 这是一段引用文字
> 可以多行
```

### 分割线

```markdown
---
```

### 表格

```markdown
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 数据 | 数据 | 数据 |
| 数据 | 数据 | 数据 |
```

## 发布流程

### 1. 创建文章

在 `content/posts/` 目录下创建新的 `.md` 文件。

### 2. 编写内容

使用 Markdown 语法编写文章内容。

### 3. 生成静态页面

运行生成命令：

```bash
npm run gen:blog
```

### 4. 预览效果

刷新博客页面查看新文章。

## 文章管理

### 删除文章

直接删除 `content/posts/` 下对应的 `.md` 文件，然后重新运行生成命令。生成器会自动清理没有对应源文件的目录。

### 修改文章

编辑对应的 `.md` 文件后，重新运行生成命令即可更新。

## 封面图片

### 添加封面

1. 将封面图片放入 `public/images/` 目录
2. 在文章 Frontmatter 中添加 `cover` 字段：

```markdown
---
title: 我的文章
cover: /images/my-cover.jpg
---
```

### 推荐尺寸

封面图片推荐尺寸：**800 x 400** 像素，支持 JPG、PNG、WebP 格式。

## 标签使用

标签用于文章分类，可以在标签页面按标签浏览文章。

```markdown
---
tags: [技术, Python, 教程]
---
```

建议每篇文章使用 2-5 个标签。

## 小技巧

### 1. 文件命名

文件名会成为默认的 URL 路径，建议使用英文和连字符：

- ✅ `my-first-post.md` → `/blog/my-first-post/`
- ❌ `我的第一篇文章.md` → URL 会转码

### 2. 文章摘要

文章前两段非标题文字会自动作为摘要显示在首页卡片上。

### 3. 代码高亮

代码块会自动高亮，建议指定语言获得更好的效果：

````markdown
```javascript
const greeting = "Hello";
console.log(greeting);
```
````

---

现在你可以开始写自己的文章了！如有问题欢迎交流讨论。
