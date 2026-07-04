// MiniMax Video Agent 官方模板列表（11 个）
// 数据来源：https://platform.minimaxi.com/docs/faq/video-agent-templates
// media_input: 是否需要图片（"需要" / "/"）
// text_input:  是否需要文本（"需要" / "/"）

export type Template = {
  id: string;
  name: string;
  description: string;
  needsMedia: boolean;
  needsText: boolean;
  textLabel?: string; // 当 needsText 时，UI 提示用户填什么
  previewUrl: string; // 官方提供的示例 mp4
};

export const TEMPLATES: Template[] = [
  {
    id: "392753057216684038",
    name: "跳水",
    description: "上传你的照片，生成照片中主体完美跳水表现的视频",
    needsMedia: true,
    needsText: false,
    previewUrl: "https://filecdn.minimax.chat/public/434bb72c-3f55-4094-b06f-fb96bd41ddac.mp4",
  },
  {
    id: "393881433990066176",
    name: "吊环",
    description: "上传宠物照片，生成图中主体完成完美吊环动作的视频",
    needsMedia: true,
    needsText: false,
    previewUrl: "https://filecdn.minimax.chat/public/4eba7e2b-ae58-4933-965e-3dbde901ed1f.mp4",
  },
  {
    id: "393769180141805569",
    name: "绝地求生",
    description: "上传宠物图片并输入野兽种类，生成宠物野外绝地求生视频",
    needsMedia: true,
    needsText: true,
    textLabel: "野兽种类（如：狮子、老虎、狼）",
    previewUrl: "https://filecdn.minimax.chat/public/ee7be27a-86e4-45ef-b1fb-829ea078624d.mp4",
  },
  {
    id: "394246956137422856",
    name: "万物皆可 labubu",
    description: "上传人物/宠物照片，生成 labubu 换脸视频",
    needsMedia: true,
    needsText: false,
    previewUrl: "https://filecdn.minimax.chat/public/5d6cff91-b030-4c19-a80e-29cfed3ed56d.mp4",
  },
  {
    id: "393879757702918151",
    name: "麦当劳宠物外卖员",
    description: "上传爱宠照片，生成麦当劳宠物外卖员视频",
    needsMedia: true,
    needsText: false,
    previewUrl: "https://filecdn.minimax.chat/public/1f8061fe-f885-4778-810f-5e3a4e148deb.mp4",
  },
  {
    id: "393766210733957121",
    name: "藏族风写真",
    description: "上传面部参考图，生成藏族风视频写真",
    needsMedia: true,
    needsText: false,
    previewUrl: "https://filecdn.minimax.chat/public/b7a6e34a-84bd-4f90-81a2-d9495eb19ea1.mp4",
  },
  {
    id: "394125185182695432",
    name: "生无可恋",
    description: "输入各类主角痛苦做某事，一键生成角色痛苦生活的小动画",
    needsMedia: false,
    needsText: true,
    textLabel: "主角 + 痛苦做的事（如：小狗加班、外卖员淋雨）",
    previewUrl: "https://filecdn.minimax.chat/public/4f21aa52-74bd-488f-b62f-ca03fcb6ed98.mp4",
  },
  {
    id: "393857704283172864",
    name: "情书写真",
    description: "上传照片生成冬日雪景写真",
    needsMedia: true,
    needsText: false,
    previewUrl: "https://filecdn.minimax.chat/public/01f85d47-162b-4d97-856f-8ab3bf8b0101.mp4",
  },
  {
    id: "398574688191234048",
    name: "四季写真",
    description: "上传人脸照片生成四季写真",
    needsMedia: true,
    needsText: false,
    previewUrl: "https://filecdn.minimax.chat/public/571229bd-0e33-41be-80bb-716e30ba34f8.mp4",
  },
  {
    id: "393866076583718914",
    name: "女模特试穿广告",
    description: "上传服装图片，生成女模特试穿对应服装的广告",
    needsMedia: true,
    needsText: false,
    previewUrl: "https://filecdn.minimax.chat/public/215dc60a-8987-4fab-9041-7e2e064b3eb7.mp4",
  },
  {
    id: "393876118804459526",
    name: "男模特试穿广告",
    description: "上传服装图片，生成男模特试穿对应服装的广告",
    needsMedia: true,
    needsText: false,
    previewUrl: "https://filecdn.minimax.chat/public/db76ea00-9919-43e9-9457-a0548430984c.mp4",
  },
];

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}