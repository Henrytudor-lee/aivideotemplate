"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

type Props = {
  photos: File[];
  onPhotosChange: (photos: File[]) => void;
  /** 是否允许多张上传（默认 true）。关闭时 input multiple 移除，添加按钮也隐藏 */
  allowMultiple?: boolean;
};

export function PhotoUpload({ photos, onPhotosChange, allowMultiple = true }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  // 同步生成缩略图
  useEffect(() => {
    if (photos.length === 0) {
      setPreviews([]);
      return;
    }
    const next: string[] = [];
    let cancelled = false;
    Promise.all(
      photos.map(
        (f) =>
          new Promise<string>((resolve) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result as string);
            r.readAsDataURL(f);
          })
      )
    ).then((arr) => {
      if (!cancelled) setPreviews(arr);
    });
    return () => {
      cancelled = true;
    };
  }, [photos]);

  function handleAdd(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files);
    // 不允许多张时：只取第一张
    const accepted = allowMultiple ? arr : arr.slice(0, 1);
    const next = allowMultiple
      ? [...photos, ...accepted].slice(0, 9)
      : accepted; // 替换式：单图模式直接覆盖
    onPhotosChange(next);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleRemove(i: number) {
    onPhotosChange(photos.filter((_, idx) => idx !== i));
  }

  function handleClear() {
    onPhotosChange([]);
    if (inputRef.current) inputRef.current.value = "";
  }

  if (photos.length === 0) {
    return (
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={allowMultiple}
          className="hidden"
          onChange={(e) => handleAdd(e.target.files)}
        />
        <motion.button
          onClick={() => inputRef.current?.click()}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="flex h-48 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface text-muted transition-colors hover:border-accent hover:bg-surface2"
        >
          <motion.div
            className="text-3xl"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            📷
          </motion.div>
          <div className="mt-2 text-sm">点击上传照片{allowMultiple ? "（可多选）" : ""}</div>
          <div className="mt-1 text-xs">
            {allowMultiple ? "支持 JPG/PNG，最多 9 张" : "支持 JPG/PNG"}
          </div>
        </motion.button>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={allowMultiple}
        className="hidden"
        onChange={(e) => handleAdd(e.target.files)}
      />

      {/* 缩略图网格 */}
      <div className={`grid gap-2 ${allowMultiple ? "grid-cols-3" : "grid-cols-1"}`}>
        <AnimatePresence mode="popLayout">
          {photos.map((p, i) => (
            <motion.div
              key={`${i}-${p.name}`}
              layout
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="group relative overflow-hidden rounded-lg border border-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previews[i]}
                alt={p.name}
                className={`w-full object-cover ${allowMultiple ? "aspect-square" : "aspect-video max-h-48"}`}
              />
              <motion.button
                onClick={() => handleRemove(i)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label={`删除 ${p.name}`}
              >
                ✕
              </motion.button>
              {allowMultiple && (
                <div className="absolute bottom-0 left-0 right-0 truncate bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                  #{i + 1} {p.name}
                </div>
              )}
            </motion.div>
          ))}

          {/* 添加按钮（仅多图模式显示） */}
          {allowMultiple && photos.length < 9 && (
            <motion.button
              key="add-btn"
              layout
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => inputRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface text-muted transition-colors hover:border-accent hover:bg-surface2"
            >
              <div className="text-2xl">+</div>
              <div className="mt-1 text-[10px]">添加</div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {allowMultiple ? (
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-muted">
            {photos.length} 张 · 多图会被自动拼接成一张再美化
          </span>
          <button onClick={handleClear} className="text-accent hover:underline">
            清空
          </button>
        </div>
      ) : (
        <div className="mt-2 text-right text-xs">
          <button onClick={handleClear} className="text-accent hover:underline">
            换一张
          </button>
        </div>
      )}
    </div>
  );
}