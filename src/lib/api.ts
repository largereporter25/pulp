import type { Document, WritingMode, ScreenplayElement, TextBlock } from "@shared/types";

const BASE = "/api";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  list: () => fetch(`${BASE}/documents`).then((r) => json<Document[]>(r)),

  get: (id: string) => fetch(`${BASE}/documents/${id}`).then((r) => json<Document>(r)),

  create: (data: { title?: string; mode?: WritingMode; content?: unknown; synopsis?: string }) =>
    fetch(`${BASE}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => json<Document>(r)),

  update: (
    id: string,
    data: Partial<{ title: string; mode: WritingMode; content: ScreenplayElement[] | TextBlock[]; synopsis: string }>
  ) =>
    fetch(`${BASE}/documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => json<Document>(r)),

  remove: (id: string) => fetch(`${BASE}/documents/${id}`, { method: "DELETE" }).then((r) => json<void>(r)),
};
