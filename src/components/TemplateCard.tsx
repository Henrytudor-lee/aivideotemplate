"use client";

import { motion } from "motion/react";
import { Template } from "@/lib/templates";

type Props = {
  template: Template;
  selected: boolean;
  onSelect: () => void;
};

export function TemplateCard({ template, selected, onSelect }: Props) {
  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ y: -3, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      animate={{
        scale: selected ? 1.03 : 1,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={[
        "group relative overflow-hidden rounded-xl border text-left transition-colors",
        "bg-surface hover:bg-surface2",
        selected ? "border-accent ring-2 ring-accent/50" : "border-border hover:border-muted",
      ].join(" ")}
    >
      {/* 预览视频（hover 播放，静音循环） */}
      <div className="relative aspect-[9/16] w-full bg-black">
        <video
          src={template.previewUrl}
          muted
          loop
          playsInline
          preload="metadata"
          className="h-full w-full object-cover opacity-90 group-hover:opacity-100"
          onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
          onMouseLeave={(e) => {
            e.currentTarget.pause();
            e.currentTarget.currentTime = 0;
          }}
        />
        {selected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="absolute right-2 top-2 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-white shadow-lg"
          >
            ✓ 已选
          </motion.div>
        )}
      </div>

      {/* 信息 */}
      <div className="p-3">
        <div className="text-sm font-semibold">{template.name}</div>
        <div className="mt-1 line-clamp-2 text-xs text-muted">{template.description}</div>
        <div className="mt-2 flex gap-1.5">
          {template.needsMedia && (
            <span className="rounded bg-surface2 px-1.5 py-0.5 text-[10px] text-muted">📷 图片</span>
          )}
          {template.needsText && (
            <span className="rounded bg-surface2 px-1.5 py-0.5 text-[10px] text-muted">✏️ 文本</span>
          )}
        </div>
      </div>
    </motion.button>
  );
}