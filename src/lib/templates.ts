// MiniMax Video Agent 模板
// 两种类型：
//   - 官方 11 个（template_id 形式）→ 调 /v1/video_template_generation
//   - Hub 模板（prompt 形式）→ 调 /v1/video_generation
//
// 官方 11 个：https://platform.minimaxi.com/docs/faq/video-agent-templates
// Hub 模板：抓取自海螺 Hub 公开预览 mp4（cdn.hailuoai.com 域）

export type Template =
  | OfficialTemplate
  | HubTemplate;

type BaseTemplate = {
  id: string;
  name: string;
  description: string;
  needsMedia: boolean;
  needsText: boolean;
  textLabel?: string;
  previewUrl: string;
};

/** 官方 Video Agent 模板 */
export type OfficialTemplate = BaseTemplate & {
  mode: "official";
  templateId: string;
};

/** Hub 模板（用 prompt + 可选首帧图） */
export type HubTemplate = BaseTemplate & {
  mode: "hub";
  /** Hub 模板的 prompt 描述 */
  prompt: string;
};

export const TEMPLATES: Template[] = [
  // ==================== 官方 11 个 ====================
  {
    id: "392753057216684038",
    mode: "official",
    templateId: "392753057216684038",
    name: "跳水",
    description: "上传你的照片，生成照片中主体完美跳水表现的视频",
    needsMedia: true,
    needsText: false,
    previewUrl: "https://filecdn.minimax.chat/public/434bb72c-3f55-4094-b06f-fb96bd41ddac.mp4",
  },
  {
    id: "393881433990066176",
    mode: "official",
    templateId: "393881433990066176",
    name: "吊环",
    description: "上传宠物照片，生成图中主体完成完美吊环动作的视频",
    needsMedia: true,
    needsText: false,
    previewUrl: "https://filecdn.minimax.chat/public/4eba7e2b-ae58-4933-965e-3dbde901ed1f.mp4",
  },
  {
    id: "393769180141805569",
    mode: "official",
    templateId: "393769180141805569",
    name: "绝地求生",
    description: "上传宠物图片并输入野兽种类，生成宠物野外绝地求生视频",
    needsMedia: true,
    needsText: true,
    textLabel: "野兽种类（如：狮子、老虎、狼）",
    previewUrl: "https://filecdn.minimax.chat/public/ee7be27a-86e4-45ef-b1fb-829ea078624d.mp4",
  },
  {
    id: "394246956137422856",
    mode: "official",
    templateId: "394246956137422856",
    name: "万物皆可 labubu",
    description: "上传人物/宠物照片，生成 labubu 换脸视频",
    needsMedia: true,
    needsText: false,
    previewUrl: "https://filecdn.minimax.chat/public/5d6cff91-b030-4c19-a80e-29cfed3ed56d.mp4",
  },
  {
    id: "393879757702918151",
    mode: "official",
    templateId: "393879757702918151",
    name: "麦当劳宠物外卖员",
    description: "上传爱宠照片，生成麦当劳宠物外卖员视频",
    needsMedia: true,
    needsText: false,
    previewUrl: "https://filecdn.minimax.chat/public/1f8061fe-f885-4778-810f-5e3a4e148deb.mp4",
  },
  {
    id: "393766210733957121",
    mode: "official",
    templateId: "393766210733957121",
    name: "藏族风写真",
    description: "上传面部参考图，生成藏族风视频写真",
    needsMedia: true,
    needsText: false,
    previewUrl: "https://filecdn.minimax.chat/public/b7a6e34a-84bd-4f90-81a2-d9495eb19ea1.mp4",
  },
  {
    id: "394125185182695432",
    mode: "official",
    templateId: "394125185182695432",
    name: "生无可恋",
    description: "输入各类主角痛苦做某事，一键生成角色痛苦生活的小动画",
    needsMedia: false,
    needsText: true,
    textLabel: "主角 + 痛苦做的事（如：小狗加班、外卖员淋雨）",
    previewUrl: "https://filecdn.minimax.chat/public/4f21aa52-74bd-488f-b62f-ca03fcb6ed98.mp4",
  },
  {
    id: "393857704283172864",
    mode: "official",
    templateId: "393857704283172864",
    name: "情书写真",
    description: "上传照片生成冬日雪景写真",
    needsMedia: true,
    needsText: false,
    previewUrl: "https://filecdn.minimax.chat/public/01f85d47-162b-4d97-856f-8ab3bf8b0101.mp4",
  },
  {
    id: "398574688191234048",
    mode: "official",
    templateId: "398574688191234048",
    name: "四季写真",
    description: "上传人脸照片生成四季写真",
    needsMedia: true,
    needsText: false,
    previewUrl: "https://filecdn.minimax.chat/public/571229bd-0e33-41be-80bb-716e30ba34f8.mp4",
  },
  {
    id: "393866076583718914",
    mode: "official",
    templateId: "393866076583718914",
    name: "女模特试穿广告",
    description: "上传服装图片，生成女模特试穿对应服装的广告",
    needsMedia: true,
    needsText: false,
    previewUrl: "https://filecdn.minimax.chat/public/215dc60a-8987-4fab-9041-7e2e064b3eb7.mp4",
  },
  {
    id: "393876118804459526",
    mode: "official",
    templateId: "393876118804459526",
    name: "男模特试穿广告",
    description: "上传服装图片，生成男模特试穿对应服装的广告",
    needsMedia: true,
    needsText: false,
    previewUrl: "https://filecdn.minimax.chat/public/db76ea00-9919-43e9-9457-a0548430984c.mp4",
  },

  // ==================== Hub 模板（3 个）====================
  // 来源：海螺 Hub 推荐区高互动量模板（已公开预览 mp4 + 描述）
  // 走基础视频生成 API（/v1/video_generation）+ 首帧图

  {
    id: "hub_mulan",
    mode: "hub",
    name: "国风水墨《花木兰》",
    description: "海螺×离谱琴社联合创作，国风水墨风格动画短片",
    needsMedia: false,
    needsText: false,
    previewUrl: "https://cdn.hailuoai.com/prod/2026-03-23-15/feed/1774249791928110206-feed_492384590720368645.mp4",
    prompt: "Chinese ink wash painting (shuimo) style animated short film. A heroic female warrior in ancient Chinese armor, her story told through flowing ink brushstrokes, traditional guzheng and erhu music. Sweeping mountain landscapes dissolve into mist, with delicate plum blossoms and bamboo forests. Studio Ghibli meets classical Chinese art direction, 6 seconds.",
  },
  {
    id: "hub_petal",
    mode: "hub",
    name: "花瓣消失特效",
    description: "上传横屏图 + 指定颜色，生成花瓣飘散消失特效",
    needsMedia: true,
    needsText: true,
    textLabel: "花瓣颜色（如：粉色、白色、红色）",
    previewUrl: "https://cdn.hailuoai.com/prod/2026-06-04-21/feed/1780580700643200028-feed_473212776258355202.mp4",
    prompt: "The character in the photo stands still as glowing [用户输入] petals begin swirling around them. The petals gradually cover the entire figure, and when they disperse the character has vanished, leaving only a soft mist of floating petals. Cinematic, slow motion, soft natural lighting, dreamy and elegant atmosphere, 6 seconds.",
  },
  {
    id: "hub_jojo",
    mode: "hub",
    name: "JOJO 替身节奏",
    description: "上传照片，生成 JOJO 替身使者登场的电影感节奏视频",
    needsMedia: true,
    needsText: false,
    previewUrl: "https://cdn.hailuoai.com/prod/2026-06-04-21/feed/1780581251314710435-feed_476117246902419462.mp4",
    prompt: "Cinematic JoJo's Bizarre Adventure style intro sequence. The character in the photo steps forward dramatically, a glowing Stand (ghostly humanoid figure with flowing energy) materializes behind them. Bold manga speed lines, purple neon lights, gold ornaments. Dynamic camera push-in, dramatic theatrical lighting, anime action sequence vibe with 'ゴゴゴ' energy, 6 seconds.",
  },
];

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}