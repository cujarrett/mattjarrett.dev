# mattjarrett.dev

Personal portfolio site built with Angular (signals, standalone components, OnPush). It ships as a static SPA in an nginx image and runs on a self-hosted Kubernetes cluster (k3s on Raspberry Pi). The homelab section reads live numbers from [homelab-stats](https://github.com/cujarrett/homelab-stats), which nginx proxies at `/api/stats/`.

- **Namespace**: `mattjarrett-dev`
- **nginx config**: the homelab `Spa` composition generates it. This repo ships none.
- **Angular instructions**: See [.github/instructions/angular.instructions.md](.github/instructions/angular.instructions.md)

### Key Files

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build: Angular CLI, then the `base-spa` nginx image |
| `src/app/` | Angular components (hero, about, portfolio, homelab, contact, nav) |
| `proxy.live.json`, `proxy.local.json` | Dev-server proxies for `/api/stats/`. `npm start` uses the live one, `npm run start:local` the local one |

## Rules

- **Never run `git commit`, `git push`, or any git command that writes to or modifies repository history or remotes.** If a task requires committing or pushing, stop and tell the user to run the git command manually.
- **Never add a `Co-Authored-By` trailer or a "Generated with Claude Code" line** to commit messages or PR descriptions, including in suggested commit messages. Commits are authored by the user alone.
- **When debugging, always list every command used** - show the command, what it does, and why - so the user can learn the debugging workflow. Do this inline as you debug, not as a summary at the end.
- **Cheapest rung that works.** Before writing code go down the ladder and stop at the first rung that solves it - skip the feature, reuse code already here, standard library, native platform feature, a dependency already installed, one line, then build the minimum.

### Pre-commit safety check

Before telling the user to commit, always run `/security-review`. It reviews the pending changes on the current branch for security issues. Once it confirms the changes are safe, offer the user a suggested commit message - do not run `git commit` yourself.

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
