"use client";

/** 브라우저 → /api 호출 공통 래퍼 (에러 메시지 통일) */
export async function api<T = unknown>(
  url: string,
  init: { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: unknown } = {}
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: init.method ?? (init.body ? "POST" : "GET"),
      headers: init.body ? { "Content-Type": "application/json" } : undefined,
      body: init.body ? JSON.stringify(init.body) : undefined,
      credentials: "same-origin",
    });
  } catch {
    throw new Error("인터넷 연결을 확인해 주세요");
  }
  let json: { error?: string } & T;
  try {
    json = (await res.json()) as { error?: string } & T;
  } catch {
    throw new Error(res.ok ? "응답을 읽을 수 없어요" : `오류가 발생했어요 (${res.status})`);
  }
  if (!res.ok) throw new Error(json.error ?? `오류가 발생했어요 (${res.status})`);
  return json;
}
