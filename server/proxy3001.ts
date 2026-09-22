import http from 'http';
import httpProxy from 'http-proxy';

const proxy = httpProxy.createProxyServer({
  target: 'http://localhost:3000',
  ws: true,
  changeOrigin: true,
});

proxy.on('error', (err, req, res) => {
  console.error('[Port 3001 Proxy Error]:', err.message);
  if (res && 'writeHead' in res && !(res as http.ServerResponse).headersSent) {
    (res as http.ServerResponse).writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Proxying to port 3000...');
  }
});

const server = http.createServer((req, res) => {
  proxy.web(req, res);
});

server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head);
});

server.listen(3001, () => {
  console.log('[ServeFlow Port Forwarder] http://localhost:3001 -> http://localhost:3000 (HTTP & WebSocket active)');
});
