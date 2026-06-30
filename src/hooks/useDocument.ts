import { useState, useEffect, useCallback } from "react";
import { api, Doc } from "../lib/api";

export function useDocuments() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setDocs(await api.listDocuments());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return { docs, loading, refresh };
}

export function useDocument(id: string) {
  const [doc, setDoc] = useState<Doc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (!id) return;
    api.getDocument(id).then(d => { setDoc(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const save = useCallback(async (payload: Partial<Doc>) => {
    if (!id) return;
    setSaving(true);
    try {
      const updated = await api.updateDocument(id, payload);
      setDoc(updated);
      setLastSaved(new Date());
    } finally { setSaving(false); }
  }, [id]);

  return { doc, loading, saving, lastSaved, save };
}
