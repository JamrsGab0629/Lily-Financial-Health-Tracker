// src/utils/fuzzyEngine.js

/**
 * 1. Pure Triangular Membership Function
 */
function getTriangularMembership(x, a, b, c) {
  if (x <= a || x >= c) return 0;
  if (x === b) return 1;
  if (x > a && x < b) return (x - a) / (b - a);
  if (x > b && x < c) return (c - x) / (c - b);
  return 0;
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
    normal: x <= 1.0 ? 1 : getTriangularMembership(x, 0.5, 1.0, 1.5),
    elevated: getTriangularMembership(x, 1.0, 1.5, 2.0),
    accelerating: x >= 2.0 ? 1 : (x > 1.5 ? (x - 1.5) / 0.5 : 0)
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
  const exp = evaluateExpenseAntecedents(expenseRatio);
  const gap = evaluateSavingsGapAntecedents(savingsGap);
  const burn = evaluateBurnPaceAntecedents(burnPace);
  const wants = fuzzifyNeedsWants(wantsRatio);

  //  MAMDANI RULE EVALUATIONS (MIN OPERATORS) 
  const r1_crit_discretionary = Math.min(Math.max(exp.veryHigh, exp.high), wants.discretionaryHeavy);
  const r2_crit_burn = Math.min(Math.max(exp.veryHigh, exp.high), burn.accelerating);
  const r3_crit_gap = Math.min(gap.largeGap, burn.accelerating);

  const criticalDegree = Math.max(r1_crit_discretionary, r2_crit_burn, r3_crit_gap);

  const optimalDegree = Math.min(
    Math.max(exp.veryLow, exp.low),
    gap.onTrack,
    wants.essentialHeavy
  );

  const r4_caution_moderate = Math.min(exp.moderate, gap.minorGap);
  const r5_caution_pace = Math.min(burn.elevated, wants.balanced);
  const r6_caution_essential_pass = Math.min(Math.max(exp.veryHigh, exp.high), wants.essentialHeavy);

  const cautionDegree = Math.max(r4_caution_moderate, r5_caution_pace, r6_caution_essential_pass);

  // RESOLVE DOMINANT TIER & ACTIVE RULE TEXT 
  if (criticalDegree > 0 && criticalDegree >= optimalDegree && criticalDegree >= cautionDegree) {
    let ruleText = "IF expense_ratio IS high AND wants IS discretionaryHeavy THEN status IS Critical";
    if (r2_crit_burn === criticalDegree) {
      ruleText = "IF expense_ratio IS high AND burn_acceleration IS ACCELERATING THEN status IS Critical";
    } else if (r3_crit_gap === criticalDegree) {
      ruleText = "IF savings_gap IS largeGap AND burn_acceleration IS ACCELERATING THEN status IS Critical";
    }

    return {
      tier: "CRITICAL",
      activeRule: ruleText,
      memberships: { exp, gap, burn, wants },
      degrees: { critical: criticalDegree, caution: cautionDegree, optimal: optimalDegree }
    };
  } else if (optimalDegree > criticalDegree && optimalDegree >= cautionDegree) {
    return {
      tier: "OPTIMAL",
      activeRule: "IF expense_ratio IS low AND savings_gap IS onTrack AND wants IS essentialHeavy THEN status IS Optimal",
      memberships: { exp, gap, burn, wants },
      degrees: { critical: criticalDegree, caution: cautionDegree, optimal: optimalDegree }
    };
  }

  let cautionRuleText = "IF expense_ratio IS moderate AND savings_gap IS minorGap THEN status IS Caution";
  if (r6_caution_essential_pass === cautionDegree) {
    cautionRuleText = "IF expense_ratio IS high BUT wants IS essentialHeavy THEN status IS Caution";
  } else if (r5_caution_pace === cautionDegree) {
    cautionRuleText = "IF burn_pace IS elevated AND wants IS balanced THEN status IS Caution";
  }

  return {
    tier: "CAUTION",
    activeRule: cautionRuleText,
    memberships: { exp, gap, burn, wants },
    degrees: { critical: criticalDegree, caution: cautionDegree, optimal: optimalDegree }
  };
}

/**
 * 7. Health Score Defuzzification
 */
function calculateHealthScore(expMemberships) {
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
  let rawInput = typeof inputRatio === 'number' && !isNaN(inputRatio) ? inputRatio : 0;
  const spendRatio = rawInput > 1.0 ? rawInput / 100 : rawInput;

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