// Museframe interpreter — brief → understanding board.
// Brain: local Ollama (gemma3:12b) for privacy-first, key-free inference,
// with a deterministic heuristic fallback so the harness never dies on stage.
// [HACKATHON: new work — written 2026-07-04 during RAISE]

const OLLAMA = process.env.MUSEFRAME_OLLAMA || 'http://localhost:11434';
const MODEL = process.env.MUSEFRAME_MODEL || 'gemma3:12b';
const HEX = /^#[0-9a-fA-F]{6}$/;

const MOOD_ARCHETYPES = [
  { key: 'nocturne', label: 'Nocturne',
    tokens: { bg: '#0a0b12', panel: '#12141f', ink: '#eef0ff', mut: '#8b90b3', acc: '#7c5cff', acc2: '#3be0c0', line: '#262a45', radius: '999px', font: 'Inter' } },
  { key: 'signal', label: 'Signal',
    tokens: { bg: '#070908', panel: '#101614', ink: '#eafff4', mut: '#7fa694', acc: '#ffb02e', acc2: '#4be37a', line: '#1e2b26', radius: '999px', font: 'Inter' } },
  { key: 'editorial', label: 'Editorial',
    tokens: { bg: '#f2ede3', panel: '#faf7f0', ink: '#221d14', mut: '#7a705d', acc: '#b3402a', acc2: '#2a6b8f', line: '#ddd3bf', radius: '10px', font: 'Georgia' } },
];

function titleFrom(brief) {
  const words = brief.replace(/[^a-zA-Z ]/g, ' ').split(/\s+/).filter(w => w.length > 3);
  const skip = new Set(['launch', 'page', 'mini', 'with', 'that', 'this', 'build', 'make', 'create', 'want', 'need', 'app']);
  const pick = words.find(w => !skip.has(w.toLowerCase())) || 'Nova';
  return pick.toUpperCase().slice(0, 12);
}

export function heuristicBoard(brief) {
  const b = brief.toLowerCase();
  const audio = /music|audio|sound|visualizer|voice|song/.test(b);
  const data = /data|finance|analytics|ledger|report|budget/.test(b);
  const surface = audio ? 'Visualizer' : data ? 'Live ledger' : 'Live surface';
  return sanitizeBoard({
    brain: 'local heuristic (deterministic fallback)',
    product: {
      name: titleFrom(brief),
      tagline: audio ? 'see your sound' : data ? 'numbers, alive' : 'watch it work',
    },
    moods: [
      { ...MOOD_ARCHETYPES[0], why: `I read this as nocturnal and luminous — an instrument, not a brochure. Dark stage; light behaves like signal.` },
      { ...MOOD_ARCHETYPES[1], why: `Alternative read: festival energy. Amber signal on near-black; phosphor green as the live channel.` },
      { ...MOOD_ARCHETYPES[2], why: `Third read: the product told as a story. Paper, ink, one decisive red.` },
    ],
    selected_mood: 'nocturne',
    motion: { selected: audio ? 'reactive' : 'calm', why: audio
      ? 'Motion is the product here — the interface should flinch with the signal.'
      : 'The content moves; the chrome stays still.' },
    components: [
      { id: 'hero', label: 'Hero' },
      { id: 'surface', label: surface, primary: true },
      { id: 'waitlist', label: 'Waitlist' },
    ],
    states: [
      { key: 'idle', why: 'a held breath — the idle state must already promise the live one' },
      { key: 'live', why: audio ? 'sound made visible' : 'the system at work, visibly' },
    ],
  });
}

export function sanitizeBoard(raw) {
  const board = typeof raw === 'object' && raw ? raw : {};
  const product = board.product || {};
  const moods = Array.isArray(board.moods) ? board.moods.slice(0, 3) : [];
  const clean = {
    brain: String(board.brain || MODEL),
    product: {
      name: String(product.name || 'NOVA').slice(0, 16),
      tagline: String(product.tagline || 'built from your intent').slice(0, 60),
    },
    moods: MOOD_ARCHETYPES.map((arch, i) => {
      const m = moods[i] || {};
      const t = m.tokens || {};
      const tokens = {};
      for (const k of Object.keys(arch.tokens)) {
        tokens[k] = k === 'radius' || k === 'font'
          ? String(t[k] || arch.tokens[k]).slice(0, 24)
          : (HEX.test(String(t[k] || '')) ? t[k] : arch.tokens[k]);
      }
      return {
        key: String(m.key || arch.key).toLowerCase().replace(/[^a-z]/g, '').slice(0, 12) || arch.key,
        label: String(m.label || arch.label).slice(0, 14),
        why: String(m.why || 'a visual hypothesis').slice(0, 220),
        tokens,
      };
    }),
    selected_mood: null,
    motion: {
      selected: board.motion?.selected === 'calm' ? 'calm' : 'reactive',
      why: String(board.motion?.why || 'proposed grammar').slice(0, 220),
    },
    components: (Array.isArray(board.components) && board.components.length
      ? board.components.slice(0, 5)
      : [{ id: 'hero', label: 'Hero' }, { id: 'surface', label: 'Live surface', primary: true }, { id: 'waitlist', label: 'Waitlist' }]
    ).map((c, i) => ({
      id: String(c.id || `c${i}`).slice(0, 16),
      label: String(c.label || `Component ${i + 1}`).slice(0, 18),
      primary: !!c.primary,
    })),
    states: (Array.isArray(board.states) && board.states.length === 2 ? board.states : [
      { key: 'idle', why: 'a held breath' }, { key: 'live', why: 'the system at work' },
    ]).map(s => ({ key: String(s.key || 'state').slice(0, 10), why: String(s.why || '').slice(0, 120) })),
  };
  if (!clean.components.some(c => c.primary)) clean.components[Math.min(1, clean.components.length - 1)].primary = true;
  clean.selected_mood = clean.moods.some(m => m.key === board.selected_mood) ? board.selected_mood : clean.moods[0].key;
  return clean;
}

const PROMPT = (brief) => `You are Museframe, a design-intent interpreter. A user gave this rough product brief:

"${brief}"

Respond with ONLY a JSON object (no markdown) with this exact shape:
{
  "product": {"name": "<punchy product name, one word, uppercase>", "tagline": "<5 words max>"},
  "moods": [
    {"key":"<one lowercase word>","label":"<Label>","why":"<1-2 sentences: your visual read of the brief in this mood>","tokens":{"bg":"#hex","panel":"#hex","ink":"#hex","mut":"#hex","acc":"#hex","acc2":"#hex","line":"#hex","radius":"999px|10px|4px","font":"Inter|Georgia"}},
    {... a second, genuinely different visual hypothesis ...},
    {... a third ...}
  ],
  "selected_mood": "<key of the mood you believe in most>",
  "motion": {"selected":"reactive|calm","why":"<1 sentence>"},
  "components": [{"id":"hero","label":"Hero"},{"id":"<id>","label":"<the product's primary live surface>","primary":true},{"id":"waitlist","label":"Waitlist"}],
  "states": [{"key":"idle","why":"<short>"},{"key":"live","why":"<short>"}]
}
Rules: dark moods need light ink, light moods dark ink; all six-digit hex; the "why" fields are your voice — confident, specific to THIS brief, no filler.`;

export async function interpret(brief, { timeoutMs = 100000 } = {}) {
  if (process.env.MUSEFRAME_BRAIN === 'local') return heuristicBoard(brief);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${OLLAMA}/api/generate`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: MODEL, prompt: PROMPT(brief), stream: false, format: 'json',
        keep_alive: '30m', options: { temperature: 0.8, num_predict: 900 },
      }),
    });
    if (!res.ok) throw new Error(`ollama ${res.status}`);
    const data = await res.json();
    const board = sanitizeBoard(JSON.parse(data.response));
    board.brain = `${MODEL} (local, on-device)`;
    return board;
  } catch (e) {
    const board = heuristicBoard(brief);
    board.brain_note = `LLM unavailable (${e.name === 'AbortError' ? 'timeout' : e.message}) — deterministic interpreter used`;
    return board;
  } finally {
    clearTimeout(timer);
  }
}

// Fire-and-forget model warm-up so the first real brief doesn't pay the cold-load tax.
export function warmBrain() {
  if (process.env.MUSEFRAME_BRAIN === 'local') return;
  fetch(`${OLLAMA}/api/generate`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, prompt: 'ok', stream: false, keep_alive: '30m', options: { num_predict: 1 } }),
  }).catch(() => {});
}
