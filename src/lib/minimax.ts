// MiniMax 视频生成 API 客户端
// 文档：https://platform.minimaxi.com/docs/guides/video-agent

const BASE = process.env.MINIMAX_API_BASE || "https://api.minimaxi.com";
const API_KEY = process.env.MINIMAX_API_KEY || "";

export type CreateTaskInput = {
  templateId: string;
  // 图片转 base64 data URI（已验证可绕过公网 URL 限制）
  mediaDataUri?: string;
  // 文本输入（如野兽种类）
  textValue?: string;
};

export type CreateTaskResult = {
  taskId: string;
};

export type PollResult = {
  status: "Processing" | "Success" | "Fail" | string;
  videoUrl?: string;
  fileId?: string;
  errorMessage?: string;
  raw: unknown;
};

export class MiniMaxError extends Error {
  constructor(public statusCode: number, message: string, public raw?: unknown) {
    super(message);
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_KEY) {
    throw new MiniMaxError(401, "MINIMAX_API_KEY 未配置（.env.local）");
  }
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    // 避免 Next.js fetch 缓存
    cache: "no-store",
  });
  const text = await res.text();
  let body: any;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    throw new MiniMaxError(res.status, `MiniMax HTTP ${res.status}: ${text.slice(0, 300)}`, body);
  }
  // MiniMax 业务错误码：base_resp.status_code !== 0
  const sc = body?.base_resp?.status_code;
  if (typeof sc === "number" && sc !== 0) {
    throw new MiniMaxError(sc, body?.base_resp?.status_msg || "业务错误", body);
  }
  return body as T;
}

/**
 * 创建模板视频生成任务
 */
export async function createTemplateTask(input: CreateTaskInput): Promise<CreateTaskResult> {
  const payload: Record<string, unknown> = {
    template_id: input.templateId,
  };
  if (input.mediaDataUri) {
    payload.media_inputs = [{ value: input.mediaDataUri }];
  }
  if (input.textValue) {
    payload.text_inputs = [{ value: input.textValue }];
  }
  const resp = await call<{ task_id: string; base_resp: unknown }>(
    "/v1/video_template_generation",
    { method: "POST", body: JSON.stringify(payload) }
  );
  return { taskId: resp.task_id };
}

/**
 * 查询模板任务状态
 */
export async function pollTemplateTask(taskId: string): Promise<PollResult> {
  const resp = await call<{
    task_id: string;
    status: string;
    video_url?: string;
    file_id?: string;
    base_resp: { status_code: number; status_msg: string };
  }>(`/v1/query/video_template_generation?task_id=${encodeURIComponent(taskId)}`, {
    method: "GET",
  });
  return {
    status: resp.status,
    videoUrl: resp.video_url || undefined,
    fileId: resp.file_id || undefined,
    raw: resp,
  };
}

// ============================================================================
// 图生图 API（参考图美化）
// 文档：https://platform.minimaxi.com/docs/guides/image-generation
// ============================================================================

export type EnhanceReferenceInput = {
  /** base64 data URI */
  imageDataUri: string;
  /** 自定义 prompt（可选，不传则用默认"高质量肖像"prompt）*/
  prompt?: string;
  /** 横竖比，默认 1:1 */
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
  /** 生成几张候选图，默认 1；范围 1-6 */
  count?: number;
};

export type EnhanceReferenceResult = {
  /** 高质量参考图 data URI 列表（JPEG，按官方返回顺序） */
  enhancedDataUris: string[];
  /** 生成任务 id（用于日志） */
  jobId: string;
};

const DEFAULT_ENHANCE_PROMPT =
  "A high-quality close-up portrait photograph, sharp facial features, natural expression, professional photography lighting, shallow depth of field, magazine cover quality. Maintain the same facial identity, hairstyle, and overall character.";

export async function enhanceReferenceImage(
  input: EnhanceReferenceInput
): Promise<EnhanceReferenceResult> {
  const count = Math.max(1, Math.min(6, input.count ?? 1));
  const payload = {
    model: "image-01",
    prompt: input.prompt || DEFAULT_ENHANCE_PROMPT,
    aspect_ratio: input.aspectRatio || "1:1",
    n: count, // 一次生成 N 张候选图（官方参数）
    subject_reference: [
      {
        type: "character",
        image_file: input.imageDataUri,
      },
    ],
    response_format: "base64",
  };
  const resp = await call<{
    id: string;
    data: { image_base64: string[] };
    base_resp: unknown;
  }>("/v1/image_generation", { method: "POST", body: JSON.stringify(payload) });
  const list = resp.data?.image_base64 ?? [];
  if (list.length === 0) {
    throw new MiniMaxError(500, "图生图返回为空", resp);
  }
  // 后端返回 base64 字符串（无前缀），加 data URI 前缀
  const enhancedDataUris = list.map((b) => `data:image/jpeg;base64,${b}`);
  return { enhancedDataUris, jobId: resp.id };
}

// ============================================================================
// 基础视频生成 API（/v1/video_generation）
// 文档：https://platform.minimaxi.com/docs/guides/video-generation
// 用于 Hub 模板（带 prompt + 可选首帧图）
// ============================================================================

export type CreatePromptVideoInput = {
  /** 提示词 */
  prompt: string;
  /** 首帧图（base64 data URI，可选） */
  firstFrameDataUri?: string;
  /** 模型，默认 MiniMax-Hailuo-2.3 */
  model?: string;
  /** 时长（秒），默认 6 */
  duration?: number;
  /** 分辨率，默认 1080P */
  resolution?: "768P" | "1080P";
};

/**
 * 用 prompt + 可选首帧图创建视频生成任务
 */
export async function createPromptVideoTask(
  input: CreatePromptVideoInput
): Promise<CreateTaskResult> {
  const payload: Record<string, unknown> = {
    model: input.model || "MiniMax-Hailuo-2.3",
    prompt: input.prompt,
    duration: input.duration || 6,
    resolution: input.resolution || "1080P",
  };
  if (input.firstFrameDataUri) {
    payload.first_frame_image = input.firstFrameDataUri;
  }
  const resp = await call<{ task_id: string; base_resp: unknown }>(
    "/v1/video_generation",
    { method: "POST", body: JSON.stringify(payload) }
  );
  return { taskId: resp.task_id };
}

/**
 * 轮询基础视频任务状态
 * 基础 API 成功响应返回 file_id（不是直接 video_url），需调 /v1/files/retrieve
 */
export async function pollBasicVideoTask(taskId: string): Promise<PollResult> {
  const resp = await call<{
    task_id: string;
    status: string;
    file_id?: string;
    base_resp: { status_code: number; status_msg: string };
  }>(`/v1/query/video_generation?task_id=${encodeURIComponent(taskId)}`, {
    method: "GET",
  });
  let videoUrl: string | undefined;
  if (resp.status === "Success" && resp.file_id) {
    try {
      // 手动 fetch（call() 默认加 Content-Type: application/json，GET 不需要）
      const fileRes = await fetch(
        `${BASE}/v1/files/retrieve?file_id=${encodeURIComponent(resp.file_id)}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${API_KEY}` },
          cache: "no-store",
        }
      );
      const fileText = await fileRes.text();
      const fileBody = JSON.parse(fileText);
      videoUrl = fileBody?.file?.download_url;
    } catch {
      // 取不到 URL 也不阻断
    }
  }
  return {
    status: resp.status,
    videoUrl,
    fileId: resp.file_id || undefined,
    raw: resp,
  };
}