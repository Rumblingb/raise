# RAISE — end-to-end plan (co-founder brief)

> Repo: github.com/Rumblingb/raise · Track: **Cursor (Statement One)** · Submissions: **Sun Jul 5, 12:00 PM Paris**
> Thesis: one always-on orchestrator (**Bee**) owns the machine and every power tool —
> Codex, Hermes, Claude, Cursor — dispatching over the existing kanban, paying through
> AgentPay, expressing itself through the **Museframe** visual canvas instead of chat transcripts.

## 1 · The three layers (and what the judges may count)

| Layer | What it is | Status | Hackathon-legal? |
|---|---|---|---|
| **Control plane** | Bee spine (kanban, routing, approval wall, voice), Clickey gesture desk, AgentPay payment rails | pre-existing | ❌ NOT the entry — attributed infrastructure ("the company being operated") |
| **Museframe harness** | intent → understanding board (local Gemma) → token-driven build → real drift lint → publish gated by signed founder ticket | **built + verified Jul 4** | ✅ the core entry |
| **Raise dispatch layer** | Bee conducting the power-tool fleet from the canvas: dispatch lanes, Cursor worker adapter, spend surface | build next (in event window) | ✅ entry, if finished before submission |

**Rules constraint that shapes everything:** *"New Work Only… judges must clearly identify
what was created during the event."* So Bee is never pitched as ours-built-here; it is the
enterprise the new harness operates. Every pre-existing surface is labeled in the UI and README.

## 2 · What is DONE and verified (2026-07-04, this machine)

- Brief → understanding board on **local gemma3:12b** (no API key): generated original mood
  hypotheses (cosmic/glitch/vaporwave) with its own palettes; deterministic fallback if Ollama is down.
- Capability radar probing the **live MCP registry** + local capabilities (Gemma, Bee/Clickey),
  with labeled cached fallback — never silently fake.
- Token-driven **codegen on disk**; drift sentinel is a **real linter** (found 3 genuine violations
  from the stale legacy CTA library; patch rewrote the artifact; re-lint clean).
- **Truthful gate:** publish returns HTTP 409 while drift is open.
- **Publish → Bee:** staged signed one-time ticket `act_…` on the real approval wall (verified on
  the live labs board, then rejected as test cleanup). Approval requires the founder's ✓ gesture
  on Clickey — the harness cannot approve its own actions, by design.

## 3 · Build next (inside the event window, priority order)

1. **Dispatch lane on the canvas** — a fourth Museframe section: Bee's worker fleet as live cards
   (claude / codex / hermes / cursor), each showing lane, current card, and heartbeat, fed by
   read-only board + worker-status peeks. Interaction: drag a generated build task onto a worker →
   stages a routed card (internal-autonomous, Labs lane only).
2. **Cursor worker adapter** — the one genuinely missing power tool. `cursor-agent` CLI (or
   background agent API) as a Bee assignee: card in → cursor session out, result reported back to
   the board. This is also the strongest Cursor-track story: *Cursor as a fleet worker under an
   orchestrator, not a human's editor.*
3. **Spend surface (AgentPay)** — "the build needs an asset/tool" → Museframe stages a Bee payment
   mandate (guard → mandate → wall) → Clickey gesture → **sandbox** settle → receipt on the canvas.
   Real rails, capped, founder-gated; no live money in the demo.
4. **Voice loop polish** — brief by voice (done), Bee speaks at staging (done); add spoken worker
   status on demand.

Not in window (post-hackathon roadmap): Lenovo/Hermes SSH repair, n8n consolidation, live payment
mandates, always-on screen ownership, promotion of Fable as Bee's routing brain.

## 4 · Known risks → mitigations

- **`claude -p` is 401 on this machine** → Claude worker card shows staged-only until `claude login`;
  demo leans on Cursor/Codex/local Gemma. Fix = one interactive login before recording.
- **Codex quota windows** → Cursor adapter is the demo worker; Codex card may show "queued".
- **Gemma cold load ≈ 90 s** → server warms the model at boot; record demo after first interpret.
- **"Dashboard-main projects" are banned** → the canvas is an *instrument you act through*
  (redirect intent, patch drift, approve with a gesture), never a passive metrics page. Say this
  in the pitch.
- **Team size rule** — remote teams: 1–5 ✓; in-person requires exactly 5. Confirm registration mode.

## 5 · Logistics checklist (founder actions — none can be done by agents)

- [ ] Join event Discord; confirm remote registration + team entry
- [ ] Cursor credits form (tab already open) — $300/dev
- [ ] Record **1-minute demo video** (script below), upload to YouTube/Loom
- [ ] Submit at cerebralvalley.ai/e/raise-summit-hackathon/hackathon/submit before **12:00 Sun**

## 6 · 60-second demo script

1. *(0–10s)* Speak the brief. "Museframe answers in media, not paragraphs" — board appears, Gemma-local badge.
2. *(10–20s)* Tap a mood tile → the entire canvas re-themes. "Correct the understanding, not the output."
3. *(20–30s)* Build → real artifact in the frame; drift sentinel flags the stale-library CTA; patch morphs it live.
4. *(30–42s)* Dispatch lane: the fleet (Cursor worker takes the card) — "Bee conducts every power tool we own."
5. *(42–55s)* Publish → signed ticket on the founder wall → Clickey gesture pane → draw ✓ → released.
   "The harness cannot approve its own actions. That's the point."
6. *(55–60s)* Tagline: **"Cursor and Codex make AI work legible as text. Raise makes an AI company legible as a canvas."**

## 7 · Judging fit (weights)

- **Demo 50%** — everything above is live and self-running on one machine; nothing mocked, fallbacks labeled.
- **Impact 25%** — the founder-approval pattern (signed one-time tickets + deliberate gesture) is the missing
  trust primitive for agent fleets; the harness generalizes to any company-in-a-box.
- **Creativity 15%** — the interface flip: the agent's understanding as media; the orchestrator with a face.
- **Pitch 10%** — script above; lead with the gesture moment.
