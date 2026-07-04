import { NextRequest, NextResponse } from "next/server";
import { enhanceReferenceImage, MiniMaxError } from "@/lib/minimax";
import { buildCollage } from "@/lib/collage";

// POST /api/enhance
// multipart/form-data:
//   photos  - File[]  1-9 张（必填；前端 input 多选）
//   count   - 候选图数量，可选，默认 4，范围 1-6
//   prompt  - 自定义 prompt，可选
// 返回 { enhancedDataUris: string[], jobId: string, usedCollage: boolean }
//   usedCollage=false 表示服务端降级到只用了第一张图
export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const photos = form.getAll("photos").filter((v): v is File => v instanceof File);
    const customPrompt = form.get("prompt") ? String(form.get("prompt")) : undefined;
    const countRaw = form.get("count");
    let count = 4;
    if (countRaw) {
      const n = parseInt(String(countRaw), 10);
      if (!isNaN(n)) count = Math.max(1, Math.min(6, n));
    }

    if (photos.length === 0) {
      return NextResponse.json({ error: "缺少 photos" }, { status: 400 });
    }
    if (photos.length > 9) {
      return NextResponse.json({ error: "最多 9 张照片" }, { status: 400 });
    }

    // 决定用哪张图进图生图
    let imageDataUri: string;
    let usedCollage = false;
    if (photos.length === 1) {
      const p = photos[0];
      const buf = Buffer.from(await p.arrayBuffer());
      imageDataUri = `data:${p.type || "image/jpeg"};base64,${buf.toString("base64")}`;
    } else {
      // 多图：服务端拼成一张，再调图生图
      const buffers = await Promise.all(photos.map((p) => p.arrayBuffer().then(Buffer.from)));
      try {
        const collageBuf = await buildCollage(buffers);
        usedCollage = true;
        imageDataUri = `data:image/jpeg;base64,${collageBuf.toString("base64")}`;
      } catch (e: any) {
        // 拼接失败降级到第一张
        console.warn("[collage] failed, falling back to first photo:", e?.message);
        const p = photos[0];
        const buf = Buffer.from(await p.arrayBuffer());
        imageDataUri = `data:${p.type || "image/jpeg"};base64,${buf.toString("base64")}`;
      }
    }

    let result;
    try {
      result = await enhanceReferenceImage({
        imageDataUri,
        prompt: customPrompt,
        count,
      });
    } catch (e: any) {
      // 如果用了拼接图且失败，回退到单图重试
      if (usedCollage && photos.length > 1) {
        console.warn("[enhance with collage failed, retry with single photo]:", e?.message);
        const p = photos[0];
        const buf = Buffer.from(await p.arrayBuffer());
        const singleUri = `data:${p.type || "image/jpeg"};base64,${buf.toString("base64")}`;
        result = await enhanceReferenceImage({
          imageDataUri: singleUri,
          prompt: customPrompt,
          count,
        });
        usedCollage = false;
      } else {
        throw e;
      }
    }

    return NextResponse.json({
      enhancedDataUris: result.enhancedDataUris,
      jobId: result.jobId,
      usedCollage,
    });
  } catch (err: any) {
    if (err instanceof MiniMaxError) {
      return NextResponse.json(
        { error: err.message, statusCode: err.statusCode, detail: err.raw },
        { status: 502 }
      );
    }
    return NextResponse.json({ error: err?.message || "未知错误" }, { status: 500 });
  }
}