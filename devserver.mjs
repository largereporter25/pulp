// Local-only dev server: serves the Vite build + runs the API handlers
// against Neon. This mirrors Vercel's serverless routing for QA.
import http from "node:http";
import fs from "node:fs";
// minimal .env loader (dev-only)
for (const line of fs.readFileSync(new URL("./.env", import.meta.url), "utf8").split("\n")) {
  const i = line.indexOf("=");
  if (i > 0) process.env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
}
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const PORT = 5050;

function send(res, code, body) {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(body === undefined ? "" : JSON.stringify(body));
}

async function readBody(req) {
  let data = "";
  for await (const c of req) data += c;
  return data ? JSON.parse(data) : {};
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const m = url.pathname.match(/^\/api\/documents\/?(.*)$/);
    if (!m) return send(res, 404, { error: "no route" });
    const id = m[1];

    if (!id) {
      if (req.method === "GET") {
        const rows = await sql`SELECT * FROM documents ORDER BY updated_at DESC`;
        return send(res, 200, rows);
      }
      if (req.method === "POST") {
        const b = await readBody(req);
        const rows = await sql`INSERT INTO documents (title, mode, content, synopsis)
          VALUES (${b.title ?? "Untitled"}, ${b.mode ?? "screenplay"}, ${JSON.stringify(b.content ?? [])}::jsonb, ${b.synopsis ?? ""})
          RETURNING *`;
        return send(res, 201, rows[0]);
      }
    } else {
      if (req.method === "GET") {
        const rows = await sql`SELECT * FROM documents WHERE id = ${id}`;
        return rows.length ? send(res, 200, rows[0]) : send(res, 404, { error: "nf" });
      }
      if (req.method === "PATCH" || req.method === "PUT") {
        const b = await readBody(req);
        const ex = await sql`SELECT * FROM documents WHERE id = ${id}`;
        if (!ex.length) return send(res, 404, { error: "nf" });
        const c = ex[0];
        const rows = await sql`UPDATE documents SET
          title=${b.title ?? c.title}, mode=${b.mode ?? c.mode},
          content=${b.content !== undefined ? JSON.stringify(b.content) : JSON.stringify(c.content)}::jsonb,
          synopsis=${b.synopsis ?? c.synopsis}, updated_at=now()
          WHERE id=${id} RETURNING *`;
        return send(res, 200, rows[0]);
      }
      if (req.method === "DELETE") {
        await sql`DELETE FROM documents WHERE id=${id}`;
        return send(res, 204);
      }
    }
    send(res, 405, { error: "method" });
  } catch (e) {
    console.error(e);
    send(res, 500, { error: String(e.message || e) });
  }
});

server.listen(PORT, () => console.log(`API dev shim on ${PORT}`));
