const BASE = (import.meta as any).env?.VITE_API_BASE ?? "/api/v2";

export interface Doc {
  id: string;
  title: string;
  mode: "screenplay" | "prose" | "poem" | "song" | "notes";
  content: Record<string, unknown>;
  synopsis: string;
  tags: string[];
  canvas_x: number;
  canvas_y: number;
  word_count: number;
  page_count: number;
  bpm?: number;
  key_signature?: string;
  draft_date?: string;
  contact_info?: string;
  created_at: string;
  updated_at: string;
}

export interface CanvasCard {
  id: string;
  title: string;
  mode: string;
  x: number;
  y: number;
  word_count: number;
  page_count: number;
  tags: string[];
  updated_at: string;
}

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const api = {
  listDocuments: (params?: { mode?: string; tag?: string; q?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v))
    ).toString();
    return req<Doc[]>(`/documents${qs ? "?" + qs : ""}`);
  },
  createDocument: (payload: Partial<Doc>) =>
    req<Doc>("/documents", { method: "POST", body: JSON.stringify(payload) }),
  getDocument: (id: string) => req<Doc>(`/documents/${id}`),
  updateDocument: (id: string, payload: Partial<Doc>) =>
    req<Doc>(`/documents/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteDocument: (id: string) =>
    fetch(`${BASE}/documents/${id}`, { method: "DELETE" }),
  duplicateDocument: (id: string) =>
    req<Doc>(`/documents/${id}/duplicate`, { method: "POST" }),
  getCanvasState: () => req<{ documents: CanvasCard[] }>("/canvas/state"),
  updateCanvasPositions: (positions: { id: string; x: number; y: number }[]) =>
    req("/canvas/positions", { method: "PATCH", body: JSON.stringify(positions) }),
  search: (q: string) => req<Doc[]>(`/search?q=${encodeURIComponent(q)}`),
  backlinks: (id: string) =>
    req<{ id: string; title: string; mode: string }[]>(`/backlinks/${id}`),
  exportUrl: (id: string, format: "pdf" | "fountain" | "docx" | "txt") =>
    `${BASE}/documents/${id}/export/${format}`,
};
