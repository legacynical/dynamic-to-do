---
topic: "Next.js PostCSS audit advisory"
slug: "next-postcss-audit-advisory"
aliases:
  - "CVE-2026-41305"
  - "GHSA-qx2v-qp2m-jg93"
  - "PostCSS XSS advisory"
category: security
researched: "2026-05-11T06:22:00-07:00"
expires: "2026-06-10"
version: 2
confidence: medium
project: "dynamic-to-do"
related-decisions: []
related-research: []
source-count: 6
status: current
superseded-by: null
---

# Next.js PostCSS Audit Advisory

## Scope

This research records the current dependency-audit finding that remains after upgrading `dynamic-to-do` from Next.js 15.2.3 to Next.js 15.5.18 and rechecking current npm metadata on 2026-05-11.

The question is not whether PostCSS has a real advisory. It does. The question is whether the remaining `npm audit --omit=dev` result should be fixed automatically by the current `npm audit fix --force` recommendation.

## Local Evidence

`npm audit --omit=dev --cache ./.npm-cache` reports a moderate advisory for `postcss < 8.5.10` through `node_modules/next/node_modules/postcss`.

The same audit output says the available forced fix would install `next@9.3.3`, which is a breaking framework downgrade from the current Next.js 15 line. That recommendation should not be applied blindly.

`package-lock.json` shows the upgraded app dependency at `next` 15.5.18. The nested Next.js dependency still pins `postcss` 8.4.31 under `node_modules/next`, while the root/dev PostCSS resolution is 8.5.14.

`npm view next@15.5.18 dependencies --json` confirms Next.js 15.5.18 declares `postcss` 8.4.31 directly. `npm view next version dependencies --json` reports current latest Next.js 16.2.6, which also declares `postcss` 8.4.31. `npm view next@15.5.19 version dependencies --json` returns 404, so there is not a newer 15.5.x patch available from the registry at this check.

## Advisory Facts

GitHub Advisory Database identifies the issue as CVE-2026-41305 / GHSA-qx2v-qp2m-jg93, moderate severity, affecting npm package `postcss` versions before 8.5.10. The patched version is 8.5.10.

NVD describes the issue as PostCSS failing to escape `</style>` sequences when stringifying CSS AST output. The risk appears when user-submitted CSS is parsed and re-stringified for embedding in HTML style tags.

PostCSS release 8.5.10 records the fix for unescaped `</style>` in non-bundler cases.

## Impact Notes For This App

The app does not currently expose user-authored CSS input or a feature that parses user CSS and embeds stringified PostCSS output into HTML. That lowers immediate product exposure, but the advisory still matters because the vulnerable package is reachable through the framework dependency tree and audit tooling will keep flagging it.

The current safe action is to preserve the Next.js 15.5.18 upgrade, keep lint/build green, and track the residual advisory. A future patched Next.js release or a deliberately researched override may remove the nested vulnerable PostCSS copy. Upgrading to current latest Next.js 16.2.6 would not remove the nested PostCSS 8.4.31 dependency by itself based on current npm metadata.

## Decision Guidance

Do not apply `npm audit fix --force` when it recommends downgrading Next.js to 9.3.3. That would regress the framework architecture and likely break the App Router/React 19 project surface.

Reasonable next actions:

- Check newer stable Next.js releases before the next dependency-maintenance pass.
- If audit pressure is high, research whether an npm `overrides` entry can safely force Next's nested PostCSS to `>=8.5.10` without breaking Next's build pipeline.
- Keep the advisory documented in `docs/tech-stack.md` until either Next patches its internal PostCSS dependency or the project adopts a tested override.
- Do not spend implementation time chasing a plain Next major upgrade for this specific advisory unless npm metadata shows the nested PostCSS dependency changed.

## Sources

| Key | Title | URL | Accessed | Type | Reliability |
| --- | --- | --- | --- | --- | --- |
| S1 | GitHub Advisory Database: GHSA-qx2v-qp2m-jg93 | https://github.com/advisories/GHSA-qx2v-qp2m-jg93 | 2026-05-11 | Security advisory | High |
| S2 | NVD: CVE-2026-41305 | https://nvd.nist.gov/vuln/detail/CVE-2026-41305 | 2026-05-11 | Security advisory | High |
| S3 | PostCSS 8.5.10 release | https://github.com/postcss/postcss/releases/tag/8.5.10 | 2026-05-11 | Release note | High |
| S4 | npm package page for Next.js versions | https://www.npmjs.com/package/next?activeTab=versions | 2026-05-11 | Package metadata | Medium |
| S5 | Local npm audit and lockfile evidence | `npm audit --omit=dev --cache ./.npm-cache`, `package-lock.json` | 2026-05-11 | Local project evidence | High |
| S6 | Current Next.js npm metadata | `npm view next@15.5.18 dependencies --json`, `npm view next version dependencies --json`, `npm view next@15.5.19 version dependencies --json` | 2026-05-11 | Package metadata | High |
