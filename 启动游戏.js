#!/usr/bin/env node
/* 土豆史诗 · 一键启动器（Node.js 版）
   双击「启动游戏.bat」时若没装 Python 会自动走这里。
   或命令行: node 启动游戏.js
*/
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const ROOT = __dirname;
const PORTS = [8080, 8081, 8082, 8888, 9000, 9123];
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4', '.mp3': 'audio/mpeg', '.wasm': 'application/wasm',
};

function pickPort() {
  const net = require('net');
  for (const p of PORTS) {
    const s = net.createServer();
    let ok = true;
    try { s.listen(p, '127.0.0.1'); } catch (e) { ok = false; }
    if (ok) { s.close(); return p; }
  }
  return 0;
}

const port = pickPort();
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(ROOT, path.normalize(p).replace(/^(\.\.[/\\])+/, ''));
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('404'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(port, '127.0.0.1', () => {
  const actual = server.address().port;
  const url = `http://127.0.0.1:${actual}/index.html`;
  console.log('='.repeat(56));
  console.log('  土豆史诗 · 本地启动器');
  console.log('='.repeat(56));
  console.log(`  游戏地址: ${url}`);
  console.log('  浏览器会自动打开；若没弹出来，手动复制上面地址');
  console.log('  关闭游戏: 回到这个窗口按 Ctrl+C');
  console.log('='.repeat(56));
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start ""' : 'xdg-open';
  exec(`${cmd} "${url}"`, () => {});
});
