import type { Document, ScreenplayElement, TextBlock } from "@shared/types";

// Convert a screenplay to Fountain — the open screenplay markup standard.
export function toFountain(doc: Document): string {
  const els = doc.content as ScreenplayElement[];
  const lines: string[] = [`Title: ${doc.title || "Untitled"}`, "", ""];
  for (const el of els) {
    const t = el.text.trim();
    if (!t) continue;
    switch (el.type) {
      case "scene":
        lines.push("", t.toUpperCase(), "");
        break;
      case "action":
        lines.push(t, "");
        break;
      case "character":
        lines.push(t.toUpperCase());
        break;
      case "parenthetical":
        lines.push(t.startsWith("(") ? t : `(${t})`);
        break;
      case "dialogue":
        lines.push(t, "");
        break;
      case "transition":
        lines.push("", `> ${t.toUpperCase()}`, "");
        break;
    }
  }
  return lines.join("\n");
}

export function toPlainText(doc: Document): string {
  if (doc.mode === "screenplay") {
    return (doc.content as ScreenplayElement[]).map((e) => e.text).join("\n");
  }
  return (doc.content as TextBlock[]).map((b) => b.text).join("\n");
}

export function download(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Print-to-PDF via a clean print window.
export function printPDF(doc: Document) {
  const w = window.open("", "_blank");
  if (!w) return;
  const isScript = doc.mode === "screenplay";
  let body = "";
  if (isScript) {
    for (const el of doc.content as ScreenplayElement[]) {
      const t = el.text.replace(/</g, "&lt;");
      if (!t.trim()) continue;
      body += `<p class="${el.type}">${t}</p>`;
    }
  } else {
    body = `<pre class="freeform">${toPlainText(doc).replace(/</g, "&lt;")}</pre>`;
  }
  w.document.write(`<!doctype html><html><head><title>${doc.title}</title>
  <style>
    @page { margin: 1in; }
    body { font-family: 'Courier New', monospace; font-size: 12pt; color:#111; max-width: 6.5in; margin: 0 auto; }
    h1 { text-align:center; font-size:16pt; margin-bottom: 2em; }
    p { margin: 0 0 0.5em; white-space: pre-wrap; }
    .scene { text-transform: uppercase; font-weight: bold; margin-top: 1.2em; }
    .action { }
    .character { text-transform: uppercase; margin-left: 2.2in; margin-top: 1em; }
    .parenthetical { margin-left: 1.6in; font-style: italic; }
    .dialogue { margin-left: 1in; margin-right: 1.5in; }
    .transition { text-transform: uppercase; text-align: right; margin-top: 1em; }
    .freeform { font-family: Georgia, serif; font-size: 13pt; white-space: pre-wrap; }
  </style></head><body>
  <h1>${doc.title || "Untitled"}</h1>${body}
  <script>window.onload=function(){window.print();}</script>
  </body></html>`);
  w.document.close();
}
