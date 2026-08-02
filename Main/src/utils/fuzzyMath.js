// fuzzyEngine.js

// 1. Triangular Membership Function: Returns weight between 0.0 and 1.0
function getTriangularMembership(x, a, b, c) {
  if (x <= a || x >= c) return 0;
  if (x === b) return 1;
  if (x > a && x < b) return (x - a) / (b - a);
  if (x > b && x < c) return (c - x) / (c - b);
}

// 2. Antecedent Evaluation: Computes membership for 5 financial tiers
export function evaluateAntecedents(spendRatio) {
  return {
    veryLow:  getTriangularMembership(spendRatio, 0.0, 0.0, 0.25),
    low:      getTriangularMembership(spendRatio, 0.15, 0.30, 0.45),
    moderate: getTriangularMembership(spendRatio, 0.35, 0.50, 0.65),
    high:     getTriangularMembership(spendRatio, 0.55, 0.70, 0.85),
    veryHigh: getTriangularMembership(spendRatio, 0.75, 1.00, 1.00)
  };
}

// 3. Inference Engine: Gets the dominant fuzzy tier from membership weights
export function getDominantFuzzyTier(spendRatio) {
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