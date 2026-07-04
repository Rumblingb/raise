# Raise

**One always-on orchestrator, every power tool, one visual canvas — and a human gesture
on every outward action.**

**Museframe** (this repo's harness) is the visual surface: the AI shows you what it
understood — as mood, motion, structure, and states — *before* it builds, and every
outward action it stages must be approved by a deliberate founder gesture. Cursor and
Codex make the AI's *work* legible as text; Raise makes an AI-operated company legible
as a canvas.

Built for the RAISE Summit Hackathon 2026 (Cursor track). See [RAISE-PLAN.md](RAISE-PLAN.md)
for the full end-to-end plan and demo script.

## Attribution (RAISE "new work only" rule)

- **Built during the event (2026-07-04→05):** everything in this repo — the harness server,
  interpreter, builder, drift linter, capability radar, Bee/Clickey adapter, and the canvas UI.
- **Pre-existing infrastructure (NOT part of the entry, clearly labeled in the UI):**
  **Bee** (the founder's task orchestrator), **Clickey** (its gesture-approval desk), and
  **AgentPay** (payment rails). The harness integrates with them and degrades to a labeled
  standalone mode when they are absent — judges can run it on a clean machine.

## The problem

When you brief an AI agent, misalignment is discovered **last**. You describe intent in
words, the agent replies with confident prose, builds invisibly, and only when you open
the result do you learn it misunderstood you. Text is a lossy channel for design intent —
and when agents can also *act* (publish, spend, dispatch), the trust gap gets dangerous.

## The flip

1. **Understanding board** — the agent's first response is media, not paragraphs: mood
   hypotheses with real palettes, motion grammar (demonstrated, not described), a component
   map, and state wireframes. Tap anything to redirect the *understanding*; tokens propagate
   across the whole canvas. Correcting understanding replaces re-prompting.
2. **Capability radar** — what the agent can reach for right now, probed live (MCP registry,
   local models, the control plane), with capabilities that visibly change the plan.
3. **Background build + drift sentinel** — code is generated on disk from the approved
   tokens; a real linter audits the artifact against them and patches violations as a live
   morph, not a diff you have to imagine.
4. **Gated publish** — outward actions become signed one-time Bee tickets on the founder's
   approval wall, approved only by a deliberate ✓ mouse gesture on the Clickey desk. The
   harness cannot approve its own actions. Publish is refused while drift is open.
5. **Visual changelog + voice** — every decision human-readable; brief by voice, agent
   narrates at key beats.

## Verified end-to-end (2026-07-04, live)

- Brief interpreted on **local gemma3:12b** via Ollama (no API key) — the model invented its
  own mood hypotheses and palettes; a deterministic fallback keeps the demo alive offline.
- Capability radar hit the **live MCP registry**; fallbacks are labeled, never silent.
- Build wrote a real artifact; the **drift linter found 3 genuine violations** (stale legacy
  CTA vs approved tokens), patched them, re-linted clean.
- Publish with open drift → **HTTP 409**. Publish after patch → **signed Bee ticket** visible
  on the real approval wall (then rejected as test cleanup).

## Run it

```bash
node server.mjs          # http://localhost:8787 — zero dependencies, Node ≥ 18
```

Optional environment: `MUSEFRAME_BRAIN=local` (skip LLM), `MUSEFRAME_MODEL`,
`MUSEFRAME_OLLAMA`, `MUSEFRAME_BEE=off` (force standalone), `PORT`.
Without Ollama or Bee it still runs — every degraded path is labeled in the UI.

`docs/prototype.html` is the day-1 static sketch kept for provenance.

## Next (event window)

- [x] **Dispatch lane** (verified 2026-07-04): Bee's worker fleet (Claude / Codex / Hermes /
      Nemotron / local Gemma / Cursor) as live canvas cards read from the real board;
      dispatch goes through Bee's **own router** and the canvas reports the route it
      *actually* chose — smoke test asked for claude, router chose local-gemma
      ("trivial → local, $0"), card displayed `preference overridden by policy`.
      Cursor shows `absent` truthfully until installed.
- [ ] Cursor worker adapter — Cursor as a fleet worker under the orchestrator (blocked on install)
- [ ] AgentPay spend surface: mandate → gesture → sandbox settle → receipt on canvas
