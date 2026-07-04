# MiniMax Video Studio

基于 **MiniMax Video Agent** 的可视化视频生成工作台。

11 个官方视频模板 · 选模板 → 上传照片 → 输入文本 → 一键生成视频

## 功能

- 🎨 **11 个官方模板**：跳水、吊环、绝地求生、藏族风写真、生无可恋、四季写真等
- 📷 **图片输入**：支持本地图片（自动 base64，绕过公网 URL 限制）
- ✏️ **文本输入**：部分模板需要文本（如绝地求生的"野兽种类"）
- ⏳ **进度展示**：实时轮询，显示已等待秒数
- 🎬 **视频预览**：生成完毕直接在页面播放 + 下载
- 🔒 **安全**：API Key 仅在后端 .env，前端零接触

## 技术栈

- Next.js 14（App Router）+ TypeScript
- Tailwind CSS（深色 UI）
- Next API Routes（代理 MiniMax API）
- 客户端轮询（无第三方状态管理）

## 快速开始

```bash
cd /Volumes/world/program/minimax-video-studio
npm install

# 编辑 .env.local，填入 MINIMAX_API_KEY
# MINIMAX_API_KEY=sk-cp-xxxxx

npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)

## 项目结构

```
src/
├── app/
│   ├── api/
│   │   ├── generate/route.ts   # POST 提交任务（multipart）
│   │   └── poll/route.ts        # GET 轮询任务状态
│   ├── layout.tsx
│   ├── page.tsx                 # 主页面
│   └── globals.css
├── components/
│   ├── TemplateCard.tsx         # 模板宫格卡片
│   ├── PhotoUpload.tsx          # 照片上传 + 预览
│   └── StatusPanel.tsx          # 生成进度展示
└── lib/
    ├── minimax.ts               # MiniMax API 客户端
    └── templates.ts             # 11 个模板元数据
```

## 关键发现（已踩过的坑）

1. **base64 data URI 直接可用**：`media_inputs[].value` 传 `data:image/jpeg;base64,...` 不需要上传到公网图床（官方文档没写）
2. **官方文件上传 API 不支持图片**：只接 4 种 purpose（voice_clone/prompt_audio/t2a_async_input/video_understanding），都不收 jpg/png
3. **模板生成是异步 + 长任务**：通常 1-5 分钟，前端轮询 8s 一次，超时 6 分钟
4. **Success 时直接返回 video_url**：不用走 file_id → retrieve 这两步（与基础视频生成 API 不同）

## 部署到 Vercel

```bash
# 1. 推代码
git init && git add . && git commit -m "init"
# 2. 推到 GitHub 后在 Vercel 导入
# 3. 在 Vercel Project Settings → Environment Variables 设置 MINIMAX_API_KEY
# 4. vercel deploy
```

⚠️ Vercel Serverless 函数默认 10s 超时。如果想在前端做长轮询，需要用 Vercel Edge Functions 或在客户端直接轮询 MiniMax API（需要小心 CORS 和 Key 暴露）。

**当前架构是客户端轮询 → 后端单次查询**，所以不涉及长函数问题，可直接部署。

## API 文档参考

- [使用模板生成视频](https://platform.minimaxi.com/docs/guides/video-agent)
- [视频模板列表](https://platform.minimaxi.com/docs/faq/video-agent-templates)
- [视频生成（基础）](https://platform.minimaxi.com/docs/guides/video-generation)