# Technology Stack & Dependencies

Last verified: 2026-05-11 06:22 AM PDT
Source-of-truth for: runtime, frameworks, dependency roles, tooling, infrastructure, and repo conventions

A concise inventory of the stack currently proven by `package.json`, `package-lock.json`, committed configuration, and routed DDD docs.

---

## Stack overview

| Layer | Technology |
| --- | --- |
| App runtime | Next.js 15.5.18 App Router on React 19 |
| UI | Tailwind CSS 4, local shadcn/Radix-style primitives, lucide-react icons |
| Drag-and-drop | `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities` |
| AI generation | `openai` SDK against Nebius AI Studio OpenAI-compatible API |
| Package manager | npm with `package-lock.json` lockfileVersion 3 |

---

## A. Runtime

| Technology | Version | Purpose | Docs |
| --- | --- | --- | --- |
| Node.js | Not pinned in repo | Runs Next.js scripts and server actions locally. | `package.json`, `package-lock.json` |
| TypeScript | Transitive through Next.js; configured in repo | Type-checking TS/TSX source with `strict: false`. | `tsconfig.json` |

*Config*: `tsconfig.json`, `next.config.mjs`

---

## B. Frameworks and platforms

| Framework or platform | Version | Purpose | Docs |
| --- | --- | --- | --- |
| Next.js | `^15.5.18` | App Router framework, build pipeline, server actions. | `package.json`, `app/` |
| React | `^19.0.0` | Client component rendering and local state. | `package.json` |
| React DOM | `^19.0.0` | Browser rendering adapter for React. | `package.json` |

*Config*: `app/layout.tsx`, `app/page.tsx`, `app/actions.ts`, `next.config.mjs`

---

## C. Key dependencies

### Local task interaction

| Package | Version | Purpose | Docs |
| --- | --- | --- | --- |
| `@dnd-kit/core` | `^6.3.1` | Drag context, sensors, collision detection, and drag events. | `package.json`, `components/todo-item.tsx`, `app/page.tsx` |
| `@dnd-kit/sortable` | `^10.0.0` | Sortable list behavior and keyboard coordinate helper. | `package.json`, `components/todo-item.tsx`, `app/page.tsx` |
| `@dnd-kit/utilities` | `^3.2.2` | CSS transform helpers for sortable item rendering. | `package.json`, `components/todo-item.tsx` |

*Important boundary*: `app/page.tsx` owns the canonical local todo array; `components/todo-item.tsx` owns per-item transient editing and drag-handle rendering.

### UI primitives and styling

| Package | Version | Purpose | Docs |
| --- | --- | --- | --- |
| `@radix-ui/react-checkbox` | `^1.1.4` | Accessible checkbox primitive. | `components/ui/checkbox.tsx` |
| `@radix-ui/react-slider` | `^1.2.3` | Life/Work balance slider primitive. | `components/ui/slider.tsx` |
| `@radix-ui/react-slot` | `^1.1.2` | Slot support for local Button primitive. | `components/ui/button.tsx` |
| `lucide-react` | `^0.483.0` | Icons for loading, task controls, and drag handle. | `app/page.tsx`, `components/todo-item.tsx` |
| `class-variance-authority` | `^0.7.1` | Variant styling helper for local UI primitives. | `components/ui/button.tsx` |
| `clsx` | `^2.1.1` | Conditional class composition. | `lib/utils.ts` |
| `tailwind-merge` | `^3.0.2` | Tailwind class conflict merging. | `lib/utils.ts` |
| `tw-animate-css` | `^1.2.4` | Tailwind animation utility import. | `app/globals.css` |

*Config*: `app/globals.css`, `components.json`, `postcss.config.mjs`

### AI generation

| Package or service | Version / value | Purpose | Docs |
| --- | --- | --- | --- |
| `openai` | `^4.89.0` | OpenAI-compatible SDK used by the server action. | `app/actions.ts` |
| Nebius AI Studio | External service | OpenAI-compatible chat completions provider. | `docs/subsystem-requirements/ai-todo-generation.md` |
| Model | `meta-llama/Meta-Llama-3.1-70B-Instruct` | Current todo generation model. | `app/actions.ts` |

*Important boundary*: Provider configuration and `NEBIUS_API_KEY` stay inside `app/actions.ts`; browser code treats generation as `generateTodos(project, workLifeRatio): Promise<string[]>`.

---

## D. Development dependencies

| Package | Version | Purpose | Docs |
| --- | --- | --- | --- |
| `eslint` | `^9` | Lint engine. | `eslint.config.mjs` |
| `eslint-config-next` | `^15.5.18` | Next.js ESLint rules via flat config compatibility. | `eslint.config.mjs` |
| `@eslint/eslintrc` | `^3` | FlatCompat support for legacy config extension. | `eslint.config.mjs` |
| `@tailwindcss/postcss` | `^4` | Tailwind CSS PostCSS integration. | `postcss.config.mjs` |
| `tailwindcss` | `^4` | Styling framework. | `app/globals.css` |
| `@types/node` | `22.13.11` | Node.js type declarations. | `package.json` |
| `@types/react` | `19.0.12` | React type declarations. | `package.json` |
| `@playwright/test` | `^1.59.1` | Browser interaction regression tests for the rendered todo UI. | `playwright.config.ts`, `e2e/todo-interactions.spec.ts` |

*Config*: `eslint.config.mjs`, `postcss.config.mjs`, `tsconfig.json`

---

## E. Testing

| Artifact or package | Version / status | Purpose |
| --- | --- | --- |
| `node --test` | Node.js built-in test runner | Pure local-state, generation-output, generation-input, and generation-prompt regression tests without adding a package-level test dependency. |
| `@playwright/test` | `^1.59.1` | Browser interaction coverage for manual add, Enter add, completion, edit/cancel/save, delete, Clear All, and empty state. |
| `npm run build` | Present | Next.js production build and compile validation. |
| `npm run lint` | Present | Runs `eslint .` with Next core-web-vitals rules through the flat ESLint config. Generated/cache output is ignored in `eslint.config.mjs`. |

*Further reading*: `docs/subsystem-requirements/task-list-interaction.md`, `docs/subsystem-requirements/ai-todo-generation.md`

---

## F. Infrastructure and external services

| Service | Purpose | Notes |
| --- | --- | --- |
| Nebius AI Studio | Chat completions provider for todo generation. | Requires `NEBIUS_API_KEY` in server-side environment; see `.env.example`; run `npm run env:check` before validating provider-backed generation. |
| `NEBIUS_BASE_URL` | Optional server-only provider endpoint override. | Leave unset for Nebius; Playwright uses it to point the server action at a local OpenAI-compatible mock provider. |

---

## G. Package management

**npm**

- *Config*: `package.json`, `package-lock.json`
- *Overrides or patches*: none declared in `package.json`
- *Why*: The repo currently includes an npm lockfile and no alternate package-manager lockfile.

---

## H. Scripts

```bash
npm run dev     # Next.js dev server with Turbopack
npm run build   # Next.js production build
npm run start   # Serve a production build
npm run lint    # ESLint CLI with Next core-web-vitals rules
npm run test    # Node built-in tests for pure todo-state transitions
npm run env:check # Validate required provider env without printing secret values
npm run test:e2e # Playwright browser interaction tests
```

---

## I. Dependency lifecycle

```bash
npm install <package>       # add a production dependency
npm install -D <package>    # add a development dependency
npm update <package>        # update through npm and lockfile
npm uninstall <package>     # remove a dependency
npm audit                   # audit lockfile dependencies
```

---

## J. Versioning strategy

- **Pinning**: `@types/node` and `@types/react` are exact in `package.json`; most runtime dependencies use caret ranges with the lockfile as the installed-version authority.
- **Overrides / resolutions**: none currently declared.
- **Patches**: no patch files or package-manager patch metadata are present.

---

## K. Major version upgrades

Before upgrading core stack pieces, review upstream migration notes for Next.js, React, Tailwind CSS, Radix primitives, dnd-kit, and the OpenAI SDK. Add focused research under `docs/research/` only when an upgrade or provider decision depends on current external behavior.

---

## L. Current constraints

- Todo persistence is intentionally session-local until PRD and SRD persistence questions are answered.
- Provider-backed generation requires `NEBIUS_API_KEY`; local todo interactions must still work without a successful provider call.
- Existing TypeScript config has `strict: false`; new implementation should avoid relying on strict-mode guarantees until the project opts in.
- `npm audit --omit=dev` currently reports a moderate advisory through Next.js' direct nested `postcss` dependency. The suggested `npm audit fix --force` path would downgrade Next.js to 9.3.3, so it is not an acceptable blind fix. Current npm metadata shows Next.js 15.5.18 and latest 16.2.6 both declare `postcss` 8.4.31, so a plain major upgrade is not a known fix for this advisory yet.

---

## M. Future considerations

| Need | Why | Candidates |
| --- | --- | --- |
| Browser interaction expansion | Current Playwright coverage protects the manual todo flow, keyboard reorder, provider failure preservation, and slow provider success/failure loading behavior. Pointer drag remains intentionally separate. | Additional Playwright specs only if dnd-kit pointer behavior becomes a priority. |
| Dependency advisory follow-up | The remaining PostCSS advisory is carried by Next.js' internal dependency graph. | Track a patched Next.js release or research whether a package override is safe for this app. Latest checked Next.js metadata still declares vulnerable nested PostCSS. See [Next.js PostCSS audit advisory research](research/next-postcss-audit-advisory.md). |
| User-visible generation errors | Provider failures now show a generic local error and preserve todos. | Retry affordance or typed action result if the product needs richer recovery. |
| Persistence | Product question remains open. | localStorage, database-backed storage, authenticated cloud sync. |

---

## N. References

- [Product requirements](product-requirements.md)
- [Task list interaction SRD](subsystem-requirements/task-list-interaction.md)
- [AI todo generation SRD](subsystem-requirements/ai-todo-generation.md)
- [Architecture](architecture.md)

---

## Task triage

tt1. [iterate] Expand browser interaction coverage only for remaining high-risk surfaces; provider-error and loading-time generation behavior are now covered, while pointer drag remains separate.
tt2. [research] Track the remaining Next.js/PostCSS audit advisory from [research/next-postcss-audit-advisory.md](research/next-postcss-audit-advisory.md); do not apply the current forced downgrade recommendation.
tt3. [policy] Decide the official Node.js version for local development and deployment, then encode it in the repo.

---

## Open questions

oq1. Which Node.js version should this project officially support for local development and deployment?
oq2. Should npm remain the package-manager policy, or should the repo support another package manager?
