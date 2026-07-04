import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const DATA_DIR = path.join(process.cwd(), ".data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, "app.db");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// 初始化 schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    template_id TEXT NOT NULL,
    template_name TEXT NOT NULL,
    photo_data_uri TEXT NOT NULL,
    enhanced_data_uri TEXT,
    used_collage INTEGER NOT NULL DEFAULT 0,
    text_value TEXT,
    external_task_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    video_url TEXT,
    error_msg TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id, created_at DESC);
`);

export type Task = {
  id: string;
  user_id: string;
  template_id: string;
  template_name: string;
  photo_data_uri: string;
  enhanced_data_uri: string | null;
  used_collage: number;
  text_value: string | null;
  external_task_id: string | null;
  status: "pending" | "submitted" | "processing" | "success" | "failed";
  video_url: string | null;
  error_msg: string | null;
  created_at: number;
  updated_at: number;
};

// ========== 用户/会话 ==========
export function getOrCreateUserByToken(token: string): { userId: string; token: string } {
  const now = Date.now();
  const row = db.prepare("SELECT user_id, expires_at FROM sessions WHERE token = ?").get(token) as
    | { user_id: string; expires_at: number }
    | undefined;
  if (row && row.expires_at > now) {
    return { userId: row.user_id, token };
  }
  // 失效或不存在：建新 user + session
  const userId = "u_" + crypto.randomBytes(8).toString("hex");
  const userName = "User-" + userId.slice(2, 6);
  db.prepare("INSERT INTO users (id, name, created_at) VALUES (?, ?, ?)").run(
    userId,
    userName,
    now
  );
  const newToken = "s_" + crypto.randomBytes(24).toString("hex");
  db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(
    newToken,
    userId,
    now + 1000 * 60 * 60 * 24 * 30 // 30 天
  );
  return { userId, token: newToken };
}

// ========== 任务 CRUD ==========
export function createTask(
  input: Partial<Task> & {
    user_id: string;
    template_id: string;
    template_name: string;
    photo_data_uri: string;
    used_collage: number;
  }
): Task {
  const id = "t_" + crypto.randomBytes(10).toString("hex");
  const now = Date.now();
  const status = input.status ?? "pending";
  db.prepare(
    `INSERT INTO tasks (id, user_id, template_id, template_name, photo_data_uri,
      enhanced_data_uri, used_collage, text_value, external_task_id, status, video_url,
      error_msg, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.user_id,
    input.template_id,
    input.template_name,
    input.photo_data_uri,
    input.enhanced_data_uri ?? null,
    input.used_collage,
    input.text_value ?? null,
    input.external_task_id ?? null,
    status,
    null,
    null,
    now,
    now
  );
  return getTask(id)!;
}

export function getTask(id: string): Task | null {
  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as Task | undefined;
  return row ?? null;
}

export function listTasks(userId: string, limit = 50): Task[] {
  return db
    .prepare("SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC LIMIT ?")
    .all(userId, limit) as Task[];
}

export function updateTask(
  id: string,
  patch: Partial<Pick<Task, "external_task_id" | "status" | "video_url" | "error_msg" | "enhanced_data_uri">>
): Task | null {
  const fields: string[] = [];
  const values: any[] = [];
  for (const [k, v] of Object.entries(patch)) {
    fields.push(`${k} = ?`);
    values.push(v);
  }
  if (fields.length === 0) return getTask(id);
  fields.push("updated_at = ?");
  values.push(Date.now());
  values.push(id);
  db.prepare(`UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return getTask(id);
}

export function deleteTask(id: string, userId: string): boolean {
  const res = db.prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?").run(id, userId);
  return res.changes > 0;
}

// 给客户端轮询用：批量获取一组任务的最新状态
export function getTasksStatus(
  userId: string,
  ids: string[]
): Array<Pick<Task, "id" | "status" | "video_url" | "error_msg" | "external_task_id">> {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => "?").join(",");
  return db
    .prepare(
      `SELECT id, status, video_url, error_msg, external_task_id
       FROM tasks WHERE user_id = ? AND id IN (${placeholders})`
    )
    .all(userId, ...ids) as any;
}