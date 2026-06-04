# Say So

**Voice to a tested, running app. You just have to say so.**

Speak (or type) a request. A Cursor Agent SDK run scaffolds a small web app in a
scratch workspace, runs it, and verifies its own work by taking a screenshot of
the running app. We stream the agent's work live and surface its own screenshot
as proof.

## Run it (3 steps)

1. `npm install` then `npx playwright install chromium` (one-time, for the proof screenshot)
2. Put your Cursor API key in `.env.local`: `CURSOR_API_KEY=cursor_...`
3. `npm run dev` and open http://localhost:3000 in Chrome

Click **Speak** (or type) and say: _"a todo list app where I can add and delete tasks."_

## How it works

- `app/page.tsx` — single-screen UI: mic/text input, live build stream, proof panel
- `app/api/build/route.ts` — POST that streams normalized agent events (SSE over a `ReadableStream`, Node runtime)
- `app/api/proof/route.ts` — serves the screenshot the agent took
- `lib/cursor.ts` — creates a local Cursor agent, sends one prompt, maps `run.stream()` to UI events
- `lib/scratch.ts` — resets the scratch workspace and pre-seeds the screenshot helper
- `lib/prompts.ts` — the prescriptive build + self-verify prompt

The agent runs **locally** against a scratch directory, so the screenshot is read
straight off disk. One request = one fresh agent (respects the one-active-run rule).
