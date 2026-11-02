![demo](./media/demo.gif)

# [https://mattjarrett.dev](https://mattjarrett.dev)

## Run it locally

```bash
npm install
npm start
```

Open http://localhost:4200. The page reloads when a file changes.

The homelab section reads live numbers from [homelab-stats](https://github.com/cujarrett/homelab-stats). Pick where they come from:

| Command | Stats from |
|---|---|
| `npm start` | The live site, `mattjarrett.dev` |
| `npm run start:local` | homelab-stats from source on `localhost:18080`. Start it first with `just dev` in that repo |

## Checks

```bash
npm run ci      # format check, lint and unit tests
npm run build   # production build in dist/
```
