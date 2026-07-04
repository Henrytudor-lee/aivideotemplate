import sharp from "sharp";

export type CollageOptions = {
  /** 每张子图的目标宽度（像素），默认 512 */
  cellSize?: number;
  /** 间距像素，默认 16 */
  padding?: number;
  /** 背景色（hex），默认纯白 */
  background?: string;
};

/**
 * 把多张图片拼成一张网格图（自动选择行/列布局）。
 * - 1 张：原图（最多限制最大宽度）
 * - 2 张：1x2 横排
 * - 3 张：3 张竖排（1x3）
 * - 4 张：2x2
 * - 5-6 张：2x3
 * - 7-9 张：3x3
 */
export async function buildCollage(
  buffers: Buffer[],
  opts: CollageOptions = {}
): Promise<Buffer> {
  const cell = opts.cellSize ?? 512;
  const pad = opts.padding ?? 16;
  const bg = opts.background ?? "#ffffff";

  if (buffers.length === 0) {
    throw new Error("至少需要 1 张图片");
  }

  // 1 张：直接 resize 返回
  if (buffers.length === 1) {
    return await sharp(buffers[0])
      .resize({ width: cell, withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();
  }

  // 决定网格布局
  const n = buffers.length;
  let cols: number, rows: number;
  if (n === 2) { cols = 2; rows = 1; }
  else if (n === 3) { cols = 1; rows = 3; }
  else if (n === 4) { cols = 2; rows = 2; }
  else if (n <= 6) { cols = 3; rows = 2; }
  else if (n <= 9) { cols = 3; rows = 3; }
  else { cols = 4; rows = Math.ceil(n / 4); }

  // 把每张图 resize 成 cell x cell（contain，不变形，空白填白）
  const cellImages = await Promise.all(
    buffers.map(async (b) => {
      const meta = await sharp(b).metadata();
      // 计算 contain 缩放
      const ratio = Math.min(cell / (meta.width || cell), cell / (meta.height || cell));
      const w = Math.round((meta.width || cell) * ratio);
      const h = Math.round((meta.height || cell) * ratio);
      const resized = await sharp(b)
        .resize(w, h, { fit: "inside" })
        .toBuffer();
      return { w, h, buf: resized };
    })
  );

  const canvasW = cols * cell + (cols + 1) * pad;
  const canvasH = rows * cell + (rows + 1) * pad;

  // 用 composite 把每张图放到画布中央
  const composites = cellImages.map((img, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const left = pad + col * (cell + pad) + Math.round((cell - img.w) / 2);
    const top = pad + row * (cell + pad) + Math.round((cell - img.h) / 2);
    return { input: img.buf, left, top };
  });

  return await sharp({
    create: {
      width: canvasW,
      height: canvasH,
      channels: 3,
      background: bg,
    },
  })
    .composite(composites)
    .jpeg({ quality: 90 })
    .toBuffer();
}