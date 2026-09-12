import { reflectWithOpenRouter, parseReflectionInput } from './reflect.mjs';
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { analyzeWithOpenRouter, MODEL, MAX_CHARS } from './analysis.mjs';

// Development service: intentionally loopback-only. Do not expose this API publicly
// without application authentication and per-user quotas.
export function createAnalysisServer({ apiKey = process.env.OPENROUTER_API_KEY, analyze = analyzeWithOpenRouter, reflect = reflectWithOpenRouter } = {}) {
  let calls = [];
  let active = false;
  return createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json');
    const reply = (status, data) => { res.writeHead(status); res.end(JSON.stringify(data)); };
    const host = req.headers.host ?? '';
    const origin = req.headers.origin;
    if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) return reply(403, { error: 'Forbidden host' });
    if (origin && !/^http:\/\/(localhost|127\.0\.0\.1):8081$/.test(origin)) return reply(403, { error: 'Forbidden origin' });
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'POST, GET');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      return reply(204, {});
    }
    if (req.url === '/health' && req.method === 'GET') return reply(200, { configured: !!apiKey, model: MODEL });
    if (!['/analyze', '/reflect'].includes(req.url) || req.method !== 'POST') return reply(404, { error: 'Not found' });
    if (!apiKey) return reply(503, { error: 'AI is not configured. Local suggestions are still available.' });
    if (!req.headers['content-type']?.startsWith('application/json')) return reply(415, { error: 'JSON required' });
    const chunks = [];
    let bytes = 0;
    try {
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > 30_000) return reply(413, { error: 'Entry is too long for AI. Local suggestions are still available.' });
        chunks.push(chunk);
      }
      const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (typeof input.body !== 'string' || !input.body.trim() || input.body.length > MAX_CHARS) return reply(400, { error: `Use 1–${MAX_CHARS} characters for AI suggestions.` });
      if (req.url === '/reflect') parseReflectionInput(input.body, input.mode);
      const now = Date.now();
      calls = calls.filter((time) => now - time < 60_000);
      if (active || calls.length >= 10) return reply(429, { error: 'Please wait before requesting more suggestions.' });
      calls.push(now);
      active = true;
      try {
        return reply(200, req.url === '/reflect' ? await reflect(input.body, { apiKey, mode: input.mode }) : await analyze(input.body, { apiKey }));
      } catch {
        // Never log upstream payloads, journal text, or credentials.
        return reply(502, { error: 'AI is unavailable right now. Your current suggestions are unchanged.' });
      } finally { active = false; }
    } catch { return reply(400, { error: 'Invalid request' }); }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createAnalysisServer().listen(8787, '127.0.0.1', () => console.log(`VOQDO AI ready on http://127.0.0.1:8787 (${MODEL})`));
}
