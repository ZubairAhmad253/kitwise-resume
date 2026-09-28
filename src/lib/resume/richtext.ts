/**
 * The small text format used in summaries and descriptions. It's plain text
 * that stays readable in a backup file:
 *   - lines starting with "- " or "• " are bullet points
 *   - **bold**, *italic* and [link text](https://…)
 *   - a blank line starts a new paragraph
 * Parsing returns a tree the templates render; no HTML is ever injected.
 */

export type Inline = { type: 'text'; text: string } | { type: 'bold'; children: Inline[] } | { type: 'italic'; children: Inline[] } | { type: 'link'; href: string; children: Inline[] };

export type Block = { type: 'paragraph'; children: Inline[] } | { type: 'list'; items: Inline[][] };

const BULLET = /^\s*(?:[-•*]|•)\s+/;

/** Only web and mail links are kept; anything else is shown as plain text. */
export function safeHref(href: string): string | null {
  const h = href.trim();
  if (/^mailto:[^\s]+$/i.test(h)) return h;
  if (/^https?:\/\/[^\s]+$/i.test(h)) return h;
  if (/^[\w-]+(\.[\w-]+)+(\/[^\s]*)?$/.test(h)) return `https://${h}`;
  return null;
}

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let i = 0;
  let buf = '';
  const flush = () => {
    if (buf) out.push({ type: 'text', text: buf });
    buf = '';
  };
  while (i < text.length) {
    if (text.startsWith('**', i)) {
      const end = text.indexOf('**', i + 2);
      if (end > i + 2) {
        flush();
        out.push({ type: 'bold', children: parseInline(text.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    }
    if (text[i] === '*' && text[i + 1] !== '*' && text[i + 1] !== ' ') {
      const end = text.indexOf('*', i + 1);
      if (end > i + 1 && text[end - 1] !== ' ') {
        flush();
        out.push({ type: 'italic', children: parseInline(text.slice(i + 1, end)) });
        i = end + 1;
        continue;
      }
    }
    if (text[i] === '[') {
      const close = text.indexOf('](', i);
      const end = close > -1 ? text.indexOf(')', close + 2) : -1;
      if (close > i && end > close) {
        const href = safeHref(text.slice(close + 2, end));
        if (href) {
          flush();
          out.push({ type: 'link', href, children: parseInline(text.slice(i + 1, close)) });
          i = end + 1;
          continue;
        }
      }
    }
    buf += text[i];
    i++;
  }
  flush();
  return out;
}

export function parseRichText(source: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: string[] = [];
  const endPara = () => {
    if (para.length) blocks.push({ type: 'paragraph', children: parseInline(para.join(' ')) });
    para = [];
  };
  const endList = () => {
    if (list.length) blocks.push({ type: 'list', items: list.map(parseInline) });
    list = [];
  };
  for (const raw of source.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim();
    if (!line) {
      endPara();
      endList();
    } else if (BULLET.test(raw)) {
      endPara();
      list.push(raw.replace(BULLET, '').trim());
    } else {
      endList();
      para.push(line);
    }
  }
  endPara();
  endList();
  return blocks;
}

/** Plain text of a rich-text value (for ATS text export and checks). */
export function plainText(source: string): string {
  const inline = (nodes: Inline[]): string => nodes.map((n) => (n.type === 'text' ? n.text : inline(n.children))).join('');
  return parseRichText(source)
    .map((b) => (b.type === 'paragraph' ? inline(b.children) : b.items.map((it) => `• ${inline(it)}`).join('\n')))
    .join('\n');
}
