# Reflection — AI-Assisted Development

## What I Learned

Working with Claude Code on a domain-heavy regulatory project like FuelEU Maritime surfaced something I hadn't fully internalised before: **AI agents are strongest when the problem is well-specified and weakest at the edges of library APIs**.

The core domain — the CB formula, banking rules, pool allocation — was translated from regulation text to TypeScript almost perfectly on the first attempt. The agent understood the math and correctly mapped it to domain objects with zero framework coupling. This was the highest-leverage use of AI in the project.

The friction points were all at integration boundaries: Tailwind v4's renamed PostCSS plugin, Recharts' `ValueType | undefined` formatter signature, and TypeScript's `verbatimModuleSyntax` strict mode on type imports. These are the kinds of details that live in changelogs and release notes rather than in official docs — places where LLM training data gets stale fast. The fix pattern was always the same: run the build, read the error, tell the agent, and it corrected immediately.

## Efficiency Gains

| Task | Manual estimate | With AI | Saved |
|------|----------------|---------|-------|
| Directory scaffolding + configs | 30 min | 5 min | 25 min |
| Domain modeling (4 entities + formulas) | 2 hrs | 20 min | 1h 40m |
| Repository adapters (4 × Postgres) | 3 hrs | 25 min | 2h 35m |
| Use-cases + HTTP routers | 2 hrs | 20 min | 1h 40m |
| Unit test scaffolding (16 tests) | 2 hrs | 15 min | 1h 45m |
| Frontend 4-tab dashboard | 4 hrs | 45 min | 3h 15m |

Total rough saving: ~11 hours on a project that would otherwise take 14–16 hours solo.

The multiplier isn't uniform. Boilerplate (configs, repository patterns, type mappers) gets an ~8x speedup. Novel business logic (the greedy pool allocator, the CB formula) gets ~3x — because you still need to read the spec yourself and verify the output is correct.

## What I'd Do Differently

1. **Start with the spec PDF earlier.** The FuelEU regulation document (pp. 104–107 on banking/pooling) has nuances — like the "deficit ship cannot exit worse" rule — that are easy to miss. I'd feed the relevant pages to the agent as context upfront rather than describing the rules in natural language.

2. **Lock dependency versions before generating code.** The Vite 8 / Tailwind v4 / `verbatimModuleSyntax` issues all stem from the agent knowing Vite 5/6 patterns better. Pinning to known-stable versions (or telling the agent the exact versions) would have eliminated the post-generation fixes.

3. **Ask the agent to generate tests before implementation.** I wrote tests after the use-cases. Writing them first (or in parallel) would have caught the edge cases — especially the over-apply banking scenario — earlier in the loop.

4. **Use the agent for documentation last, not first.** AGENT_WORKFLOW.md is most valuable when written after the implementation, when you can point to real prompts and real errors. Writing it speculatively upfront produces generic content that has to be rewritten anyway.
