/* Loaner — mortgage scenario calculation engine, seed data, storage.
   Plain JS (no JSX). Exposes window.Loaner. */
(function () {
  'use strict';

  // ---------- math ----------
  function pmt(loan, annualPct, years) {
    const r = (Number(annualPct) || 0) / 100 / 12;
    const n = (Number(years) || 0) * 12;
    if (!loan || !n) return 0;
    if (r === 0) return loan / n;
    const f = Math.pow(1 + r, n);
    return (loan * r * f) / (f - 1);
  }

  const sum = (arr) => (arr || []).reduce((a, b) => a + (Number(b.amount) || 0), 0);

  function lifetimeInterest(loan, monthlyPI, years) {
    const n = (Number(years) || 0) * 12;
    if (!loan || !n || !monthlyPI) return 0;
    return monthlyPI * n - loan;
  }

  function computeDerived(s) {
    const price = Number(s.purchasePrice) || 0;
    const down = Number(s.downPayment) || 0;
    const loanAmount = Math.max(0, price - down);
    const ltv = price ? loanAmount / price : 0;
    const pi = pmt(loanAmount, s.rate, s.termYears);

    const housing = {
      pi,
      otherPI: Number(s.otherFinancingPI) || 0,
      hoi: Number(s.homeownersInsMonthly) || 0,
      tax: Number(s.propertyTaxMonthly) || 0,
      mi: Number(s.mortgageInsMonthly) || 0,
      hoa: Number(s.hoaMonthly) || 0,
    };
    const monthly =
      housing.pi + housing.otherPI + housing.hoi + housing.tax + housing.mi + housing.hoa;

    const lenderTotal = sum(s.lenderFees);
    const tpCannot = sum(s.thirdPartyCannotShop);
    const tpCan = sum(s.thirdPartyCanShop);
    const thirdPartyTotal = tpCannot + tpCan;
    const govTotal = sum(s.govFees);
    const prepaidsTotal = sum(s.prepaids);
    const escrowTotal = sum(s.escrows);
    const prepaidsEscrowTotal = prepaidsTotal + escrowTotal;
    const totalClosingCosts = lenderTotal + thirdPartyTotal + govTotal + prepaidsEscrowTotal;

    const payoffs = Number(s.payoffs) || 0;
    const fundsDue = down + totalClosingCosts + payoffs;
    const lenderCredits = Number(s.lenderCredits) || 0;
    const sellerCredits = Number(s.sellerCredits) || 0;
    const creditsAvailable = lenderCredits + sellerCredits;
    // Credits offset closing costs only — they can't reduce the purchase price / down payment.
    const creditsApplied = Math.min(creditsAvailable, totalClosingCosts);
    const creditsRemaining = Math.max(0, creditsAvailable - totalClosingCosts);
    const credits = creditsApplied;
    const cashToClose = fundsDue - creditsApplied;

    const pointsPct = loanAmount ? (lenderTotal / loanAmount) * 100 : 0;
    const interest = lifetimeInterest(loanAmount, pi, s.termYears);

    // ---- temporary buydown ----
    const bdRates = Array.isArray(s.buydown) ? s.buydown.filter((r) => r != null && r !== '') : [];
    const buydownSchedule = [];
    let buydownCost = 0;
    bdRates.forEach((rt, i) => {
      const rate = Number(rt) || 0;
      const yPI = pmt(loanAmount, rate, s.termYears);
      const yMonthly = yPI + monthly - pi;
      const monthlySaving = pi - yPI;
      buydownCost += monthlySaving * 12;
      buydownSchedule.push({ year: i + 1, rate, pi: yPI, monthly: yMonthly, saving: monthlySaving });
    });
    const hasBuydown = buydownSchedule.length > 0;
    const buydownFinal = { year: bdRates.length + 1, rate: Number(s.rate) || 0, pi, monthly, saving: 0 };
    const firstYearMonthly = hasBuydown ? buydownSchedule[0].monthly : monthly;
    const firstYearPI = hasBuydown ? buydownSchedule[0].pi : pi;

    return {
      loanAmount, ltv, pi, monthly, housing,
      lenderTotal, tpCannot, tpCan, thirdPartyTotal, govTotal,
      prepaidsTotal, escrowTotal, prepaidsEscrowTotal, totalClosingCosts,
      payoffs, fundsDue, lenderCredits, sellerCredits,
      creditsAvailable, creditsApplied, creditsRemaining, credits, cashToClose,
      pointsPct, interest,
      hasBuydown, buydownSchedule, buydownFinal, buydownCost, firstYearMonthly, firstYearPI,
    };
  }

  // ---------- formatting ----------
  const fmtMoney = (n, dp = 2) =>
    (Number(n) || 0).toLocaleString('en-US', {
      style: 'currency', currency: 'USD',
      minimumFractionDigits: dp, maximumFractionDigits: dp,
    });
  const fmtMoney0 = (n) => fmtMoney(n, 0);
  const fmtPct = (n, dp = 3) => (Number(n) || 0).toFixed(dp) + '%';
  const fmtNum = (n, dp = 2) =>
    (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });

  // ---------- ids ----------
  let _c = 0;
  const uid = () => 's' + Date.now().toString(36) + (_c++).toString(36) + Math.floor(Math.random() * 1e4).toString(36);

  const line = (label, amount) => ({ id: uid(), label, amount });

  // ---------- seed data ----------
  function baseFees() {
    return {
      thirdPartyCannotShop: [
        line('Appraisal Fee', 1000),
        line('Appraisal Re-Inspection Fee', 250),
        line('Credit Report Fee', 75),
        line('Flood Certificate Fee', 6.5),
        line('MERS Registration Fee', 25),
        line('Tax Service Fee', 80),
        line('UDM', 9),
        line('Verification Of Employment Fee', 250),
      ],
      thirdPartyCanShop: [
        line('Architectural Fee', 250),
        line('HOA Transfer Fee', 250),
        line('HOA Questionnaire Fee', 400),
        line('Natural Hazard Disclosure Fee', 110),
        line('Title - Courier/Wire/E-Mail Fee', 300),
        line('Title - Disbursement Fee', 150),
        line("Title - Lender's Endorsement Fee", 300),
        line("Title - Lender's Title Insurance", 2000),
        line('Title - Notary Fee', 300),
        line("Title - Owner's Title Insurance (Optional)", 2200),
        line('Title Escrow/Settlement Fee', 2500),
      ],
      govFees: [
        line('City/County Tax/Stamps - Deed', 0),
        line('Recording Fees - Deed', 75),
        line('Recording Fees - Mortgage', 100),
        line('Transfer Tax Total', 750),
      ],
    };
  }

  function makeScenario(overrides) {
    const f = baseFees();
    const base = {
      id: uid(),
      name: 'Untitled Scenario',
      notes: '',
      color: '#4f5bd5',
      apr: 7.021,
      purchasePrice: 750000,
      downPayment: 150000,
      rate: 6.75,
      termYears: 30,
      buydown: [],
      otherFinancingPI: 0,
      homeownersInsMonthly: 100,
      propertyTaxMonthly: 750,
      mortgageInsMonthly: 0,
      hoaMonthly: 350,
      lenderFees: [line('Points / Discount', 5625)],
      thirdPartyCannotShop: f.thirdPartyCannotShop,
      thirdPartyCanShop: f.thirdPartyCanShop,
      govFees: f.govFees,
      prepaids: [
        line('Hazard Insurance Premium', 1200),
        line('Homeowners Association Dues', 0),
        line('Mortgage Insurance Premium', 0),
        line('Prepaid Interest', 142.50),
        line('Property Taxes', 0),
        line('Supp Property Insurance Premium', 0),
      ],
      escrows: [
        line('Hazard Insurance Reserve', 300),
        line('Mortgage Insurance Reserve', 0),
        line('Property Taxes', 4500),
        line('Supp Property Insurance Reserve', 0),
        line('Aggregate Adjustment', 0),
      ],
      payoffs: 0,
      lenderCredits: 0,
      sellerCredits: 12000,
    };
    return Object.assign(base, overrides || {});
  }

  function seedScenarios() {
    const s1 = makeScenario({
      name: 'Baseline — 30yr Fixed, 80% LTV',
      notes: '30yr Conventional Fixed, escrows not waived. $12k seller credit offered — more than the closing costs, so part is surfaced as unused credit.',
      color: '#4f5bd5',
    });

    const s2 = makeScenario({
      name: '2/1 Buydown — 4.75% → 5.75% → 6.75%',
      notes: 'Same 6.75% note rate, but the first two years are bought down: 4.75% in year 1, 5.75% in year 2, then the full payment from year 3 on.',
      color: '#1f9d72',
      buydown: [4.75, 5.75],
    });

    const s3 = makeScenario({
      name: 'Low Down — 90% LTV (+PMI)',
      notes: '10% down to keep cash in pocket. Adds monthly PMI and a slightly higher rate; smaller seller credit assumed.',
      color: '#c2603a',
      downPayment: 75000,
      rate: 7.0,
      apr: 7.45,
      mortgageInsMonthly: 150,
      sellerCredits: 5000,
      lenderFees: [line('Points / Discount', 3750)],
      prepaids: [
        line('Hazard Insurance Premium', 1200),
        line('Homeowners Association Dues', 0),
        line('Mortgage Insurance Premium', 300),
        line('Prepaid Interest', 155.00),
        line('Property Taxes', 0),
        line('Supp Property Insurance Premium', 0),
      ],
    });

    return [s1, s2, s3];
  }

  // ---------- storage ----------
  const KEY = 'loaner.scenarios.v3';
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch (e) { /* ignore */ }
    return seedScenarios();
  }
  function save(scenarios) {
    try { localStorage.setItem(KEY, JSON.stringify(scenarios)); } catch (e) { /* ignore */ }
  }
  function resetSeed() {
    const s = seedScenarios();
    save(s);
    return s;
  }

  function duplicate(s) {
    const copy = JSON.parse(JSON.stringify(s));
    copy.id = uid();
    copy.name = s.name.replace(/ \(copy.*\)$/, '') + ' (copy)';
    const relabel = (arr) => arr.forEach((l) => (l.id = uid()));
    ['lenderFees', 'thirdPartyCannotShop', 'thirdPartyCanShop', 'govFees', 'prepaids', 'escrows']
      .forEach((k) => relabel(copy[k] || []));
    return copy;
  }

  // ---------- share link encoding ----------
  const LINE_KEYS = ['lenderFees', 'thirdPartyCannotShop', 'thirdPartyCanShop', 'govFees', 'prepaids', 'escrows'];

  async function _compress(str) {
    const data = new TextEncoder().encode(str);
    const cs = new CompressionStream('deflate-raw');
    const w = cs.writable.getWriter();
    w.write(data); w.close();
    const chunks = []; const r = cs.readable.getReader(); let ch;
    while (!(ch = await r.read()).done) chunks.push(ch.value);
    const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
    let off = 0; for (const c of chunks) { out.set(c, off); off += c.length; }
    return out;
  }

  async function _decompress(bytes) {
    const ds = new DecompressionStream('deflate-raw');
    const w = ds.writable.getWriter();
    w.write(bytes); w.close();
    const chunks = []; const r = ds.readable.getReader(); let ch;
    while (!(ch = await r.read()).done) chunks.push(ch.value);
    const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
    let off = 0; for (const c of chunks) { out.set(c, off); off += c.length; }
    return new TextDecoder().decode(out);
  }

  function _b64url(bytes) {
    let s = ''; bytes.forEach((b) => (s += String.fromCharCode(b)));
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  function _fromb64url(str) {
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const bin = atob(padded); const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  async function encodeShare(scenarios) {
    const stripped = scenarios.map((s) => {
      const out = { ...s };
      LINE_KEYS.forEach((k) => {
        if (Array.isArray(out[k])) out[k] = out[k].map(({ id, ...item }) => item);
      });
      return out;
    });
    return _b64url(await _compress(JSON.stringify(stripped)));
  }

  async function decodeShare(encoded) {
    const json = await _decompress(_fromb64url(encoded));
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed) || !parsed.length) throw new Error('Invalid share data.');
    const relabel = (arr) => (arr || []).map((l) => ({ ...l, id: uid() }));
    return parsed.map((s) => {
      const out = { ...s, id: s.id || uid() };
      LINE_KEYS.forEach((k) => { if (Array.isArray(out[k])) out[k] = relabel(out[k]); });
      return out;
    });
  }

  window.Loaner = {
    pmt, sum, computeDerived, lifetimeInterest,
    fmtMoney, fmtMoney0, fmtPct, fmtNum,
    uid, line, makeScenario, seedScenarios,
    load, save, resetSeed, duplicate,
    encodeShare, decodeShare,
  };
})();
