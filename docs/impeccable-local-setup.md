# Local Impeccable launcher

Official source: https://github.com/pbakaus/impeccable ; documented npm installer: `npx impeccable install`.

Installed with `npm exec --cache /workspace/.npm-cache --yes --package impeccable@4.8.2 -- impeccable install --providers=codex --scope=project --no-hooks --yes`.

The installed skill and launcher are under `.agents/skills/impeccable/`, not `.codex/skills/impeccable/`. Use the installed folder as the skill base:

```sh
cd /workspace
.agents/skills/impeccable/scripts/impeccable context --target app/page.tsx
.agents/skills/impeccable/scripts/impeccable detect --json app/page.tsx
```

Verified context resolves the existing PRODUCT.md. The source scan returned `[]` with exit 0. This is a source-pattern check, not a complete browser/a11y/site audit.

Installer version: 4.8.2. Bundled engine: v0.1.21 linux-x64. The cloud catalog skill was 4.3.1, unavailable as an npm package version; use the installed SKILL.md and references for local runtime commands. No init rerun, no PRODUCT.md overwrite, no automatic hooks enabled. No application source or deployment changed by this setup.

Each cloud task already has an isolated checkout. Use the existing checkout; do not create a worktree unless requested.
