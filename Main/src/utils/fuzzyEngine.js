// src/utils/fuzzyEngine.js

function getTriangularMembership(x, a, b, c) {
  if (x <= a || x >= c) return 0;
  if (x === b) return 1;
  if (x > a && x < b) return (x - a) / (b - a);
  if (x > b && x < c) return (c - x) / (c - b);
  return 0;
}

/**
 * Helper to handle ratio inputs safely without breaking values > 1.0
 */
function normalizeRatio(val) {
  let num = typeof val === 'number' && !isNaN(val) ? val : 0;
  // If passed as a percentage like 38.71, convert to decimal. 
  // If passed as a true ratio like 3.8 (380%), keep it as is.
  return num > 10.0 ? num / 100 : num;
}

/**
 * 2. Input 1: Expense Ratio Antecedents (0.0 to 1.0+)
 */
function evaluateExpenseAntecedents(spendRatio) {
  const x = Math.max(0, spendRatio);
  return {
    veryLow: x <= 0.0 ? 1 : getTriangularMembership(x, -0.25, 0.0, 0.25),
    low: getTriangularMembership(x, 0.0, 0.25, 0.50),
    moderate: getTriangularMembership(x, 0.25, 0.50, 0.75),
    high: getTriangularMembership(x, 0.50, 0.75, 1.00),
    veryHigh: x >= 1.0 ? 1 : (x > 0.75 ? (x - 0.75) / 0.25 : 0)
  };
}

/**
 * 3. Input 2: Savings Gap Ratio Antecedents (Target % - Actual %)
 */
function evaluateSavingsGapAntecedents(gapRatio) {
  const x = gapRatio;
  return {
    onTrack: x <= 0.0 ? 1 : getTriangularMembership(x, -0.20, 0.0, 0.10),
    minorGap: getTriangularMembership(x, 0.0, 0.15, 0.30),
    largeGap: x >= 0.30 ? 1 : (x > 0.15 ? (x - 0.15) / 0.15 : 0)
  };
}

/**
 * 4. Input 3: Burn Acceleration / Pace Antecedents
 */
function evaluateBurnPaceAntecedents(paceRatio) {
  const x = Math.max(0, paceRatio);
  return {
    normal: x <= 1.0 ? 1 : getTriangularMembership(x, 0.5, 1.0, 1.6),
    elevated: getTriangularMembership(x, 1.2, 1.6, 2.1),
    accelerating: x >= 2.1 ? 1 : (x > 1.6 ? (x - 1.6) / 0.5 : 0)
  };
}

/**
 * 5. Input 4: Needs vs. Wants Ratio Antecedents
 */
function fuzzifyNeedsWants(wantsRatio) {
  const x = Math.max(0, Math.min(1, wantsRatio));
  return {
    essentialHeavy: x <= 0.3 ? 1 : getTriangularMembership(x, 0.15, 0.3, 0.45),
    balanced: getTriangularMembership(x, 0.3, 0.5, 0.7),
    discretionaryHeavy: x >= 0.7 ? 1 : (x > 0.5 ? (x - 0.5) / 0.2 : 0)
  };
}

/**
 * 6. 4-Variable Multi-Variable Fuzzy Inference Engine
 */
function evaluateSavingsFuzzyRules(expenseRatio, savingsGap, burnPace = 1.0, wantsRatio = 0.5) {
  const normalizedExpense = normalizeRatio(expenseRatio);
  const exp = evaluateExpenseAntecedents(normalizedExpense);
  const gap = evaluateSavingsGapAntecedents(savingsGap);
  const burn = evaluateBurnPaceAntecedents(burnPace);
  const wants = fuzzifyNeedsWants(wantsRatio);

  // SAFEGUARD 1: If expenses exceed income (> 100% ratio), force CRITICAL immediately
  if (normalizedExpense > 1.0) {
    return {
      tier: "CRITICAL",
      activeRule: "IF expense_ratio > 100% THEN status IS Critical (Expenses Exceed Income)",
      memberships: { exp, gap, burn, wants },
      degrees: { critical: 1.0, caution: 0, optimal: 0 }
    };
  }

  // SAFEGUARD 2: If expense ratio is completely 0
  if (normalizedExpense === 0) {
    return {
      tier: "OPTIMAL",
      activeRule: "IF expense_ratio IS veryLow THEN status IS Optimal",
      memberships: { exp, gap, burn, wants },
      degrees: { critical: 0, caution: 0, optimal: 1 }
    };
  }

  // MAMDANI RULE EVALUATIONS (MIN OPERATORS) 
  const r1_crit_discretionary = Math.min(Math.max(exp.veryHigh, exp.high), wants.discretionaryHeavy);
  const r2_crit_burn = Math.min(Math.max(exp.veryHigh, exp.high), burn.accelerating);
  const r3_crit_gap = Math.min(gap.largeGap, burn.accelerating);
  const r7_crit_veryHigh = exp.veryHigh; 

  const criticalDegree = Math.max(r1_crit_discretionary, r2_crit_burn, r3_crit_gap, r7_crit_veryHigh);

  const optimalDegree = Math.min(
    Math.max(exp.veryLow, exp.low),
    gap.onTrack,
    wants.essentialHeavy
  );

  const r4_caution_moderate = Math.min(exp.moderate, Math.max(gap.minorGap, 0.1));
  const r5_caution_pace = Math.min(burn.elevated, wants.balanced);
  const r6_caution_essential_pass = Math.min(exp.high, wants.essentialHeavy);

  const cautionDegree = Math.max(r4_caution_moderate, r5_caution_pace, r6_caution_essential_pass, exp.moderate);

  let resolvedTier = "OPTIMAL";
  let activeRule = "";

  if (criticalDegree > 0 && criticalDegree >= optimalDegree && criticalDegree >= cautionDegree) {
    resolvedTier = "CRITICAL";
    activeRule = "IF expense_ratio IS high or veryhigh AND wants IS discretionaryHeavy THEN status IS Critical or Warning";
    if (r2_crit_burn === criticalDegree) {
      activeRule = "IF expense_ratio IS high or veryhigh AND burn_acceleration IS ACCELERATING THEN status IS Critical or Warning";
    } else if (r3_crit_gap === criticalDegree) {
      activeRule = "IF savings_gap IS largeGap AND burn_acceleration IS ACCELERATING THEN status IS Critical or Warning";
    } else if (r7_crit_veryHigh === criticalDegree) {
      activeRule = "IF expense_ratio IS veryHigh THEN status IS Critical";
    }
  } else if (normalizedExpense >= 0.5) {
    resolvedTier = normalizedExpense >= 0.75 ? "CRITICAL" : "CAUTION";
    activeRule = resolvedTier === "CRITICAL" ? "IF expense_ratio IS high THEN status IS Critical" : "IF expense_ratio IS moderate THEN status IS Caution";
  } else {
    resolvedTier = "OPTIMAL";
    activeRule = "IF expense_ratio IS veryLow THEN status IS Optimal";
  }

  return {
    tier: resolvedTier,
    activeRule: activeRule,
    memberships: { exp, gap, burn, wants },
    degrees: { critical: criticalDegree, caution: cautionDegree, optimal: optimalDegree }
  };
}

/**
 * 7. Health Score Defuzzification
 */
function calculateHealthScore(expMemberships, normalizedExpense = 0) {
  if (normalizedExpense > 1.0) return 10; // Force low health score on overspend

  const weights = { veryLow: 100, low: 80, moderate: 50, high: 25, veryHigh: 0 };
  let totalWeight = 0;
  let totalMembership = 0;

  for (const [tier, weight] of Object.entries(expMemberships)) {
    const mu = weight || 0;
    totalWeight += mu * weights[tier];
    totalMembership += mu;
  }

  return totalMembership === 0 ? 50 : Math.round(totalWeight / totalMembership);
}

/**
 * 8. Dominant Tier Helper
 */
function getDominantFuzzyTier(inputRatio) {
  const spendRatio = normalizeRatio(inputRatio);
  const memberships = evaluateExpenseAntecedents(spendRatio);
  let dominantTier = 'moderate';
  let maxWeight = -1;

  for (const [tier, weight] of Object.entries(memberships)) {
    if (weight > maxWeight) {
      maxWeight = weight;
      dominantTier = tier;
    }
  }

  return { dominantTier, memberships, normalizedRatio: spendRatio };
}

module.exports = {
  getTriangularMembership,
  evaluateExpenseAntecedents,
  evaluateSavingsGapAntecedents,
  evaluateBurnPaceAntecedents,
  fuzzifyNeedsWants,
  evaluateSavingsFuzzyRules,
  calculateHealthScore,
  getDominantFuzzyTier
};