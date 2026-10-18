// Перезапись скринкаста кейса Pantry для ленты на сайте.
// Сам раздаёт папку прототипа, проигрывает demo-цикл на виртуальных часах
// (шаг ровно 1/60 с, без пропущенных кадров) и кодирует H.264.
//
//   cd tools/pantry-prototype && npm install && npm run record
//
// Результат: public/video/pantry.mp4 и src/assets/img/pantry-poster.png.
// Chrome по умолчанию — /Applications/Google Chrome.app, иначе CHROME_PATH=...

import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(ROOT, '../..');
const VIDEO_OUT = path.join(SITE, 'public/video/pantry.mp4');
const POSTER_OUT = path.join(SITE, 'src/assets/img/pantry-poster.png');
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const FPS = 60;
const DSF = 2; // 385×819 → 770×1638, затем даунскейл до 540×1148 (сглаживание)
const SIZE = '540:1148';
const POSTER_FRAME = 110; // экран собран, касания ещё нет

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const file = path.join(ROOT, decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const { port } = server.address();

const frames = fs.mkdtempSync(path.join(os.tmpdir(), 'pantry-frames-'));
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--hide-scrollbars', '--force-color-profile=srgb', '--ignore-gpu-blocklist'],
  defaultViewport: { width: 385, height: 819, deviceScaleFactor: DSF },
});

try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error('[page]', e.message));
  await page.goto(`http://127.0.0.1:${port}/?demo&record`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__demo?.ready === true, { timeout: 20000 });
  const cycle = await page.evaluate(() => window.__demo.cycle);
  const total = Math.round((cycle / 1000) * FPS);
  console.log(`Цикл ${cycle} мс → ${total} кадров`);

  await page.evaluate(() => window.__demo.go());
  const cdp = await page.createCDPSession();
  for (let i = 0; i < total; i++) {
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(frames, `f${String(i).padStart(4, '0')}.png`), Buffer.from(data, 'base64'));
    await page.evaluate((ms) => window.__clock.step(ms), 1000 / FPS);
    if (i % 60 === 0) process.stdout.write(`  кадр ${i}/${total}\r`);
  }
  console.log(`  кадров записано: ${total}   `);
} finally {
  await browser.close();
  server.close();
}

fs.mkdirSync(path.dirname(VIDEO_OUT), { recursive: true });
execFileSync(ffmpeg, [
  '-hide_banner', '-loglevel', 'error', '-y',
  '-framerate', String(FPS), '-i', path.join(frames, 'f%04d.png'),
  '-vf', `scale=${SIZE}:flags=lanczos,format=yuv420p`,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-profile:v', 'high', '-tag:v', 'avc1',
  '-movflags', '+faststart', '-an', VIDEO_OUT,
]);
execFileSync(ffmpeg, [
  '-hide_banner', '-loglevel', 'error', '-y',
  '-i', path.join(frames, `f${String(POSTER_FRAME).padStart(4, '0')}.png`),
  '-vf', `scale=${SIZE}:flags=lanczos`, POSTER_OUT,
]);
fs.rmSync(frames, { recursive: true, force: true });

console.log(`Видео:  ${path.relative(SITE, VIDEO_OUT)} (${(fs.statSync(VIDEO_OUT).size / 1024).toFixed(0)} КБ)`);
console.log(`Постер: ${path.relative(SITE, POSTER_OUT)}`);
