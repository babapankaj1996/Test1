"use client";

import { useRef, useState } from "react";

interface HtmlEditorProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function textToParagraphs(input: string): string {
  return input
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
    .join("\n\n");
}

function textToList(input: string, tag: "ul" | "ol"): string {
  const items = input
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .filter(Boolean);
  const safeItems = (items.length ? items : ["List item"]).map(
    (item) => `  <li>${escapeHtml(item)}</li>`
  );
  return `<${tag}>\n${safeItems.join("\n")}\n</${tag}>`;
}

export default function HtmlEditor({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 16,
}: HtmlEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);

  function replaceSelection(nextText: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value + nextText);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextValue = `${value.slice(0, start)}${nextText}${value.slice(end)}`;
    onChange(nextValue);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + nextText.length, start + nextText.length);
    });
  }

  function selectedText(): string {
    const textarea = textareaRef.current;
    if (!textarea) return "";
    return value.slice(textarea.selectionStart, textarea.selectionEnd);
  }

  function block(tag: "h1" | "h2" | "h3") {
    const selected = selectedText().trim();
    const fallback =
      tag === "h1" ? "Main heading" : tag === "h2" ? "Section heading" : "Subheading";
    replaceSelection(`<${tag}>${escapeHtml(selected || fallback)}</${tag}>\n\n`);
  }

  function paragraphs() {
    replaceSelection(`${textToParagraphs(selectedText() || "Paragraph text")}\n\n`);
  }

  function list(tag: "ul" | "ol") {
    replaceSelection(`${textToList(selectedText(), tag)}\n\n`);
  }

  function inline(tag: "strong" | "em") {
    const selected = selectedText().trim();
    replaceSelection(`<${tag}>${escapeHtml(selected || "text")}</${tag}>`);
  }

  function link() {
    const selected = selectedText().trim();
    replaceSelection(`<a href="https://example.com">${escapeHtml(selected || "link text")}</a>`);
  }

  const buttonCls = "btn-ghost !px-2.5 !py-1.5 text-xs";

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="block text-sm font-medium text-white/80">
          {label}
        </label>
        <button type="button" onClick={() => setPreview((next) => !next)} className={buttonCls}>
          {preview ? "Edit" : "Preview"}
        </button>
      </div>

      <div className="mb-2 flex flex-wrap gap-1.5">
        <button type="button" onClick={() => block("h1")} className={buttonCls}>H1</button>
        <button type="button" onClick={() => block("h2")} className={buttonCls}>H2</button>
        <button type="button" onClick={() => block("h3")} className={buttonCls}>H3</button>
        <button type="button" onClick={paragraphs} className={buttonCls}>P</button>
        <button type="button" onClick={() => list("ul")} className={buttonCls}>UL</button>
        <button type="button" onClick={() => list("ol")} className={buttonCls}>OL</button>
        <button type="button" onClick={() => inline("strong")} className={buttonCls}>B</button>
        <button type="button" onClick={() => inline("em")} className={buttonCls}>I</button>
        <button type="button" onClick={link} className={buttonCls}>Link</button>
        <button
          type="button"
          onClick={() => replaceSelection('<img src="/uploads/example.webp" alt="Image description" />\n\n')}
          className={buttonCls}
        >
          Img
        </button>
        <button
          type="button"
          onClick={() =>
            replaceSelection(`<blockquote>${escapeHtml(selectedText().trim() || "Quote text")}</blockquote>\n\n`)
          }
          className={buttonCls}
        >
          Quote
        </button>
        <button type="button" onClick={() => replaceSelection("<hr />\n\n")} className={buttonCls}>HR</button>
      </div>

      {preview ? (
        <div
          className="prose-content min-h-[18rem] rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3"
          dangerouslySetInnerHTML={{ __html: value || "<p></p>" }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="field min-h-[18rem] font-mono !text-[13px]"
          placeholder={placeholder}
          rows={rows}
        />
      )}
    </div>
  );
}
