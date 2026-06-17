import type { Document, ScreenplayElement, TextBlock, TitlePage } from "@shared/types";

export function toFountain(doc: Document, tp?: TitlePage): string {
  const els = doc.content as ScreenplayElement[];
  const lines: string[] = [];
  // Title page front matter (Fountain spec)
  lines.push(`Title: ${tp?.title || doc.title || "Untitled"}`);
  if (tp?.author) lines.push(`Author: ${tp.author}`);
  if (tp?.basedOn) lines.push(`Source: ${tp.basedOn}`);
  if (tp?.draftDate) lines.push(`Draft date: ${tp.draftDate}`);
  if (tp?.contact) lines.push(`Contact: ${tp.contact.replace(/\n/g, ", ")}`);
  lines.push("", "");

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

export function printPDF(doc: Document, tp?: TitlePage) {
  const w = window.open("", "_blank");
  if (!w) return;
  const isScript = doc.mode === "screenplay";
  let body = "";
  let titlePage = "";

  if (isScript && tp && (tp.title || tp.author || doc.title)) {
    titlePage = `
      <section class="titlepage">
        <div class="tp-center">
          <h1>${(tp.title || doc.title || "Untitled").replace(/</g, "&lt;").toUpperCase()}</h1>
          <p class="byline">written by</p>
          <p class="author">${(tp.author || "").replace(/</g, "&lt;")}</p>
          ${tp.basedOn ? `<p class="basedon">${tp.basedOn.replace(/</g, "&lt;")}</p>` : ""}
        </div>
        <div class="tp-foot">
          ${tp.draftDate ? `<p>${tp.draftDate.replace(/</g, "&lt;")}</p>` : ""}
          ${tp.contact ? `<p>${tp.contact.replace(/</g, "&lt;").replace(/\n/g, "<br>")}</p>` : ""}
        </div>
      </section>`;
  }

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
    @page { margin: 1in; size: letter; }
    body { font-family: 'Courier New', Courier, monospace; font-size: 12pt; color:#111; max-width: 6in; margin: 0 auto; line-height: 1; }
    .titlepage { height: 9in; display: flex; flex-direction: column; justify-content: center; page-break-after: always; position: relative; }
    .tp-center { text-align: center; }
    .titlepage h1 { font-size: 14pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0; }
    .byline { margin: 1.5em 0 0.5em; }
    .author { font-size: 12pt; margin: 0; }
    .basedon { font-style: italic; margin-top: 1em; font-size: 11pt; }
    .tp-foot { position: absolute; bottom: 0; left: 0; font-size: 11pt; }
    .tp-foot p { margin: 0.2em 0; }
    p { margin: 0 0 0.5em; white-space: pre-wrap; }
    .scene { text-transform: uppercase; font-weight: bold; margin-top: 1.2em; }
    .character { text-transform: uppercase; margin-left: 2.2in; margin-top: 1em; }
    .parenthetical { margin-left: 1.6in; margin-right: 1.8in; }
    .dialogue { margin-left: 1in; margin-right: 1.5in; }
    .transition { text-transform: uppercase; text-align: right; margin-top: 1em; }
    .freeform { font-family: Georgia, serif; font-size: 13pt; white-space: pre-wrap; line-height: 1.5; }
  </style></head><body>
  ${titlePage}${body}
  <script>window.onload=function(){setTimeout(function(){window.print();},250);}</script>
  </body></html>`);
  w.document.close();
}
