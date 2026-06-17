import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../_db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: "Missing id" });

  try {
    if (req.method === "GET") {
      const rows = await sql`
        SELECT id, title, mode, content, synopsis, created_at, updated_at
        FROM documents WHERE id = ${id}
      `;
      if (!rows.length) return res.status(404).json({ error: "Not found" });
      return res.status(200).json(rows[0]);
    }

    if (req.method === "PATCH" || req.method === "PUT") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
      const existing = await sql`SELECT * FROM documents WHERE id = ${id}`;
      if (!existing.length) return res.status(404).json({ error: "Not found" });
      const cur = existing[0];

      const title = body.title ?? cur.title;
      const mode = body.mode ?? cur.mode;
      const content =
        body.content !== undefined ? JSON.stringify(body.content) : JSON.stringify(cur.content);
      const synopsis = body.synopsis ?? cur.synopsis;

      const rows = await sql`
        UPDATE documents
        SET title = ${title}, mode = ${mode}, content = ${content}::jsonb,
            synopsis = ${synopsis}, updated_at = now()
        WHERE id = ${id}
        RETURNING id, title, mode, content, synopsis, created_at, updated_at
      `;
      return res.status(200).json(rows[0]);
    }

    if (req.method === "DELETE") {
      await sql`DELETE FROM documents WHERE id = ${id}`;
      return res.status(204).end();
    }

    res.setHeader("Allow", "GET, PATCH, PUT, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    console.error("documents/[id] error", err);
    return res.status(500).json({ error: err?.message ?? "Server error" });
  }
}
