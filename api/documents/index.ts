import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../_db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "GET") {
      const rows = await sql`
        SELECT id, title, mode, content, synopsis, created_at, updated_at
        FROM documents
        ORDER BY updated_at DESC
      `;
      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
      const title = body.title ?? "Untitled";
      const mode = body.mode ?? "screenplay";
      const content = JSON.stringify(body.content ?? []);
      const synopsis = body.synopsis ?? "";

      const rows = await sql`
        INSERT INTO documents (title, mode, content, synopsis)
        VALUES (${title}, ${mode}, ${content}::jsonb, ${synopsis})
        RETURNING id, title, mode, content, synopsis, created_at, updated_at
      `;
      return res.status(201).json(rows[0]);
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    console.error("documents/index error", err);
    return res.status(500).json({ error: err?.message ?? "Server error" });
  }
}
