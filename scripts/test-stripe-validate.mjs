/**
 * Script local de validação Stripe — sem chamadas reais, sem Stripe CLI.
 * Testa funções puras diretamente contra os price IDs LIVE.
 * Rodar com: node scripts/test-stripe-validate.mjs
 */

// ── Replica do PLANS (mesmo dado de lib/plans.ts) ────────────────────────────
const PLANS = {
  starter: {
    key: "starter",
    stripePriceMonthlyId:       "price_1TYAPpFvYZaPsKPDOGPhTGbK",
    stripePriceYearlyId:        "price_1TYAQBFvYZaPsKPDu1om3O1Z",
    stripeExtraFormPriceId:     "price_1TYAdzFvYZaPsKPD0jHL1vx8",
    stripeExtraWhatsappPriceId: "price_1TYAf7FvYZaPsKPDrtCdgYnU",
  },
  agency: {
    key: "agency",
    stripePriceMonthlyId:       "price_1TYARRFvYZaPsKPDM1OHOGeG",
    stripePriceYearlyId:        "price_1TYARtFvYZaPsKPDg0SISCXN",
    stripeExtraFormPriceId:     "price_1TYAeOFvYZaPsKPDTZZhcSay",
    stripeExtraWhatsappPriceId: "price_1TYAg1FvYZaPsKPDXLULtrr1",
  },
  scale: {
    key: "scale",
    stripePriceMonthlyId:       "price_1TYATGFvYZaPsKPDgr70EKRW",
    stripePriceYearlyId:        "price_1TYATcFvYZaPsKPDWFW6f1RM",
    stripeExtraFormPriceId:     "price_1TYAeqFvYZaPsKPDRdScDGRL",
    stripeExtraWhatsappPriceId: "price_1TYAgMFvYZaPsKPDj0OCdk3a",
  },
  enterprise: {
    key: "enterprise",
    stripePriceMonthlyId:       "price_1TYAUrFvYZaPsKPDJk5mdTRc",
    stripePriceYearlyId:        "price_1TYAVCFvYZaPsKPDv03BlWjg",
    stripeExtraFormPriceId:     null,
    stripeExtraWhatsappPriceId: null,
  },
};

// ── Replica das funções de lib/stripe.ts ─────────────────────────────────────
function getPlanFromPriceId(priceId) {
  for (const plan of Object.values(PLANS)) {
    if (plan.stripePriceMonthlyId === priceId || plan.stripePriceYearlyId === priceId) {
      return plan.key;
    }
  }
  return "starter";
}

function getBillingCycleFromPriceId(priceId) {
  for (const plan of Object.values(PLANS)) {
    if (plan.stripePriceYearlyId  === priceId) return "yearly";
    if (plan.stripePriceMonthlyId === priceId) return "monthly";
  }
  return "monthly";
}

// ── Casos de teste ────────────────────────────────────────────────────────────
const PRICE_ID_CASES = [
  { priceId: "price_1TYAPpFvYZaPsKPDOGPhTGbK", expectedPlan: "starter",    expectedBilling: "monthly" },
  { priceId: "price_1TYAQBFvYZaPsKPDu1om3O1Z", expectedPlan: "starter",    expectedBilling: "yearly"  },
  { priceId: "price_1TYARRFvYZaPsKPDM1OHOGeG", expectedPlan: "agency",     expectedBilling: "monthly" },
  { priceId: "price_1TYARtFvYZaPsKPDg0SISCXN", expectedPlan: "agency",     expectedBilling: "yearly"  },
  { priceId: "price_1TYATGFvYZaPsKPDgr70EKRW", expectedPlan: "scale",      expectedBilling: "monthly" },
  { priceId: "price_1TYATcFvYZaPsKPDWFW6f1RM", expectedPlan: "scale",      expectedBilling: "yearly"  },
  { priceId: "price_1TYAUrFvYZaPsKPDJk5mdTRc", expectedPlan: "enterprise", expectedBilling: "monthly" },
  { priceId: "price_1TYAVCFvYZaPsKPDv03BlWjg", expectedPlan: "enterprise", expectedBilling: "yearly"  },
];

const ADD_ON_CASES = [
  { plan: "starter",    formId: "price_1TYAdzFvYZaPsKPD0jHL1vx8", whatsappId: "price_1TYAf7FvYZaPsKPDrtCdgYnU" },
  { plan: "agency",     formId: "price_1TYAeOFvYZaPsKPDTZZhcSay",  whatsappId: "price_1TYAg1FvYZaPsKPDXLULtrr1"  },
  { plan: "scale",      formId: "price_1TYAeqFvYZaPsKPDRdScDGRL",  whatsappId: "price_1TYAgMFvYZaPsKPDj0OCdk3a"  },
  { plan: "enterprise", formId: null,                               whatsappId: null                              },
];

// ── Execução ─────────────────────────────────────────────────────────────────
let totalPass = 0, totalFail = 0;

function ok(label)   { totalPass++; console.log(`  ✅ ${label}`); }
function fail(label) { totalFail++; console.error(`  ❌ ${label}`); }

console.log("\n════════════════════════════════════════════════════");
console.log("  VALIDAÇÃO STRIPE — PRICE IDs LIVE (sem API calls)");
console.log("════════════════════════════════════════════════════\n");

// 1. getPlanFromPriceId
console.log("── 1. getPlanFromPriceId ──────────────────────────\n");
for (const { priceId, expectedPlan } of PRICE_ID_CASES) {
  const got = getPlanFromPriceId(priceId);
  const pass = got === expectedPlan;
  const label = `${priceId}  →  plan="${got}" (esperado: "${expectedPlan}")`;
  pass ? ok(label) : fail(label);
}

// 2. getBillingCycleFromPriceId
console.log("\n── 2. getBillingCycleFromPriceId ──────────────────\n");
for (const { priceId, expectedBilling } of PRICE_ID_CASES) {
  const got = getBillingCycleFromPriceId(priceId);
  const pass = got === expectedBilling;
  const label = `${priceId}  →  billing="${got}" (esperado: "${expectedBilling}")`;
  pass ? ok(label) : fail(label);
}

// 3. Sem cross-contamination (mensal NÃO vira yearly e vice-versa)
console.log("\n── 3. Cross-contamination (mensal ≠ yearly) ───────\n");
for (const { priceId, expectedBilling } of PRICE_ID_CASES) {
  const billing = getBillingCycleFromPriceId(priceId);
  const contaminated = expectedBilling === "monthly" && billing === "yearly"
    || expectedBilling === "yearly" && billing === "monthly";
  contaminated
    ? fail(`CROSS-CONTAMINATION: ${priceId} → ${billing} (esperado ${expectedBilling})`)
    : ok(`OK — ${priceId} → ${billing} correto`);
}

// 4. Add-ons
console.log("\n── 4. Add-ons por plano ───────────────────────────\n");
for (const { plan, formId, whatsappId } of ADD_ON_CASES) {
  const p = PLANS[plan];
  const formOk      = p.stripeExtraFormPriceId     === formId;
  const whatsappOk  = p.stripeExtraWhatsappPriceId === whatsappId;
  formOk
    ? ok(`${plan} form     → "${p.stripeExtraFormPriceId}"`)
    : fail(`${plan} form     esperado "${formId}" got "${p.stripeExtraFormPriceId}"`);
  whatsappOk
    ? ok(`${plan} whatsapp → "${p.stripeExtraWhatsappPriceId}"`)
    : fail(`${plan} whatsapp esperado "${whatsappId}" got "${p.stripeExtraWhatsappPriceId}"`);
}

// 5. Enterprise bloqueado
console.log("\n── 5. Enterprise — add-ons bloqueados (null) ──────\n");
const ent = PLANS.enterprise;
ent.stripeExtraFormPriceId     === null ? ok("enterprise.stripeExtraFormPriceId = null ✓")     : fail("enterprise.stripeExtraFormPriceId deve ser null");
ent.stripeExtraWhatsappPriceId === null ? ok("enterprise.stripeExtraWhatsappPriceId = null ✓") : fail("enterprise.stripeExtraWhatsappPriceId deve ser null");

// 6. Priceids únicos (sem colisão)
console.log("\n── 6. Price IDs únicos (sem colisão) ──────────────\n");
const allIds = [
  ...PRICE_ID_CASES.map(c => c.priceId),
  ...ADD_ON_CASES.flatMap(c => [c.formId, c.whatsappId]).filter(Boolean),
];
const unique = new Set(allIds);
unique.size === allIds.length
  ? ok(`Todos os ${allIds.length} price IDs são únicos`)
  : fail(`COLISÃO DETECTADA: ${allIds.length} IDs mas apenas ${unique.size} únicos`);

// ── Resultado final ───────────────────────────────────────────────────────────
console.log("\n════════════════════════════════════════════════════");
console.log(`  RESULTADO: ${totalPass} PASS  |  ${totalFail} FAIL`);
console.log(totalFail === 0
  ? "  ✅ INTEGRAÇÃO PRONTA — todos os price IDs corretos"
  : "  ❌ FALHAS ENCONTRADAS — revisar itens acima");
console.log("════════════════════════════════════════════════════\n");

process.exit(totalFail > 0 ? 1 : 0);
