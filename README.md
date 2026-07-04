# Museframe

**The AI shows you what it understood — before it builds.**

Cursor and Codex make the AI's *work* legible as text. Museframe makes the AI's
*understanding* legible as media — and lets you correct that understanding before
the build, not after it. Coding is a background process; the canvas is the conversation.

Built for the RAISE Summit Hackathon (Cursor + Google DeepMind tracks).

## The problem

When you brief an AI agent, misalignment is discovered **last**. You describe intent
in words, the agent replies with confident prose, builds invisibly, and only when you
open the result do you learn it misunderstood you. Text is a lossy channel for design
intent, and the chat paradigm puts intent verification at the *end* of the loop.

## The flip

The agent's first response is media, not paragraphs:

1. **Understanding board** — mood hypotheses, motion grammar (demonstrated, not
   described), component map, and idle/live state wireframes. Tap anything to
   redirect the agent's *understanding*; design tokens propagate across the entire
   canvas, including the built product. Correcting understanding replaces re-prompting.
2. **Capability radar** — what the agent can reach for right now (MCP registry,
   partner APIs, local skills), with capabilities that visibly *change the plan*.
3. **Background build + drift sentinel** — code happens off-stage. What surfaces is
   the product, plus any place it betrayed the grammar you approved, patched as a
   live morph with before/after chips instead of a text diff.
4. **Visual changelog** — every agent decision and user redirect, human-readable.

Voice in (Web Speech recognition for the brief) and voice out (the agent narrates
its state at key beats).

## Run it

Open `index.html` in a browser. Hit **Interpret →** and the demo arc plays out;
then tap a mood tile and watch the whole canvas re-theme.

## Roadmap

- [ ] Wire the mic brief to actually reshape the understanding board
- [ ] Real background builder (Gemini persistent agent) behind the progress bar
- [ ] Capability radar fed by the live MCP registry
- [ ] Drift sentinel running on real generated code, not a staged violation
