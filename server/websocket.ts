import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { verifyAccessToken } from './utils/auth';
import cookie from 'cookie';

interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
  userId?: string;
  restaurantId?: string;
  role?: string;
}

let wss: WebSocketServer | null = null;

export function initWebSocket(server: HttpServer): WebSocketServer {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: ExtendedWebSocket, req) => {
    ws.isAlive = true;

    // Extract token from cookie or query param
    let token: string | undefined;
    if (req.headers.cookie) {
      const parsedCookies = cookie.parse(req.headers.cookie);
      token = parsedCookies['serveflow_access'];
    }

    if (!token && req.url) {
      const url = new URL(req.url, 'http://localhost');
      token = url.searchParams.get('token') || undefined;
    }

    if (token) {
      const payload = verifyAccessToken(token);
      if (payload) {
        ws.userId = payload.userId;
        ws.restaurantId = payload.restaurantId;
        ws.role = payload.role;
      }
    }

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (message) => {
      try {
        const parsed = JSON.parse(message.toString());
        if (parsed.type === 'AUTH' && parsed.token) {
          const payload = verifyAccessToken(parsed.token);
          if (payload) {
            ws.userId = payload.userId;
            ws.restaurantId = payload.restaurantId;
            ws.role = payload.role;
            ws.send(JSON.stringify({ event: 'AUTH_SUCCESS', data: { userId: payload.userId } }));
          } else {
            ws.send(JSON.stringify({ event: 'AUTH_FAILED', message: 'Invalid token' }));
          }
        } else if (parsed.type === 'PING') {
          ws.send(JSON.stringify({ event: 'PONG' }));
        }
      } catch {
        // Ignore unparseable messages
      }
    });

    ws.on('close', () => {
      // Clean disconnect
    });
  });

  // Heartbeat interval to prune dead sockets
  const interval = setInterval(() => {
    if (!wss) return;
    wss.clients.forEach((ws) => {
      const extWs = ws as ExtendedWebSocket;
      if (!extWs.isAlive) return extWs.terminate();
      extWs.isAlive = false;
      extWs.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  console.log('[WebSocket Server] Initialized on /ws');
  return wss;
}

/**
 * Broadcast event to all authenticated clients in a restaurant
 */
export function broadcastToRestaurant(restaurantId: string, event: string, data: any) {
  if (!wss) return;
  const payload = JSON.stringify({ event, data, timestamp: new Date().toISOString() });

  wss.clients.forEach((client) => {
    const extWs = client as ExtendedWebSocket;
    if (extWs.readyState === WebSocket.OPEN) {
      // Deliver if client belongs to this restaurant or is not yet strictly filtered
      if (!extWs.restaurantId || extWs.restaurantId === restaurantId) {
        extWs.send(payload);
      }
    }
  });
}

/**
 * Broadcast event to specific role within a restaurant (e.g. only KITCHEN or only ADMIN)
 */
export function broadcastToRole(restaurantId: string, role: string, event: string, data: any) {
  if (!wss) return;
  const payload = JSON.stringify({ event, data, timestamp: new Date().toISOString() });

  wss.clients.forEach((client) => {
    const extWs = client as ExtendedWebSocket;
    if (extWs.readyState === WebSocket.OPEN) {
      if ((!extWs.restaurantId || extWs.restaurantId === restaurantId) && (!extWs.role || extWs.role === role)) {
        extWs.send(payload);
      }
    }
  });
}
