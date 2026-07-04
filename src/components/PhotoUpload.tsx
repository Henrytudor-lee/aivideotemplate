"use client";

import { useRef, useState } from "react";

type Props = {
  onFile: (file: File | null) => void;
};

export function PhotoUpload({ onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleSelect(file: File | null) {
    if (!file) {
      setPreview(null);
      setFileName(null);
      onFile(null);
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
    onFile(file);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleSelect(e.target.files?.[0] || null)}
      />

      {preview ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="预览"
            className="h-48 w-full rounded-lg border border-border object-cover"
          />
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="truncate text-muted">{fileName}</span>
            <button
              onClick={() => {
                if (inputRef.current) inputRef.current.value = "";
                handleSelect(null);
              }}
              className="text-accent hover:underline"
            >
              换一张
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex h-48 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface text-muted transition-colors hover:border-accent hover:bg-surface2"
        >
          <div className="text-3xl">📷</div>
          <div className="mt-2 text-sm">点击上传照片</div>
          <div className="mt-1 text-xs">支持 JPG/PNG，人脸清晰效果更好</div>
        </button>
      )}
    </div>
  );
}