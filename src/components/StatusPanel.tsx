"use client";

import { AnimatePresence, motion } from "motion/react";

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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className="rounded-lg border border-border bg-surface p-4"
    >
      <AnimatePresence mode="wait">
        {status === "enhancing" && (
          <motion.div
            key="enhancing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3"
          >
            <Spinner />
            <span>美化参考图中...</span>
          </motion.div>
        )}

        {status === "polling" && (
          <motion.div
            key="polling"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-3">
              <Spinner />
              <span>视频生成中（通常 1-10 分钟）</span>
              {elapsedSec !== undefined && (
                <motion.span
                  key={elapsedSec}
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs text-muted"
                >
                  已等待 {elapsedSec}s
                </motion.span>
              )}
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface2">
              <motion.div
                className="h-full rounded-full bg-accent"
                style={{ width: "33%" }}
                animate={{ x: ["-100%", "300%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        )}

        {status === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="flex items-center gap-2 text-sm text-green-400"
          >
            <motion.span
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 500 }}
            >
              ✅
            </motion.span>
            视频生成完成！
          </motion.div>
        )}

        {status === "failed" && (
          <motion.div
            key="failed"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="text-sm text-red-400"
          >
            ❌ {errorMsg || "失败，请重试"}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Spinner() {
  return (
    <motion.div
      className="h-5 w-5 rounded-full border-2 border-accent border-t-transparent"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
    />
  );
}