// models/questionsModel.js

/**
 * 1. COMMON / STATIC ANCHOR QUESTIONS (Baseline navigation)
 */
const COMMON_QUESTIONS = [
  {
    id: "core_highest_spend",
    intent: "CHECK_HIGHEST_SPENDING",
    text: "🔍 Check Highest Spending",
    label: "🔍 Check Highest Spending"
  },
  {
    id: "core_needs_wants",
    intent: "CHECK_NEEDS_VS_WANTS",
    text: "⚖️ Needs vs. Wants Audit",
    label: "⚖️ Needs vs. Wants Audit"
  },
  {
    id: "core_savings_goal",
    intent: "CHECK_SAVINGS_GOAL",
    text: "🎯 Did I hit my Savings Goal?",
    label: "🎯 Did I hit my Savings Goal?"
  }
];

/**
 * 2. MASTER FUZZY DYNAMIC POOL (Level 2 Dynamic + Level 3 Nested)
 */
const FUZZY_DYNAMIC_POOL = [
  {
    id: "fq_freeze",
    intent: "FREEZE_BUDGET",
    text: "🚨 Activate Emergency Freeze Budget",
    weights: { low: 0.0, medium: 0.3, high: 1.0 },
    // 🔀 LEVEL 3 NESTED FUZZY SUB-QUESTIONS (HIGH TIER FOCUS)
    nestedFuzzyQuestions: [
      {
        id: "sub_cut_wants",
        intent: "CUT_DISCRETIONARY",
        text: "✂️ What non-essentials can I drop right now?",
        weights: { low: 0.0, medium: 0.4, high: 1.0 }
      },
      {
        id: "sub_check_runway",
        intent: "CHECK_RUNWAY",
        text: "⏳ How many days until my balance hits 0?",
        weights: { low: 0.0, medium: 0.2, high: 0.9 }
      }
    ]
  },
  {
    id: "fq_trim_leaks",
    intent: "TRIM_LEAKS",
    text: "✂️ Find potential spending leaks",
    weights: { low: 0.1, medium: 1.0, high: 0.6 },
    // 🔀 LEVEL 3 NESTED FUZZY SUB-QUESTIONS (MEDIUM TIER FOCUS)
    nestedFuzzyQuestions: [
      {
        id: "sub_compare_month",
        intent: "COMPARE_MONTHS",
        text: "📅 Compare with Last Month",
        weights: { low: 0.5, medium: 1.0, high: 0.5 }
      },
      {
        id: "sub_buffer_check",
        intent: "CHECK_EMERGENCY_FUND",
        text: "🛡️ Is my buffer safe for emergencies?",
        weights: { low: 0.3, medium: 0.9, high: 0.4 }
      }
    ]
  },
  {
    id: "fq_surplus",
    intent: "SURPLUS_ADVICE",
    text: "💡 Where should I put my savings surplus?",
    weights: { low: 1.0, medium: 0.2, high: 0.0 },
    // 🔀 LEVEL 3 NESTED FUZZY SUB-QUESTIONS (LOW TIER FOCUS)
    nestedFuzzyQuestions: [
      {
        id: "sub_investment_split",
        intent: "ALLOCATE_SURPLUS",
        text: "📈 How should I split surplus into investments?",
        weights: { low: 1.0, medium: 0.3, high: 0.0 }
      },
      {
        id: "sub_raise_goal",
        intent: "RAISE_SAVINGS_TARGET",
        text: "🚀 Can I raise my monthly savings goal?",
        weights: { low: 0.9, medium: 0.2, high: 0.0 }
      }
    ]
  }
];

/**
 * 🔀 Fuzzy Vector Evaluator for Level 2 Dynamic Question
 */
// models/questionsModel.js - Robust Fuzzy Membership Reader

function getFuzzyDynamicQuestions(memberships = { low: 1, medium: 0, high: 0 }, limit = 1) {
  // Read memberships safely across different naming conventions (med / medium / moderate)
  const mu_low = memberships.low || memberships.veryLow || 0;
  const mu_med = memberships.medium || memberships.med || memberships.moderate || 0;
  const mu_high = memberships.high || memberships.veryHigh || 0;

  const scored = FUZZY_DYNAMIC_POOL.map(q => {
    const score = (mu_low * q.weights.low) +
                  (mu_med * q.weights.medium) +
                  (mu_high * q.weights.high);

    return {
      id: q.id,
      intent: q.intent,
      text: q.text,
      label: q.text,
      fuzzyScore: parseFloat(score.toFixed(3))
    };
  });

  scored.sort((a, b) => b.fuzzyScore - a.fuzzyScore);
  return scored.slice(0, limit);
}

/**
 * 🔀 Fuzzy Vector Evaluator for Level 3 Nested Sub-Questions
 */
function getNestedFuzzyQuestions(parentIntent, memberships = { low: 1, medium: 0, high: 0 }) {
  const parentNode = FUZZY_DYNAMIC_POOL.find(q => q.intent === parentIntent);
  if (!parentNode || !parentNode.nestedFuzzyQuestions) return [];

  const mu_low = memberships.low || 0;
  const mu_med = memberships.medium || memberships.med || 0;
  const mu_high = memberships.high || 0;

  const scored = parentNode.nestedFuzzyQuestions.map(sub => {
    const score = (mu_low * sub.weights.low) +
                  (mu_med * sub.weights.medium) +
                  (mu_high * sub.weights.high);

    return {
      id: sub.id,
      intent: sub.intent,
      text: sub.text,
      label: sub.text,
      fuzzyScore: parseFloat(score.toFixed(3))
    };
  });

  scored.sort((a, b) => b.fuzzyScore - a.fuzzyScore);
  return scored;
}

/**
 * Default getter: 3 Baseline + Top 1 Dynamic Fuzzy Question
 */
function getQuestionsForMood(dominantTier, memberships = null) {
  const fuzzyVector = memberships || {
    low: dominantTier === 'low' ? 1 : 0,
    medium: dominantTier === 'medium' ? 1 : 0,
    high: dominantTier === 'high' ? 1 : 0
  };

  const dynamicQuestions = getFuzzyDynamicQuestions(fuzzyVector, 1);

  return [
    ...COMMON_QUESTIONS,
    ...dynamicQuestions
  ];
}

module.exports = {
  COMMON_QUESTIONS,
  FUZZY_DYNAMIC_POOL,
  getQuestionsForMood,
  getNestedFuzzyQuestions
};