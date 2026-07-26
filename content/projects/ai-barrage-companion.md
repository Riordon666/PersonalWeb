---
name: AI Barrage Companion
slug: ai-barrage-companion
tagline: AI 驱动的虚拟弹幕陪伴应用
repo: https://github.com/Riordon666/AI-Barrage-Companion
tech: [Python, PySide6, mss, OpenAI 兼容 API]
status: MVP 完成
year: 2026
---

轻量分析屏幕状态，生成 AI 或本地弹幕，在透明悬浮层中滚动显示，模拟"有人在看、有人在吐槽、有人在陪伴"的直播氛围。解决了玩免费游戏 / 发呆时没有弹幕氛围的问题。

- **画面感知**：定时截取主屏做缩略图帧差检测，识别静止 / 正常 / 快速 / 重复场景
- **隐私优先**：严格模式禁止截图、OCR、窗口标题、文件名、URL、聊天文本进入 AI 请求
- **五类人格**：吐槽、鼓励、阴阳怪气、跟风复读、玩梗，配合 4 种场景模板
- **广泛兼容**：DeepSeek、Qwen、Kimi、智谱 GLM、SiliconFlow、OpenRouter、Ollama 本地等
- **稳定降级**：AI 超时或失败时自动切换本地模拟弹幕，不中断运行
- **弹幕调度**：去重、密度限制、轨道分配、优先级插队，透明层点击穿透
