const http = require('http');
const fs = require('fs');
const path = require('path');

const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;
const rootDir = __dirname;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const safePath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const filePath = path.join(rootDir, safePath);

  fs.readFile(filePath, (error, data) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
      }

      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Server error');
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': mimeTypes[extension] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(data);
  });
});

server.listen(port, hostname, () => {
  console.log(`Frontend running at http://${hostname}:${port}`);
});
