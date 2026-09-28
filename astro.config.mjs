// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

/**
 * The public address of the site. Canonical URLs, the sitemap and Open
 * Graph tags are all built from it. In order of preference:
 * 1. SITE_URL (set this to the real domain when it's live)
 * 2. on Vercel, the project's production address (VERCEL_PROJECT_PRODUCTION_URL)
 * 3. a placeholder for local builds
 * A bare hostname gets https:// added, a blank value is ignored, and
 * anything that still isn't a web address stops the build with a clear message.
 */
function siteUrl() {
  const candidates = [
    ['SITE_URL', process.env.SITE_URL],
    ['VERCEL_PROJECT_PRODUCTION_URL', process.env.VERCEL_PROJECT_PRODUCTION_URL],
  ];
  for (const [name, raw] of candidates) {
    const value = (raw ?? '').trim().replace(/^["']|["']$/g, '');
    if (!value) continue;
    const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try {
      const url = new URL(withScheme);
      if (url.hostname.includes('.') || url.hostname === 'localhost') return url.origin;
    } catch {
      // Reported below.
    }
    throw new Error(`${name} must be a web address like https://example.com, but it is "${raw}".`);
  }
  return 'https://example.com';
}

// Only `astro dev` uses the dev Vite cache, in its own folder; build, check
// and preview use another. Sharing one lets a production run overwrite the
// dev server's pre-bundled React ("_jsxDEV is not a function"), and browsers
// keep those files for a year, so the folder names must stay distinct.
const isDev = process.argv.includes('dev');

export default defineConfig({
  site: siteUrl(),
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    cacheDir: isDev ? 'node_modules/.vite-dev' : 'node_modules/.vite-build',
  },
});
