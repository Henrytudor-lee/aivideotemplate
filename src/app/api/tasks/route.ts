import { NextRequest, NextResponse } from "next/server";
import {
  createTemplateTask,
  createPromptVideoTask,
  enhanceReferenceImage,
  MiniMaxError,
} from "@/lib/minimax";
import { getCurrentUser, setSessionCookie } from "@/lib/session";
import { createTask, getTask, listTasks } from "@/lib/db";
import type { Template } from "@/lib/templates";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const photos = form.getAll("photos").filter((v): v is File => v instanceof File);
    const templateId = String(form.get("templateId") || "");
    const textValue = form.get("textValue") ? String(form.get("textValue")) : undefined;

    if (!templateId) return NextResponse.json({ error: "缺少 templateId" }, { status: 400 });

    // 用户
    const { userId, token } = getCurrentUser();
    setSessionCookie(token);

    // 模板校验
    const { getTemplate } = await import("@/lib/templates");
    const tpl = getTemplate(templateId);
    if (!tpl) return NextResponse.json({ error: "模板不存在" }, { status: 400 });

    if (tpl.needsText && !textValue?.trim()) {
      return NextResponse.json(
        { error: `模板「${tpl.name}」需要文本输入（${tpl.textLabel || "请填文本"}）` },
        { status: 400 }
      );
    }
    if (!tpl.needsMedia && photos.length > 0) {
      return NextResponse.json(
        { error: `模板「${tpl.name}」是纯文本模板，不要传图片` },
        { status: 400 }
      );
    }
    if (tpl.needsMedia && photos.length === 0) {
      return NextResponse.json({ error: "该模板需要上传照片" }, { status: 400 });
    }
    if (tpl.needsMedia && photos.length > 9) {
      return NextResponse.json({ error: "最多 9 张照片" }, { status: 400 });
    }

    // 纯文本模板：无照片，直接创建任务
    if (!tpl.needsMedia) {
      const task = createTask({
        user_id: userId,
        template_id: templateId,
        template_name: tpl.name,
        photo_data_uri: "",
        used_collage: 0,
        text_value: textValue ?? null,
      });
      submitToMiniMaxAsync(task.id, "", tpl, textValue, userId);
      return NextResponse.json({ tasks: [task] });
    }

    // 有照片的模板：每张照片一个任务
    const created: any[] = [];
    for (const photo of photos) {
      const buf = Buffer.from(await photo.arrayBuffer());
      const mime = photo.type || "image/jpeg";
      const photoDataUri = `data:${mime};base64,${buf.toString("base64")}`;

      const task = createTask({
        user_id: userId,
        template_id: templateId,
        template_name: tpl.name,
        photo_data_uri: photoDataUri,
        used_collage: 0,
        text_value: textValue ?? null,
      });
      created.push(task);
      submitToMiniMaxAsync(task.id, photoDataUri, tpl, textValue, userId);
    }

    return NextResponse.json({ tasks: created });
  } catch (err: any) {
    if (err instanceof MiniMaxError) {
      return NextResponse.json(
        { error: err.message, statusCode: err.statusCode, detail: err.raw },
        { status: 502 }
      );
    }
    return NextResponse.json({ error: err?.message || "未知错误" }, { status: 500 });
  }
}

async function submitToMiniMaxAsync(
  taskId: string,
  mediaDataUri: string,
  template: Template,
  textValue: string | undefined,
  _userId: string
) {
  const { updateTask } = await import("@/lib/db");
  try {
    if (template.mode === "official") {
      // 官方 Video Agent 模板
      const { taskId: externalTaskId } = await createTemplateTask({
        templateId: template.templateId,
        mediaDataUri: mediaDataUri || undefined,
        textValue,
      });
      updateTask(taskId, { external_task_id: externalTaskId, status: "processing" });
    } else {
      // Hub 模板（基础视频 API）
      // 替换 prompt 中的 [用户输入] 占位
      const finalPrompt = (template.prompt || "").replace(
        /\[用户输入\]/g,
        textValue || "natural"
      );
      const { taskId: externalTaskId } = await createPromptVideoTask({
        prompt: finalPrompt,
        firstFrameDataUri: mediaDataUri || undefined,
      });
      updateTask(taskId, { external_task_id: externalTaskId, status: "processing" });
    }
  } catch (e: any) {
    updateTask(taskId, { status: "failed", error_msg: e?.message || "提交失败" });
  }
}

export async function GET(req: NextRequest) {
  const { userId, token } = getCurrentUser();
  setSessionCookie(token);
  const tasks = listTasks(userId, 50);
  return NextResponse.json({
    tasks: tasks.map((t) => ({
      ...t,
      photo_data_uri: t.photo_data_uri || undefined,
      enhanced_data_uri: t.enhanced_data_uri || undefined,
    })),
  });
}