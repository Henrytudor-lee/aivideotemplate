import { NextRequest, NextResponse } from "next/server";
import { pollTemplateTask, MiniMaxError } from "@/lib/minimax";

export const runtime = "nodejs";
export const maxDuration = 30; // 单次轮询不会太久

export async function GET(req: NextRequest) {
  const taskId = req.nextUrl.searchParams.get("taskId");
  if (!taskId) {
    return NextResponse.json({ error: "缺少 taskId" }, { status: 400 });
  }
  try {
    const result = await pollTemplateTask(taskId);
    return NextResponse.json(result);
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