# js-framework-benchmark — backbone.giraffe fork

A fork of krausest/js-framework-benchmark for one blog post: run
Backbone.Giraffe against Svelte, React, Marionette, and frameworks of the same
era, once. Nothing here goes upstream; the fork stays on GitHub as the record
of what was run. Work on the `backbone.giraffe` branch.

## Comparison set

All under `frameworks/keyed/`:

- `backbone.giraffe` — the addition (see below)
- `svelte`
- `react-hooks`, `react-compiler-hooks`
- `marionette-backbone` — Marionette on Backbone
- era lineages: `knockout`, `ractive` — current versions, still close to how
  they looked in 2013
- `vanillajs` — baseline

Excluded because they look era but aren't: `dojo` (the modern TypeScript
rewrite), `ember` (Ember's modern descendant — Glimmer, `.gjs` — nothing like
Ember 1.x), `riot` (the custom-tag Riot from 2.0 on, 2015+, not the 2013
library), `mithril` (2014, then rewritten in 1.0 and 2.0; the repo runs 2.x),
and `marionette` (Marionette 5 without Backbone). There is no plain
`backbone` implementation in the repo, and no AngularJS 1.x (the `angular-cf*`
entries are modern Angular).

## The giraffe implementation

Backbone.Giraffe dates from 2013 ([personal fork](https://github.com/ryanatkn/backbone.giraffe),
[original repo](https://github.com/barc/backbone.giraffe)); the benchmark runs its committed `dist/`
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
without asking.

The benchmark needs no internet: the server, the framework builds, the CSS,
and the browser are all local, and the harness only talks to `localhost:8080`.
Going offline also cuts Chromium's background traffic (component updates,
safe browsing). So install and build everything first, while still online
(repo root):

```fish
for f in backbone.giraffe svelte react-hooks react-compiler-hooks marionette-backbone knockout ractive vanillajs
    npm ci --prefix frameworks/keyed/$f; and npm run build-prod --prefix frameworks/keyed/$f; or break
end
```

Then quiet the machine. CPU governor and power profile already sit at
`performance`; check with `powerprofilesctl get`. Stop the background services
(their `.socket` units too, or they come back on demand), go offline, then
close everything but the two terminals:

```fish
sudo systemctl stop libvirtd.service libvirtd.socket libvirtd-ro.socket libvirtd-admin.socket virtlogd.service virtlogd.socket virtlogd-admin.socket virtlockd.service virtlockd.socket virtlockd-admin.socket
sudo systemctl stop postgresql@18-main avahi-daemon.service avahi-daemon.socket smartmontools cron
sudo systemctl stop apt-daily.timer apt-daily-upgrade.timer man-db.timer fstrim.timer e2scrub_all.timer logrotate.timer dpkg-db-backup.timer
systemctl --user stop localsearch-3  # GNOME file indexer, the worst offender
nmcli networking off
```

A reboot restores all of it (each one is enabled), or start them again by
hand: run the same commands with `start`, and `nmcli networking on`.

Run headed (no `--headless`), mouse outside the browser window:

```fish
npm start  # terminal 1, repo root
# terminal 2, repo root:
npm run bench -- --chromeBinary /usr/bin/chromium --framework keyed/backbone.giraffe keyed/svelte keyed/react-hooks keyed/react-compiler-hooks keyed/marionette-backbone keyed/knockout keyed/ractive keyed/vanillajs
npm run results
```

Results land in `webdriver-ts/results/`; the table is at
`http://localhost:8080/webdriver-ts-results/dist/index.html`.

## Results as Markdown

`webdriver-ts/results-to-markdown.mjs` (fork-only, no dependencies) renders
the result JSON as `RESULTS.md`, the quotable record of the run (repo root):

```fish
node webdriver-ts/results-to-markdown.mjs > RESULTS.md
```

It writes three tables: duration (mean ± stddev, factor vs. the fastest, CPU
slowdown per row, and a geometric mean of the factors), memory, and
size/startup. Columns sort by that geometric mean, a plain one over the mean
ratios, so it can differ slightly from the results UI, which weights by
confidence intervals. Benchmark labels and throttling factors are copied from
`webdriver-ts/src/benchmarksCommon.ts`; the `_x16`/`_x8`/`_x2` suffixes in
benchmark ids are not slowdowns. Cells stack values with `<br><sub>`, which
GitHub renders.
