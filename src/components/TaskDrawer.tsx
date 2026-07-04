"use client";

import { AnimatePresence, motion } from "motion/react";
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

  // 删除任务
  async function handleDelete(id: string) {
    if (!confirm("确认删除这个任务？")) return;
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setFullTask(null);
    }
  }

  // 打开时启动轮询
  useEffect(() => {
    if (open) {
      loadList();
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(pollProcessing, POLL_INTERVAL_MS);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      setSelectedId(null);
      setFullTask(null);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // 外部触发刷新
  useEffect(() => {
    if (open && refreshTrigger > 0) {
      loadList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  const stats = {
    processing: tasks.filter((t) => t.status === "processing" || t.status === "pending").length,
    success: tasks.filter((t) => t.status === "success").length,
    failed: tasks.filter((t) => t.status === "failed").length,
  };

  return (
    <>
      {/* 背景遮罩 */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-30 bg-black/30"
          />
        )}
      </AnimatePresence>

      {/* 抽屉主体 */}
      <AnimatePresence>
        {open && (
          <motion.aside
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 z-40 h-full w-full max-w-md border-l border-border bg-bg shadow-2xl"
          >
            <div className="flex h-full flex-col">
              {/* 头部 */}
              <div className="flex items-center justify-between border-b border-border p-4">
                <div>
                  <h2 className="text-lg font-semibold">任务面板</h2>
                  <motion.div
                    key={`${stats.processing}-${stats.success}-${stats.failed}`}
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="mt-1 text-xs text-muted"
                  >
                    ⏳ {stats.processing} 处理中 · ✅ {stats.success} 成功 · ❌ {stats.failed} 失败
                  </motion.div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="rounded-lg p-2 hover:bg-surface"
                >
                  ✕
                </motion.button>
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
                  <AnimatePresence initial={false}>
                    {tasks.map((t) => (
                      <motion.div
                        key={t.id}
                        layout
                        initial={{ opacity: 0, x: 30, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 30, scale: 0.95, transition: { duration: 0.2 } }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        className="group relative"
                      >
                        <button
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
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(t.id);
                          }}
                          className="absolute right-2 top-2 rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-400 opacity-0 transition-opacity group-hover:opacity-100"
                          title="删除"
                        >
                          ✕
                        </motion.button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* 详情浮层 */}
      <AnimatePresence>
        {selectedId && fullTask && (
          <TaskDetailModal
            key="detail"
            task={fullTask}
            onClose={() => {
              setSelectedId(null);
              setFullTask(null);
            }}
            onDelete={() => handleDelete(fullTask.id)}
          />
        )}
      </AnimatePresence>
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-bg shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="text-lg font-semibold">任务详情</h3>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-surface"
          >
            ✕
          </motion.button>
        </div>

        <div className="space-y-4 p-4">
          {/* 状态条 */}
          <div className="flex items-center gap-2">
            <StatusDot status={task.status} />
            <span className="text-sm">{task.status}</span>
          </div>

          {/* 视频 */}
          {task.video_url && (
            <div>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                src={task.video_url}
                controls
                className="w-full rounded-lg border border-border"
              />
              <a
                href={task.video_url}
                download={`minimax-${task.template_name}-${task.id}.mp4`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block rounded-lg bg-accent py-2 text-center text-sm font-medium text-white hover:bg-accentHover"
              >
                ⬇️ 下载视频
              </a>
            </div>
          )}

          {/* 参考图 */}
          {task.photo_data_uri && (
            <div>
              <div className="mb-1 text-xs text-muted">参考图</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={task.photo_data_uri}
                alt="参考"
                className="max-h-48 w-full rounded-lg border border-border object-contain"
              />
            </div>
          )}

          {/* 增强图 */}
          {task.enhanced_data_uri && (
            <div>
              <div className="mb-1 text-xs text-muted">美化图</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={task.enhanced_data_uri}
                alt="美化"
                className="max-h-48 w-full rounded-lg border border-border object-contain"
              />
            </div>
          )}

          {/* 元数据 */}
          <div className="space-y-1 rounded-lg border border-border bg-surface p-3 text-xs text-muted">
            <div>模板：{task.template_name}</div>
            <div>任务 ID：<span className="font-mono">{task.id}</span></div>
            {task.external_task_id && (
              <div>外部任务：<span className="font-mono">{task.external_task_id}</span></div>
            )}
            {task.text_value && <div>文本：{task.text_value}</div>}
            <div>创建：{new Date(task.created_at).toLocaleString("zh-CN")}</div>
            <div>更新：{new Date(task.updated_at).toLocaleString("zh-CN")}</div>
          </div>

          {task.error_msg && (
            <div className="rounded-lg border border-red-700 bg-red-900/20 p-3 text-xs text-red-400">
              ❌ {task.error_msg}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border p-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onDelete}
            className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20"
          >
            删除任务
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className="rounded-lg bg-surface px-4 py-2 text-sm hover:bg-surface2"
          >
            关闭
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}