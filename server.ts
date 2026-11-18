import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

interface ChatMessageInput {
  role: 'user' | 'model';
  text: string;
}

interface UserLocationInput {
  lat: number;
  lng: number;
}

interface GroundingMapLink {
  title: string;
  uri: string;
  reviewSnippets: string[];
}

const JACKIE_SWEETS_SYSTEM_INSTRUCTION = `You are the official Jackie Sweets Customer Support & Store Specialist.
Keep answers warm, concise, accurate, and formatted cleanly in plain text or light Markdown bullets.

BRAND & PRODUCT FACTS:
- Brand: Jackie Sweets — Cold-pressed plant protein bars ("Pressed, not baked. Cold-pressed at dawn. Sealed by noon.")
- Serving size: 50 g bar | Calories: 210 kcal | Protein: 12 g plant protein (24% DV) | Total Fat: 9 g | Carbohydrate: 22 g | Dietary Fibre: 6 g (21% DV) | Total Sugars: 8 g | Added Sugars: 0 g | Salt: 0.2 g.
- Pricing: $2.99 per single bar. Build Your 3-Pack bundle is $7.48 (saves $1.49 compared to 3 singles).
- Five Flavours & Exact Ingredients / Allergens:
  1. Peanut Cocoa — Peanuts, oats, dates, cocoa, pea protein, sea salt. Allergens: Contains peanuts. Made in a facility that handles tree nuts. (Sat fat 1.8g, Sodium 80mg, Potassium 240mg, Magnesium 54mg, Iron 2.1mg)
  2. Berry Oat — Oats, blueberries, raspberries, dates, pea protein, almonds. Allergens: Contains almonds (tree nuts). (Sat fat 1.1g, Sodium 75mg, Potassium 215mg, Vitamin C 9mg, Iron 1.9mg)
  3. Salted Caramel — Dates, cashews, oats, pea protein, sea salt, vanilla. Allergens: Contains cashews (tree nuts). (Sat fat 1.7g, Sodium 88mg, Potassium 230mg, Magnesium 48mg, Iron 1.8mg)
  4. Mint Chip — Oats, dark chocolate, almonds, pea protein, peppermint oil. Allergens: Contains almonds (tree nuts). (Sat fat 2.2g, Sodium 78mg, Potassium 225mg, Calcium 42mg, Iron 2.3mg)
  5. Strawberry — Oats, strawberries, dates, cashews, pea protein, lemon. Allergens: Contains cashews (tree nuts). (Sat fat 1.5g, Sodium 76mg, Potassium 210mg, Vitamin C 14mg, Iron 1.7mg)
- Ordering & Support policies:
  - Orders ship from cold-press batches within 1 business day. Keep bars stored in a cool, dry pantry (or chill for firmer snap).
  - First Dibs list grants early access to small-batch seasonal drops and 15% off a subscriber's first box.
  - Users can inspect full nutritional tables for any flavour by clicking the flavour name on a shop card.

LOCATION & STOCKIST QUESTIONS:
- If the user asks where to buy bars locally, nearby health food stores, organic grocers, specialty markets, gyms, or cafes near a city/neighborhood or near their current location, use Google Maps grounding to suggest real nearby health food stores, organic markets, or natural grocers.
- Clearly note that stockists vary by store and recommend calling ahead to verify Jackie Sweets availability, or opening the interactive Store Locator map on the page to get walking/driving directions.
- Never invent or fabricate addresses, store hours, phone numbers, or coordinates.`;

function extractMapsLinks(response: unknown): GroundingMapLink[] {
  const candidate = (response as { candidates?: Array<{ groundingMetadata?: { groundingChunks?: Array<Record<string, unknown>> } }> })?.candidates?.[0];
  const chunks = candidate?.groundingMetadata?.groundingChunks;
  if (!Array.isArray(chunks)) return [];

  const seenUris = new Set<string>();
  const links: GroundingMapLink[] = [];

  for (const chunk of chunks) {
    const mapsObj = chunk?.maps as
      | {
          uri?: unknown;
          title?: unknown;
          placeAnswerSources?: {
            reviewSnippets?: Array<{ content?: unknown; text?: unknown } | string>;
          };
        }
      | undefined;

    if (!mapsObj || typeof mapsObj.uri !== 'string' || !mapsObj.uri) continue;
    if (seenUris.has(mapsObj.uri)) continue;
    seenUris.add(mapsObj.uri);

    const snippetsRaw = mapsObj.placeAnswerSources?.reviewSnippets;
    const reviewSnippets: string[] = [];
    if (Array.isArray(snippetsRaw)) {
      for (const snip of snippetsRaw) {
        if (typeof snip === 'string' && snip.trim()) {
          reviewSnippets.push(snip.trim());
        } else if (snip && typeof snip === 'object') {
          const textVal = (snip as { content?: unknown; text?: unknown }).content ?? (snip as { text?: unknown }).text;
          if (typeof textVal === 'string' && textVal.trim()) {
            reviewSnippets.push(textVal.trim());
          }
        }
      }
    }

    links.push({
      title: typeof mapsObj.title === 'string' && mapsObj.title.trim() ? mapsObj.title.trim() : 'View on Google Maps',
      uri: mapsObj.uri,
      reviewSnippets: reviewSnippets.slice(0, 2),
    });
  }

  return links;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post('/api/support-chat', async (req: Request, res: Response) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        error: 'Gemini API key is not configured. Please add GEMINI_API_KEY in Settings > Secrets.',
      });
      return;
    }

    const body = req.body as {
      messages?: unknown;
      userLocation?: unknown;
    };

    if (!Array.isArray(body?.messages) || body.messages.length === 0) {
      res.status(400).json({ error: 'Request must include at least one chat message.' });
      return;
    }

    const sanitizedMessages: ChatMessageInput[] = [];
    for (const item of body.messages.slice(-16)) {
      if (
        item &&
        typeof item === 'object' &&
        (item.role === 'user' || item.role === 'model') &&
        typeof item.text === 'string' &&
        item.text.trim().length > 0
      ) {
        sanitizedMessages.push({
          role: item.role,
          text: item.text.trim().slice(0, 3000),
        });
      }
    }

    if (sanitizedMessages.length === 0) {
      res.status(400).json({ error: 'No valid chat messages were provided.' });
      return;
    }

    let validLocation: UserLocationInput | null = null;
    if (body.userLocation && typeof body.userLocation === 'object') {
      const loc = body.userLocation as { lat?: unknown; lng?: unknown };
      if (
        typeof loc.lat === 'number' &&
        typeof loc.lng === 'number' &&
        Number.isFinite(loc.lat) &&
        Number.isFinite(loc.lng)
      ) {
        validLocation = { lat: loc.lat, lng: loc.lng };
      }
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const contents = sanitizedMessages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      const config: {
        systemInstruction: string;
        tools: Array<{ googleMaps: Record<string, never> }>;
        toolConfig?: {
          retrievalConfig: {
            latLng: { latitude: number; longitude: number };
          };
        };
      } = {
        systemInstruction: JACKIE_SWEETS_SYSTEM_INSTRUCTION,
        tools: [{ googleMaps: {} }],
      };

      if (validLocation) {
        config.toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: validLocation.lat,
              longitude: validLocation.lng,
            },
          },
        };
      }

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents,
        config,
      });

      const reply = (response.text ?? '').trim();
      const mapsLinks = extractMapsLinks(response);

      if (!reply) {
        res.status(502).json({
          error: 'The support assistant returned an empty response. Please try again.',
        });
        return;
      }

      res.json({ reply, mapsLinks });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const status =
        typeof (err as { status?: unknown })?.status === 'number'
          ? (err as { status: number }).status
          : msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')
            ? 429
            : msg.includes('403') || msg.includes('PERMISSION_DENIED')
              ? 403
              : msg.includes('400') || msg.includes('API_KEY_INVALID')
                ? 400
                : 500;

      console.error('[/api/support-chat] Gemini API error:', msg);
      res.status(status).json({
        error:
          status === 403 || status === 400
            ? 'Gemini API authentication failed. Please check GEMINI_API_KEY in Settings > Secrets.'
            : status === 429
              ? 'Support chat rate limit reached. Please wait a moment and try again.'
              : `Support chat failed: ${msg}`,
      });
    }
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Jackie Sweets server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
