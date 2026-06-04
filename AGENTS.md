# AGENTS.md

## Project Overview

Loaner is a static mortgage scenario comparison SPA with an AWS CDK deployment
layer. The frontend intentionally has no bundler or generated build output. CDK
dependencies are managed with npm.

## Development

Run:

```bash
npm run serve
```

Open `http://localhost:3000`.

Runtime dependencies (React, Babel) are loaded from CDNs in `site/index.html`.
Browser verification therefore requires internet access.

## File Boundaries

- `site/index.html`: CDN scripts and global CSS. Entry point.
- `site/engine.js`: Pure calculations and seed data. Keep this DOM-free and
  testable from Node by stubbing `window`.
- `site/components.jsx`: Shared UI primitives (Icon, Btn, Field, LineEditor,
  Section, UnitAmount, etc.).
- `site/ListView.jsx`: Scenario list with multi-select and the floating compare
  bar.
- `site/EditView.jsx`: Full scenario editor with the buydown section and the
  sticky summary rail.
- `site/CompareView.jsx`: Side-by-side comparison table with best/worst
  highlighting.
- `site/App.jsx`: Top-level React state, view routing, and localStorage
  persistence.
- `infra/bin/loaner.ts`: CDK entry point and environment loading.
- `infra/lib/loaner-site-stack.ts`: AWS resources and static-site deployment.
- `scripts/deploy-site.sh`: Content-only AWS CLI deployment fast path.
- `scripts/render-site.mjs`: Renders `.site-dist/` with deploy-time tokens.

## Implementation Rules

- Keep the calculation engine (`engine.js`) independent from the UI.
- Use existing UI primitives from `components.jsx` before adding one-off markup.
- Do not commit `.playwright-cli/`; it contains local browser-test artifacts.
- Do not commit `.env`, `.site-dist/`, `node_modules/`, or `cdk.out/`.
- Keep domain and hosted-zone values configurable through environment variables.
  Do not hardcode private DNS values.
- Render `site/` into `.site-dist/` before deploying.
- Deploy only `.site-dist/` through `BucketDeployment` or the AWS CLI fast path.
- Keep `scripts/deploy-site.sh` aligned with the CDK stack output names.
- Keep the CloudFront certificate stack in `us-east-1`.
- Avoid introducing a frontend build tool unless the task explicitly calls for
  a production packaging migration.

## Verification

For UI changes:

1. Start the static server (`npm run serve`).
2. Load the app and confirm the three seed scenarios appear (Baseline,
   2/1 Buydown, Low Down).
3. Verify the Baseline scenario shows $8,764/mo and $264,978 cash to close.
4. Exercise the affected interaction in a browser.

For calculation changes, run a Node smoke test against `site/engine.js`:

```bash
node -e "
  global.window = {};
  require('./site/engine.js');
  const d = window.Loaner.computeDerived({
    purchasePrice: 1324888, downPayment: 264978,
    rate: 5.625, termYears: 30,
    lenderFees: [], thirdPartyCannotShop: [], thirdPartyCanShop: [],
    govFees: [], prepaids: [], escrows: [],
    payoffs: 0, lenderCredits: 0, sellerCredits: 0,
    otherFinancingPI: 0, homeownersInsMonthly: 0,
    propertyTaxMonthly: 0, mortgageInsMonthly: 0, hoaMonthly: 0, buydown: []
  });
  console.assert(Math.abs(d.pi - 6101.44) < 0.01, 'P&I mismatch: ' + d.pi);
  console.log('ok');
"
```

For infrastructure changes:

1. Copy `.env.example` to `.env` and set non-secret local values.
2. Run `npm run typecheck`.
3. Run `npm run synth`.
4. Review the synthesized resources before deploying.
