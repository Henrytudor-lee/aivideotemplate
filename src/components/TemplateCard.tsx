"use client";

import { Template } from "@/lib/templates";

type Props = {
  template: Template;
  selected: boolean;
  onSelect: () => void;
};

export function TemplateCard({ template, selected, onSelect }: Props) {
  return (
    <button
      onClick={onSelect}
      className={[
        "group relative overflow-hidden rounded-xl border text-left transition-all",
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
          <div className="absolute right-2 top-2 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-white">
            已选
          </div>
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
    </button>
  );
}