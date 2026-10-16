// Serve the actual production build locally.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../www/', import.meta.url));
const port = Number(process.env.SANELLE_PREVIEW_PORT ?? 4300);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.pdf': 'application/pdf',
  '.gz': 'application/gzip',
};
await stat(path.join(root, 'index.html')); // Fail clearly if the app hasn't been built.
const server = createServer(async (request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405).end();
      return;
    }
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    let target = path.resolve(root, '.' + pathname);
    if (target !== path.resolve(root) && !target.startsWith(root)) {
      response.writeHead(403).end();
      return;
    }
    try {
      if (!(await stat(target)).isFile()) throw new Error('Not a file');
    } catch {
      // Missing scripts must be a 404, rather than HTML masquerading as JavaScript.
      if (path.extname(pathname)) {
        response.writeHead(404).end('Not found');
        return;
      }
      target = path.join(root, 'index.html');
    }
    const body = await readFile(target);
    response.writeHead(200, {
      'Content-Type': types[path.extname(target)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(400).end('Unable to load this page');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Sanelle preview: http://127.0.0.1:${port}/`));
process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
