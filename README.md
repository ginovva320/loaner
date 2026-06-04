# Loaner

A static single-page app for comparing mortgage scenarios side by side. Enter loan terms, fees, and credits for each scenario; Loaner computes monthly payments, cash to close, lifetime interest, and optional temporary buydown schedules and lets you compare them in a highlighted table.

## Features

- **Scenario editor** — purchase price, down payment, rate, term, HOA, taxes, insurance, PMI, and a full itemized closing-cost breakdown (lender fees, third-party, government, prepaids, escrows)
- **Seller credit capping** — credits are applied against closing costs only and can't reduce the down payment; unused credit is surfaced explicitly
- **Temporary buydown** — enter one or more below-market rates for year 1, year 2, etc. and see the year-by-year payment schedule and total buydown cost
- **Compare view** — side-by-side table with per-row best/worst highlighting
- **Share links** — deflate-compressed URL fragments for sharing a full scenario set
- **localStorage persistence** — scenarios survive page refreshes; share links upsert by ID so re-importing doesn't duplicate

## Running locally

```bash
npm run serve
```

Opens at `http://localhost:3000`. No build step — React and Babel are loaded from CDN.

## Deploying

The infra layer is AWS CDK (S3 + CloudFront + ACM + Route 53).

```bash
cp .env.example .env   # fill in domain and hosted-zone values
npm run deploy         # synth + cdk deploy (first deploy, or infra changes)
npm run deploy:site    # fast path for content-only updates (AWS CLI)
```

## Project structure

```
site/           Static frontend (no bundler)
  index.html    CDN scripts, full inline stylesheet, entry point
  engine.js     Calculation engine and seed data (DOM-free)
  App.jsx       State management and view routing
  ListView.jsx  Scenario list and compare bar
  EditView.jsx  Scenario editor with sticky summary rail
  CompareView.jsx  Side-by-side comparison table
  components.jsx   Shared UI primitives
infra/          AWS CDK stack (TypeScript)
scripts/        Build and deploy helpers
```
