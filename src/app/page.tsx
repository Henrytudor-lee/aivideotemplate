"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { TEMPLATES, getTemplate } from "@/lib/templates";
import { TemplateCard } from "@/components/TemplateCard";
import { PhotoUpload } from "@/components/PhotoUpload";
import { TaskDrawer } from "@/components/TaskDrawer";

const CANDIDATE_COUNT = 4;

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function HomePage() {
  const [selectedId, setSelectedId] = useState<string>(TEMPLATES[5].id);
  const selected = getTemplate(selectedId)!;

  // 多张照片
  const [photos, setPhotos] = useState<File[]>([]);
  const [originalDataUri, setOriginalDataUri] = useState<string | null>(null);
  const [textValue, setTextValue] = useState("");
  const [enhanceEnabled, setEnhanceEnabled] = useState(true);

  // 候选区
  const [candidates, setCandidates] = useState<string[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [enhanceJobId, setEnhanceJobId] = useState<string | null>(null);
  const [usedCollage, setUsedCollage] = useState(false);

  // 提交状态
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedCount, setSubmittedCount] = useState(0);

  // 抽屉
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerRefreshTrigger, setDrawerRefreshTrigger] = useState(0);

  // 切模板时清空
  function resetAll() {
    setCandidates([]);
    setSelectedIdx(null);
    setEnhanceJobId(null);
    setUsedCollage(false);
    setSubmitError(null);
  }

  async function handlePhotosChange(newPhotos: File[]) {
    setPhotos(newPhotos);
    if (newPhotos.length === 0) {
      setOriginalDataUri(null);
      resetAll();
      return;
    }
    fileToDataUri(newPhotos[0]).then(setOriginalDataUri);
    resetAll();
  }

  // 美化：直接走 /api/enhance（拿到 4 张候选）
  async function handleEnhance() {
    if (photos.length === 0) return;
    setSubmitting(true);
    setSubmitError(null);
    setCandidates([]);
    setSelectedIdx(null);
    setEnhanceJobId(null);
    setUsedCollage(false);

    const form = new FormData();
    photos.forEach((p) => form.append("photos", p));
    form.append("count", String(CANDIDATE_COUNT));

    try {
      const r = await fetch("/api/enhance", { method: "POST", body: form });
      const data = await r.json();
      if (data.error || !data.enhancedDataUris?.length) {
        setSubmitError(data.error || "美化失败");
        return;
      }
      setCandidates(data.enhancedDataUris);
      setEnhanceJobId(data.jobId || null);
      setUsedCollage(!!data.usedCollage);
      setSelectedIdx(null);
    } catch (e: any) {
      setSubmitError(e?.message || "网络错误");
    } finally {
      setSubmitting(false);
    }
  }

  // 提交任务到 /api/tasks
  async function handleSubmitTasks() {
    if (photos.length === 0) return;
    setSubmitting(true);
    setSubmitError(null);

    const form = new FormData();
    form.append("templateId", selected.id);
    if (textValue.trim()) form.append("textValue", textValue.trim());

    if (enhanceEnabled) {
      // 多图美化：每张单独生成候选。但当前 UI 只对 photos[0] 走了 4 张候选
      // 设计决策：当前 UI 是"1 张主图 + 4 候选"，所以提交时也只用 1 个任务（用选中候选）
      if (selectedIdx === null) {
        setSubmitError("请先选中一张候选图");
        setSubmitting(false);
        return;
      }
      // 走单图 path：只传选中的候选图作为"美化后图"
      const selectedUri = candidates[selectedIdx];
      form.append("photos", dataUriToFile(selectedUri, "candidate.jpg"));
      form.append("enhance", "false"); // 已经是美化图了
    } else {
      // 不美化：原图
      photos.forEach((p) => form.append("photos", p));
      form.append("enhance", "false");
    }

    try {
      const r = await fetch("/api/tasks", { method: "POST", body: form });
      const data = await r.json();
      if (data.error) {
        setSubmitError(data.error);
        return;
      }
      setSubmittedCount(data.tasks?.length || 0);
      setDrawerOpen(true);
      setDrawerRefreshTrigger((n) => n + 1);
      // 重置
      setPhotos([]);
      setCandidates([]);
      setSelectedIdx(null);
      setEnhanceJobId(null);
      setOriginalDataUri(null);
    } catch (e: any) {
      setSubmitError(e?.message || "网络错误");
    } finally {
      setSubmitting(false);
    }
  }

  // 推断主按钮文案
  function getSubmitButtonText(): string {
    if (submitting) return "提交中...";
    if (enhanceEnabled) {
      if (candidates.length === 0) return `① 先生成 ${CANDIDATE_COUNT} 张候选`;
      if (selectedIdx === null) return "② 选中一张候选";
      return `③ 提交 ${photos.length} 个任务`;
    }
    return `③ 提交 ${photos.length} 个任务`;
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <motion.header
        className="mb-8 flex items-start justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div>
          <h1 className="text-3xl font-bold">🎬 MiniMax Video Studio</h1>
          <p className="mt-2 text-sm text-muted">
            基于 MiniMax Video Agent · 11 个官方模板 · 多任务并线 · 侧边栏面板
          </p>
        </div>
        <motion.button
          onClick={() => {
            setDrawerOpen(true);
            setDrawerRefreshTrigger((n) => n + 1);
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:border-accent"
        >
          📋 任务面板
        </motion.button>
      </motion.header>

      <motion.div
        className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_440px]"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
      >
        <section>
          <h2 className="mb-4 text-lg font-semibold">选择模板</h2>
          <motion.div
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.04 } },
            }}
          >
            {TEMPLATES.map((t) => (
              <motion.div
                key={t.id}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 30 } },
                }}
              >
                <TemplateCard
                  template={t}
                  selected={t.id === selectedId}
                  onSelect={() => {
                    setSelectedId(t.id);
                    resetAll();
                    // 切到纯文本模板时清掉照片
                    if (!t.needsMedia) {
                      handlePhotosChange([]);
                    }
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-1 text-xs uppercase tracking-wider text-muted">已选模板</div>
            <div className="text-lg font-semibold">{selected.name}</div>
            <p className="mt-2 text-sm text-muted">{selected.description}</p>
          </section>

          {/* 步骤 1: 上传照片（仅需要图片的模板） */}
          {selected.needsMedia && (
            <section>
              <div className="mb-2 flex items-center justify-between text-sm font-medium">
                <span>① 上传参考照片</span>
                <span className="text-xs text-muted">
                  {photos.length > 0
                    ? `已选 ${photos.length} 张`
                    : enhanceEnabled
                      ? "支持 1-9 张"
                      : "单张"}
                </span>
              </div>
              <PhotoUpload
                photos={photos}
                onPhotosChange={handlePhotosChange}
                allowMultiple={enhanceEnabled}
              />
            </section>
          )}

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

          {/* 步骤 2: 美化 */}
          {selected.needsMedia && photos.length > 0 && (
            <section className="rounded-xl border border-border bg-surface p-4">
              <div className="mb-2 flex items-center justify-between text-sm font-medium">
                <span>② 美化参考图（{CANDIDATE_COUNT} 张候选）</span>
                {candidates.length > 0 && (
                  <span className="text-xs text-green-400">
                    {selectedIdx !== null ? `已选 #${selectedIdx + 1}` : "请选择"}
                  </span>
                )}
              </div>
              <label className="mb-3 flex cursor-pointer items-start gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={enhanceEnabled}
                  onChange={(e) => {
                    setEnhanceEnabled(e.target.checked);
                    if (!e.target.checked && photos.length > 1) {
                      handlePhotosChange(photos.slice(0, 1));
                    } else {
                      resetAll();
                    }
                  }}
                  className="mt-0.5 accent-accent"
                />
                <span>
                  启用图生图美化。
                  {enhanceEnabled
                    ? photos.length > 1
                      ? "多张会自动拼成 1 张。"
                      : "可传 1-9 张参考图。"
                    : "关闭则只用 1 张原图。"}
                </span>
              </label>

              {enhanceEnabled && (
                <>
                  <button
                    onClick={handleEnhance}
                    disabled={submitting}
                    className="w-full rounded-lg border border-accent bg-accent/10 px-3 py-2 text-sm font-medium text-accent hover:bg-accent/20 disabled:opacity-50"
                  >
                    {submitting
                      ? "生成中..."
                      : candidates.length > 0
                        ? `🔄 重新生成 ${CANDIDATE_COUNT} 张`
                        : `✨ 生成 ${CANDIDATE_COUNT} 张候选`}
                  </button>

                  {candidates.length > 0 && (
                    <div className="mt-3">
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-muted">点击选择一张</span>
                        <span className="font-mono text-muted">
                          {usedCollage ? "📎 拼接" : "🖼️ 单图"} · {enhanceJobId?.slice(0, 8)}...
                        </span>
                      </div>
                      <motion.div
                        className="grid grid-cols-2 gap-2"
                        initial="hidden"
                        animate="show"
                        variants={{
                          hidden: {},
                          show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
                        }}
                      >
                        {candidates.map((uri, i) => (
                          <motion.button
                            key={i}
                            variants={{
                              hidden: { opacity: 0, scale: 0.7, y: 10 },
                              show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 380, damping: 26 } },
                            }}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedIdx(i)}
                            className={[
                              "relative overflow-hidden rounded-lg border-2 transition-colors",
                              selectedIdx === i
                                ? "border-accent ring-2 ring-accent/50"
                                : "border-border hover:border-muted",
                            ].join(" ")}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={uri}
                              alt={`候选 ${i + 1}`}
                              className="aspect-square w-full object-cover"
                            />
                            <div
                              className={[
                                "absolute left-1 top-1 rounded px-1.5 py-0.5 text-[10px] font-medium",
                                selectedIdx === i
                                  ? "bg-accent text-white"
                                  : "bg-black/60 text-white",
                              ].join(" ")}
                            >
                              #{i + 1}
                            </div>
                            {selectedIdx === i && (
                              <motion.div
                                initial={{ scale: 0, rotate: -90 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 20 }}
                                className="absolute right-1 top-1 rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-white"
                              >
                                ✓
                              </motion.div>
                            )}
                          </motion.button>
                        ))}
                      </motion.div>
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {/* 步骤 3: 提交任务 */}
          <section className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-2 text-sm font-medium">③ 提交任务</div>

            {submittedCount > 0 && (
              <div className="mb-3 rounded-lg border border-green-700 bg-green-900/20 p-2 text-xs text-green-400">
                ✅ 已提交 {submittedCount} 个任务，查看抽屉面板
              </div>
            )}

            {submitError && (
              <div className="mb-3 rounded-lg border border-red-700 bg-red-900/20 p-2 text-xs text-red-400">
                ❌ {submitError}
              </div>
            )}

            <motion.button
              onClick={handleSubmitTasks}
              disabled={
                submitting ||
                (selected.needsMedia && photos.length === 0) ||
                (selected.needsText && !textValue.trim()) ||
                (enhanceEnabled && selected.needsMedia && selectedIdx === null && candidates.length > 0)
              }
              whileHover={!submitting ? { scale: 1.01 } : {}}
              whileTap={!submitting ? { scale: 0.98 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className={[
                "w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors",
                !submitting &&
                  (selected.needsMedia ? photos.length > 0 : true) &&
                  (selected.needsText ? textValue.trim().length > 0 : true) &&
                  (enhanceEnabled && selected.needsMedia && candidates.length > 0 ? selectedIdx !== null : true)
                  ? "bg-accent text-white hover:bg-accentHover"
                  : "cursor-not-allowed bg-surface2 text-muted",
              ].join(" ")}
            >
              {getSubmitButtonText()}
            </motion.button>
          </section>
        </aside>
      </motion.div>

      <TaskDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        refreshTrigger={drawerRefreshTrigger}
      />

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

// data URI 转 File
function dataUriToFile(dataUri: string, filename: string): File {
  const [meta, b64] = dataUri.split(",");
  const mime = meta.match(/data:([^;]+)/)?.[1] || "image/jpeg";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new File([arr], filename, { type: mime });
}