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
├── lib/resume/            Resume data model, editing reducer, import checks, dates, rich text, examples
├── components/builder/    The builder app: editor forms, toolbar, autosave (useResume)
├── components/resume/     Page engine (usePagedLayout) and rich text
├── templates/             One folder per resume design, plus shared helpers and the registry
├── components/layout/     Header, footer, logo
├── components/ui/         Small shared UI (icons)
├── pages/                 index (landing), builder, 404, robots.txt
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

- The resume lives in React state and is saved to `localStorage` (`kitwise-resume:current`) half a second after each change. Nothing is sent to a server.
- **File → Download backup** saves the resume as JSON; **Open backup** loads one. Every file is checked and repaired by `normalizeResume` before it's used.
- `/builder?sample=<id>` opens an example (`software`, `fresher`, `mechanical`, `civil`, `doctor`, `driver`, `designer`, `finance`, `academic`), asking first if there's work to lose. Add `&template=<id>`, `&paper=A4|Letter|Legal` or `&fit=1` to pick the template, paper size or fit to one page.
- Descriptions use a small text format: lines starting with `- ` are bullets; `**bold**`, `*italic*` and `[link](https://…)` (see `lib/resume/richtext.ts`).

## Pages and PDF

- Every page is drawn at its real size in millimetres: **A4** 210 × 297, **US Letter** 215.9 × 279.4, **US Legal** 215.9 × 355.6.
- A template turns the resume into small **blocks** (a section heading, an entry header, each bullet). `usePagedLayout` renders them off-screen at the exact column width, measures each one and reads how much room every column has on page 1 and on later pages. `lib/resume/paginate.ts` then fills the pages: a heading or entry header is never left alone at the bottom of a page.
- Pages 2+ use the template's `margins.topNext`, so continued pages always have space at the top.
- **Fit to one page** reduces the text size in 3% steps down to 82%; if it still doesn't fit, the preview says so.
- **Download PDF** opens the browser's print dialog ("Save as PDF"). The print view is the same pages as the preview, with `@page` set to the paper size and no margins, so the PDF matches exactly and keeps real, selectable text and clickable links.

### Writing a template

A template (`src/templates/<id>/`) exports a `TemplateDef`: its margins, its columns (`main`, optionally `side`), a `build(resume)` function that returns the blocks for each column (use `sectionBlocks` from `templates/shared.tsx`), an optional page decoration (rails, bands) and a stylesheet scoped under its class. Sizes in the stylesheet are in `em`, relative to `calc(<size> * var(--kr-scale))`, so fit-to-page can scale them.

## Deployment

The build output in `dist/` is a fully static site. Pages are built as `name.html` and served at clean URLs (`/builder`); on Vercel, `vercel.json` turns on `cleanUrls` for this.

- build command: `npm run build`
- output directory: `dist`
- environment variables: none needed until you have a domain (then set `SITE_URL`)

## Roadmap

| # | Phase | Status |
|---|---|---|
| 0 | Setup: project, branding, landing page | Done |
| 1 | Resume data and editor: sections, reordering, autosave, sample content, backup and restore | Done |
| 2 | Page engine and PDF: live preview, A4 / US Letter / US Legal, page breaks with top padding on every new page, fit to page | Done |
| 3 | Templates 1–3 and 20: Software & Tech, Startups & Freshers | Done |
| 4 | Templates 4–8: Mechanical/Electrical and Civil Engineering | Done |
| 5 | Templates 9–12: Healthcare, Logistics/Drivers/Aviation | Done |
| 6 | Templates 13–19: Creative, Corporate/Finance, Academia/Legal | |
| 7 | Customising (colours, fonts, spacing, photo) and template gallery | |
| 8 | Writing helpers: phrase library, ATS checks, completeness score | |
| 9 | Multiple resumes and more exports | |
| 10 | Site pages and SEO: template pages, resume examples, blog, legal pages | |
| 11 | QA and launch prep | |
| Later | Cover letters, Arabic (right-to-left), Word export, ads, accounts and paid features | |
