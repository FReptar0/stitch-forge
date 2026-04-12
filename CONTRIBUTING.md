# Contributing to Design Guard

Thanks for your interest in contributing! Here's how to get started.

## Prerequisites

- Node.js 20+
- npm
- A [Stitch API key](https://stitch.withgoogle.com) (for testing MCP integration)

## Setup

```bash
git clone https://github.com/freptar0/design-guard.git
cd design-guard
npm install
cp .env.example .env
# Add your STITCH_API_KEY to .env
```

## Development

```bash
npm run dev         # Launch TUI in dev mode
npm test            # Run all tests (watch mode)
npm test -- --run   # Run tests once
npm run typecheck   # Type-check without emitting
npm run build       # Compile TypeScript to dist/
```

## Code Conventions

- TypeScript with strict mode enabled
- ESM imports (`import`, not `require`)
- Ink/React components use functional components with hooks
- All MCP calls go through `src/mcp/client.ts`
- Logs to stderr, output to stdout
- No `any` types

## Pull Request Process

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Ensure `npm run typecheck` and `npm test -- --run` pass
4. Write a clear PR description explaining **what** and **why**
5. Submit your PR

## Reporting Bugs

Use the [bug report template](https://github.com/freptar0/design-guard/issues/new?template=bug_report.md) on GitHub Issues.

## Suggesting Features

Use the [feature request template](https://github.com/freptar0/design-guard/issues/new?template=feature_request.md) on GitHub Issues.

## Code of Conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md). Be kind and constructive.
