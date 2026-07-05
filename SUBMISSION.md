# RAISE Summit Hackathon 2026 — Submission Pack

**Track:** Cursor (Statement One) · **Deadline:** Sun Jul 5, 12:00 Paris (CEST)  
**Submit at:** https://cerebralvalley.ai/e/raise-summit-hackathon/hackathon/submit  
**Repo (public):** https://github.com/Rumblingb/raise

---

## Copy-paste fields

### Project title
**Raise — Museframe: the AI shows you what it understood, before it builds**

### Short description (≤255 chars)
Visual-first agent harness: local Gemma understanding board → token build → drift lint → Bee fleet dispatch (Cursor worker) → founder-gesture publish & spend gates. Cursor track.

### Long description

**Problem:** When you brief an AI agent, misalignment is discovered last. Text is a lossy channel for design intent — and when agents can publish, spend, and dispatch, the trust gap becomes dangerous.

**Solution (built Jul 4–5, 2026):** Museframe — a visual harness where the agent's first response is *media* (mood hypotheses, motion grammar, component map), not paragraphs. Correct the understanding; tokens propagate. Then: real codegen, a drift linter that patches violations live, fleet dispatch through Bee's router (including headless **cursor-agent** jobs inside the artifact), and outward actions gated by signed one-time tickets + deliberate founder ✓ gesture on Clickey.

**Attribution:** Bee (orchestrator), Clickey (gesture desk), and AgentPay (payment rails) are pre-existing infrastructure — labeled in UI and README. The hackathon entry is this repo's harness only.

**Target user:** Founders running multi-agent companies who need legible understanding *before* build and human-in-the-loop gates on every outward action.

**Why AI:** Local Gemma interprets intent on-device; MCP registry shapes the capability plan; Cursor executes inside the generated artifact; drift re-audits every edit against approved tokens.

**Business value:** The missing trust primitive for agent fleets — signed one-time tickets + deliberate gesture — generalizes to any company-in-a-box operating autonomous workers.

### Technology tags
`Node.js` · `Ollama` · `Gemma` · `Cursor` · `MCP` · `Multi-agent` · `Human-in-the-loop` · `Visual UI`

### Category tags
Developer Tools · AI Agents · Human-Computer Interaction · Trust & Safety

### GitHub repository
https://github.com/Rumblingb/raise

### Demo / application URL
**Local demo (judges):** clone repo → `node server.mjs` → http://localhost:8787  
Zero npm dependencies. Ollama + gemma3:12b optional (deterministic fallback labeled). Bee/Clickey optional (standalone mode labeled).

### Video presentation
*(Upload 1-min demo to YouTube/Loom — paste URL here before submit)*

**Script:** see [RAISE-PLAN.md §6](RAISE-PLAN.md#6--60-second-demo-script)

### Slide presentation
*(Optional — README + this file serve as technical deck)*

---

## Pre-submit checklist

- [ ] `cursor-agent login` — Cursor worker green in fleet lane
- [ ] Server warmed: `node server.mjs` (Gemma loads at boot)
- [ ] Arc verified: `node scripts/verify-arc.mjs`
- [ ] 1-min video recorded (Clickey desk visible for gesture moments)
- [ ] Video URL pasted above + in Cerebral Valley form
- [ ] Discord joined + remote registration confirmed
- [ ] Cursor credits form submitted ($300/dev)
- [ ] Submit before **12:00 Paris Sun Jul 5**
- [ ] Log submission evidence in GOAL.md

---

## Judging fit

| Criterion | Weight | Our proof |
|---|---|---|
| Demo | 50% | Live localhost arc — brief → board → build → drift → fleet → publish → spend |
| Impact | 25% | Founder-gesture trust primitive for agent fleets |
| Creativity | 15% | Understanding as media; orchestrator with a face |
| Pitch | 10% | 60s script; tagline in RAISE-PLAN.md §6 |

---

## Quick judge run

```bash
git clone https://github.com/Rumblingb/raise.git && cd raise
node server.mjs          # wait for "brain warmed: gemma3:12b"
node scripts/verify-arc.mjs
open http://localhost:8787
```

Optional: `MUSEFRAME_BEE=off node server.mjs` for clean-machine standalone mode.
