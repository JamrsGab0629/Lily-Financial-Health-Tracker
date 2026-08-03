// src/utils/fuzzyEngine.js

// 1. Triangular Membership Function
function getTriangularMembership(x, a, b, c) {
  if (x <= a || x >= c) return 0;
  if (x === b) return 1;
  if (x > a && x < b) return (x - a) / (b - a);
  if (x > b && x < c) return (c - x) / (c - b);
  return 0;
}

// 2. Antecedent Evaluation (Using 0.0 to 1.0 normalized scale with shoulder boundaries)
function evaluateAntecedents(spendRatio) {
  // Clamp spendRatio to non-negative
  const x = Math.max(0, spendRatio);

  return {
    // Left shoulder: If spending is 0, full membership in veryLow
    veryLow: x <= 0.0 ? 1 : getTriangularMembership(x, 0.0, 0.0, 0.25),
    low: getTriangularMembership(x, 0.15, 0.30, 0.45),
    moderate: getTriangularMembership(x, 0.35, 0.50, 0.65),
    high: getTriangularMembership(x, 0.55, 0.70, 0.85),
    // Right shoulder: If spending is >= 1.0 (100%+), full membership in veryHigh
    veryHigh: x >= 1.0 ? 1 : getTriangularMembership(x, 0.75, 1.00, 1.00)
  };
}

// 3. Inference Engine
function getDominantFuzzyTier(inputRatio) {
  // 💡 NORMALIZE INPUT:
  // If ratio is passed as percentage (e.g. 220 or 75), convert to decimal (2.2 or 0.75)
  const spendRatio = inputRatio > 1.0 && inputRatio <= 100 
    ? inputRatio / 100 
    : (inputRatio > 100 ? inputRatio / 100 : inputRatio);

  const memberships = evaluateAntecedents(spendRatio);
  let dominantTier = 'moderate';
  let maxWeight = -1;

  for (const [tier, weight] of Object.entries(memberships)) {
    if (weight > maxWeight) {
      maxWeight = weight;
      dominantTier = tier;
    }
  }

  return { dominantTier, memberships };
}
function calculateHealthScore(memberships) {
  // Define center score weights for each tier (100 = perfect, 0 = critical)
  const weights = {
    veryLow: 100,  // Spending <= 25% -> Score ~100
    low: 80,       // Spending ~30% -> Score ~80
    moderate: 50,  // Spending ~50% -> Score ~50
    high: 25,      // Spending ~75% -> Score ~25
    veryHigh: 0    // Spending >= 100% -> Score 0
  };

  let totalWeight = 0;
  let totalMembership = 0;

  for (const [tier, weight] of Object.entries(memberships)) {
    const mu = weight; // Membership degree (0.0 to 1.0)
    totalWeight += mu * weights[tier];
    totalMembership += mu;
  }

  if (totalMembership === 0) return 0;

  // Weighted average score rounded to clean integer
  return Math.round(totalWeight / totalMembership);
}

module.exports = {
  getTriangularMembership,
  evaluateAntecedents,
  getDominantFuzzyTier,
  calculateHealthScore
};