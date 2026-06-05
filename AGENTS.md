# Say So — agent guidance

**Say So** is a single-screen Next.js 16 demo: voice or text → local `@cursor/sdk` agent → live build stream → agent screenshots the app it built → proof panel shows that PNG.

**Detailed rules:** see [`.cursor/rules/`](.cursor/rules/) — four focused `.mdc` files (overview, architecture, styling, guardrails). That directory is the source of truth for conventions; this file is the entry point.

## Quick map

| Area | Key files |
|------|-----------|
| UI + stream client | `app/page.tsx`, `components/` |
| Build API (SSE) | `app/api/build/route.ts` → `lib/cursor.ts` |
| Proof API | `app/api/proof/route.ts` → `lib/scratch.ts` |
| Event contract | `lib/events.ts` (`BuildEvent` union) |
| Agent prompt | `lib/prompts.ts` |
| Scratch + screenshot | `{tmpdir}/say-so/` via `lib/scratch.ts` |

**Run locally:** `CURSOR_API_KEY` in `.env.local`, `npm run dev`, Chrome for Web Speech. Demo prompt: `DEFAULT_REQUEST` in `lib/events.ts`.

**Prime directive:** demo reliability beats sophistication. Floor (streamed build) must never break for flex features.

---

## Next.js 16 — read before you edit framework code

This repo uses **Next.js 16.2.7** with breaking differences from older versions in training data (App Router conventions, route handlers, React 19).

Before changing routing, route handlers, or `next.config.ts`, read the vendored guide:

```
node_modules/next/dist/docs/
```

Start with `01-app/03-api-reference/03-file-conventions/route.md` for API routes. Heed deprecation notices — do not assume Pages Router or Next 14 patterns.
