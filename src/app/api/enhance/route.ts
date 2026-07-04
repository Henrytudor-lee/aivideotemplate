import { NextRequest, NextResponse } from "next/server";
import { enhanceReferenceImage, MiniMaxError } from "@/lib/minimax";

// POST /api/enhance
// multipart/form-data: photo (File), [prompt (string, 可选)]
// 返回 { enhancedDataUri, jobId }
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const photo = form.get("photo");
    const customPrompt = form.get("prompt") ? String(form.get("prompt")) : undefined;

    if (!(photo instanceof File)) {
      return NextResponse.json({ error: "缺少 photo" }, { status: 400 });
    }

    const buf = Buffer.from(await photo.arrayBuffer());
    const mime = photo.type || "image/jpeg";
    const imageDataUri = `data:${mime};base64,${buf.toString("base64")}`;

    const result = await enhanceReferenceImage({
      imageDataUri,
      prompt: customPrompt,
    });

    return NextResponse.json({
      enhancedDataUri: result.enhancedDataUris[0],
      jobId: result.jobId,
    });
  } catch (err: any) {
    if (err instanceof MiniMaxError) {
      return NextResponse.json(
        { error: err.message, statusCode: err.statusCode, detail: err.raw },
        { status: 502 },
      );
    }
    return NextResponse.json({ error: err?.message || "未知错误" }, { status: 500 });
  }
}