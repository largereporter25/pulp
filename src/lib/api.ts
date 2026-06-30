const BASE = '/api/v2';

export interface Document {
  id: string;
  title: string;
  mode: 'screenplay' | 'prose' | 'poem' | 'song' | 'notes';
  content: string;
  synopsis: string;
  tags: string[];
  canvas_x: number;
  canvas_y: number;
  word_count: number;
  page_count: number;
  created_at: string;
  updated_at: string;
}

export interface CanvasDoc {
  id: string;
  title: string;
  mode: string;
  x: number;
  y: number;
  word_count: number;
  page_count: number;
  updated_at: string;
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${method} ${path} → ${res.status}`);
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  listDocuments: (params?: { mode?: string; q?: string; tag?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return req<Document[]>('GET', `/documents${qs ? '?' + qs : ''}`);
  },
  createDocument: (data: Partial<Document>) =>
    req<Document>('POST', '/documents', data),
  getDocument: (id: string) => req<Document>('GET', `/documents/${id}`),
  updateDocument: (id: string, data: Partial<Document>) =>
    req<Document>('PATCH', `/documents/${id}`, data),
  deleteDocument: (id: string) => req<void>('DELETE', `/documents/${id}`),
  duplicateDocument: (id: string) =>
    req<Document>('POST', `/documents/${id}/duplicate`),

  getCanvasState: () => req<{ documents: CanvasDoc[] }>('GET', '/canvas/state'),
  updateCanvasPositions: (positions: { id: string; x: number; y: number }[]) =>
    req<{ updated: number }>('PATCH', '/canvas/positions', positions),

  search: (q: string) => req<Document[]>('GET', `/search?q=${encodeURIComponent(q)}`),
  backlinks: (id: string) =>
    req<{ id: string; title: string; mode: string }[]>('GET', `/backlinks/${id}`),

  exportUrl: (id: string, format: 'pdf' | 'fountain' | 'docx' | 'txt') =>
    `${BASE}/documents/${id}/export/${format}`,
};
