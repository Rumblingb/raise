// Museframe harness server — dependency-free Node (>=18).
//   POST /api/interpret     brief → understanding board (local Gemma or fallback)
//   GET  /api/capabilities  live MCP registry + local capability probe
//   POST /api/build         approved board → real generated artifact
//   GET  /api/drift         lint the artifact against approved tokens
//   POST /api/patch         reconcile drift, return before/after + re-lint
//   POST /api/publish       stage a signed Bee action ticket (founder wall)
//   GET  /api/ticket/:id    real ticket status (reflects the Clickey gesture)
//   POST /api/gesture       pop the Clickey ✓/✗ overlay on the founder screen
//   GET  /api/bee/board     read-only peek at Bee's task board
//   GET  /api/fleet         the worker fleet as it actually is (board + status + probes)
//   POST /api/dispatch      route work through Bee's own router to a worker inbox
// Static: / → public, /builds/* → generated artifacts.
// [HACKATHON: new work — written 2026-07-04 during RAISE]

import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, normalize, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { interpret, warmBrain } from './lib/interpreter.mjs';
import { capabilities } from './lib/radar.mjs';
import { build } from './lib/builder.mjs';
import { lint, patch } from './lib/drift.mjs';
import * as bee from './lib/bee.mjs';
import { fleetStatus, dispatchWork, startCursorJob, cursorJob } from './lib/fleet.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(ROOT, 'public');
const BUILDS = join(ROOT, 'workspace', 'builds');
const PORT = Number(process.env.PORT || 8787);
mkdirSync(BUILDS, { recursive: true });

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
};

function send(res, code, body, type = 'application/json') {
  const data = type === 'application/json' ? JSON.stringify(body) : body;
  res.writeHead(code, { 'content-type': type + '; charset=utf-8', 'cache-control': 'no-store' });
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', c => { raw += c; if (raw.length > 1e6) reject(new Error('body too large')); });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); } });
  });
}

function serveStatic(res, base, rel) {
  const path = normalize(join(base, rel));
  if (!path.startsWith(base)) return send(res, 403, { error: 'forbidden' });
  const file = existsSync(path) && !extname(path) ? join(path, 'index.html') : path;
  if (!existsSync(file)) return send(res, 404, { error: 'not found' });
  send(res, 200, readFileSync(file), MIME[extname(file)] || 'application/octet-stream');
}

const buildDir = id => {
  if (!/^b[0-9a-f]{8}$/.test(String(id))) return null;
  const dir = join(BUILDS, id);
  return existsSync(dir) ? dir : null;
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  try {
    if (req.method === 'POST' && p === '/api/interpret') {
      const { brief } = await readBody(req);
      if (!brief || !String(brief).trim()) return send(res, 400, { error: 'brief required' });
      const t0 = Date.now();
      const board = await interpret(String(brief).slice(0, 500));
      bee.remember(`brief interpreted (“${String(brief).slice(0, 60)}”) via ${board.brain}`);
      return send(res, 200, { board, took_ms: Date.now() - t0 });
    }
    if (req.method === 'GET' && p === '/api/capabilities') {
      return send(res, 200, await capabilities(url.searchParams.get('brief') || ''));
    }
    if (req.method === 'POST' && p === '/api/build') {
      const { board } = await readBody(req);
      if (!board?.moods) return send(res, 400, { error: 'board required' });
      const result = build(board, BUILDS);
      const report = lint(result.dir);
      bee.remember(`build ${result.id} generated (mood ${result.mood}) — ${report.violations.length} drift violation(s) found`);
      return send(res, 200, { build: result, drift: report });
    }
    if (req.method === 'GET' && p === '/api/drift') {
      const dir = buildDir(url.searchParams.get('build'));
      if (!dir) return send(res, 404, { error: 'unknown build' });
      return send(res, 200, lint(dir));
    }
    if (req.method === 'POST' && p === '/api/patch') {
      const { build: id } = await readBody(req);
      const dir = buildDir(id);
      if (!dir) return send(res, 404, { error: 'unknown build' });
      const result = patch(dir);
      if (result.patched) bee.remember(`build ${id} drift patched — artifact reconciled to approved tokens`);
      return send(res, 200, result);
    }
    if (req.method === 'POST' && p === '/api/publish') {
      const { build: id, target } = await readBody(req);
      const dir = buildDir(id);
      if (!dir) return send(res, 404, { error: 'unknown build' });
      const report = lint(dir);
      if (report.violations.length) {
        return send(res, 409, { error: 'refusing to publish with open drift violations', drift: report });
      }
      const goal = `publish museframe build ${id} to ${String(target || 'the launch host').slice(0, 60)}`;
      const staged = bee.stagePublish(goal);
      if (staged.mode === 'standalone') {
        return send(res, 200, {
          mode: 'standalone',
          note: 'Bee/Clickey not present — this is a SIMULATED ticket for judges running without the control plane.',
          ticket: { id: 'sim-' + id, goal, status: 'proposed', simulated: true },
        });
      }
      return send(res, 200, staged);
    }
    if (req.method === 'GET' && p.startsWith('/api/ticket/')) {
      const t = bee.ticketStatus(p.split('/').pop());
      return t ? send(res, 200, t) : send(res, 404, { error: 'unknown ticket' });
    }
    if (req.method === 'POST' && p === '/api/gesture') {
      const { ticket } = await readBody(req);
      return send(res, 200, bee.summonGesture(String(ticket || '')));
    }
    if (req.method === 'GET' && p === '/api/fleet') {
      return send(res, 200, fleetStatus());
    }
    if (req.method === 'POST' && p === '/api/dispatch') {
      const { text, worker } = await readBody(req);
      if (!text || !String(text).trim()) return send(res, 400, { error: 'text required' });
      const result = dispatchWork(String(text), worker ? String(worker) : null);
      if (result.card) bee.remember(`dispatched card ${result.card.id} → ${result.card.assignee} (“${result.card.title.slice(0, 50)}”)`);
      return send(res, 200, result);
    }
    if (req.method === 'POST' && p === '/api/cursor') {
      const { text, build: id } = await readBody(req);
      if (!text || !String(text).trim()) return send(res, 400, { error: 'text required' });
      const dir = buildDir(id);
      if (!dir) return send(res, 400, { error: 'a valid build id is required — Cursor works inside the generated artifact' });
      const result = startCursorJob(String(text), dir);
      if (result.job) bee.remember(`cursor job ${result.job.id} started on build ${id}`);
      return send(res, 200, result);
    }
    if (req.method === 'GET' && p.startsWith('/api/cursor/')) {
      const j = cursorJob(p.split('/').pop());
      return j ? send(res, 200, j) : send(res, 404, { error: 'unknown job' });
    }
    if (req.method === 'POST' && p === '/api/spend') {
      const { amount, merchant, intent } = await readBody(req);
      if (!merchant || !Number(amount)) return send(res, 400, { error: 'amount and merchant required' });
      const result = bee.stageMandate(amount, merchant, intent);
      if (result.mandate) bee.remember(`sandbox mandate ${result.mandate.id} staged: $${result.mandate.amount} → ${result.mandate.merchant}`);
      return send(res, 200, result);
    }
    if (req.method === 'GET' && p.startsWith('/api/mandate/')) {
      const m = bee.mandateStatus(p.split('/').pop());
      return m ? send(res, 200, m) : send(res, 404, { error: 'unknown mandate' });
    }
    if (req.method === 'POST' && p === '/api/settle') {
      const { mandate } = await readBody(req);
      const m = bee.mandateStatus(String(mandate || ''));
      if (!m) return send(res, 404, { error: 'unknown mandate' });
      if (m.mode !== 'sandbox') return send(res, 403, { error: 'harness settles sandbox mandates only' });
      const result = bee.settleSandbox(m.id);
      if (result.ok) bee.remember(`sandbox settlement executed for ${m.id}`);
      return send(res, 200, { ...result, mandate: bee.mandateStatus(m.id) });
    }
    if (req.method === 'GET' && p === '/api/bee/board') {
      return send(res, 200, { available: bee.beeAvailable(), tasks: bee.boardPeek(6) });
    }
    if (req.method === 'GET' && p === '/api/health') {
      return send(res, 200, { ok: true, bee: bee.beeAvailable(), builds: BUILDS });
    }
    if (req.method === 'GET' && p.startsWith('/builds/')) {
      return serveStatic(res, BUILDS, p.slice('/builds/'.length) || 'nope');
    }
    if (req.method === 'GET') {
      return serveStatic(res, PUBLIC, p === '/' ? 'index.html' : p.slice(1));
    }
    send(res, 405, { error: 'method not allowed' });
  } catch (e) {
    send(res, 500, { error: String(e.message || e).slice(0, 200) });
  }
});

server.listen(PORT, () => {
  console.log(`museframe harness → http://localhost:${PORT}  (bee: ${bee.beeAvailable() ? 'connected' : 'standalone'})`);
  warmBrain();
});
