"use client";

import { useEffect, useRef, useState } from "react";
import { TEMPLATES, getTemplate } from "@/lib/templates";
import { TemplateCard } from "@/components/TemplateCard";
import { PhotoUpload } from "@/components/PhotoUpload";
import { StatusPanel } from "@/components/StatusPanel";

type Status = "idle" | "enhancing" | "polling" | "success" | "failed";

// 任务项（页面内 React state，不持久化）
type Task = {
  id: string;
  templateId: string;
  templateName: string;
  status: "polling" | "success" | "failed";
  externalTaskId: string | null;
  videoUrl: string | null;
  errorMsg: string | null;
  createdAt: number;
  finishedAt: number | null;
  usedSource: "original" | "enhanced";
};

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

const POLL_INTERVAL_MS = 8000;
const MAX_POLL_MS = 6 * 60 * 1000;

export default function HomePage() {
  const [selectedId, setSelectedId] = useState<string>(TEMPLATES[5].id);
  const selected = getTemplate(selectedId)!;

  // 原始上传图
  const [photo, setPhoto] = useState<File | null>(null);
  const [originalDataUri, setOriginalDataUri] = useState<string | null>(null);
  // 文本
  const [textValue, setTextValue] = useState("");
  // 美化
  const [enhanceEnabled, setEnhanceEnabled] = useState(true);
  const [enhancedDataUri, setEnhancedDataUri] = useState<string | null>(null);
  const [enhanceJobId, setEnhanceJobId] = useState<string | null>(null);
  // 视频生成
  const [status, setStatus] = useState<Status>("idle");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);

  // 任务历史
  const [tasks, setTasks] = useState<Task[]>([]);
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);

  const startedAtRef = useRef<number>(0);
  const stopPollingRef = useRef(false);

  // 切模板时清空下游
  useEffect(() => {
    setEnhancedDataUri(null);
    setEnhanceJobId(null);
    setStatus("idle");
    setTaskId(null);
    setVideoUrl(null);
    setErrorMsg(null);
    setElapsedSec(0);
  }, [selectedId]);

  // 上传图变化 → 读 data URI + 清空下游
  useEffect(() => {
    if (!photo) {
      setOriginalDataUri(null);
      setEnhancedDataUri(null);
      setEnhanceJobId(null);
      setStatus("idle");
      setTaskId(null);
      setVideoUrl(null);
      setErrorMsg(null);
      return;
    }
    fileToDataUri(photo).then(setOriginalDataUri);
    setEnhancedDataUri(null);
    setEnhanceJobId(null);
    setStatus("idle");
    setTaskId(null);
    setVideoUrl(null);
    setErrorMsg(null);
  }, [photo]);

  // 轮询
  useEffect(() => {
    if (status !== "polling" || !taskId) return;
    startedAtRef.current = Date.now();
    stopPollingRef.current = false;
    const timer = setInterval(async () => {
      if (stopPollingRef.current) return;
      const elapsed = Date.now() - startedAtRef.current;
      setElapsedSec(Math.floor(elapsed / 1000));
      if (elapsed > MAX_POLL_MS) {
        stopPollingRef.current = true;
        setStatus("failed");
        setErrorMsg("轮询超时（6 分钟）");
        // 也更新任务历史
        setTasks((prev) =>
          prev.map((t) =>
            t.externalTaskId === taskId
              ? { ...t, status: "failed", errorMsg: "轮询超时", finishedAt: Date.now() }
              : t,
          ),
        );
        return;
      }
      try {
        const r = await fetch(`/api/poll?taskId=${encodeURIComponent(taskId)}`);
        const data = await r.json();
        if (data.error) {
          stopPollingRef.current = true;
          setStatus("failed");
          setErrorMsg(data.error);
          setTasks((prev) =>
            prev.map((t) =>
              t.externalTaskId === taskId
                ? { ...t, status: "failed", errorMsg: data.error, finishedAt: Date.now() }
                : t,
            ),
          );
          return;
        }
        if (data.status === "Success") {
          stopPollingRef.current = true;
          setVideoUrl(data.videoUrl);
          setStatus("success");
          setTasks((prev) =>
            prev.map((t) =>
              t.externalTaskId === taskId
                ? { ...t, status: "success", videoUrl: data.videoUrl, finishedAt: Date.now() }
                : t,
            ),
          );
        } else if (data.status === "Fail") {
          stopPollingRef.current = true;
          setStatus("failed");
          setErrorMsg("任务失败，请重试");
          setTasks((prev) =>
            prev.map((t) =>
              t.externalTaskId === taskId
                ? { ...t, status: "failed", errorMsg: "任务失败", finishedAt: Date.now() }
                : t,
            ),
          );
        }
      } catch (e: any) {
        stopPollingRef.current = true;
        setStatus("failed");
        setErrorMsg(e?.message || "网络错误");
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [status, taskId]);

  // 步骤 1: 美化
  async function handleEnhance() {
    if (!photo) return;
    setStatus("enhancing");
    setErrorMsg(null);
    setEnhancedDataUri(null);
    setEnhanceJobId(null);

    const form = new FormData();
    form.append("photo", photo);

    try {
      const r = await fetch("/api/enhance", { method: "POST", body: form });
      const data = await r.json();
      if (data.error || !data.enhancedDataUri) {
        setStatus("failed");
        setErrorMsg(data.error || "美化失败");
        return;
      }
      setEnhancedDataUri(data.enhancedDataUri);
      setEnhanceJobId(data.jobId || null);
      setStatus("idle");
    } catch (e: any) {
      setStatus("failed");
      setErrorMsg(e?.message || "网络错误");
    }
  }

  // 步骤 2: 生成视频
  async function handleGenerateVideo(mediaDataUri: string) {
    setStatus("polling");
    setErrorMsg(null);
    setVideoUrl(null);
    setTaskId(null);

    const form = new FormData();
    form.append("templateId", selected.id);
    form.append("mediaDataUri", mediaDataUri);
    if (textValue.trim()) form.append("textValue", textValue.trim());

    try {
      const r = await fetch("/api/generate", { method: "POST", body: form });
      const data = await r.json();
      if (data.error || !data.taskId) {
        setStatus("failed");
        setErrorMsg(data.error || "提交失败");
        return;
      }
      setTaskId(data.taskId);
      // 推入任务历史
      const usedSource: Task["usedSource"] = mediaDataUri === enhancedDataUri ? "enhanced" : "original";
      const newTask: Task = {
        id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        templateId: selected.id,
        templateName: selected.name,
        status: "polling",
        externalTaskId: data.taskId,
        videoUrl: null,
        errorMsg: null,
        createdAt: Date.now(),
        finishedAt: null,
        usedSource,
      };
      setTasks((prev) => [newTask, ...prev]);
      setHighlightedTaskId(newTask.id);
    } catch (e: any) {
      setStatus("failed");
      setErrorMsg(e?.message || "网络错误");
    }
  }

  // 推导当前可用于视频生成的图
  function getVideoSource(): { dataUri: string | null; label: string } {
    if (enhanceEnabled) {
      if (enhancedDataUri) return { dataUri: enhancedDataUri, label: "美化图" };
      return { dataUri: null, label: "需先美化" };
    }
    if (originalDataUri) return { dataUri: originalDataUri, label: "原图" };
    return { dataUri: null, label: "需上传照片" };
  }

  // 删除任务
  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    // 如果删除的是当前展示的任务，重置右侧预览
    if (highlightedTaskId === id) {
      setHighlightedTaskId(null);
      setVideoUrl(null);
      setTaskId(null);
      setStatus("idle");
      setErrorMsg(null);
    }
  }

  // 点击历史任务，把视频加载到主预览区
  function selectTask(t: Task) {
    setHighlightedTaskId(t.id);
    setSelectedId(t.templateId);
    if (t.status === "success" && t.videoUrl) {
      setVideoUrl(t.videoUrl);
      setStatus("success");
      setTaskId(t.externalTaskId);
    } else if (t.status === "failed") {
      setStatus("failed");
      setErrorMsg(t.errorMsg || "任务失败");
      setTaskId(t.externalTaskId);
      setVideoUrl(null);
    } else if (t.status === "polling") {
      setStatus("polling");
      setTaskId(t.externalTaskId);
      setVideoUrl(null);
    }
  }

  const videoSource = getVideoSource();

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">🎬 MiniMax Video Studio</h1>
        <p className="mt-2 text-sm text-muted">
          基于 MiniMax Video Agent · 11 个官方模板 · 两步流程：上传 → 美化预览 → 生成视频
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px]">
        <section>
          <h2 className="mb-4 text-lg font-semibold">选择模板</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {TEMPLATES.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                selected={t.id === selectedId}
                onSelect={() => setSelectedId(t.id)}
              />
            ))}
          </div>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-1 text-xs uppercase tracking-wider text-muted">已选模板</div>
            <div className="text-lg font-semibold">{selected.name}</div>
            <p className="mt-2 text-sm text-muted">{selected.description}</p>
          </section>

          {/* ① 上传 */}
          <section>
            <div className="mb-2 flex items-center justify-between text-sm font-medium">
              <span>① 上传参考照片</span>
              {originalDataUri && <span className="text-xs text-green-400">已上传</span>}
            </div>
            <PhotoUpload onFile={setPhoto} />
          </section>

          {/* 文本 */}
          {selected.needsText && (
            <section>
              <div className="mb-2 text-sm font-medium">
                文本输入{selected.textLabel ? `（${selected.textLabel}）` : ""}
              </div>
              <input
                type="text"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                placeholder="请输入..."
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </section>
          )}

          {/* ② 美化 */}
          {selected.needsMedia && originalDataUri && (
            <section className="rounded-xl border border-border bg-surface p-4">
              <div className="mb-2 flex items-center justify-between text-sm font-medium">
                <span>② 美化参考图（可选）</span>
                {enhancedDataUri && <span className="text-xs text-green-400">已生成</span>}
              </div>
              <label className="mb-3 flex cursor-pointer items-start gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={enhanceEnabled}
                  onChange={(e) => {
                    setEnhanceEnabled(e.target.checked);
                    if (!e.target.checked) {
                      setEnhancedDataUri(null);
                      setEnhanceJobId(null);
                    }
                  }}
                  className="mt-0.5 accent-accent"
                />
                <span>启用图生图美化（~30s）。关闭则直接用原图传给视频模板。</span>
              </label>

              {enhanceEnabled && (
                <>
                  <div className="flex gap-2">
                    <button
                      onClick={handleEnhance}
                      disabled={status === "enhancing" || status === "polling"}
                      className="flex-1 rounded-lg border border-accent bg-accent/10 px-3 py-2 text-sm font-medium text-accent hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {status === "enhancing"
                        ? "美化中..."
                        : enhancedDataUri
                          ? "🔄 重新美化"
                          : "✨ 美化"}
                    </button>
                  </div>

                  {enhancedDataUri && (
                    <div className="mt-3">
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-muted">美化结果预览</span>
                        <span className="font-mono text-muted">
                          job: {enhanceJobId?.slice(0, 12)}...
                        </span>
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={enhancedDataUri}
                        alt="美化结果"
                        className="w-full rounded-lg border border-border object-cover"
                        style={{ maxHeight: "220px" }}
                      />
                      <p className="mt-1.5 text-[11px] text-muted">
                        不满意？点"重新美化"再试；或关闭上方开关直接用原图。
                      </p>
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {/* ③ 生成视频 */}
          <section className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-2 text-sm font-medium">③ 生成视频</div>

            {videoSource.dataUri && (
              <div className="mb-3 text-xs text-muted">
                当前使用：<span className="text-accent">{videoSource.label}</span>
              </div>
            )}

            <button
              onClick={() => videoSource.dataUri && handleGenerateVideo(videoSource.dataUri)}
              disabled={!videoSource.dataUri || status === "polling" || status === "enhancing"}
              className={[
                "w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors",
                videoSource.dataUri && status !== "polling" && status !== "enhancing"
                  ? "bg-accent text-white hover:bg-accentHover"
                  : "cursor-not-allowed bg-surface2 text-muted",
              ].join(" ")}
            >
              {status === "polling"
                ? "生成中..."
                : status === "enhancing"
                  ? "请先等待美化..."
                  : videoSource.dataUri
                    ? "🎬 确认生成视频"
                    : enhanceEnabled
                      ? "请先点击「美化」"
                      : "请先上传照片"}
            </button>
          </section>

          <StatusPanel status={status} elapsedSec={elapsedSec} errorMsg={errorMsg || undefined} />

          {videoUrl && (
            <section className="overflow-hidden rounded-xl border border-border bg-surface">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                src={videoUrl}
                controls
                autoPlay
                loop
                className="w-full"
                style={{ maxHeight: "60vh" }}
              />
              <div className="p-3">
                <a
                  href={videoUrl}
                  download={`minimax-${selected.name}-${Date.now()}.mp4`}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-lg bg-accent py-2 text-center text-sm font-medium text-white hover:bg-accentHover"
                >
                  ⬇️ 下载视频
                </a>
                <div className="mt-2 truncate text-xs text-muted">task_id: {taskId}</div>
              </div>
            </section>
          )}

          {/* 📋 任务历史 */}
          <TaskHistory
            tasks={tasks}
            selectedId={highlightedTaskId}
            onSelect={selectTask}
            onDelete={deleteTask}
          />
        </aside>
      </div>

      <footer className="mt-12 text-center text-xs text-muted">
        Powered by{" "}
        <a
          href="https://platform.minimaxi.com/docs/guides/video-agent"
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:underline"
        >
          MiniMax Video Agent
        </a>
      </footer>
    </main>
  );
}

// ============================================================================
// 任务历史（页面内嵌，不抽组件以减少文件数）
// ============================================================================

const STATUS_STYLE: Record<Task["status"], { text: string; cls: string }> = {
  polling: { text: "⏳ 处理中", cls: "text-yellow-400" },
  success: { text: "✅ 完成", cls: "text-green-400" },
  failed: { text: "❌ 失败", cls: "text-red-400" },
};

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "刚刚";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  return `${Math.floor(diff / 86_400_000)} 天前`;
}

type TaskHistoryProps = {
  tasks: Task[];
  selectedId: string | null;
  onSelect: (t: Task) => void;
  onDelete: (id: string) => void;
};

function TaskHistory({ tasks, selectedId, onSelect, onDelete }: TaskHistoryProps) {
  if (tasks.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="mb-1 text-sm font-medium">📋 本次会话任务</div>
        <p className="text-xs text-muted">还没有任务。生成第一个视频后会显示在这里。</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium">📋 本次会话任务</div>
        <span className="text-xs text-muted">{tasks.length} 个</span>
      </div>
      <ul className="space-y-2">
        {tasks.map((t) => {
          const st = STATUS_STYLE[t.status];
          const isSelected = t.id === selectedId;
          return (
            <li
              key={t.id}
              className={[
                "group flex items-center gap-2 rounded-lg border p-2 transition-colors",
                isSelected
                  ? "border-accent bg-accent/10"
                  : "border-border hover:border-muted",
              ].join(" ")}
            >
              <button
                onClick={() => onSelect(t)}
                className="flex flex-1 items-center gap-2 overflow-hidden text-left"
              >
                {t.videoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <video
                    src={t.videoUrl}
                    muted
                    playsInline
                    className="h-12 w-9 flex-none rounded object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-9 flex-none items-center justify-center rounded bg-surface2 text-base">
                    {t.status === "polling" ? "⏳" : t.status === "failed" ? "❌" : "🎬"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{t.templateName}</div>
                  <div className={["text-[11px]", st.cls].join(" ")}>
                    {st.text} · {formatRelative(t.createdAt)}
                  </div>
                </div>
              </button>
              <button
                onClick={() => {
                  if (confirm(`删除「${t.templateName}」这个任务？`)) onDelete(t.id);
                }}
                aria-label="删除任务"
                className="flex h-7 w-7 flex-none items-center justify-center rounded text-muted opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                title="删除"
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}