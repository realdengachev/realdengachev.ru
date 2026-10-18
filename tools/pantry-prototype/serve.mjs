// Локальный просмотр прототипа: npm run serve → http://127.0.0.1:5288
//   /             — интерактивный прототип (перетаскивание фото в папку)
//   /?demo        — сценарий скринкаста по кругу, в реальном времени
//   /?overlay     — эталон из Figma поверх вёрстки для сверки
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 5288);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };

http
  .createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    const file = path.join(ROOT, decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  })
  .listen(PORT, '127.0.0.1', () => console.log(`http://127.0.0.1:${PORT}`));
