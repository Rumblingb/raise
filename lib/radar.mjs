// Museframe capability radar — what can the agent reach for RIGHT NOW.
// Live sources: the official MCP registry (network), local Ollama models,
// and the Bee/Clickey control plane if present on this machine.
// Falls back to a labeled cached snapshot when offline — never silently fake.
// [HACKATHON: new work — written 2026-07-04 during RAISE]

import { beeAvailable } from './bee.mjs';

const REGISTRY = 'https://registry.modelcontextprotocol.io/v0/servers?limit=40';
const OLLAMA = process.env.MUSEFRAME_OLLAMA || 'http://localhost:11434';

const CACHED_REGISTRY = [
  { name: 'io.github.modelcontextprotocol/everything', description: 'Reference server exercising every MCP feature' },
  { name: 'com.gradium/voice', description: 'TTS / STT / voice cloning APIs (RAISE partner)' },
  { name: 'io.github.audio-tools/analysis', description: 'Audio analysis: FFT, beat detection, stems' },
];

async function fetchJson(url, ms = 6000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export async function capabilities(brief = '') {
  const cards = [];
  let registrySource = 'live';

  // 1 — official MCP registry (live network call)
  let servers = [];
  try {
    const data = await fetchJson(REGISTRY);
    servers = (data.servers || []).map(s => ({
      name: s.name || s.server?.name || 'unknown',
      description: s.description || s.server?.description || '',
    }));
  } catch {
    registrySource = 'cached snapshot (registry unreachable)';
    servers = CACHED_REGISTRY;
  }
  const words = brief.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  const scored = servers
    .map(s => ({ s, score: words.filter(w => (s.name + ' ' + s.description).toLowerCase().includes(w)).length }))
    .sort((a, b) => b.score - a.score);
  const seen = new Set();
  for (const { s } of scored) {
    const short = s.name.split('/').pop();
    const key = short + '|' + (s.description || '').slice(0, 40);
    if (seen.has(key)) continue;
    seen.add(key);
    cards.push({
      name: short,
      note: (s.description || 'MCP server').slice(0, 110),
      source: `mcp-registry (${registrySource})`,
    });
    if (seen.size >= 3) break;
  }

  // 2 — local inference brain
  try {
    const tags = await fetchJson(`${OLLAMA}/api/tags`, 3000);
    const gemma = (tags.models || []).find(m => /gemma/i.test(m.name));
    if (gemma) {
      cards.unshift({
        name: gemma.name,
        note: 'Local on-device brain detected — interpretation runs privately, no API key, no cloud round-trip.',
        source: 'local (ollama)',
        changed_plan: true,
        plan_change: 'Brief interpretation routed to local inference instead of a cloud API.',
      });
    }
  } catch { /* no local brain — interpreter falls back deterministically */ }

  // 3 — Bee / Clickey control plane
  if (beeAvailable()) {
    cards.push({
      name: 'Bee + Clickey',
      note: 'Founder control plane detected: publish actions become signed one-time tickets approved by a deliberate ✓ mouse gesture. [pre-existing infrastructure — see README attribution]',
      source: 'local (control plane)',
      changed_plan: true,
      plan_change: 'Outward actions (publish) route through the founder approval wall instead of executing directly.',
    });
  } else {
    cards.push({
      name: 'Bee + Clickey',
      note: 'Not detected on this machine — publish will run in standalone mode with a simulated (clearly labeled) ticket.',
      source: 'local (absent)',
    });
  }

  return { cards, registry: registrySource };
}
