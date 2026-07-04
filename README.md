# MiniMax Video Studio

基于 **MiniMax Video Agent** 的可视化视频生成工作台。

11 个官方模板 · 两步流程：上传 → 美化预览 → 生成视频

## 功能

- 🎨 **11 个官方模板**：跳水、吊环、绝地求生、藏族风写真、生无可恋、四季写真等
- 📷 **图片输入**：支持本地图片（自动 base64，绕过公网 URL 限制）
- ✨ **参考图美化**：可选图生图增强（提升角色一致性），可预览后重做或跳过
- ✏️ **文本输入**：部分模板需要文本（如绝地求生的"野兽种类"）
- ⏳ **进度展示**：实时轮询，显示已等待秒数
- 🎬 **视频预览**：生成完毕直接播放 + 下载
- 🔒 **安全**：API Key 仅在后端 `.env.local`，前端零接触

## 配置 API Key（⚠️ 必读）

**`.env.local` 文件**位于项目根目录（`minimax-video-studio/.env.local`），内容格式：

```
MINIMAX_API_KEY=sk-cp-xxxxxxxxxxxxxxxx
```

> 🔑 **API Key 获取**：登录 [MiniMax 开放平台](https://platform.minimaxi.com) → 账户管理 → 接口密钥。
>
> ⚠️ **不要将此文件提交到 git**（已在 `.gitignore` 中排除），否则 Key 会被公开。

## 技术栈

- Next.js 14（App Router）+ TypeScript
- Tailwind CSS（深色 UI）
- Next API Routes（代理 MiniMax API）
- 客户端轮询（无第三方状态管理）

## 快速开始

```bash
npm install

# 1. 编辑 .env.local，填入你的 MINIMAX_API_KEY
# 2. 启动
npm run dev
```

打开 [http://localhost:8006](http://localhost:8006)

## 项目结构

```
src/
├── app/
│   ├── api/
│   │   ├── enhance/route.ts   # POST 单独生成美化参考图
│   │   ├── generate/route.ts  # POST 提交视频模板任务
│   │   └── poll/route.ts      # GET 轮询任务状态
│   ├── layout.tsx
│   ├── page.tsx               # 主页面（两步交互）
│   └── globals.css
├── components/
│   ├── TemplateCard.tsx        # 模板宫格卡片（hover 预览视频）
│   ├── PhotoUpload.tsx         # 照片上传 + 预览
│   └── StatusPanel.tsx         # 生成进度展示
└── lib/
    ├── minimax.ts              # MiniMax API 客户端（图生图 + 视频模板）
    └── templates.ts            # 11 个模板元数据
```

## 使用流程

1. **选择模板** — 左侧宫格选择
2. **上传照片** — 右侧 ① 区
3. **美化参考图（可选）** — 右侧 ② 区，点击"美化"，预览结果，不满意可重做
4. **生成视频** — 右侧 ③ 区，点"确认生成视频"
5. **等待 + 下载** — 轮询进度，完成后播放 / 下载

## 关键发现（已踩过的坑）

1. **base64 data URI 直接可用**：`media_inputs[].value` 传 `data:image/jpeg;base64,...` 不需要上传到公网图床
2. **官方文件上传 API 不支持图片**：只接 4 种 purpose，都不收 jpg/png
3. **模板生成耗时 ~1-10 分钟**：异步任务，前端轮询 8s 一次，超时 6 分钟
4. **Success 时直接返回 video_url**：不用走 file_id → retrieve（与基础视频生成 API 不同）
5. **图生图美化提升一致性**：单张参考图 → subject_reference → 高质量肖像，面部更稳定

## 部署到 Vercel

```bash
# 1. 推代码到 GitHub
# 2. Vercel 导入项目
# 3. Project Settings → Environment Variables 设置：
#    MINIMAX_API_KEY=sk-cp-xxxxx
# 4. 部署
```

> 当前架构是客户端轮询 → 后端单次查询，不涉及长函数问题，可直接部署。

## API 文档参考

- [使用模板生成视频](https://platform.minimaxi.com/docs/guides/video-agent)
- [视频模板列表](https://platform.minimaxi.com/docs/faq/video-agent-templates)
- [图片生成（图生图）](https://platform.minimaxi.com/docs/guides/image-generation)