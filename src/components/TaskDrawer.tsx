"use client";

import { useEffect, useRef, useState } from "react";

type TaskItem = {
  id: string;
  template_id: string;
  template_name: string;
  status: "pending" | "submitted" | "processing" | "success" | "failed";
  video_url: string | null;
  error_msg: string | null;
  created_at: number;
  updated_at: number;
};

type FullTask = TaskItem & {
  photo_data_uri: string;
  enhanced_data_uri: string | null;
  text_value: string | null;
  external_task_id: string | null;
  used_collage: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  refreshTrigger: number; // 主页提交新任务时 +1
};

const POLL_INTERVAL_MS = 5000;

export function TaskDrawer({ open, onClose, refreshTrigger }: Props) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fullTask, setFullTask] = useState<FullTask | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 加载列表
  async function loadList() {
    setLoading(true);
    try {
      const r = await fetch("/api/tasks");
      const d = await r.json();
      setTasks(d.tasks || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // 轮询一组 processing 任务
  async function pollProcessing() {
    const processing = tasks.filter((t) => t.status === "processing" || t.status === "pending");
    if (processing.length === 0) return;
    const ids = processing.map((t) => t.id).join(",");
    try {
      const r = await fetch(`/api/tasks/poll?ids=${encodeURIComponent(ids)}`);
      const d = await r.json();
      if (d.updates?.length) {
        setTasks((prev) =>
          prev.map((t) => {
            const u = d.updates.find((x: any) => x.id === t.id);
            return u
              ? { ...t, status: u.status, video_url: u.video_url ?? t.video_url, error_msg: u.error_msg ?? t.error_msg }
              : t;
          })
        );
      }
    } catch (e) {
      console.error(e);
    }
  }

  // 加载详情
  async function loadDetail(id: string) {
    setSelectedId(id);
    try {
      const r = await fetch(`/api/tasks/${id}`);
      const d = await r.json();
      setFullTask(d.task);
    } catch (e) {
      console.error(e);
    }
  }

  // 启动轮询（只要有 processing 中的就持续轮询）
  useEffect(() => {
    if (!open) return;
    loadList();
    pollRef.current = setInterval(pollProcessing, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [open, refreshTrigger]);

  // 详情变化时刷新详情
  useEffect(() => {
    if (selectedId) {
      const t = tasks.find((x) => x.id === selectedId);
      if (t && (!fullTask || fullTask.id !== selectedId || fullTask.status !== t.status)) {
        loadDetail(selectedId);
      }
    }
  }, [tasks, selectedId]);

  async function handleDelete(id: string) {
    if (!confirm("确认删除这个任务？")) return;
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setFullTask(null);
    }
  }

  // 统计
  const stats = {
    processing: tasks.filter((t) => t.status === "processing" || t.status === "pending").length,
    success: tasks.filter((t) => t.status === "success").length,
    failed: tasks.filter((t) => t.status === "failed").length,
  };

  return (
    <>
      {/* 抽屉 */}
      <div
        className={[
          "fixed right-0 top-0 z-40 h-full w-full max-w-md transform border-l border-border bg-bg shadow-2xl transition-transform",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-full flex-col">
          {/* 头部 */}
          <div className="flex items-center justify-between border-b border-border p-4">
            <div>
              <h2 className="text-lg font-semibold">任务面板</h2>
              <div className="mt-1 text-xs text-muted">
                ⏳ {stats.processing} 处理中 · ✅ {stats.success} 成功 · ❌ {stats.failed} 失败
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 hover:bg-surface">
              ✕
            </button>
          </div>

          {/* 任务列表 */}
          <div className="flex-1 overflow-y-auto p-3">
            {loading && tasks.length === 0 && (
              <div className="py-8 text-center text-sm text-muted">加载中...</div>
            )}
            {!loading && tasks.length === 0 && (
              <div className="py-8 text-center text-sm text-muted">
                还没有任务 · 在左边选模板上传照片提交
              </div>
            )}
            <div className="space-y-2">
              {tasks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => loadDetail(t.id)}
                  className={[
                    "w-full rounded-lg border bg-surface p-3 text-left transition-colors",
                    selectedId === t.id
                      ? "border-accent"
                      : "border-border hover:border-muted",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <StatusDot status={t.status} />
                      {t.template_name}
                    </div>
                    <span className="text-[10px] text-muted">
                      {new Date(t.created_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="mt-1 truncate text-[10px] font-mono text-muted">
                    {t.id}
                  </div>
                  {t.error_msg && (
                    <div className="mt-1 truncate text-xs text-red-400">{t.error_msg}</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 详情浮层 */}
      {selectedId && fullTask && (
        <TaskDetailModal
          task={fullTask}
          onClose={() => {
            setSelectedId(null);
            setFullTask(null);
          }}
          onDelete={() => handleDelete(fullTask.id)}
        />
      )}

      {/* 背景遮罩（点击关闭） */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/30"
        />
      )}
    </>
  );
}

function StatusDot({ status }: { status: TaskItem["status"] }) {
  const color =
    status === "success"
      ? "bg-green-500"
      : status === "failed"
        ? "bg-red-500"
        : "bg-yellow-500 animate-pulse";
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />;
}

function TaskDetailModal({
  task,
  onClose,
  onDelete,
}: {
  task: FullTask;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-bg shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="text-lg font-semibold">任务详情</h3>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-surface">
            ✕
          </button>
        </div>

        <div className="space-y-4 p-4">
          {/* 状态条 */}
          <div className="rounded-lg border border-border bg-surface p-3">
            <div className="flex items-center gap-2 text-sm">
              <StatusDot status={task.status} />
              <span className="font-medium">{labelOf(task.status)}</span>
              <span className="ml-auto text-xs text-muted">
                {new Date(task.created_at).toLocaleString("zh-CN")}
              </span>
            </div>
            <div className="mt-1 text-[10px] font-mono text-muted">
              task_id: {task.id} · ext: {task.external_task_id || "-"}
            </div>
            {task.text_value && (
              <div className="mt-2 text-xs text-muted">
                文本: <span className="text-text">{task.text_value}</span>
              </div>
            )}
            {task.error_msg && (
              <div className="mt-2 text-xs text-red-400">{task.error_msg}</div>
            )}
          </div>

          {/* 视频 */}
          {task.video_url && (
            <div className="overflow-hidden rounded-lg border border-border bg-surface">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video src={task.video_url} controls autoPlay loop className="w-full" />
              <div className="p-3">
                <a
                  href={task.video_url}
                  download={`minimax-${task.template_name}-${task.id}.mp4`}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-lg bg-accent py-2 text-center text-sm font-medium text-white hover:bg-accentHover"
                >
                  ⬇️ 下载视频
                </a>
              </div>
            </div>
          )}

          {/* 使用的图 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 text-xs text-muted">原图</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={task.photo_data_uri}
                alt="原图"
                className="w-full rounded-lg border border-border object-cover"
                style={{ maxHeight: "200px" }}
              />
            </div>
            {task.enhanced_data_uri && (
              <div>
                <div className="mb-1 text-xs text-muted">美化图</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={task.enhanced_data_uri}
                  alt="美化图"
                  className="w-full rounded-lg border border-accent object-cover"
                  style={{ maxHeight: "200px" }}
                />
              </div>
            )}
          </div>

          {/* 操作 */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onDelete}
              className="rounded-lg border border-border px-3 py-2 text-sm text-red-400 hover:bg-surface"
            >
              删除任务
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accentHover"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function labelOf(status: string) {
  return status === "success"
    ? "已完成"
    : status === "failed"
      ? "失败"
      : status === "processing"
        ? "生成中"
        : "排队中";
}