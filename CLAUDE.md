# mattjarrett.dev

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

## Rules

- **Never run `git commit`, `git push`, or any git command that writes to or modifies repository history or remotes.** If a task requires committing or pushing, stop and tell the user to run the git command manually.
- **When debugging, always list every command used** — show the command, what it does, and why — so the user can learn the debugging workflow. Do this inline as you debug, not as a summary at the end.

### Pre-commit safety check

Before telling the user to commit, always run `/pre-commit-review`. It checks for secrets, sensitive identifiers, PII, credential templates, and cluster safety, and returns explicit verdicts on whether the changes are safe for a public repo. Once it confirms the changes are safe, offer the user a suggested commit message — do not run `git commit` yourself.

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
