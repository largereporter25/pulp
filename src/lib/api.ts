import type { Document, WritingMode, ScreenplayElement, TextBlock, CanvasCard } from "@shared/types";

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
  list: (params?: { mode?: string; q?: string }) => {
    const qs = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
    return fetch(`${BASE}/documents${qs}`).then((r) => json<Document[]>(r));
  },

  get: (id: string) => fetch(`${BASE}/documents/${id}`).then((r) => json<Document>(r)),

  create: (data: { title?: string; mode?: WritingMode; content?: unknown; synopsis?: string }) =>
    fetch(`${BASE}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => json<Document>(r)),

  update: (
    id: string,
    data: Partial<{
      title: string;
      mode: WritingMode;
      content: ScreenplayElement[] | TextBlock[];
      synopsis: string;
      canvas_x: number;
      canvas_y: number;
      tags: string[];
    }>
  ) =>
    fetch(`${BASE}/documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => json<Document>(r)),

  remove: (id: string) => fetch(`${BASE}/documents/${id}`, { method: "DELETE" }).then((r) => json<void>(r)),

  duplicate: (id: string) =>
    fetch(`${BASE}/documents/${id}/duplicate`, { method: "POST" }).then((r) => json<Document>(r)),

  canvasState: () => fetch(`${BASE}/canvas/state`).then((r) => json<{ documents: CanvasCard[] }>(r)),

  updateCanvasPositions: (positions: { id: string; x: number; y: number }[]) =>
    fetch(`${BASE}/canvas/positions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ positions }),
    }).then((r) => json<void>(r)),

  search: (q: string) => fetch(`${BASE}/search?q=${encodeURIComponent(q)}`).then((r) => json<Document[]>(r)),

  exportUrl: (id: string, format: "pdf" | "fountain" | "docx" | "txt") =>
    `${BASE}/documents/${id}/export/${format}`,
};
