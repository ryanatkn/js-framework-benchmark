# js-framework-benchmark — backbone.giraffe fork

A fork of krausest/js-framework-benchmark for one blog post: run
Backbone.Giraffe against Svelte, React, Marionette, and frameworks of the same
era, once. Nothing here goes upstream; the fork stays on GitHub as the record
of what was run. Work on the `backbone.giraffe` branch.

## Comparison set

All under `frameworks/keyed/`:

- `backbone.giraffe` — the addition (see below)
- `svelte`, `svelte-classic`
- `react-hooks`, `react-compiler-hooks`
- `marionette`, `marionette-backbone`
- era peers: `knockout`, `ember`, `ractive`, `riot`, `mithril`
- `vanillajs` — baseline

`dojo` is excluded: it is the modern TypeScript rewrite, not era Dojo. There
is no plain `backbone` implementation in the repo.

## The giraffe implementation

Backbone.Giraffe dates from 2013; the benchmark runs its committed `dist/`
build as-is. `frameworks/keyed/backbone.giraffe/src/Main.js` uses
`Giraffe.Contrib.FastCollectionView`: one `innerHTML` write for the whole
collection, and per-row re-render on model `change` (`renderOnChange`), so
selection and label updates go through model attributes.

- Giraffe isn't on npm — the dependency is pinned to a GitHub commit; the
  version shown in results comes from its `package.json`. It requires jquery,
  underscore, and backbone (jQuery 3, since Giraffe predates jQuery 4).
- Swap rows moves the two `<tr>` elements by hand, because the
  FastCollectionView re-renders everything on `sort`, which isn't keyed. Hence
  issue 772 (manual DOM manipulation) in its `package.json`.
- Known hot spots, left as the library behaves: append adds models one at a
  time and each insert re-reads `modelEl.children()`; select re-renders two
  rows; delete resolves the model by element index (`findModelByEl`).

## Setup

```fish
npm ci --omit=dev --legacy-peer-deps  # upstream's lint devDeps have a peer conflict
npm run install-local                 # webdriver-ts, results UI, server
# per framework:
cd frameworks/keyed/<name>; npm ci; npm run build-prod
```

Chrome is the system Chromium: pass `--chromeBinary /usr/bin/chromium`.

## Checks (safe any time)

With the server up (`npm start` at the root):

```fish
cd webdriver-ts
npm run isKeyed -- --headless --chromeBinary /usr/bin/chromium --framework keyed/backbone.giraffe
npm run bench -- --smoketest --headless --chromeBinary /usr/bin/chromium --framework keyed/backbone.giraffe
```

`--smoketest` runs one iteration per benchmark and writes no results.

## The real run

Timed runs need a quiet machine — the user decides when. Don't start one
without asking. Run headed (no `--headless`), mouse outside the browser window:

```fish
npm start  # terminal 1, repo root
# terminal 2, repo root:
npm run bench -- --chromeBinary /usr/bin/chromium --framework keyed/backbone.giraffe keyed/svelte keyed/svelte-classic keyed/react-hooks keyed/react-compiler-hooks keyed/marionette keyed/marionette-backbone keyed/knockout keyed/ember keyed/ractive keyed/riot keyed/mithril keyed/vanillajs
npm run results
```

Results land in `webdriver-ts/results/`; the table is at
`http://localhost:8080/webdriver-ts-results/dist/index.html`.
