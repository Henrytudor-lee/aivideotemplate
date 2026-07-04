import { NextRequest, NextResponse } from "next/server";
import { pollTemplateTask, MiniMaxError } from "@/lib/minimax";
import { getCurrentUser, setSessionCookie } from "@/lib/session";
import { getTask, updateTask } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 30;

// GET /api/tasks/:id - 任务详情
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId, token } = getCurrentUser();
  setSessionCookie(token);
  const task = getTask(params.id);
  if (!task || task.user_id !== userId) {
    return NextResponse.json({ error: "任务不存在" }, { status: 404 });
  }
  return NextResponse.json({ task });
}

// DELETE /api/tasks/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { deleteTask } = await import("@/lib/db");
  const { userId, token } = getCurrentUser();
  setSessionCookie(token);
  const ok = deleteTask(params.id, userId);
  if (!ok) return NextResponse.json({ error: "任务不存在" }, { status: 404 });
  return NextResponse.json({ ok: true });
}