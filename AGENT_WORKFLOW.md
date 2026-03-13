# AI Agent Workflow Log

## Agents Used

| Agent | Role |
|-------|------|
| **Claude Code** (claude-sonnet-4-6) | Primary development agent — architecture, domain modeling, full implementation |

---

## Prompts & Outputs

### Example 1 — Architecture scaffolding

**Prompt:**
> Set up a FuelEU Maritime compliance platform. Frontend: React + TypeScript + TailwindCSS. Backend: Node.js + TypeScript + PostgreSQL. Architecture: Hexagonal (Ports & Adapters). Include Docker Compose for local Postgres.

**Output (summarised):**
- Created `/frontend` with Vite + React 19 + TS + Tailwind v4 (PostCSS path)
- Created `/backend` with Express 5 + TypeScript 5.9 strict mode + pg
- Laid out hexagonal directory structure:
  - `core/domain`, `core/application`, `core/ports`
  - `adapters/inbound/http`, `adapters/outbound/postgres`
  - `infrastructure/db`, `infrastructure/server`
- Added `docker-compose.yml` with `postgres:16-alpine`, healthcheck, named volume

---

### Example 2 — Domain modeling

**Prompt:**
> Model the FuelEU compliance domain: Route entity, ComplianceBalance with CB formula, BankEntry, Pool with greedy allocation. Use pure TypeScript — no framework dependencies in the core.

**Output:**
- `Route.ts` — typed entity with `VesselType` and `FuelType` union types
- `Compliance.ts` — `computeComplianceBalance()` pure function implementing CB = (Target − Actual) × EnergyInScope
- `Banking.ts` — `BankingResult` and `ApplyBankedResult` value objects
- `Pool.ts` — `allocatePool()` pure function with greedy two-pointer algorithm enforcing all three Article 21 rules

---

### Example 3 — Refinement: Recharts formatter types

**Issue encountered:**
Agent initially typed the Recharts `Tooltip formatter` as `(v: number) => ...`, which caused a TS2322 error because Recharts types `value` as `ValueType | undefined`.

**Correction applied:**
```tsx
// Before (agent output — caused TS error)
<Tooltip formatter={(v: number) => [`${v.toFixed(4)} gCO₂e/MJ`, 'GHG Intensity']} />

// After (corrected)
<Tooltip formatter={(v) => [`${Number(v).toFixed(4)} gCO₂e/MJ`, 'GHG Intensity']} />
```

---

### Example 4 — Tailwind v4 PostCSS migration

**Issue encountered:**
Vite 8 ships with Tailwind v4, which moved the PostCSS plugin to `@tailwindcss/postcss`. The initial `postcss.config.js` used the old `tailwindcss: {}` key.

**Correction applied:**
```js
// Before
export default { plugins: { tailwindcss: {}, autoprefixer: {} } }

// After
export default { plugins: { '@tailwindcss/postcss': {} } }
```

---

### Example 5 — `verbatimModuleSyntax` type imports

**Issue encountered:**
Frontend `tsconfig.json` has `verbatimModuleSyntax: true` (Vite default), requiring all type-only imports to use `import type`. All page components and the API client used plain `import { SomeType }`.

**Correction applied:**
Changed all type-only imports to `import type { ... }` across:
- `IApiPort.ts`, `ApiClient.ts`, `RoutesTab.tsx`, `CompareTab.tsx`, `BankingTab.tsx`, `PoolingTab.tsx`

---

## Validation / Corrections

| Area | What was validated |
|------|--------------------|
| Domain formulas | CB formula cross-checked against spec: CB = (89.3368 − actual) × (fuelConsumption × 41 000). Unit tests confirm sign (deficit vs surplus) |
| Pool allocation | Four unit tests covering: surplus→deficit transfer, negative aggregate rejection, surplus ship stays ≥ 0, exact-zero pool |
| TypeScript strict | `npm run build` on frontend — 0 errors after corrections |
| Backend unit tests | `npm test` — 16/16 passing |
| Repo isolation | Core domain files have **zero** imports from Express, pg, or React |

---

## Observations

### Where the agent saved time
- Boilerplate reduction: full hexagonal directory structure, all 4 repositories, all 5 use-cases, all 4 HTTP routers — generated in minutes
- Regulatory formula translation: correctly translated CB = (Target − Actual) × Energy from the FuelEU spec with right units
- Test scaffolding: Jest mocks, edge cases (over-apply, zero CB, negative pool) written in one pass
- Config debugging: diagnosed Tailwind v4 / Vite 8 / verbatimModuleSyntax issues from error messages alone

### Where it needed correction
- **Recharts types**: inferred `number` for formatter param; actual Recharts type is `ValueType | undefined`
- **Tailwind v4 PostCSS**: agent initially used the Tailwind v3 PostCSS config key
- **`import type`**: agent didn't anticipate `verbatimModuleSyntax` strictness on first pass

### How tools were combined
- Claude Code used for all code generation, architecture decisions, and iterative fixes
- Build output (`npm run build`, `npm test`) used as ground-truth feedback loop — errors fed back immediately for correction

---

## Best Practices Followed

1. **Domain-first**: wrote pure domain entities and formulas before any framework code
2. **Red-green on unit tests**: ran `npm test` after writing tests — all 16 passed first run
3. **Build-driven validation**: ran `npm run build` after completing frontend — fixed all 3 categories of errors before proceeding
4. **Minimal coupling**: core/ has zero imports from Express, React, or pg — verified by checking each domain/port/application file
5. **Incremental commits**: each logical layer committed separately (domain → ports → use-cases → DB → adapters → HTTP → tests → frontend)
