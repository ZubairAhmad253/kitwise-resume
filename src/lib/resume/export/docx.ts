/**
 * A Word (.docx) version of a resume: a clean, single-column document
 * with real headings and bullet lists, which recruiters can edit and
 * applicant tracking systems read easily. Built in the browser.
 */
import { parseRichText, type Inline } from '../richtext';
import type { Resume } from '../types';
import { contactsOf, datesOf, visibleSectionsOf } from './text';
import { zip } from './zip';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Page size and margins in twentieths of a point. */
const PAGES = { A4: [11906, 16838], Letter: [12240, 15840], Legal: [12240, 20160] } as const;

function run(text: string, props = ''): string {
  return `<w:r>${props ? `<w:rPr>${props}</w:rPr>` : ''}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
}

function runs(nodes: Inline[], props = ''): string {
  return nodes
    .map((n) => {
      if (n.type === 'text') return run(n.text, props);
      if (n.type === 'bold') return runs(n.children, `${props}<w:b/>`);
      if (n.type === 'italic') return runs(n.children, `${props}<w:i/>`);
      const label = runs(n.children, `${props}<w:color w:val="1F5FBF"/><w:u w:val="single"/>`);
      const bare = n.href.replace(/^mailto:|^https?:\/\//, '');
      const text = n.children.map((c) => (c.type === 'text' ? c.text : '')).join('');
      return text === bare ? label : `${label}${run(` (${bare})`, props)}`;
    })
    .join('');
}

const para = (content: string, style?: string, extra = '') => `<w:p>${style || extra ? `<w:pPr>${style ? `<w:pStyle w:val="${style}"/>` : ''}${extra}</w:pPr>` : ''}${content}</w:p>`;
const bullet = (content: string) => para(content, 'ListBullet', '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>');

function description(source: string): string {
  return parseRichText(source)
    .map((b) => (b.type === 'paragraph' ? para(runs(b.children)) : b.items.map((it) => bullet(runs(it))).join('')))
    .join('');
}

function documentXml(r: Resume): string {
  const b = r.basics;
  const body: string[] = [para(run(b.name || 'Your Name'), 'Title')];
  if (b.headline) body.push(para(run(b.headline), 'Subtitle'));
  if (contactsOf(r).length) body.push(para(run(contactsOf(r).join('  |  ')), 'Contact'));
  if (b.summary) body.push(para(run('Summary'), 'Heading1'), description(b.summary));
  for (const s of visibleSectionsOf(r)) {
    body.push(para(run(s.title), 'Heading1'));
    if (s.kind === 'skills' || s.kind === 'languages') {
      for (const it of s.items) {
        const detail = s.kind === 'skills' ? it.tags.join(', ') : it.subtitle;
        body.push(para(`${run(it.title, '<w:b/>')}${detail ? run(`${it.title ? ': ' : ''}${detail}`) : ''}`));
        if (it.description) body.push(description(it.description));
      }
      continue;
    }
    for (const it of s.items) {
      body.push(para(`${run(it.title || '')}${it.subtitle ? run(` — ${it.subtitle}`, '<w:b w:val="0"/>') : ''}`, 'Heading2'));
      const meta = [datesOf(r, s, it), it.location].filter(Boolean).join('  ·  ');
      if (meta) body.push(para(run(meta), 'Meta'));
      if (it.tags.length) body.push(para(run(it.tags.join(', '), '<w:i/>')));
      if (it.url) body.push(para(run(it.url, '<w:color w:val="1F5FBF"/>')));
      if (it.description) body.push(description(it.description));
    }
  }
  const [w, h] = PAGES[r.settings.paper];
  const margin = 1020; // 18 mm
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body.join('')}<w:sectPr><w:pgSz w:w="${w}" w:h="${h}"/><w:pgMar w:top="${margin}" w:right="${margin}" w:bottom="${margin}" w:left="${margin}" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`;
}

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="21"/><w:szCs w:val="21"/><w:color w:val="222222"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="60" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="40"/></w:pPr><w:rPr><w:b/><w:sz w:val="44"/><w:color w:val="16213E"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:rPr><w:sz w:val="26"/><w:color w:val="1F5FBF"/></w:rPr></w:style>
<w:style w:type="paragraph" w:customStyle="1" w:styleId="Contact"><w:name w:val="Contact"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="200"/></w:pPr><w:rPr><w:color w:val="555F6D"/><w:sz w:val="19"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="80"/><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="2" w:color="C9D3DD"/></w:pBdr><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:caps/><w:spacing w:val="20"/><w:sz w:val="22"/><w:color w:val="16213E"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="140" w:after="0"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="22"/><w:color w:val="16213E"/></w:rPr></w:style>
<w:style w:type="paragraph" w:customStyle="1" w:styleId="Meta"><w:name w:val="Meta"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:after="40"/></w:pPr><w:rPr><w:color w:val="5F6B7D"/><w:sz w:val="19"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="ListBullet"><w:name w:val="List Bullet"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="30"/><w:ind w:left="357" w:hanging="357"/></w:pPr></w:style>
</w:styles>`;

const NUMBERING = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="357" w:hanging="357"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/></w:rPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>`;

export function toDocx(r: Resume): Uint8Array {
  const title = esc(r.basics.name ? `${r.basics.name} – Resume` : r.name);
  return zip([
    {
      name: '[Content_Types].xml',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`,
    },
    {
      name: '_rels/.rels',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`,
    },
    {
      name: 'docProps/core.xml',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${title}</dc:title><dc:creator>${esc(r.basics.name)}</dc:creator></cp:coreProperties>`,
    },
    {
      name: 'word/_rels/document.xml.rels',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/></Relationships>`,
    },
    { name: 'word/document.xml', data: documentXml(r) },
    { name: 'word/styles.xml', data: STYLES },
    { name: 'word/numbering.xml', data: NUMBERING },
  ]);
}
