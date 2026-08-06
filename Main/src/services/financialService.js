// services/financialService.js
const transactionModel = require("../models/transactionModel");

// 1. Import Fuzzy Engine, Decision Tree, Multi-Tiered Questions models, and Metrics Calculator
const { 
  getDominantFuzzyTier, 
  calculateHealthScore, 
  evaluateSavingsFuzzyRules 
} = require("../utils/fuzzyEngine");
const { DECISION_TREE } = require("../models/decisionTreeModel");
const { getQuestionsForMood, getNestedFuzzyQuestions } = require("../models/questionsModel");

// Import utility for pace and acceleration calculations
const { calculateBurnRateAcceleration } = require("../utils/metricsCalculator");

/*
=====================================
HELPERS & CATEGORY CLASSIFICATION
=====================================
*/

/**
 * List of known discretionary / want categories (case-insensitive)
 */
const WANT_CATEGORIES = [
  "entertainment",
  "wants",
  "leisure",
  "dining out",
  "shopping",
  "hobbies",
  "subscriptions",
  "vacation",
  "games"
];

/**
 * Categorizes category rows dynamically into Needs and Wants
 */
function classifyNeedsAndWants(categoryRows = []) {
  let computedNeeds = 0;
  let computedWants = 0;

  categoryRows.forEach((row) => {
    const catName = (row.category || "Uncategorized").trim().toLowerCase();
    const amt = parseFloat(row.total_amount) || 0;

    if (WANT_CATEGORIES.includes(catName)) {
      computedWants += amt;
    } else {
      computedNeeds += amt;
    }
  });

  return { computedNeeds, computedWants };
}

// Helper to get visual reaction headers based on Mamdani tier
function getFuzzyReactionUI(tier) {
  const upper = (tier || '').toUpperCase();
  switch (upper) {
    case "CRITICAL":
      return {
        reaction: "😱 OH NO!",
        headline: "🚨 SEVERE FINANCIAL RISK!",
        banner: "Emergency action needed to protect your budget!"
      };
    case "CAUTION":
    case "WARNING":
      return {
        reaction: "⚠️ HEADS UP!",
        headline: "⚠️ BUDGET IN CAUTION ZONE",
        banner: "Your budget is slipping out of balance. Let's keep a close eye on this!"
      };
    case "OPTIMAL":
    case "GOOD":
      return {
        reaction: "🎉 AWESOME!",
        headline: "🎯 PERFECT BALANCE!",
        banner: "You are completely crushing your financial goals!"
      };
    default:
      return {
        reaction: "📊 AUDIT",
        headline: "FINANCIAL STATUS AUDIT",
        banner: "Analyzing your health metrics..."
      };
  }
}

// Helper to map alert tiers directly to your /public/assets/ folder
function getLilyGif(status) {
  const upper = (status || '').toUpperCase();
  switch (upper) {
    case 'CRITICAL':
      return '/assets/angry.gif';
    case 'WARNING':
      return '/assets/sad.gif';
    case 'MODERATE':
    case 'NEUTRAL':
    case 'CAUTION':
      return '/assets/neutral.gif';
    case 'OPTIMAL':
    case 'GOOD':
    default:
      return '/assets/happy.gif';
  }
}

/*
=====================================
CALCULATION & BUSINESS LOGIC
=====================================
*/

async function getFinancialSummary() {
  const [totals, categoryRows, targetRate, comparison] = await Promise.all([
    transactionModel.getTotalsFromDB(),
    transactionModel.getCategoryBreakdownFromDB(),
    transactionModel.getTargetSavingsRate(),
    transactionModel.getMonthlyComparisonFromDB().catch(() => ({ current_month_expense: 0, last_month_expense: 0 }))
  ]);

  const totalIncome = parseFloat(totals.total_income) || 0;
  const totalExpense = parseFloat(totals.total_expense) || 0;
  const lastMonthExpense = parseFloat(comparison.last_month_expense) || 0;
  
  const categoryBreakdown = (categoryRows || []).map(row => ({
    category: row.category || "Uncategorized",
    amount: parseFloat(row.total_amount) || 0
  }));

  // Dynamically compute Needs vs. Wants based on category breakdown
  let computedNeeds = 0;
  let computedWants = 0;

  categoryBreakdown.forEach(item => {
    const catName = item.category.trim().toLowerCase();
    const isWant = WANT_CATEGORIES.some(want => catName.includes(want));
    if (isWant) {
      computedWants += item.amount;
    } else {
      computedNeeds += item.amount;
    }
  });

  const totalNeedsAmount = computedNeeds;
  const totalWantsAmount = computedWants;

  const balance = Math.max(0, totalIncome - totalExpense);

  const savingsPercentage = totalIncome > 0 
    ? Math.round((balance / totalIncome) * 100) 
    : 0;

  let expenseRatio = 0;
  if (totalIncome > 0) {
    expenseRatio = (totalExpense / totalIncome) * 100;
  } else if (totalExpense > 0) {
    expenseRatio = (totalExpense / (totalIncome || 1)) * 100;
  }

  const burnRateMetrics = calculateBurnRateAcceleration(totalExpense, lastMonthExpense);
  const projectedMonthlyExpense = burnRateMetrics.currentDailyPace * 30 || 1;
  const emergencyBufferMonths = parseFloat((balance / projectedMonthlyExpense).toFixed(1));

  return {
    totalIncome,
    totalExpense,
    totalNeedsAmount,
    totalWantsAmount,
    lastMonthExpense,
    balance,
    savingsPercentage,
    netSavings: balance,
    expenseRatio: parseFloat(expenseRatio.toFixed(2)),
    targetSavingsRate: targetRate || 20,
    categoryBreakdown,
    burnRateMetrics,
    emergencyBufferMonths
  };
}

/*
=====================================
FUZZY & FDT INTERACTION HANDLER
=====================================
*/

async function processLilyChat(intent = "CHECK_HEALTH") {
  const summary = await getFinancialSummary();
  const spendRatio = summary.expenseRatio || 0;
  const buffer = summary.emergencyBufferMonths || 0;
  const acceleration = summary.burnRateMetrics.accelerationPct || 0;
  const dailyPace = summary.burnRateMetrics.currentDailyPace || 0;
  const targetSavingsRate = summary.targetSavingsRate || 20;
  const currentSavingsPct = summary.savingsPercentage || 0;

  // 1. Evaluate Single-Input Fuzzy Logic (Expense Ratio)
  const { dominantTier, memberships } = getDominantFuzzyTier(spendRatio);
  const healthScore = calculateHealthScore ? calculateHealthScore(memberships) : Math.max(0, 100 - spendRatio);
  
  const normVeryLow = memberships.veryLow ?? 0;
  const normLow = memberships.low ?? 0;
  const normMed = memberships.medium ?? memberships.med ?? memberships.moderate ?? 0;
  const normHigh = memberships.high ?? memberships.veryHigh ?? 0;

  // 2. Retrieve root questions
  let suggestedQuestions = getQuestionsForMood(dominantTier, memberships);

  // 3. Fetch default node from Decision Tree
  const rawNode = DECISION_TREE[intent]?.[dominantTier] || DECISION_TREE[intent]?.default;

  const node = rawNode ? JSON.parse(JSON.stringify(rawNode)) : {
    response: {
      alertTier: "Stable",
      badgeColor: "#6c757d",
      gifUrl: "/assets/neutral.gif",
      message: "Processing your request..."
    },
    isTerminal: false,
    nestedQuestions: []
  };

  let dynamicProofOverride = null;

  /*
  =====================================================
  DYNAMIC INTENT INJECTIONS
  =====================================================
  */

  // 1. Highest Spending / Category Breakdown Audit
  if (intent === "SHOW_BREAKDOWN" || intent === "CHECK_HIGHEST_SPENDING" || intent === "SHOW_CATEGORIES") {
    if (!summary.categoryBreakdown || summary.categoryBreakdown.length === 0) {
      node.response.message = "📊 You don't have any expenses recorded yet!";
    } else {
      const sortedCategories = [...summary.categoryBreakdown].sort((a, b) => b.amount - a.amount);
      const topCategory = sortedCategories[0];

      const listText = sortedCategories
        .map(item => `• ${item.category}: ₱${item.amount.toLocaleString()}`)
        .join("\n");

      node.response.message = `🔍 **Highest Expense Audit:**\nYour top spending area is **${topCategory.category}** at ₱${topCategory.amount.toLocaleString()}.\n\n📊 **Full Category Breakdown:**\n${listText}\n\n🧠 **Fuzzy Context:** Because your current Expense Ratio is **${spendRatio.toFixed(1)}%**, evaluating this breakdown helps keep your dominant state in **${dominantTier.toUpperCase()}**!`;
    }
  }

  // 2. Needs vs. Wants Audit
 // 2. Needs vs. Wants Audit
  if (intent === "CHECK_NEEDS_VS_WANTS") {
    const needsAmount = summary.totalNeedsAmount || 0;
    const wantsAmount = summary.totalWantsAmount || 0;
    const totalSpent = summary.totalExpense || (needsAmount + wantsAmount);
    const combinedSpent = needsAmount + wantsAmount;

    // Use combinedSpent (or fallback to totalSpent) to keep percentages summing cleanly to 100%
    const baselineSpent = combinedSpent > 0 ? combinedSpent : (totalSpent > 0 ? totalSpent : 1);

    const needsPct = Math.round((needsAmount / baselineSpent) * 100);
    const wantsPct = Math.round((wantsAmount / baselineSpent) * 100);

    const wantsRatio = baselineSpent > 0 ? wantsAmount / baselineSpent : 0;
    const normalizedExpenseRatio = spendRatio / 100;
    const savingsGapRatio = Math.max(0, (targetSavingsRate - currentSavingsPct) / 100);
    const burnAcceleration = summary.burnRateMetrics.accelerationPct ? summary.burnRateMetrics.accelerationPct / 100 : 1.0;

    // Run 4-Input Fuzzy Engine
    const fuzzyResult = evaluateSavingsFuzzyRules(
      normalizedExpenseRatio,
      savingsGapRatio,
      burnAcceleration,
      wantsRatio
    );

    const ui = getFuzzyReactionUI(fuzzyResult.tier);

    if (fuzzyResult.tier === "CRITICAL" || spendRatio > 100) {
      const criticalUI = getFuzzyReactionUI("CRITICAL");
      node.response.message = `${criticalUI.reaction} **${criticalUI.headline}**\n\n` +
        `🚨 **Severe Overspending Detected!** Your total expense ratio is **${spendRatio.toFixed(1)}%**!\n\n` +
        `• **Wants (Discretionary):** **${wantsPct}%** (₱${wantsAmount.toLocaleString()})\n` +
        `• **Needs (Essential):** **${needsPct}%** (₱${needsAmount.toLocaleString()})\n\n` +
        `Your discretionary spending on non-essentials is consuming your entire budget. Freeze discretionary purchases immediately! 💔`;
      node.response.alertTier = "Critical";
    } else if (wantsPct >= 60) {
      node.response.message = `${ui.reaction} **${ui.headline}**\n\n` +
        `You are allocating **${wantsPct}%** (₱${wantsAmount.toLocaleString()}) to non-essentials/Wants versus **${needsPct}%** (₱${needsAmount.toLocaleString()}) to Needs.\n\n` +
        `💡 **Lily's Tip:** Reining in non-essential purchases will quickly rebuild your savings cushion! 💸`;
      node.response.alertTier = "Warning";
    } else {
      node.response.message = `${ui.reaction} **${ui.headline}**\n\n` +
        `✅ **Great Priorities!** You are allocating **${needsPct}%** (₱${needsAmount.toLocaleString()}) to essential Needs versus **${wantsPct}%** (₱${wantsAmount.toLocaleString()}) to Wants.\n\n` +
        `Your spending balance and cushion look solid! 🌟`;
      node.response.alertTier = "Optimal";
    }

    let gapSet = savingsGapRatio <= 0 ? 'ONTRACK' : (savingsGapRatio >= 0.30 ? 'LARGEGAP' : 'MINORGAP');
    let wantsSet = wantsRatio >= 0.70 ? 'DISCRETIONARYHEAVY' : (wantsRatio <= 0.30 ? 'ESSENTIALHEAVY' : 'BALANCED');
    let burnSet = burnAcceleration >= 2.0 ? 'ACCELERATING' : (burnAcceleration > 1.0 ? 'ELEVATED' : 'NORMAL');

    dynamicProofOverride = {
      crispInput: `Ratio = ${spendRatio.toFixed(2)}% | Buffer = ${buffer} mos | Accel = ${acceleration}% (₱${dailyPace.toFixed(2)}/day)`,
      dominantSet: `EXPENSE: ${dominantTier.toUpperCase()} | GAP: ${gapSet} | PACE: ${burnSet} | WANTS: ${wantsSet}`,
      activeRule: fuzzyResult.activeRule,
      healthScore: Math.round(healthScore),
      memberships: fuzzyResult.memberships || memberships
    };
  }
  // 3. Multi-Input Savings Goal Check
  if (intent === "CHECK_SAVINGS_GOAL" || intent === "SET_GOAL") {
    const netSavings = summary.netSavings || 0;
    const normalizedExpenseRatio = spendRatio / 100;
    
    const rawGapPct = targetSavingsRate - currentSavingsPct;
    const savingsGapRatio = rawGapPct / 100;
    const effectiveGapRatio = Math.max(0, savingsGapRatio);
    
    const wantsRatio = summary.totalWantsAmount ? (summary.totalWantsAmount / (summary.totalExpense || 1)) : 0.5;

    const fuzzySavingsResult = evaluateSavingsFuzzyRules(
      normalizedExpenseRatio, 
      effectiveGapRatio, 
      acceleration / 100, 
      wantsRatio
    );

    if (currentSavingsPct >= targetSavingsRate) {
      const surplus = currentSavingsPct - targetSavingsRate;
      const ui = getFuzzyReactionUI("OPTIMAL");

      if (surplus > 0) {
        node.response.message = `${ui.reaction} **${ui.headline}**\n\nYou are saving an incredible **${currentSavingsPct}%** of your income (₱${netSavings.toLocaleString()})—beating your **${targetSavingsRate}%** target by **${surplus}%**! Keep up this amazing momentum! 🚀`;
      } else {
        node.response.message = `${ui.reaction} **${ui.headline}**\n\nYou hit your savings target exactly at **${currentSavingsPct}%** (₱${netSavings.toLocaleString()})! Fantastic discipline! 🎉`;
      }
      node.response.alertTier = "Optimal";

    } else if (fuzzySavingsResult.tier === "CRITICAL" || savingsGapRatio >= 0.30) {
      const ui = getFuzzyReactionUI("CRITICAL");
      node.response.message = `${ui.reaction} **${ui.headline}**\n\nYou are saving only **${currentSavingsPct}%** (₱${netSavings.toLocaleString()}) against your **${targetSavingsRate}%** goal. You're falling short by **${rawGapPct}%**! Freeze non-essentials immediately to turn this around. 💔`;
      node.response.alertTier = "Critical";

    } else {
      const ui = getFuzzyReactionUI("CAUTION");
      node.response.message = `${ui.reaction} **${ui.headline}**\n\nYou are saving **${currentSavingsPct}%** of your income (₱${netSavings.toLocaleString()}), putting you **${rawGapPct}%** away from your target of **${targetSavingsRate}%**. Trim a little non-essential spend to cross the goal line! 🌟`;
      node.response.alertTier = "Warning";
    }

    let gapSet = savingsGapRatio <= 0 ? 'ONTRACK' : (savingsGapRatio >= 0.30 ? 'LARGEGAP' : 'MINORGAP');
    let wantsSet = wantsRatio >= 0.70 ? 'DISCRETIONARYHEAVY' : (wantsRatio <= 0.30 ? 'ESSENTIALHEAVY' : 'BALANCED');
    let burnSet = acceleration >= 100 ? 'ACCELERATING' : (acceleration > 0 ? 'ELEVATED' : 'NORMAL');

    dynamicProofOverride = {
      crispInput: `Ratio = ${spendRatio.toFixed(2)}% | Gap = ${(savingsGapRatio * 100).toFixed(1)}% | Accel = ${acceleration}% | Wants = ${(wantsRatio * 100).toFixed(1)}%`,
      dominantSet: `EXPENSE: ${dominantTier.toUpperCase()} | GAP: ${gapSet} | PACE: ${burnSet} | WANTS: ${wantsSet}`,
      activeRule: currentSavingsPct >= targetSavingsRate 
        ? "IF expense_ratio IS low AND savings_gap IS onTrack THEN status IS Optimal"
        : fuzzySavingsResult.activeRule,
      healthScore: Math.round(healthScore),
      memberships: fuzzySavingsResult.memberships || memberships
    };
  }

  // 4. Emergency Freeze Budget
  if (intent === "FREEZE_BUDGET") {
    const highMembership = (normHigh * 100).toFixed(0);
    
    node.response.message = `🚨 **Emergency Freeze Budget Activated!**\n\n🧠 **Fuzzy Reasoning:** Your spending shows a **${highMembership}% membership in the HIGH Risk Set** (Expense Ratio: ${spendRatio.toFixed(1)}%).\n\n📌 **Lily's Action Plan:** Limit spending exclusively to essential Needs for the next 7 days until your Expense Ratio drops back into the SAFE set!`;
    node.response.alertTier = "Critical";

    suggestedQuestions = getNestedFuzzyQuestions("FREEZE_BUDGET", memberships);
    node.isTerminal = false; 
  }

  // 5. Cut Discretionary
  if (intent === "CUT_DISCRETIONARY") {
    node.response.message = `✂️ **Discretionary Spending Cut Plan:**\n\nBased on your logged expenses, cutting non-essential purchases by 50% this week will help save money and lower your expense ratio!`;
    node.response.alertTier = "Warning";
    suggestedQuestions = [];
    node.isTerminal = true;
  }

  // 6. Check Runway
  if (intent === "CHECK_RUNWAY") {
    const runwayDays = dailyPace > 0 ? Math.floor(summary.balance / dailyPace) : "Unlimited";

    node.response.message = `⏳ **Financial Runway & Pace Check:**\n\n` +
      `• **Daily Pace:** ₱${dailyPace.toLocaleString()}/day\n` +
      `• **Emergency Runway:** **${buffer} months** (~${runwayDays} days)\n` +
      `• **Remaining Balance:** ₱${summary.balance.toLocaleString()}\n\n` +
      (buffer < 1 
        ? `⚠️ **Lily's Alert:** Your runway is under 1 month! Slow down your daily burn rate to avoid depleting your balance.`
        : `🛡️ **Lily's Insight:** Your runway is in a safe condition.`);
    
    node.response.alertTier = buffer < 1 ? "Critical" : "Optimal";
    suggestedQuestions = [];
    node.isTerminal = true;
  }

  // 7. Trim Leaks
  if (intent === "TRIM_LEAKS") {
    const medMembership = (normMed * 100).toFixed(0);

    let categoryAdvice = "non-essential spending";
    if (summary.categoryBreakdown && summary.categoryBreakdown.length > 0) {
      const sorted = [...summary.categoryBreakdown].sort((a, b) => b.amount - a.amount);
      if (sorted[0]) {
        categoryAdvice = `your **${sorted[0].category}** category`;
      }
    }

    node.response.message = `✂️ **Spending Leak Analysis:**\n\n🧠 **Fuzzy Reasoning:** Your expense ratio sits at **${spendRatio.toFixed(1)}%**, placing you at **${medMembership}% membership in the MODERATE Set**.\n\n📌 **Lily's Advice:** Reducing expenses in ${categoryAdvice} by 10% will shift your dominant set from MODERATE to OPTIMAL!`;
    node.response.alertTier = "Stable";

    suggestedQuestions = getNestedFuzzyQuestions("TRIM_LEAKS", memberships);
    node.isTerminal = false;
  }

  // 8. Emergency Buffer Check
  if (intent === "CHECK_EMERGENCY_FUND") {
    if (buffer >= 3) {
      node.response.message = `🛡️ **Emergency Buffer Check:**\n\nYour current balance of **₱${summary.balance.toLocaleString()}** covers approximately **${buffer} months** of expenses! Your cushion is safe. 🌟`;
      node.response.alertTier = "Optimal";
    } else {
      node.response.message = `🛡️ **Emergency Buffer Check:**\n\nYour current balance of **₱${summary.balance.toLocaleString()}** covers **${buffer} months** of expenses. Try building this up to cover at least 3 months for full safety! ⚠️`;
      node.response.alertTier = "Caution";
    }

    suggestedQuestions = [];
    node.isTerminal = true;
  }

  // 9. Monthly Comparison & Acceleration Check
  if (intent === "COMPARE_MONTHS" || intent === "CHECK_ACCELERATION") {
    const lastExpense = summary.lastMonthExpense;
    const currentExpense = summary.totalExpense;
    const accelStatus = summary.burnRateMetrics.status;
    const accelText = acceleration >= 0 ? `+${acceleration}% faster` : `${acceleration}% slower`;

    if (lastExpense === 0) {
      node.response.message = `📅 **Monthly Comparison:** You spent **₱${currentExpense.toLocaleString()}** this month at a pace of ₱${dailyPace}/day. (No expenses recorded for last month to calculate acceleration).`;
      node.response.alertTier = "Info";
    } else if (accelStatus === "ACCELERATING") {
      node.response.message = `📈 **Spending Acceleration Alert!**\n\n` +
        `• **Current Daily Pace:** ₱${dailyPace.toLocaleString()}/day\n` +
        `• **Last Month Daily Pace:** ₱${summary.burnRateMetrics.lastMonthDailyPace.toLocaleString()}/day\n` +
        `• **Pace Trend:** Spending **${accelText}** than last month!\n\n` +
        `⚠️ **Lily's Insight:** Even if your raw total spending looks manageable, your current velocity will exhaust your budget faster than usual!`;
      node.response.alertTier = "Warning";
    } else {
      node.response.message = `📉 **Controlled Spending Speed!**\n\n` +
        `• **Current Daily Pace:** ₱${dailyPace.toLocaleString()}/day\n` +
        `• **Last Month Daily Pace:** ₱${summary.burnRateMetrics.lastMonthDailyPace.toLocaleString()}/day\n` +
        `• **Pace Trend:** Spending **${accelText}** than last month.\n\n` +
        `🎉 **Lily's Insight:** Excellent pacing! You are keeping your daily burn rate well under control.`;
      node.response.alertTier = "Optimal";
    }
  }

  // 10. Surplus Advice Strategy
  if (intent === "SURPLUS_ADVICE") {
    const lowMembership = (normLow * 100).toFixed(0);

    node.response.message = `💡 **Savings Surplus Strategy:**\n\n🧠 **Fuzzy Reasoning:** You have a strong **${lowMembership}% membership in the OPTIMAL/LOW Set** with a health score of ${Math.round(healthScore)}/100.\n\n📌 **Lily's Recommendation:** Allocate 70% of your remaining balance (₱${summary.balance.toLocaleString()}) to an Emergency Fund and 30% toward high-yield savings or investments!`;
    node.response.alertTier = "Optimal";

    suggestedQuestions = getNestedFuzzyQuestions("SURPLUS_ADVICE", memberships);
    node.isTerminal = false;
  }

  // 11. Allocate Surplus into Investments
  if (intent === "ALLOCATE_SURPLUS") {
    const totalSurplus = summary.balance;
    const emergencyFundPart = totalSurplus * 0.7;
    const investmentPart = totalSurplus * 0.3;

    node.response.message = `📈 **Optimal Allocation Split:**\n\nBased on your current balance of **₱${totalSurplus.toLocaleString()}**:\n• **₱${emergencyFundPart.toLocaleString()}** (70%) -> High-Yield Emergency Savings\n• **₱${investmentPart.toLocaleString()}** (30%) -> Growth / Investments\n\nThis keeps your risk low while maximizing growth! 🚀`;
    node.response.alertTier = "Optimal";
    suggestedQuestions = [];
    node.isTerminal = true;
  }

  // 12. Raise Savings Target
  if (intent === "RAISE_SAVINGS_TARGET") {
    const currentTarget = summary.targetSavingsRate || 20;
    const recommendedTarget = currentTarget + 5;

    node.response.message = `🚀 **Target Elevation Advice:**\n\nYour current savings target is **${currentTarget}%**. Because your Expense Ratio sits comfortably at **${spendRatio.toFixed(1)}%**, Lily suggests raising your target rate to **${recommendedTarget}%**!`;
    node.response.alertTier = "Optimal";
    suggestedQuestions = [];
    node.isTerminal = true;
  }

  // 🔄 DYNAMIC GIF INJECTION
  if (node.response) {
    node.response.gifUrl = getLilyGif(node.response.alertTier);
  }

  // 13. Build Proof of Reasoning
  const proofOfReasoning = dynamicProofOverride || {
    crispInput: `Ratio = ${spendRatio.toFixed(2)}% | Buffer = ${buffer} mos | Accel = ${acceleration}% (₱${dailyPace}/day)`,
    dominantSet: `EXPENSE: ${dominantTier.toUpperCase()} | PACE: ${summary.burnRateMetrics.status}`,
    activeRule: `IF expense_ratio IS ${dominantTier} AND burn_acceleration IS ${summary.burnRateMetrics.status} THEN status IS ${node.response?.alertTier || 'Evaluated'}`,
    healthScore: Math.round(healthScore),
    memberships: {
      veryLow: parseFloat(normVeryLow.toFixed(2)),
      low: parseFloat(normLow.toFixed(2)),
      medium: parseFloat(normMed.toFixed(2)),
      high: parseFloat(normHigh.toFixed(2))
    }
  };

  return {
    financialSummary: summary,
    evaluatedTier: dominantTier,
    fuzzyMemberships: memberships,
    suggestedQuestions: suggestedQuestions,
    proofOfReasoning: proofOfReasoning,
    ...node
  };
}

module.exports = {
  getFinancialSummary,
  processLilyChat
};