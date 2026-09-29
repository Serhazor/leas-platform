import { Fragment, type ReactNode } from "react";

/**
 * Renders the simple text format used in the admin:
 *  - blank line  => new paragraph
 *  - "- item"    => bullet list
 *  - "## Titre"  => sub-heading
 *  - URLs and e-mail addresses become links
 * No HTML is ever interpreted, so owner content cannot break the page.
 */
type Block = { type: "p"; lines: string[] } | { type: "ul"; items: string[] } | { type: "h"; text: string };

function parse(source: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ type: "p", lines: para });
    if (list.length) blocks.push({ type: "ul", items: list });
    para = [];
    list = [];
  };
  for (const raw of source.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) {
      flush();
    } else if (line.startsWith("## ") || line.startsWith("### ")) {
      flush();
      blocks.push({ type: "h", text: line.replace(/^#+\s*/, "") });
    } else if (/^[-•*]\s+/.test(line)) {
      if (para.length) {
        blocks.push({ type: "p", lines: para });
        para = [];
      }
      list.push(line.replace(/^[-•*]\s+/, ""));
    } else {
      if (list.length) {
        blocks.push({ type: "ul", items: list });
        list = [];
      }
      para.push(line);
    }
  }
  flush();
  return blocks;
}

const LINK_RE = /(https?:\/\/[^\s)]+[^\s).,;:!?]|[\w.+-]+@[\w-]+\.[\w.-]+[a-z])/gi;

function linkify(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK_RE)) {
    const value = match[0];
    const index = match.index ?? 0;
    if (index > last) out.push(text.slice(last, index));
    const isEmail = !value.startsWith("http");
    out.push(
      <a
        key={index}
        href={isEmail ? `mailto:${value}` : value}
        {...(isEmail ? {} : { target: "_blank", rel: "noopener noreferrer" })}
      >
        {value.replace(/^https?:\/\//, "")}
      </a>,
    );
    last = index + value.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function RichText({
  text,
  className = "prose-site",
  headingLevel = 2,
}: {
  text: string;
  className?: string;
  headingLevel?: 2 | 3;
}) {
  if (!text?.trim()) return null;
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <div className={className}>
      {parse(text).map((b, i) => {
        if (b.type === "h") return <H key={i}>{b.text}</H>;
        if (b.type === "ul")
          return (
            <ul key={i}>
              {b.items.map((item, j) => (
                <li key={j}>{linkify(item)}</li>
              ))}
            </ul>
          );
        return (
          <p key={i}>
            {b.lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {linkify(l)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

/** Plain-text excerpt of the rich text (for meta descriptions, cards). */
export function plainText(text: string, max = 160): string {
  const flat = text.replace(/^#+\s*/gm, "").replace(/^[-•*]\s+/gm, "").replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1).replace(/\s+\S*$/, "")}…` : flat;
}
