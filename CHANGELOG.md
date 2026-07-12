# Changelog

All notable changes to Quality Buddy will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-12

### Added

- Initial public release.
- Express + SQLite backend with a single SQLite file (`backend/data/quality-buddy.db`).
- React + Vite frontend.
- Rotation algorithm: stable member order, monotonically-shifting
  `rotation_offset` per sprint, no self-assignment, no repeat pairings.
- Full CRUD for team members, sprints, and assignments.
- "Undo last sprint" action with confirmation.
- OpenTelemetry instrumentation: backend SDK with OTLP/gRPC exporters for
  traces, metrics, and logs; browser SDK with HTTP exporters.
- Microsoft **Aspire 13** AppHost (TypeScript) wiring the API and web
  resources, with browser-launch integration.
- Multi-stage `Dockerfile` (non-root user, healthcheck) and
  `docker-compose.yml` for single-host deployment.
- Comprehensive `README` covering all four run modes, environment variables,
  API reference, project layout, and notes on auth/backup.
- 14 unit + integration tests covering the rotation algorithm and API routes.
