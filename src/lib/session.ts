import { cookies } from "next/headers";
import { getOrCreateUserByToken } from "./db";

const COOKIE_NAME = "hvs_session";

export function getCurrentUser() {
  let token = cookies().get(COOKIE_NAME)?.value;
  if (!token) {
    // 第一次访问，调用方会再写 setCookie
    token = "s_" + Math.random().toString(36).slice(2);
  }
  const { userId, token: finalToken } = getOrCreateUserByToken(token);
  return { userId, token: finalToken };
}

export function setSessionCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}