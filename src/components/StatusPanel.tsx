"use client";

type Status =
  | "idle"
  | "enhancing"
  | "polling"
  | "success"
  | "failed";

type Props = {
  status: Status;
  elapsedSec?: number;
  errorMsg?: string;
};

export function StatusPanel({ status, elapsedSec, errorMsg }: Props) {
  if (status === "idle") return null;

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      {status === "enhancing" && (
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span>美化参考图中...</span>
        </div>
      )}

      {status === "polling" && (
        <div>
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <span>视频生成中（通常 1-10 分钟）</span>
            {elapsedSec !== undefined && (
              <span className="text-xs text-muted">已等待 {elapsedSec}s</span>
            )}
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface2">
            <div className="h-full w-1/3 animate-[shimmer_1.5s_ease-in-out_infinite] rounded-full bg-accent" />
          </div>
          <style jsx>{`
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(300%); }
            }
          `}</style>
        </div>
      )}

      {status === "success" && (
        <div className="text-sm text-green-400">✅ 视频生成完成！</div>
      )}

      {status === "failed" && (
        <div className="text-sm text-red-400">❌ {errorMsg || "失败，请重试"}</div>
      )}
    </div>
  );
}