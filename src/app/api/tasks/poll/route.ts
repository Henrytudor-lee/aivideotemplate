import { NextRequest, NextResponse } from "next/server";
import { pollTemplateTask, pollBasicVideoTask, MiniMaxError } from "@/lib/minimax";
import { getCurrentUser, setSessionCookie } from "@/lib/session";
import { getTasksStatus, getTask, updateTask } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 30;

// GET /api/tasks/poll?ids=id1,id2,id3
// 批量轮询：把一组任务的最新状态拉回来；状态变化时回写 DB
// 一次性轮询 N 个 MiniMax 任务（10s 内是合理的）
//
// Hub 模板（template_id 以 "hub_" 开头）走基础视频 API + file_id → video_url
// 官方模板走 Video Agent API + 直接 video_url
export async function GET(req: NextRequest) {
  const { userId, token } = getCurrentUser();
  setSessionCookie(token);

  const idsParam = req.nextUrl.searchParams.get("ids") || "";
  const ids = idsParam.split(",").filter(Boolean).slice(0, 20);
  if (ids.length === 0) return NextResponse.json({ updates: [] });

  const dbStatuses = getTasksStatus(userId, ids);
  const updates: any[] = [];

  await Promise.all(
    dbStatuses.map(async (t) => {
      if (t.status === "processing" && t.external_task_id) {
        try {
          const isHub = t.template_id.startsWith("hub_");
          const r = isHub
            ? await pollBasicVideoTask(t.external_task_id)
            : await pollTemplateTask(t.external_task_id);

          if (r.status === "Success") {
            updateTask(t.id, { status: "success", video_url: r.videoUrl || null });
            updates.push({ id: t.id, status: "success", video_url: r.videoUrl });
          } else if (r.status === "Fail") {
            updateTask(t.id, { status: "failed", error_msg: "MiniMax 任务失败" });
            updates.push({ id: t.id, status: "failed", error_msg: "MiniMax 任务失败" });
          } else {
            updates.push({ id: t.id, status: "processing" });
          }
        } catch (e: any) {
          if (e instanceof MiniMaxError) {
            updateTask(t.id, { status: "failed", error_msg: e.message });
            updates.push({ id: t.id, status: "failed", error_msg: e.message });
          } else {
            updates.push({ id: t.id, status: "processing" });
          }
        }
      } else {
        updates.push({
          id: t.id,
          status: t.status,
          video_url: t.video_url,
          error_msg: t.error_msg,
        });
      }
    })
  );

  return NextResponse.json({ updates });
}