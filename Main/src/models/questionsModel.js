// models/questionsModel.js


function getFuzzifiedCommonQuestions(memberships = { low: 1, medium: 0, high: 0 }) {
  const mu_low = memberships.low || memberships.veryLow || 0;
  const mu_med = memberships.medium || memberships.med || memberships.moderate || 0;
  const mu_high = memberships.high || memberships.veryHigh || 0;

  const isHighRisk = mu_high > 0.5;
  const isCaution = mu_med > 0.5;

  return [
    {
      id: "core_highest_spend",
      intent: "CHECK_HIGHEST_SPENDING",
      text: isHighRisk 
        ? "⚠️ Audit Overspending Leaks" 
        : isCaution 
          ? "📊 Review High Category Spending" 
          : "🔍 Check Highest Spending",
      label: "Check Highest Spending",
      fuzzyWeight: parseFloat((mu_low * 0.8 + mu_med * 0.9 + mu_high * 1.0).toFixed(3))
    },
    {
      id: "core_needs_wants",
      intent: "CHECK_NEEDS_VS_WANTS",
      text: isHighRisk 
        ? "🚨 Emergency Needs vs. Wants Audit" 
        : "⚖️ Needs vs. Wants Audit",
      label: "Needs vs. Wants Audit",
      fuzzyWeight: parseFloat((mu_low * 0.7 + mu_med * 0.9 + mu_high * 1.0).toFixed(3))
    },
    {
      id: "core_savings_goal",
      intent: "CHECK_SAVINGS_GOAL",
      text: isHighRisk 
        ? "📉 Savings Deficit Check" 
        : "🎯 Did I hit my Savings Goal?",
      label: "Savings Goal Check",
      fuzzyWeight: parseFloat((mu_low * 1.0 + mu_med * 0.8 + mu_high * 0.2).toFixed(3))
    }
  ];
}

/**
 * 2. MASTER FUZZY DYNAMIC POOL
 */
const FUZZY_DYNAMIC_POOL = [
  {
    id: "fq_freeze",
    intent: "FREEZE_BUDGET",
    text: "🚨 Activate Emergency Freeze Budget",
    weights: { low: 0.0, medium: 0.3, high: 1.0 },
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
 * Evaluates dynamic dynamic questions based on membership inputs
 */
function getFuzzyDynamicQuestions(memberships = { low: 1, medium: 0, high: 0 }, limit = 1) {
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
 * Evaluates level 3 sub-questions
 */
function getNestedFuzzyQuestions(parentIntent, memberships = { low: 1, medium: 0, high: 0 }) {
  const parentNode = FUZZY_DYNAMIC_POOL.find(q => q.intent === parentIntent);
  if (!parentNode || !parentNode.nestedFuzzyQuestions) return [];

  const mu_low = memberships.low || memberships.veryLow || 0;
  const mu_med = memberships.medium || memberships.med || memberships.moderate || 0;
  const mu_high = memberships.high || memberships.veryHigh || 0;

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
 * Returns Fuzzified Anchors + Top Dynamic Question
 */
function getQuestionsForMood(dominantTier, memberships = null) {
  const fuzzyVector = memberships || {
    low: dominantTier === 'low' || dominantTier === 'veryLow' ? 1 : 0,
    medium: dominantTier === 'medium' || dominantTier === 'moderate' ? 1 : 0,
    high: dominantTier === 'high' || dominantTier === 'veryHigh' ? 1 : 0
  };

  const dynamicAnchors = getFuzzifiedCommonQuestions(fuzzyVector);
  const dynamicFuzzyQuestions = getFuzzyDynamicQuestions(fuzzyVector, 1);

  return [
    ...dynamicAnchors,
    ...dynamicFuzzyQuestions
  ];
}

// Key-based QUESTIONS map export to prevent reference crashes
const QUESTIONS = {
  CHECK_HIGHEST_SPENDING: { intent: "CHECK_HIGHEST_SPENDING", text: "🔍 Check Highest Spending", label: "Check Highest Spending" },
  CHECK_NEEDS_VS_WANTS: { intent: "CHECK_NEEDS_VS_WANTS", text: "⚖️ Needs vs. Wants Audit", label: "Needs vs. Wants Audit" },
  CHECK_SAVINGS_GOAL: { intent: "CHECK_SAVINGS_GOAL", text: "🎯 Did I hit my Savings Goal?", label: "Savings Goal Check" },
  CUT_EXPENSES: { intent: "CUT_EXPENSES", text: "Where can I cut back? ✂️", label: "Where can I cut back? ✂️" },
  FREEZE_BUDGET: { intent: "FREEZE_BUDGET", text: "Freeze Budget 🚨", label: "Freeze Budget 🚨" }
};

module.exports = {
  QUESTIONS,
  FUZZY_DYNAMIC_POOL,
  getFuzzifiedCommonQuestions,
  getFuzzyDynamicQuestions,
  getNestedFuzzyQuestions,
  getQuestionsForMood
};