// Raise fleet adapter — Bee's worker fleet, read truthfully and dispatched really.
// Reads Bee's board (sqlite, read-only), worker-status.json, and registry.json to
// render the fleet as it actually is. Dispatch goes through `bee create`, i.e.
// Bee's OWN router and file-based inbox dispatch (pre-existing infrastructure) —
// this adapter (new hackathon work) is the bridge and the truth-teller: it shows
// the route Bee chose, never the route we wished for. Workers act only when they
// next drain their inbox; nothing is force-spawned from here.
// [HACKATHON: new work — written 2026-07-04 during RAISE]

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { beeAvailable } from './bee.mjs';

const BEE_CLI = process.env.MUSEFRAME_BEE_CLI || '/Users/brain/Agentpay/ops/mac-mini/bee/bee.mjs';
const BEE_DIR = join(homedir(), '.bee');
const DB = join(BEE_DIR, 'labs-board.db');

// The power tools the founder cares about, in display order. `probe` reports
// machine-level presence for tools that are not (yet) Bee assignees.
const WORKERS = [
  { key: 'claude', label: 'Claude', kind: 'bee-assignee', inbox: 'Agent-Claude' },
  { key: 'codex', label: 'Codex', kind: 'bee-assignee', inbox: 'Agent-Codex' },
  { key: 'hermes-lenovo', label: 'Hermes', kind: 'bee-assignee', inbox: 'Agent-Hermes' },
  { key: 'nemotron', label: 'Nemotron', kind: 'bee-assignee', inbox: 'Agent-Hermes' },
  { key: 'local-gemma', label: 'Gemma (local)', kind: 'bee-assignee', inbox: 'Agent-Shared' },
  { key: 'cursor', label: 'Cursor', kind: 'external', inbox: null },
];

function readJson(path, fallback) {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return fallback; }
}

function boardByAssignee() {
  if (!existsSync(DB)) return {};
  try {
    const rows = JSON.parse(execFileSync('/usr/bin/sqlite3', ['-json', '-readonly', DB,
      `SELECT assignee,
              count(*) AS total,
              sum(status='in_progress') AS active,
              sum(status IN ('inbox','routed','queued')) AS queued,
              sum(status='blocked') AS blocked,
              sum(status='done') AS done
       FROM tasks GROUP BY assignee;`], { encoding: 'utf8', timeout: 5000 }) || '[]');
    const current = JSON.parse(execFileSync('/usr/bin/sqlite3', ['-json', '-readonly', DB,
      `SELECT assignee, title FROM tasks WHERE status='in_progress' ORDER BY updated_at DESC;`],
      { encoding: 'utf8', timeout: 5000 }) || '[]');
    const map = {};
    for (const r of rows) map[r.assignee || 'unrouted'] = r;
    for (const c of current) {
      const m = map[c.assignee];
      if (m && !m.current) m.current = String(c.title).slice(0, 80);
    }
    return map;
  } catch {
    return {};
  }
}

const CURSOR_BIN = join(homedir(), '.local/bin/cursor-agent');

function cursorPresent() {
  return ['/Applications/Cursor.app', CURSOR_BIN, '/usr/local/bin/cursor'].some(p => existsSync(p));
}

// ---- Cursor as a harness-level worker (new work; Cursor itself is a partner tool) ----
// Jobs run headless in the generated build's directory; the drift sentinel audits
// the result afterward, so even Cursor's edits answer to the approved grammar.
const cursorJobs = new Map();

export function startCursorJob(text, cwd) {
  if (!existsSync(CURSOR_BIN)) return { error: 'cursor-agent not installed' };
  const id = 'cj' + randomBytes(3).toString('hex');
  const job = { id, status: 'running', text: String(text).slice(0, 200), output: '', started_at: Date.now() };
  cursorJobs.set(id, job);
  const child = spawn(CURSOR_BIN, ['-p', String(text), '--output-format', 'text', '-f'], { cwd, env: process.env });
  const collect = d => { job.output = (job.output + d).slice(-4000); };
  child.stdout.on('data', collect);
  child.stderr.on('data', collect);
  const timer = setTimeout(() => { job.status = 'timeout'; try { child.kill(); } catch { /* already gone */ } }, 300000);
  child.on('close', code => {
    clearTimeout(timer);
    if (job.status === 'running') job.status = code === 0 ? 'done' : 'failed';
    job.exit = code;
  });
  child.on('error', e => { clearTimeout(timer); job.status = 'failed'; job.output = String(e.message); });
  return { job: publicJob(job) };
}

export function cursorJob(id) {
  const j = cursorJobs.get(String(id));
  return j ? publicJob(j) : null;
}

function publicJob(j) {
  return { id: j.id, status: j.status, text: j.text, output_tail: j.output.slice(-900), exit: j.exit ?? null };
}

export function fleetStatus() {
  const status = readJson(join(BEE_DIR, 'worker-status.json'), {});
  const registry = readJson(join(BEE_DIR, 'registry.json'), { agents: [] });
  const board = boardByAssignee();
  const workers = WORKERS.map(w => {
    const reg = (registry.agents || []).find(a => a.name === w.key || a.name === w.label.toLowerCase());
    const b = board[w.key] || {};
    let presence, note;
    if (w.kind === 'external') {
      presence = cursorPresent() ? 'installed (not yet a Bee assignee)' : 'absent';
      note = presence === 'absent'
        ? 'Cursor is not installed on this machine — the adapter is designed and blocked on founder install. Shown truthfully, not faked.'
        : 'Install detected — adapter can register it as an assignee.';
    } else {
      presence = status[w.key]?.status || reg?.status || 'unknown';
      note = reg?.status && /limit|down|offline/i.test(reg.status) ? `registry: ${reg.status}` : null;
    }
    return {
      key: w.key, label: w.label, kind: w.kind, inbox: w.inbox,
      presence,
      status_age_s: status[w.key] ? Math.max(0, Math.floor(Date.now() / 1000) - status[w.key].updated_at) : null,
      board: { total: b.total || 0, active: b.active || 0, queued: b.queued || 0, blocked: b.blocked || 0, done: b.done || 0 },
      current: b.current || null,
      note,
    };
  });
  return { available: beeAvailable(), workers, source: 'bee board (read-only) + worker-status.json + registry.json' };
}

// Real dispatch through Bee's own front door: create → Bee routes → Bee appends to
// the chosen worker's inbox file. We report the route Bee ACTUALLY chose.
export function dispatchWork(text, preferred) {
  if (!beeAvailable()) return { mode: 'standalone', note: 'Bee not present — dispatch is unavailable, not simulated.' };
  const composed = `${text}${preferred ? ` (prefer ${preferred})` : ''}`.slice(0, 300);
  let out;
  try {
    out = execFileSync(process.execPath, [BEE_CLI, 'create', composed, '--by', 'claude'], {
      encoding: 'utf8', timeout: 90000, env: { ...process.env, BEE_SILENT: '1' },
    });
  } catch (e) {
    return { mode: 'bee', error: String(e.message || e).slice(0, 160) };
  }
  const line = out.trim().split('\n').pop();
  let created;
  try { created = JSON.parse(line); } catch { return { mode: 'bee', error: 'unparseable create output', raw: line.slice(0, 160) }; }
  // read back the card as it actually landed
  try {
    const rows = JSON.parse(execFileSync('/usr/bin/sqlite3', ['-json', '-readonly', DB,
      `SELECT id,title,assignee,model_tier,status,needs_human,rationale FROM tasks WHERE id='${created.id.replace(/'/g, '')}';`],
      { encoding: 'utf8', timeout: 5000 }) || '[]');
    const card = rows[0] || {};
    return {
      mode: 'bee',
      card: {
        id: card.id || created.id,
        title: String(card.title || composed).slice(0, 120),
        assignee: card.assignee || created.route || 'unrouted',
        model_tier: card.model_tier || null,
        status: card.status || 'routed',
        needs_human: !!card.needs_human,
        rationale: String(card.rationale || '').slice(0, 160),
        preferred: preferred || null,
        honored: preferred ? (card.assignee === preferred) : null,
      },
    };
  } catch {
    return { mode: 'bee', card: { id: created.id, title: composed, assignee: created.route || 'unrouted', status: 'routed' } };
  }
}
