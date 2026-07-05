#!/usr/bin/env node
// Pre-demo / pre-submit arc verification — runs the full harness pipeline via HTTP.
// Usage: node scripts/verify-arc.mjs [baseUrl]
// Exit 0 = all gates passed; exit 1 = blocker found (details printed).

const BASE = process.argv[2] || 'http://localhost:8787';

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

const fail = msg => { console.error('✗', msg); process.exit(1); };
const ok = msg => console.log('✓', msg);

console.log('Raise arc verification →', BASE);

const health = await req('GET', '/api/health');
if (health.status !== 200 || !health.data.ok) fail('health check failed');
ok(`health (bee: ${health.data.bee}, cursor: ${health.data.cursor?.presence || 'unknown'})`);

if (health.data.cursor?.presence === 'auth required') {
  console.warn('⚠ cursor-agent not logged in — run: cursor-agent login');
}

const caps = await req('GET', '/api/capabilities?brief=demo');
if (caps.status !== 200) fail('capabilities probe failed');
ok(`capability radar (${caps.data.cards?.length || 0} cards)`);

console.log('… interpret (Gemma may take ~60s after cold start)');
const t0 = Date.now();
const interp = await req('POST', '/api/interpret', { brief: 'cosmic synthwave launch page with reactive motion' });
if (interp.status !== 200 || !interp.data.board?.moods) fail('interpret failed');
const brain = interp.data.board.brain;
ok(`interpret via ${brain} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
if (!/gemma|heuristic/i.test(brain)) console.warn('⚠ unexpected brain:', brain);

const build = await req('POST', '/api/build', { board: interp.data.board });
if (build.status !== 200 || !build.data.build?.id) fail('build failed');
const id = build.data.build.id;
ok(`build ${id} (${build.data.drift?.violations?.length || 0} drift violations)`);

if (build.data.drift?.violations?.length) {
  const patched = await req('POST', '/api/patch', { build: id });
  if (patched.status !== 200 || !patched.data.patched) fail('patch failed');
  ok('drift patched clean');
}

const drift = await req('GET', `/api/drift?build=${id}`);
if (drift.status !== 200 || drift.data.violations?.length) fail('drift still open after patch');

const pub409 = await req('POST', '/api/publish', { build: id, target: 'demo host' });
// If drift clean, publish should succeed (200) or stage ticket — not 409
if (pub409.status === 409) fail('publish blocked by drift (409)');
ok(`publish staged (${pub409.data.mode || pub409.data.ticket?.status})`);

const fleet = await req('GET', '/api/fleet');
if (fleet.status !== 200) fail('fleet status failed');
ok(`fleet (${fleet.data.workers?.length || 0} workers)`);

const dispatch = await req('POST', '/api/dispatch', { text: 'smoke test card from verify-arc', worker: null });
if (dispatch.status !== 200) fail('dispatch failed');
ok(`dispatch → ${dispatch.data.card?.assignee || dispatch.data.mode || 'standalone'}`);

console.log('\nAll arc gates passed. Ready to record demo.');
