/**
 * useTicketSocket — STOMP-over-native-WebSocket hook
 *
 * Uses @stomp/stompjs directly with the browser's built-in WebSocket —
 * NO sockjs-client dependency (sockjs-client uses Node.js globals that crash in Vite).
 *
 * The Spring backend's /ws endpoint accepts both SockJS and plain WS upgrades.
 * Plain WS connects at:  ws://host/ws/websocket?token=<JWT>
 *
 * When a CommentPayload arrives from the server the supplied `onComment`
 * callback is called with the parsed payload object.
 *
 * Usage:
 *   useTicketSocket(ticketId, (newComment) => { ... });
 *
 * The socket is torn down automatically when the component unmounts or ticketId changes.
 */
import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';

// SockJS plain-WebSocket path: /ws/websocket
// The JWT is passed as a query param so WebSocketHandshakeInterceptor can read it.
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
const WS_BASE  = API_BASE.replace(/^http/, 'ws'); // http→ws, https→wss

export function useTicketSocket(ticketId, onComment) {
  const clientRef = useRef(null);
  // Keep a stable ref to the latest callback so we don't reconnect on every render
  const callbackRef = useRef(onComment);
  useEffect(() => { callbackRef.current = onComment; }, [onComment]);

  useEffect(() => {
    if (!ticketId) return;

    const token = localStorage.getItem('hd_token');
    if (!token) return;

    // Plain WebSocket URL — no SockJS lib required
    const brokerURL = `${WS_BASE}/ws/websocket?token=${encodeURIComponent(token)}`;

    const client = new Client({
      brokerURL,
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(
          `/topic/tickets/${ticketId}/comments`,
          (frame) => {
            try {
              const payload = JSON.parse(frame.body);
              callbackRef.current?.(payload);
            } catch {
              // ignore malformed frames
            }
          }
        );
      },
      onStompError: (frame) => {
        console.warn('[WS] STOMP error', frame.headers?.message);
      },
      onDisconnect: () => {
        console.debug('[WS] Disconnected from ticket', ticketId);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [ticketId]);
}
