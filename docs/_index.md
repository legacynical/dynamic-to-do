# Documentation Index

Last verified: 2026-05-11 05:07 AM PDT

Use this index to choose the smallest useful document before reading deeper project context.

## Core Documentation

| Document | Purpose | Read when | Status |
| --- | --- | --- | --- |
| [Product requirements](product-requirements.md) | Product intent, scope, user-facing rules, success criteria, and open owner decisions for the dynamic todo app. | You need to understand what the app is trying to do or whether a change fits product direction. | Active |
| [Technology stack](tech-stack.md) | Runtime, frameworks, dependency roles, scripts, package management, infrastructure, and stack constraints. | You need package, script, environment, provider, validation, or tooling context. | Active |
| [Architecture](architecture.md) | Durable module boundaries, control flow, state ownership, validation implications, and anti-hack constraints. | You are planning or reviewing implementation shape across page state, item components, server actions, and provider boundaries. | Active |
| [README](../README.md) | Quick project orientation, local development commands, and documentation entry points. | You need a fast setup or repo overview. | Active |

## Standalone SRDs

| SRD | Primary purpose | Read when | Status |
| --- | --- | --- | --- |
| [AI todo generation SRD](subsystem-requirements/ai-todo-generation.md) | Requirements for turning a user project and work-life ratio into AI-generated todo text. | You are changing `app/actions.ts`, prompt behavior, provider configuration, output parsing, or generation failure handling. | Active |
| [Task list interaction SRD](subsystem-requirements/task-list-interaction.md) | Requirements for local todo creation, editing, completion, deletion, clearing, and drag-and-drop ordering. | You are changing `app/page.tsx`, `components/todo-item.tsx`, todo state shape, or list interaction behavior. | Active |

## Source Anchors

| Source | Why it matters |
| --- | --- |
| `app/page.tsx` | Main client workflow, local todo state, generation entry point, manual add flow, and drag-and-drop context. |
| `app/actions.ts` | Server action that calls the Nebius-hosted OpenAI-compatible chat API and parses generated todos. |
| `components/todo-item.tsx` | Per-item edit, complete, delete, and sortable drag-handle behavior. |
| `components/ui/` | Local shadcn/Radix-style primitives used by the todo surface. |

## Implementation Journal

| Record | Purpose | Status |
| --- | --- | --- |
| [Implementation journal logs](implementation-journal/_logs.md) | Current implementation status, next-step routing, and validation reminders. | Active |
| [0001. Task list local state stability](implementation-journal/0001-task-list-local-state-stability.md) | First DDD implementation-pipeline record for defensive drag-end guards, functional state updates, pure todo-state tests, and accessible compact row controls. | Complete with dependency-advisory follow-up |
| [0002. Provider loading browser coverage](implementation-journal/0002-provider-loading-browser-coverage.md) | Deterministic mock-provider browser coverage for generation loading, delayed success append, delayed failure preservation, and server-only provider base URL override. | Complete |

## Research Topics

| Topic | File | Category | Researched | Expires | Confidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| [Next.js PostCSS audit advisory](research/next-postcss-audit-advisory.md) | `research/next-postcss-audit-advisory.md` | security | 2026-05-11 | 2026-06-10 | medium | current |
