'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };
const allowed = new Set(['index.html', 'styles.css', 'app.js', 'game.js', 'scene.js', 'achievements.js', 'skills.js', 'panels.js', 'audio.js', 'celebration.js']);
const server = http.createServer((req, res) => {
  let name;
  try { name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\//, '') || 'index.html'; }
  catch (_) { res.writeHead(400); res.end('Bad request'); return; }
  if (!allowed.has(name)) { res.writeHead(404); res.end('Not found'); return; }
  fs.readFile(path.join(root, name), (error, data) => {
    if (error) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(name)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(4173, '127.0.0.1', () => console.log('Ember Hollow is ready: http://127.0.0.1:4173'));
