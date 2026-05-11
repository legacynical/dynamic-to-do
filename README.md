# Dynamic To Do

Dynamic To Do is a Next.js app for turning a project or day-plan prompt into an editable todo list. It can generate AI task suggestions shaped by a Life/Work balance slider, then lets the user add, edit, complete, delete, clear, and reorder tasks locally.

## Documentation

- [Documentation index](docs/_index.md) routes the project docs by purpose.
- [Product requirements](docs/product-requirements.md) captures product intent, scope, user-facing rules, and open owner decisions.
- [Technology stack](docs/tech-stack.md) captures runtime, dependency, script, provider, and validation facts.
- [Architecture](docs/architecture.md) captures module boundaries, state ownership, control flow, and anti-hack constraints.
- [AI todo generation SRD](docs/subsystem-requirements/ai-todo-generation.md) covers provider calls, prompt behavior, output parsing, and generation failure handling.
- [Task list interaction SRD](docs/subsystem-requirements/task-list-interaction.md) covers local todo lifecycle, editing, completion, deletion, clearing, and drag-and-drop behavior.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment

AI generation currently uses a Nebius AI Studio OpenAI-compatible endpoint. Create `.env.local` and set this variable before using generation:

```bash
NEBIUS_API_KEY=...
```

`NEBIUS_BASE_URL` is optional and should normally stay unset; the browser test
suite uses it to point the server action at a local OpenAI-compatible mock.

The local todo controls still work without a successful provider call.

## Key Source Files

- `app/page.tsx` owns the main page workflow and local todo state.
- `app/actions.ts` owns the AI generation server action.
- `components/todo-item.tsx` owns per-item editing, completion, deletion, and drag handle behavior.
- `components/ui/` contains the local UI primitives used by the page.

## Scripts

```bash
npm run dev
npm run build
```

`npm run lint` is present in `package.json`, but the project currently uses Next.js 15 where the legacy `next lint` command may need to be replaced with an ESLint CLI command.
