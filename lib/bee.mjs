// Museframe ⇄ Bee/Clickey adapter.
// Bee (the founder's orchestrator) and Clickey (the gesture-approval desk) are
// PRE-EXISTING infrastructure on this machine — see README attribution. This
// adapter (new hackathon work) is the bridge: Museframe writes to Bee's memory
// feed, stages publish actions as signed one-time tickets on the founder's
// approval wall, and reads ticket status back so the UI reflects the real
// gesture decision. It deliberately NEVER uses `bee create` (which dispatches
// to autonomous workers) and can never approve a ticket — approval requires a
// human ✓ gesture on the Clickey desk, by design.
// [HACKATHON: new work — written 2026-07-04 during RAISE]

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';

const BEE_CLI = process.env.MUSEFRAME_BEE_CLI || '/Users/brain/Agentpay/ops/mac-mini/bee/bee.mjs';
const BEE_DIR = join(homedir(), '.bee');
const ACTIONS = join(BEE_DIR, 'actions.json');

export function beeAvailable() {
  if (process.env.MUSEFRAME_BEE === 'off') return false;
  return existsSync(BEE_CLI) && existsSync(BEE_DIR);
}

function bee(args, { silent = true, timeout = 20000 } = {}) {
  return execFileSync(process.execPath, [BEE_CLI, ...args], {
    timeout,
    encoding: 'utf8',
    env: { ...process.env, ...(silent ? { BEE_SILENT: '1' } : {}) },
  });
}

export function remember(text) {
  if (!beeAvailable()) return false;
  try {
    bee(['remember', `museframe: ${text}`]);
    return true;
  } catch {
    return false;
  }
}

function loadActions() {
  try { return JSON.parse(readFileSync(ACTIONS, 'utf8')); } catch { return []; }
}

// Stage a publish as a Bee action ticket. The goal contains "publish", which
// Bee's own safety regex classifies as an outward action → it is staged on the
// approval wall (never executed) with a 30-minute signed expiry.
export function stagePublish(goal) {
  if (!beeAvailable()) return { mode: 'standalone' };
  const before = new Set(loadActions().map(a => a.id));
  try {
    // not silent: Bee announcing "I prepared that action" IS the product moment
    bee(['act', goal], { silent: false, timeout: 30000 });
  } catch { /* bee act exits non-zero after staging by design (returns false) */ }
  const ticket = loadActions().find(a => !before.has(a.id) && a.goal === goal)
    || loadActions().find(a => a.goal === goal && ['proposed', 'approved', 'executing'].includes(a.status));
  if (!ticket) return { mode: 'bee', error: 'ticket not found after staging' };
  return { mode: 'bee', ticket: publicTicket(ticket) };
}

export function ticketStatus(id) {
  const t = loadActions().find(a => a.id === id);
  return t ? publicTicket(t) : null;
}

// Pop the Clickey gesture overlay on the founder's screen (60s window).
export function summonGesture(id) {
  if (!beeAvailable()) return { ok: false, reason: 'bee unavailable' };
  try {
    const out = bee(['ask', id], { silent: false, timeout: 15000 });
    return { ok: !/⛔|⏳/.test(out), out: out.trim().slice(0, 200) };
  } catch (e) {
    return { ok: false, reason: String(e.message || e).slice(0, 120) };
  }
}

// Founder-side cleanup for test tickets; never called from the UI.
export function rejectTicket(id) {
  if (!beeAvailable()) return false;
  try { bee(['reject-action', id]); return true; } catch { return false; }
}

function publicTicket(t) {
  return {
    id: t.id,
    goal: t.goal,
    status: t.status,
    automatable: !!t.automatable,
    issued_at: t.issued_at,
    expires_at: t.expires_at,
    approved_at: t.approved_at || null,
    approval_method: t.approval_method || null,
    sig: t.sig ? t.sig.slice(0, 12) + '…' : null,
  };
}

// Read-only peek at Bee's board for the cards Museframe's actions created.
export function boardPeek(limit = 6) {
  const db = join(BEE_DIR, 'labs-board.db');
  if (!existsSync(db)) return [];
  try {
    const out = execFileSync('/usr/bin/sqlite3', ['-json', '-readonly', db,
      `SELECT * FROM tasks ORDER BY updated_at DESC LIMIT ${Number(limit) || 6};`], { encoding: 'utf8', timeout: 5000 });
    const rows = JSON.parse(out || '[]');
    return rows.map(r => {
      const text = r.title || r.text || r.request || r.intent || '';
      return { id: r.id, status: r.status, assignee: r.assignee, needs_human: r.needs_human, text: String(text).slice(0, 90) };
    });
  } catch {
    return [];
  }
}
