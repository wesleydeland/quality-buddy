# Contributing to Quality Buddy

Thanks for your interest in contributing! This project is a small full-stack
webapp and contributions of all sizes are welcome — bug reports, doc fixes,
small features, and larger changes.

By participating, you agree to abide by the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Development setup

Requires **Node.js 22+** and **npm 10+**.

```bash
git clone https://github.com/wesleydeland/quality-buddy.git
cd quality-buddy
npm install
npm run dev
```

`npm run dev` starts the API (`:3001`) and the Vite dev server (`:5173`)
concurrently. See the [README](./README.md) for all run modes (dev, Aspire,
production, Docker).

## Running tests

```bash
npm test
```

This runs the `node:test` suite under `backend/tests/`. Please make sure
tests pass locally before opening a PR.

## Project layout

```
backend/          Express API + SQLite + OpenTelemetry
frontend/         React + Vite + browser OTel
aspire-apphost/   Aspire 13 AppHost (TypeScript) — optional
.github/          CI, issue/PR templates
docker-compose.yml / Dockerfile  Production deploy
```

## Making changes

1. **Fork** the repo and create a topic branch off `main`:
   `git checkout -b short-descriptive-name`
2. Make your change. Keep commits focused; one logical change per commit.
3. If your change touches the rotation algorithm or any API behaviour,
   add or update tests in `backend/tests/`.
4. Run `npm test` and confirm everything is green.
5. Push and open a **Pull Request** against `main`. Fill in the PR template.

## Coding conventions

- **JavaScript** (CommonJS in `backend/`, ESM in `frontend/`). Match the
  style of the file you're editing — there is no auto-formatter wired up
  in the repo yet.
- **No new dependencies** without justification in the PR description.
  Prefer the Node.js standard library where reasonable.
- **No secrets, internal URLs, or company names** in committed code.
- **No `console.log`** for debug output — use the OTel console bridge or
  remove the log before committing.

## Reporting bugs / requesting features

Please use the issue templates:
- [Bug report](./.github/ISSUE_TEMPLATE/bug_report.yml)
- [Feature request](./.github/ISSUE_TEMPLATE/feature_request.yml)

## Security issues

**Do not** file public issues for security vulnerabilities. See
[SECURITY.md](./SECURITY.md) for the disclosure process.

## License

By contributing, you agree that your contributions will be licensed under
the [MIT License](./LICENSE).
