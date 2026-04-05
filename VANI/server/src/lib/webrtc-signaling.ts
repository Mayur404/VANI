import WebSocket, { WebSocketServer } from 'ws';
import { Server } from 'http';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface Room {
  id: string;
  agentName: string;
  customerName: string;
  customerPhone: string;
  loanAccountNumber: string;
  createdAt: Date;
  agentSocket: WebSocket | null;
  customerSocket: WebSocket | null;
  transcript: Array<{
    role: 'agent' | 'customer';
    text: string;
    language?: string;
    timestamp: number;
  }>;
  endedAt?: Date;
}

const rooms = new Map<string, Room>();

export function setupWebRTCSignaling(server: Server, app: Express) {
  const wss = new WebSocketServer({
    noServer: true,
    path: '/webrtc-signal',
  });

  wss.on('connection', (ws: WebSocket) => {
    let roomId: string | null = null;
    let role: 'agent' | 'customer' | null = null;

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case 'join':
            roomId = message.roomId;
            role = message.role || 'agent';
            if (roomId) {
              const room = rooms.get(roomId);

              if (!room) {
                ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
                return;
              }

              // Assign socket to room
              if (role === 'agent') {
                room.agentSocket = ws;
                // If customer already connected, notify agent
                if (room.customerSocket) {
                  ws.send(JSON.stringify({ type: 'peer-joined', role: 'customer' }));
                }
              } else {
                room.customerSocket = ws;
                // Notify agent that customer joined
                room.agentSocket?.send(JSON.stringify({ type: 'peer-joined', role: 'customer' }));
              }

              ws.send(JSON.stringify({ type: 'joined', roomId, role }));
            }
            break;

          case 'offer':
            // Forward offer to peer
            if (roomId) {
              const offerRoom = rooms.get(roomId);
              if (offerRoom) {
                const targetSocket = role === 'agent' ? offerRoom.customerSocket : offerRoom.agentSocket;
                targetSocket?.send(JSON.stringify({ type: 'offer', offer: message.offer }));
              }
            }
            break;

          case 'answer':
            // Forward answer to peer
            if (roomId) {
              const answerRoom = rooms.get(roomId);
              if (answerRoom) {
                const targetSocket = role === 'agent' ? answerRoom.customerSocket : answerRoom.agentSocket;
                targetSocket?.send(JSON.stringify({ type: 'answer', answer: message.answer }));
              }
            }
            break;

          case 'ice-candidate':
            // Forward ICE candidate to peer
            if (roomId) {
              const iceRoom = rooms.get(roomId);
              if (iceRoom) {
                const targetSocket = role === 'agent' ? iceRoom.customerSocket : iceRoom.agentSocket;
                targetSocket?.send(
                  JSON.stringify({
                    type: 'ice-candidate',
                    candidate: message.candidate,
                  })
                );
              }
            }
            break;

          case 'transcript-chunk':
            // Store transcript chunk
            if (roomId) {
              const transcriptRoom = rooms.get(roomId);
              if (transcriptRoom && message.role && message.text) {
                transcriptRoom.transcript.push({
                  role: message.role,
                  text: message.text,
                  language: message.language || 'EN',
                  timestamp: Date.now(),
                });

                // Forward to other peer for display
                const otherSocket = message.role === 'agent' ? transcriptRoom.customerSocket : transcriptRoom.agentSocket;
                otherSocket?.send(
                  JSON.stringify({
                    type: 'transcript-chunk',
                    role: message.role,
                    text: message.text,
                  })
                );
              }
            }
            break;

          case 'end-call':
            // Only agent can end call
            if (role === 'agent' && roomId) {
              const endRoom = rooms.get(roomId);
              if (endRoom) {
                endRoom.endedAt = new Date();
                // Notify customer
                endRoom.customerSocket?.send(JSON.stringify({ type: 'call-ended' }));
                ws.send(JSON.stringify({ type: 'call-ended' }));
              }
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (roomId) {
        const room = rooms.get(roomId);
        if (room) {
          if (role === 'agent') {
            room.agentSocket = null;
            room.customerSocket?.send(JSON.stringify({ type: 'peer-left', role: 'agent' }));
          } else {
            room.customerSocket = null;
            room.agentSocket?.send(JSON.stringify({ type: 'peer-left', role: 'customer' }));
          }
        }
      }
    });
  });

  // HTTP Routes

  app.post('/create-manual-room', (req, res) => {
    const { agentName, customerName, customerPhone, loanAccountNumber } = req.body;

    const roomId = uuidv4();
    const room: Room = {
      id: roomId,
      agentName: agentName || 'Agent',
      customerName: customerName || 'Customer',
      customerPhone: customerPhone || '',
      loanAccountNumber: loanAccountNumber || uuidv4(),
      createdAt: new Date(),
      agentSocket: null,
      customerSocket: null,
      transcript: [],
    };

    rooms.set(roomId, room);

    const domain = process.env.NGROK_URL || `http://localhost:${process.env.PORT || 4000}`;
    const protocol = domain.startsWith('https') ? 'wss' : 'ws';

    res.json({
      roomId,
      agentLink: `${domain.replace('http', 'https').replace('ws', 'http')}/call/join/${roomId}`,
      customerLink: `${domain.replace('http', 'https').replace('ws', 'http')}/call/join/${roomId}`,
      wsUrl: `${protocol}://${domain.replace('http://', '').replace('https://', '')}/webrtc-signal`,
    });
  });

  app.get('/room/:id', (req, res) => {
    const room = rooms.get(req.params.id);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({
      id: room.id,
      agentName: room.agentName,
      customerName: room.customerName,
      status: room.endedAt ? 'ended' : 'active',
      transcript: room.transcript,
    });
  });

  // Handle WebSocket upgrade
  server.on('upgrade', (req, socket, head) => {
    const pathname = req.url;

    if (pathname === '/webrtc-signal') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    }
    // Note: AI call WebSocket is handled separately in ai-call.ts
  });
}
