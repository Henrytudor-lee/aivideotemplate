// 模板元数据
// 两种类型：
//   - 官方 Video Agent 模板（11 个）：用 template_id，调 /v1/video_template_generation
//   - prompt 模板（自定义）：用 prompt + 可选首帧图，调 /v1/video_generation
//
// 11 个官方模板的数据来源：https://platform.minimaxi.com/docs/faq/video-agent-templates
// prompt 模板来自调研海螺 AI Hub 热门案例

export type Template =
  | OfficialTemplate
  | PromptTemplate;

type BaseTemplate = {
  id: string;
  name: string;
  description: string;
  needsMedia: boolean;
  needsText: boolean;
  textLabel?: string;
  /** 预览 mp4（官方模板用 filecdn，自定义模板暂用占位） */
  previewUrl: string;
};

/** 官方 Video Agent 模板（有 template_id） */
export type OfficialTemplate = BaseTemplate & {
  mode: "official";
  templateId: string;
};

/** prompt 模板（基础视频生成 API） */
export type PromptTemplate = BaseTemplate & {
  mode: "prompt";
  /** 提示词（可用 [用户输入] 占位） */
  prompt: string;
  /** 视频模型，默认 MiniMax-Hailuo-2.3 */
  model?: string;
  /** 视频时长（秒），默认 6 */
  duration?: number;
  /** 分辨率，默认 1080P */
  resolution?: "768P" | "1080P";
};

export const TEMPLATES: Template[] = [
  // ==================== 官方 11 个模板 ====================
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

  // ==================== prompt 模板（10 个，来自海螺 Hub 调研）====================
  // 这些走基础视频生成 API（/v1/video_generation），用 prompt + 可选首帧图
  // 模型 MiniMax-Hailuo-2.3（支持文生视频、图生视频）

  {
    id: "p_jojo_stand",
    mode: "prompt",
    name: "JOJO 替身节奏",
    description: "上传照片，生成 JOJO 替身使者登场的电影感节奏视频",
    needsMedia: true,
    needsText: false,
    prompt: "Cinematic JoJo's Bizarre Adventure style intro. The character in the photo steps forward dramatically, a glowing Stand (ghostly humanoid figure) materializes behind them with bold manga speed lines, purple neon lights, gold ornaments. Dynamic camera push-in, dramatic lighting, anime action sequence vibe, 6 seconds.",
    previewUrl: "https://filecdn.minimax.chat/public/b7a6e34a-84bd-4f90-81a2-d9495eb19ea1.mp4", // 复用藏族风占位
  },
  {
    id: "p_petal_dissolve",
    mode: "prompt",
    name: "花瓣消失特效",
    description: "上传横屏图 + 指定颜色，生成花瓣飘散消失特效",
    needsMedia: true,
    needsText: true,
    textLabel: "花瓣颜色（如：粉色、白色、红色）",
    prompt: "The character in the photo stands still as glowing [用户输入] petals begin swirling around them. The petals gradually cover the entire figure, and when they disperse the character has vanished, leaving only a soft mist of floating petals. Cinematic, slow motion, soft lighting, 6 seconds.",
    previewUrl: "https://filecdn.minimax.chat/public/01f85d47-162b-4d97-856f-8ab3bf8b0101.mp4",
  },
  {
    id: "p_paint_dressup",
    mode: "prompt",
    name: "手搓颜料变装",
    description: "上传照片，颜料揭开后变装成新造型",
    needsMedia: true,
    needsText: false,
    prompt: "The character in the photo is covered in thick colorful paint. Hands smear the paint downward, gradually revealing a completely new stylish outfit and look underneath. Satisfying paint transition, vibrant colors, dynamic transformation, trendy fashion vibe, 6 seconds.",
    previewUrl: "https://filecdn.minimax.chat/public/571229bd-0e33-41be-80bb-716e30ba34f8.mp4",
  },
  {
    id: "p_2000s_drama",
    mode: "prompt",
    name: "千禧年台剧",
    description: "上传照片，生成千禧年台剧氛围的怀旧视频",
    needsMedia: true,
    needsText: false,
    prompt: "Early 2000s Taiwanese idol drama aesthetic. The character in the photo stands in a sunlit school classroom, VHS film grain effect, soft pink and warm yellow tones, wind blowing through their hair, nostalgic dreamy vibe, soft piano music mood, 6 seconds.",
    previewUrl: "https://filecdn.minimax.chat/public/434bb72c-3f55-4094-b06f-fb96bd41ddac.mp4",
  },
  {
    id: "p_flamenco",
    mode: "prompt",
    name: "街头弗拉明戈",
    description: "上传照片，生成西班牙街头弗拉明戈舞蹈",
    needsMedia: true,
    needsText: false,
    prompt: "The character in the photo dances passionate Flamenco on a sun-dappled Spanish cobblestone street. Red dress spinning dramatically, castanets clicking, golden hour light, Mediterranean architecture in background, intense and graceful, 6 seconds.",
    previewUrl: "https://filecdn.minimax.chat/public/215dc60a-8987-4fab-9041-7e2e064b3eb7.mp4",
  },
  {
    id: "p_red_envelope",
    mode: "prompt",
    name: "上门送红包",
    description: "上传照片，生成身穿新年服装上门送红包祝福视频",
    needsMedia: true,
    needsText: false,
    prompt: "Chinese New Year celebration. The character in the photo wears a festive red Tang suit, rings a doorbell, then hands over a gold-trimmed red envelope with a warm smile. Traditional doorway with red couplets, snow falling, warm lantern light, joyful atmosphere, 6 seconds.",
    previewUrl: "https://filecdn.minimax.chat/public/5d6cff91-b030-4c19-a80e-29cfed3ed56d.mp4",
  },
  {
    id: "p_year_record",
    mode: "prompt",
    name: "马年唱片",
    description: "上传照片，生成马年复古唱片风格视频",
    needsMedia: true,
    needsText: false,
    prompt: "Vintage vinyl record aesthetic. The character in the photo stands next to a giant spinning record album with a golden horse emblem on the label. Retro 70s warm color palette, slight film grain, dramatic side lighting, stylish and nostalgic, 6 seconds.",
    previewUrl: "https://filecdn.minimax.chat/public/db76ea00-9919-43e9-9457-a0548430984c.mp4",
  },
  {
    id: "p_film_transport",
    mode: "prompt",
    name: "即刻穿越影视",
    description: "上传照片，穿越到著名电影场景中",
    needsMedia: true,
    needsText: false,
    prompt: "The character in the photo suddenly appears in a famous movie scene. Dramatic cinematic lighting, the character looks around in awe as the cinematic environment reacts to their presence. Swaying camera, warm and cool color contrast, Hollywood blockbuster aesthetic, 6 seconds.",
    previewUrl: "https://filecdn.minimax.chat/public/1f8061fe-f885-4778-810f-5e3a4e148deb.mp4",
  },
  {
    id: "p_year_change",
    mode: "prompt",
    name: "年度蜕变",
    description: "上传一张照片，展示你这一年来的变化",
    needsMedia: true,
    needsText: false,
    prompt: "Time-lapse transformation of the character in the photo. Hair grows from short bob to long waves, outfit changes through four seasons (light spring, summer t-shirt, autumn sweater, winter coat), and the background shifts from spring blossoms to winter snow. Soft nostalgic transitions, 6 seconds.",
    previewUrl: "https://filecdn.minimax.chat/public/4eba7e2b-ae58-4933-965e-3dbde901ed1f.mp4",
  },
  {
    id: "p_dunhuang",
    mode: "prompt",
    name: "敦煌飞天",
    description: "上传照片，生成敦煌壁画风格的飞天视频",
    needsMedia: true,
    needsText: false,
    prompt: "Dunhuang Mogao Caves flying Apsara fresco style. The character in the photo floats serenely mid-air among golden clouds and flowing silk ribbons, surrounded by glowing Buddhist halo patterns. Warm ochre and gold tones, ancient Chinese mythology, ethereal graceful movement, 6 seconds.",
    previewUrl: "https://filecdn.minimax.chat/public/ee7be27a-86e4-45ef-b1fb-829ea078624d.mp4",
  },
];

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}