# Kitwise Resume

A free online resume builder in the **Kitwise** family of tool websites. Pick a modern template, fill in your details and download a print-ready PDF in A4, US Letter or US Legal size.

- **No sign-up, no payment.** Everything runs in your browser.
- **Private by design.** Your resume is saved on your own device, never uploaded.
- **Real PDFs.** Text stays selectable and readable by applicant tracking systems (ATS).

> The name, tagline, logo and sharing image are set in [`src/config/site.ts`](src/config/site.ts); change them there and they update everywhere.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | [Astro 7](https://astro.build) | Static HTML for the marketing pages, fast and good for SEO |
| Builder app | React 19 (Astro island) | The editor and live preview run in the browser |
| Styling | Tailwind CSS 4 | Design tokens in `src/styles/global.css`, light and dark mode |
| Tests | Vitest | Pure logic (data model, pagination) is unit-tested |
| Hosting | Any static host (Vercel, Cloudflare Pages, Netlify) | No server or database |

## Getting started

Requires Node.js 22.12 or newer.

```bash
npm install
npm run dev       # http://localhost:4321
npm test          # unit tests
npm run build     # type-check, then build the static site into dist/
npm run preview   # serve the production build
```

### Troubleshooting

**Widgets appear, then disappear, in `npm run dev`** with `_jsxDEV is not a function` in the console: the browser is running a production copy of React against dev code. `astro.config.mjs` keeps separate Vite caches for `astro dev` (`node_modules/.vite-dev`) and everything else (`node_modules/.vite-build`) to prevent this. If it ever happens, run `npm run dev -- --force`, then in the browser open DevTools (F12), right-click the reload button and choose **Empty cache and hard reload**.

### Environment variables

Copy `.env.example` to `.env`:

| Variable | Purpose |
|---|---|
| `SITE_URL` | Production URL, used for canonical links, the sitemap and `robots.txt`, e.g. `https://example.com` (`https://` is added if you leave it out). If it's unset or blank, Vercel builds use the project's `*.vercel.app` address, and local builds use `https://example.com`. |
| `PUBLIC_ADSENSE_CLIENT` | AdSense publisher ID (`ca-pub-…`), once ads are approved. |

## Project structure

```
src/
├── config/site.ts         Site name, tagline, brand assets, AdSense ID
├── layouts/BaseLayout     <head>, SEO tags, header and footer ("app" variant for the builder)
├── lib/resume/            Resume data model, editing reducer, checks, dates, rich text, examples,
│                          library (saved resumes), design settings, import/, export/, assist/
├── lib/site/catalog.ts    What the site pages show: example per template, fields, example tips
├── components/builder/    The builder app: editor forms, toolbar, panels, autosave (useResume)
├── components/resume/     Page engine (usePagedLayout), thumbnails and rich text
├── components/site/       Static page previews for the site pages (rendered at build time)
├── content/blog/          Blog posts (Markdown, schema in content.config.ts)
├── templates/             One folder per resume design, plus shared helpers and the registry
├── components/layout/     Header, footer, logo
├── components/ui/         Small shared UI (icons)
├── pages/                 landing, builder, templates (+ one page each), examples (+ one each),
│                          blog, privacy, terms, contact, 404, robots.txt
└── styles/global.css      Tailwind setup and design tokens
public/                    favicon, app icons, link-preview image, web manifest
```

### Brand assets

Every Kitwise site shares the mark (three white tiles and one round teal "key"); the key's position marks the product. On Kitwise Resume it sits top right.

| File | Use |
|---|---|
| `public/favicon.svg` | Logo mark: browser tab icon, and the source for every other icon |
| `src/components/layout/Logo.astro` | The same mark inline, with the wordmark, in the header and footer |
| `public/favicon.ico` | 16/32/48 px icon for older browsers and crawlers |
| `public/apple-touch-icon.png` | 180 px home-screen icon for iPhone and iPad |
| `public/icon-192.png`, `public/icon-512.png` | Android and search-engine icons (also listed in `site.webmanifest`) |
| `public/og-image.jpg` | 1200 × 630 default image for links shared on WhatsApp, X, Facebook and LinkedIn |

## How the builder stores data

- Every resume is saved to `localStorage` half a second after each change: one key per resume (`kitwise-resume:doc:<id>`) plus an index for the **My resumes** list (`kitwise-resume:library`). The single resume saved by earlier versions (`kitwise-resume:current`) is moved in on first load. Nothing is sent to a server (`lib/resume/library.ts`).
- Examples, imports and backups open as new resumes, so nothing already saved is replaced. **My resumes** switches between them, duplicates one to tailor for another job, or deletes one.
- **File → Download as** Word (.docx), plain text or Markdown (`lib/resume/export/`; the Word file is built in the browser with a small ZIP writer). **Download backup** saves the resume as JSON and **Open backup** loads one. Every file is checked and repaired by `normalizeResume` before it's used.
- `/builder?sample=<id>` opens an example as a new resume (`software`, `fresher`, `mechanical`, `civil`, `doctor`, `driver`, `designer`, `finance`, `academic`). Add `&template=<id>`, `&paper=A4|Letter|Legal` or `&fit=1` to pick the template, paper size or fit to one page.
- Descriptions use a small text format: lines starting with `- ` are bullets; `**bold**`, `*italic*` and `[link](https://…)` (see `lib/resume/richtext.ts`).

## Pages and PDF

- Every page is drawn at its real size in millimetres: **A4** 210 × 297, **US Letter** 215.9 × 279.4, **US Legal** 215.9 × 355.6.
- A template turns the resume into small **blocks** (a section heading, an entry header, each bullet). `usePagedLayout` renders them off-screen at the exact column width, measures each one and reads how much room every column has on page 1 and on later pages. `lib/resume/paginate.ts` then fills the pages: a heading or entry header is never left alone at the bottom of a page.
- Pages 2+ use the template's `margins.topNext`, so continued pages always have space at the top.
- **Fit to one page** reduces the text size in 3% steps down to 82%; if it still doesn't fit, the preview says so.
- **Download PDF** opens the browser's print dialog ("Save as PDF"). The print view is the same pages as the preview, with `@page` set to the paper size and no margins, so the PDF matches exactly and keeps real, selectable text and clickable links.

### Importing an existing CV

"Import CV" in the builder (or `/builder?import=1`) reads a PDF, Word (.docx) or text file, or pasted text, in the browser: nothing is uploaded. The code is in `src/lib/resume/import/`:

- `extract.ts` reads the file (pdf.js for PDF, mammoth for Word; both load only when a file is chosen).
- `pdf-lines.ts` rebuilds lines from a PDF's positioned text: two-column layouts are read one column at a time (main text first, sidebar after), a box beside the name is read separately, letter-spacing is undone and wrapped lines are joined.
- `parse.ts` turns lines into a resume: section headings, contact details, date ranges, entries (title, employer, place, dates, bullets), skills groups and languages.

The review screen shows what was found and a preview in the user's current template; their template, paper and design settings are kept.

To check the importer against real files, put PDFs in a folder and run `CV_FIXTURES=<folder> npx vitest run pdf-fixtures --silent=false` (add `CV_LINES=1` to see the rebuilt lines).

### Writing helpers

- **Ideas** (on the summary and on experience, project and volunteering descriptions) inserts ready-made wording from `src/lib/resume/assist/phrases.ts`: bullet points and summary starters for 12 fields, with the parts to personalise in [square brackets]. The field is guessed from the job title.
- **Check** (next to Design) scores the resume out of 100 and lists what to fix and improve: missing details, dates, bullet points that don't start with a verb or have no numbers, leftover [placeholders], "I/my" in bullets, too few skills, non-standard headings, length, and a photo on US paper. Pasting a job ad shows which of its key words the resume uses and which are missing. All of it runs in the browser (`src/lib/resume/assist/review.ts`).

### Writing a template

A template (`src/templates/<id>/`) exports a `TemplateDef`: its margins, its columns (`main`, optionally `side`), a `build(resume)` function that returns the blocks for each column (use `sectionBlocks` from `templates/shared.tsx`), an optional page decoration (rails, bands) and a stylesheet scoped under its class. Sizes in the stylesheet are in `em`, relative to `calc(<size> * var(--kr-scale))`, so fit-to-page and the text size setting can scale them.

Two more things make a template work with the Design panel:

- `accent` lists the CSS custom properties that take the user's accent colour (and any light tints of it), plus the template's own colour for the "default" swatch.
- Gaps between blocks (`margin-bottom` and padding on `.kr-b--*` and `.kr-end-*`) are written as `calc(<gap> * var(--kr-space))`, so the Spacing setting can tighten or loosen them.

## Deployment

The build output in `dist/` is a fully static site. Pages are built as `name.html` and served at clean URLs (`/builder`); on Vercel, `vercel.json` turns on `cleanUrls` for this.

- build command: `npm run build`
- output directory: `dist`
- environment variables: none needed until you have a domain (then set `SITE_URL`)

`vercel.json` also sets basic security headers (no MIME sniffing, strict referrer, no camera/microphone/location access, no framing by other sites) and long-term caching for the hashed files in `/_astro/`.

### Launch checklist

When the domain is ready:

1. Add the domain in Vercel, then set `SITE_URL` (e.g. `https://kitwise.example`) in the project's environment variables and redeploy. Canonical links, the sitemap and link previews use it.
2. Replace the placeholder email `hello@example.com` in `src/config/site.ts` (it appears on the contact, privacy and terms pages).
3. Submit `/sitemap-index.xml` in Google Search Console and Bing Webmaster Tools.
4. For ads: set `PUBLIC_ADSENSE_CLIENT`, and update the privacy page (cookies and consent) before switching them on.
5. Check the builder once on the live site: import a PDF, download a PDF, a Word file and a backup.

### Quality checks

- `npm test`: unit tests for the data model, page breaks, templates, design settings, CV import, writing helpers, resume library and exports.
- `npm run build` runs `astro check` (types) first.
- Before each release, every page was checked for broken internal links and for errors in the browser console.

## Roadmap

| # | Phase | Status |
|---|---|---|
| 0 | Setup: project, branding, landing page | Done |
| 1 | Resume data and editor: sections, reordering, autosave, sample content, backup and restore | Done |
| 2 | Page engine and PDF: live preview, A4 / US Letter / US Legal, page breaks with top padding on every new page, fit to page | Done |
| 3 | Templates 1–3 and 20: Software & Tech, Startups & Freshers | Done |
| 4 | Templates 4–8: Mechanical/Electrical and Civil Engineering | Done |
| 5 | Templates 9–12: Healthcare, Logistics/Drivers/Aviation | Done |
| 6 | Templates 13–19: Creative, Corporate/Finance, Academia/Legal | Done |
| 7 | Customising (colours, fonts, spacing, photo) and template gallery | Done |
| 8 | Import an existing CV: upload a PDF, Word or text file and it fills the editor, ready for any template | Done |
| 9 | Writing helpers: phrase library, ATS checks, completeness score | Done |
| 10 | Multiple resumes and more exports | Done |
| 11 | Site pages and SEO: template pages, resume examples, blog, legal pages | Done |
| 12 | QA and launch prep | Done |
| Later | Cover letters, Arabic (right-to-left), ads, accounts and paid features | |
