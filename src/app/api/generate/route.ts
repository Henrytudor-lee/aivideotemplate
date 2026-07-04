import { NextRequest, NextResponse } from "next/server";
import { createTemplateTask, MiniMaxError } from "@/lib/minimax";

// POST /api/generate
// 接收 multipart/form-data:
//   templateId          - 模板 ID（必填）
//   textValue           - 文本输入（可选）
//   mediaDataUri        - 最终参考图的 data URI（必填）
//                        可由前端从 /api/enhance 返回的 enhancedDataUri 取，
//                        或用户选择"跳过美化"时传原图 data URI。
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const templateId = String(form.get("templateId") || "");
    const textValue = form.get("textValue") ? String(form.get("textValue")) : undefined;
    const mediaDataUri = form.get("mediaDataUri") ? String(form.get("mediaDataUri")) : "";

    if (!templateId) {
      return NextResponse.json({ error: "缺少 templateId" }, { status: 400 });
    }
    if (!mediaDataUri.startsWith("data:image/")) {
      return NextResponse.json({ error: "缺少或非法的 mediaDataUri" }, { status: 400 });
    }

    const { taskId } = await createTemplateTask({
      templateId,
      mediaDataUri,
      textValue,
    });
    return NextResponse.json({ taskId });
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