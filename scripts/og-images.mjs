// Builds the link-preview cards (src/pages/og-card) and screenshots each
// one into public/og/<slug>.jpg with headless Microsoft Edge or Chrome.
// Run `npm run og` after adding a template, example or blog post.
import { execSync, spawn } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';
import { tmpdir } from 'node:os';

const OUT = '.og-build';
const BROWSERS = [
  process.env.BROWSER,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const browser = BROWSERS.find((b) => existsSync(b));
if (!browser) throw new Error('No Edge or Chrome found; set BROWSER to its path.');

execSync(`npx astro build --outDir ${OUT}`, { stdio: 'inherit', env: { ...process.env, OG_CARDS: '1' } });

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = createServer((req, res) => {
  let p = join(OUT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  else if (!existsSync(p) && existsSync(`${p}.html`)) p = `${p}.html`;
  if (!existsSync(p)) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': TYPES[extname(p)] ?? 'application/octet-stream' });
  createReadStream(p).pipe(res);
}).listen(0);
const port = server.address().port;

mkdirSync('public/og', { recursive: true });
const slugs = readdirSync(join(OUT, 'og-card')).map((f) => f.replace(/\.html$/, '').replace(/\/$/, ''));
for (const slug of slugs) {
  const profile = join(tmpdir(), `kr-og-${process.pid}`);
  const args = ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${profile}`, '--window-size=1200,630', '--virtual-time-budget=6000', `--screenshot=${join(process.cwd(), 'public/og', `${slug}.jpg`)}`, `http://localhost:${port}/og-card/${slug}`];
  // Async, so this process keeps serving the page while the browser loads it.
  const status = await new Promise((done) => {
    const p = spawn(browser, args);
    const timer = setTimeout(() => p.kill(), 90000);
    p.on('exit', (code) => {
      clearTimeout(timer);
      done(code);
    });
  });
  if (status !== 0) console.warn(`failed: ${slug}`);
  else console.log(`public/og/${slug}.jpg`);
}
server.close();
rmSync(OUT, { recursive: true, force: true });
