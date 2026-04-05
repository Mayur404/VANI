import WebSocket, { WebSocketServer } from 'ws';
import { Server } from 'http';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Groq from 'groq-sdk';
import fetch from 'node-fetch';
import { generateReport } from './report-generator';

interface AISession {
  id: string;
  customerName: string;
  customerPhone: string;
  loanAccountNumber: string;
  outstandingAmount: number;
  bankName: string;
  createdAt: Date;
  customerSocket: WebSocket | null;
  conversationHistory: any[];
  languageDetected: string;
  duration: number;
  endedAt?: Date;
  alerts: string[];
}

const sessions = new Map<string, AISession>();
let groqClient: Groq | null = null;

const GROQ_SYSTEM_PROMPT = `You are a professional loan recovery agent working for a bank. Your job is to contact customers about their overdue loan payments.

CONVERSATION FLOW (7 steps):
1. Greet the customer by name, identify yourself and the bank
2. Inform them about their overdue payment amount
3. Listen to their situation and reason for non-payment
4. Explain consequences of non-payment politely
5. Negotiate a payment plan or full payment
6. Confirm payment commitment (amount, date, mode)
7. Thank them and confirm next steps

RULES:
- Always be polite and professional
- Speak in the same language the customer uses (English, Hindi, Kannada, Telugu)
- If customer says they already paid, ask for transaction details and mark as "already_paid"
- If customer says wrong number, apologize and end call
- If customer is aggressive, remain calm and offer to escalate
- After 3 refusals without commitment, mark as "refusing" and escalate
- When conversation is complete (all 7 steps done), output [CALL_COMPLETE] on its own line

OUTPUT [CALL_COMPLETE] ONLY when:
- Customer has committed to a payment amount AND date, OR
- Customer has refused 3 times, OR
- Customer says they already paid, OR
- Customer says wrong number, OR
- Customer is being aggressive/abusive

Do NOT output [CALL_COMPLETE] during normal conversation.`;

export function setupAICall(server: Server, app: Express) {
  groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const wss = new WebSocketServer({
    noServer: true,
    path: '/ai-call',
  });

  wss.on('connection', (ws: WebSocket) => {
    let sessionId: string | null = null;

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case 'customer-speech': {
            const session = sessions.get(sessionId!);
            if (!session) return;

            const transcript = message.transcript;
            const languageCode = message.languageCode || 'en';

            // Detect language
            session.languageDetected = detectLanguage(languageCode);

            // Add to conversation history
            session.conversationHistory.push({
              role: 'customer',
              content: transcript,
              language: session.languageDetected,
            });

            // Get AI response
            const aiResponse = await getAIResponse(session.conversationHistory, session.languageDetected);

            // Check for call completion
            if (aiResponse.includes('[CALL_COMPLETE]')) {
              const cleanResponse = aiResponse.replace('[CALL_COMPLETE]', '').trim();

              // Generate TTS for response
              const ttsAudio = await generateTTS(cleanResponse, session.languageDetected);

              if (ttsAudio) {
                ws.send(
                  JSON.stringify({
                    type: 'ai-speech',
                    audio: ttsAudio,
                    text: cleanResponse,
                    isFinal: true,
                  })
                );
              }

              // End call after delay
              setTimeout(() => {
                ws.send(JSON.stringify({ type: 'call-ended' }));
                session.endedAt = new Date();
                session.duration = Math.floor((Date.now() - session.createdAt.getTime()) / 1000);

                // Generate report
                generateReport(session, 'ai_call').catch(console.error);
              }, 3000);
            } else {
              // Generate TTS for response
              const ttsAudio = await generateTTS(aiResponse, session.languageDetected);

              if (ttsAudio) {
                ws.send(
                  JSON.stringify({
                    type: 'ai-speech',
                    audio: ttsAudio,
                    text: aiResponse,
                    isFinal: true,
                  })
                );
              }

              // Add AI response to history
              session.conversationHistory.push({
                role: 'assistant',
                content: aiResponse,
                language: session.languageDetected,
              });
            }

            break;
          }

          case 'call-ended': {
            const session = sessions.get(sessionId!);
            if (session) {
              session.endedAt = new Date();
              session.duration = Math.floor((Date.now() - session.createdAt.getTime()) / 1000);
              generateReport(session, 'ai_call').catch(console.error);
            }
            break;
          }
        }
      } catch (error) {
        console.error('AI call WebSocket error:', error);
      }
    });

    ws.on('close', () => {
      if (sessionId) {
        const session = sessions.get(sessionId);
        if (session) {
          session.customerSocket = null;
        }
      }
    });
  });

  // HTTP Routes

  app.post('/create-ai-session', async (req, res) => {
    const { customerName, phoneNumber, loanAccountNumber, outstandingAmount, bankName } = req.body;

    const sessionId = uuidv4();
    const session: AISession = {
      id: sessionId,
      customerName: customerName || 'Customer',
      customerPhone: phoneNumber || '',
      loanAccountNumber: loanAccountNumber || uuidv4(),
      outstandingAmount: outstandingAmount || 0,
      bankName: bankName || 'VANI Bank',
      createdAt: new Date(),
      customerSocket: null,
      conversationHistory: [],
      languageDetected: 'en',
      duration: 0,
      alerts: [],
    };

    sessions.set(sessionId, session);

    const domain = process.env.NGROK_URL || `http://localhost:${process.env.PORT || 4000}`;
    const protocol = domain.startsWith('https') ? 'wss' : 'ws';

    res.json({
      sessionId,
      customerLink: `${domain.replace('http', 'https').replace('ws', 'http')}/call/join/${sessionId}?mode=ai`,
      wsUrl: `${protocol}://${domain.replace('http://', '').replace('https://', '')}/ai-call`,
    });
  });

  app.post('/transcribe-ai', async (req, res) => {
    const SARVAM_API_KEY = process.env.SARVAM_API_KEY;

    if (!SARVAM_API_KEY) {
      return res.status(500).json({ error: 'SARVAM_API_KEY not configured' });
    }

    try {
      const audioBuffer = req.body.audio ? Buffer.from(req.body.audio, 'base64') : req.file?.buffer;

      if (!audioBuffer) {
        return res.status(400).json({ error: 'No audio data' });
      }

      const formData = new FormData();
      formData.append('file', new Blob([audioBuffer]), {
        filename: 'audio.wav',
        type: 'audio/wav',
      });
      formData.append('model', 'saaras:v3');
      formData.append('task', 'transcribe');
      formData.append('source_language', 'auto');

      const response = await fetch('https://api.sarvam.ai/api/transcribe', {
        method: 'POST',
        headers: {
          'api-key': SARVAM_API_KEY,
        },
        body: formData as any,
      });

      const result = await response.json();

      res.json({
        transcript: result.transcript || '',
        language: result.language || 'en',
      });
    } catch (error) {
      console.error('Sarvam STT error:', error);
      res.status(500).json({ error: 'Transcription failed' });
    }
  });

  app.get('/ai-session/:id', (req, res) => {
    const session = sessions.get(req.params.id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      id: session.id,
      customerName: session.customerName,
      status: session.endedAt ? 'ended' : 'active',
      languageDetected: session.languageDetected,
      duration: session.duration,
      conversationHistory: session.conversationHistory,
    });
  });

  // Handle WebSocket upgrade for AI calls
  server.on('upgrade', (req, socket, head) => {
    const pathname = req.url;

    if (pathname === '/ai-call') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    }
    // Note: WebRTC signaling is handled separately in webrtc-signaling.ts
  });
}

function detectLanguage(languageCode: string): string {
  const langMap: Record<string, string> = {
    kn: 'kannada',
    hi: 'hindi',
    te: 'telugu',
    ta: 'tamil',
    en: 'english',
  };
  return langMap[languageCode.toLowerCase()] || 'english';
}

async function getAIResponse(conversationHistory: any[], language: string): Promise<string> {
  try {
    const langInstruction = `Respond in ${language}. Keep responses concise and conversational.`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: GROQ_SYSTEM_PROMPT + '\n\n' + langInstruction },
        ...conversationHistory.map((msg) => ({
          role: msg.role === 'customer' ? 'user' : 'assistant',
          content: msg.content,
        })),
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || 'I apologize, could you please repeat that?';
  } catch (error) {
    console.error('Groq API error:', error);
    return 'I apologize, but I am having trouble processing your response. Could you please repeat?';
  }
}

async function generateTTS(text: string, language: string): Promise<string | null> {
  const SARVAM_API_KEY = process.env.SARVAM_API_KEY;

  if (!SARVAM_API_KEY) {
    console.error('SARVAM_API_KEY not configured');
    return null;
  }

  try {
    const speakerMap: Record<string, string> = {
      kannada: 'arjun',
      hindi: 'anushka',
      telugu: 'mohan',
      tamil: 'kani',
      english: 'anushka',
    };

    const speaker = speakerMap[language.toLowerCase()] || 'anushka';

    const response = await fetch('https://api.sarvam.ai/api/text-to-speech', {
      method: 'POST',
      headers: {
        'api-key': SARVAM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'bulbul:v2',
        speaker,
        text,
        language: language.toLowerCase(),
        output_format: 'mp3',
      }),
    });

    const result = await response.json();

    if (result.audio_base64) {
      return result.audio_base64;
    }

    return null;
  } catch (error) {
    console.error('Sarvam TTS error:', error);
    return null;
  }
}
