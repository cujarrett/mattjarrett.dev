# mattjarrett.dev — Copilot Instructions

## Project Overview

Personal portfolio site built with Angular 20+ (signals, standalone components, OnPush), containerized with Docker (nginx), and deployed to a self-hosted Kubernetes cluster (k3s on Raspberry Pi). There is no backend — the app is a static SPA served by nginx.

- **Namespace**: `mattjarrett-dev`
- **nginx config**: `nginx.conf` at repo root, mounted into the container
- **Angular instructions**: See [.github/instructions/angular.instructions.md](.github/instructions/angular.instructions.md)

### Key Files

| File | Purpose |
|------|---------|
| `nginx.conf` | nginx server config — routing, security headers, scanner blocks |
| `Dockerfile` | Multi-stage build: Angular CLI → nginx |
| `src/app/` | Angular components (hero, about, portfolio, contact, nav) |

---

## Copilot Rules

- **Never run `git commit`, `git push`, or any git command that writes to or modifies repository history or remotes.** If a task requires committing or pushing, stop and tell the user to run the git command manually.
- **When debugging, always list every command used** — show the command, what it does, and why — so the user can learn the debugging workflow. Do this inline as you debug, not as a summary at the end.

---

## Pre-Commit Safety Check

Whenever files are ready to be committed (after a set of changes is complete, or when the user asks), automatically perform this check on every changed file **before** telling the user to commit. Report the results inline — do not wait to be asked.

Check for:

1. **Hardcoded secrets** — passwords, API keys, tokens, private keys, connection strings with credentials
2. **Sensitive identifiers** — AWS account IDs, Cloudflare account/tunnel IDs, internal IPs beyond those documented in `copilot-instructions.md`, UUIDs that are runtime secrets
3. **Personal data** — email addresses, names, or other PII not already public

If all checks pass, state **"All files safe to commit."** If any issue is found, describe it and suggest a fix before the user commits.

---

## Build & Run

```bash
# Install dependencies
npm install

# Serve locally with hot reload
npm start

# Production build
npm run build

# Build & run Docker image locally
docker build -t mattjarrett-dev .
docker run -p 8080:80 mattjarrett-dev
```
