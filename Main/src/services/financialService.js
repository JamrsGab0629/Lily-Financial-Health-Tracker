// services/financialService.js
const transactionModel = require("../models/transactionModel");

// 1. Import Fuzzy Engine, Decision Tree, and Multi-Tiered Questions models
const { getDominantFuzzyTier, calculateHealthScore } = require("../utils/fuzzyEngine");
const { DECISION_TREE } = require("../models/decisionTreeModel");
const { getQuestionsForMood, getNestedFuzzyQuestions } = require("../models/questionsModel");

/*
=====================================
HELPERS
=====================================
*/

// Helper to map alert tiers directly to your /public/assets/ folder
function getLilyGif(alertTier = "Info") {
  switch ((alertTier || "INFO").toUpperCase()) {
    case "OPTIMAL":
      return "/assets/happy.gif";
    case "STABLE":
    case "INFO":
      return "/assets/neutral.gif";
    case "CAUTION":
    case "WARNING":
      return "/assets/sad.gif";
    case "CRITICAL":
      return "/assets/angry.gif";
    default:
      return "/assets/neutral.gif";
  }
}

/*
=====================================
CALCULATION & BUSINESS LOGIC
=====================================
*/

async function getFinancialSummary() {
  // Fetch totals, breakdown, AND dynamic savings target rate
  const [totals, categoryRows, targetRate] = await Promise.all([
    transactionModel.getTotalsFromDB(),
    transactionModel.getCategoryBreakdownFromDB(),
    transactionModel.getTargetSavingsRate() // Fetch from settings
  ]);

  const totalIncome = parseFloat(totals.total_income) || 0;
  const totalExpense = parseFloat(totals.total_expense) || 0;
  
  // Balance / Savings
  const balance = Math.max(0, totalIncome - totalExpense);

  // Savings Percentage
  const savingsPercentage = totalIncome > 0 
    ? Math.round((balance / totalIncome) * 100) 
    : 0;

  // Expense Ratio
  let expenseRatio = 0;
  if (totalIncome > 0) {
    expenseRatio = (totalExpense / totalIncome) * 100;
  } else if (totalExpense > 0) {
    expenseRatio = 100;
  }

  const categoryBreakdown = categoryRows.map(row => ({
    category: row.category || "Uncategorized",
    amount: parseFloat(row.total_amount) || 0
  }));

  return {
    totalIncome,
    totalExpense,
    balance,
    savingsPercentage,
    netSavings: balance,
    expenseRatio: parseFloat(expenseRatio.toFixed(2)),
    targetSavingsRate: targetRate || 20, // Dynamic target rate
    categoryBreakdown
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

  // 1. Evaluate Fuzzy Logic
  const { dominantTier, memberships } = getDominantFuzzyTier(spendRatio);
  const healthScore = calculateHealthScore ? calculateHealthScore(memberships) : Math.max(0, 100 - spendRatio);
  
  // Normalize memberships safely across moderate/medium/med naming schemes
  const normLow = memberships.low ?? memberships.veryLow ?? 0;
  const normMed = memberships.medium ?? memberships.med ?? memberships.moderate ?? 0;
  const normHigh = memberships.high ?? memberships.veryHigh ?? 0;

  // 2. Retrieve root questions (3 Core Baseline Anchor Questions + 1 Dynamic Fuzzy Question evaluated via Vector Dot Product)
  let suggestedQuestions = getQuestionsForMood(dominantTier, memberships);

  // 3. Fetch default node from Decision Tree
  const rawNode = DECISION_TREE[intent]?.[dominantTier] || DECISION_TREE[intent]?.default;

  // Fallback structure ensuring custom dynamic intents execute properly
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

  /*
  =====================================================
  DYNAMIC INTENT INJECTIONS WITH FUZZY EXPLANATIONS & NESTING
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

  // 2. Needs vs. Wants Audit (Spending Wisdom Check)
  if (intent === "CHECK_NEEDS_VS_WANTS" || intent === "SPENDING_WISDOM") {
    const categories = summary.categoryBreakdown || [];
    const essentialCategories = ["food", "transportation", "bills", "utilities"];

    let totalNeeds = 0;
    let totalWants = 0;

    categories.forEach(item => {
      const name = item.category ? item.category.toLowerCase() : "";
      if (essentialCategories.includes(name)) {
        totalNeeds += item.amount;
      } else if (name !== "income") {
        totalWants += item.amount;
      }
    });

    const totalSpent = summary.totalExpense || (totalNeeds + totalWants);
    const needsRatio = totalSpent > 0 ? Math.round((totalNeeds / totalSpent) * 100) : 0;
    const wantsRatio = totalSpent > 0 ? Math.round((totalWants / totalSpent) * 100) : 0;

    if (totalNeeds >= totalWants) {
      node.response.message = `⚖️ **Spending Wisdom Analysis:**\n\n✅ **Great Priorities!** You are allocating **${needsRatio}%** (₱${totalNeeds.toLocaleString()}) to essential Needs versus **${wantsRatio}%** (₱${totalWants.toLocaleString()}) to Wants.\n\nYour spending balance is looking solid! 🌟`;
      node.response.alertTier = "Optimal";
    } else {
      node.response.message = `⚠️ **Spending Wisdom Warning:**\n\n👀 You are spending more on non-essentials/Wants (**${wantsRatio}%** | ₱${totalWants.toLocaleString()}) than essential Needs (**${needsRatio}%** | ₱${totalNeeds.toLocaleString()}).\n\nTry reining in discretionary purchases this week! 💸`;
      node.response.alertTier = "Warning";
    }
  }

  // 3. Savings Percentage Goal Check
  if (intent === "CHECK_SAVINGS_GOAL" || intent === "SET_GOAL") {
    const currentSavingsPct = summary.savingsPercentage || 0;
    const netSavings = summary.netSavings || 0;
    const targetSavingsRate = summary.targetSavingsRate || 20;
    
    if (currentSavingsPct >= targetSavingsRate) {
      node.response.message = `🎯 **Goal Reached!** You are currently saving **${currentSavingsPct}%** of your income (₱${netSavings.toLocaleString()}), beating your target of ${targetSavingsRate}%! Keep this momentum going! 🎉`;
      node.response.alertTier = "Optimal";
    } else {
      const gap = targetSavingsRate - currentSavingsPct;
      node.response.message = `⚠️ **Goal Pending:** You are currently saving **${currentSavingsPct}%** of your income (₱${netSavings.toLocaleString()}). You are **${gap}%** away from hitting your target of ${targetSavingsRate}%.`;
      node.response.alertTier = "Warning";
    }
  }

  // 4. Emergency Freeze Budget (HIGH TIER LEVEL 2 DYNAMIC)
  if (intent === "FREEZE_BUDGET") {
    const highMembership = (normHigh * 100).toFixed(0);
    
    node.response.message = `🚨 **Emergency Freeze Budget Activated!**\n\n🧠 **Fuzzy Reasoning:** Your spending shows a **${highMembership}% membership in the HIGH Risk Set** (Expense Ratio: ${spendRatio.toFixed(1)}%).\n\n📌 **Lily's Action Plan:** Limit spending exclusively to essential Needs for the next 7 days until your Expense Ratio drops back into the SAFE set!`;
    node.response.alertTier = "Critical";

    // 🔀 Override chips with Level 3 Nested Fuzzy Sub-Questions
    suggestedQuestions = getNestedFuzzyQuestions("FREEZE_BUDGET", memberships);
    node.isTerminal = false; 
  }

  // 5. Cut Discretionary / Non-Essentials (HIGH TIER LEVEL 3 NESTED)
  if (intent === "CUT_DISCRETIONARY") {
    node.response.message = `✂️ **Discretionary Spending Cut Plan:**\n\nBased on your logged expenses, cutting non-essential purchases by 50% this week will help save money and lower your expense ratio!`;
    node.response.alertTier = "Warning";
    suggestedQuestions = [];
    node.isTerminal = true; // Leaf node reached
  }

  // 6. Check Runway (HIGH TIER LEVEL 3 NESTED)
  if (intent === "CHECK_RUNWAY") {
    const dailySpend = summary.totalExpense > 0 ? (summary.totalExpense / 30) : 0;
    const runwayDays = dailySpend > 0 ? Math.floor(summary.balance / dailySpend) : "Unlimited";

    node.response.message = `⏳ **Financial Runway Check:**\n\nAt your current average daily burn rate (~₱${Math.round(dailySpend).toLocaleString()}/day), your remaining balance of **₱${summary.balance.toLocaleString()}** will last approximately **${runwayDays} days**.`;
    node.response.alertTier = "Warning";
    suggestedQuestions = [];
    node.isTerminal = true; // Leaf node reached
  }

  // 7. Trim Leaks (MEDIUM TIER LEVEL 2 DYNAMIC)
  if (intent === "TRIM_LEAKS") {
    const medMembership = (normMed * 100).toFixed(0);

    // Dynamic Category Detection
    let categoryAdvice = "non-essential spending";
    if (summary.categoryBreakdown && summary.categoryBreakdown.length > 0) {
      const sorted = [...summary.categoryBreakdown].sort((a, b) => b.amount - a.amount);
      if (sorted[0]) {
        categoryAdvice = `your **${sorted[0].category}** category`;
      }
    }

    node.response.message = `✂️ **Spending Leak Analysis:**\n\n🧠 **Fuzzy Reasoning:** Your expense ratio sits at **${spendRatio.toFixed(1)}%**, placing you at **${medMembership}% membership in the MODERATE Set**.\n\n📌 **Lily's Advice:** Reducing expenses in ${categoryAdvice} by 10% will shift your dominant set from MODERATE to OPTIMAL!`;
    node.response.alertTier = "Stable";

    // 🔀 Override chips with Level 3 Nested Fuzzy Sub-Questions
    suggestedQuestions = getNestedFuzzyQuestions("TRIM_LEAKS", memberships);
    node.isTerminal = false;
  }

  // 8. Emergency Buffer Check (LEVEL 3 NESTED / BUFFER INTENT)
  if (intent === "CHECK_EMERGENCY_FUND") {
    const monthlyExpenses = summary.totalExpense || 1;
    const monthsOfBuffer = (summary.balance / monthlyExpenses).toFixed(1);

    if (parseFloat(monthsOfBuffer) >= 3) {
      node.response.message = `🛡️ **Emergency Buffer Check:**\n\nYour current balance of **₱${summary.balance.toLocaleString()}** covers approximately **${monthsOfBuffer} months** of expenses! Your cushion is safe. 🌟`;
      node.response.alertTier = "Optimal";
    } else {
      node.response.message = `🛡️ **Emergency Buffer Check:**\n\nYour current balance of **₱${summary.balance.toLocaleString()}** covers **${monthsOfBuffer} months** of expenses. Try building this up to cover at least 3 months for full safety! ⚠️`;
      node.response.alertTier = "Caution";
    }

    suggestedQuestions = [];
    node.isTerminal = true;
  }

  // 9. Monthly Comparison Check (MEDIUM/GENERAL TIER LEVEL 3 NESTED)
  if (intent === "COMPARE_MONTHS") {
    const comparison = await transactionModel.getMonthlyComparisonFromDB();
    const currentExpense = parseFloat(comparison.current_month_expense) || 0;
    const lastExpense = parseFloat(comparison.last_month_expense) || 0;

    if (lastExpense === 0) {
      node.response.message = `📅 **Monthly Comparison:** You spent **₱${currentExpense.toLocaleString()}** this month. (No expenses recorded for last month to compare).`;
      node.response.alertTier = "Info";
    } else {
      const diff = currentExpense - lastExpense;
      const percentageChange = Math.abs(Math.round((diff / lastExpense) * 100));

      if (diff > 0) {
        node.response.message = `📈 **Spending Increase:** You spent **₱${currentExpense.toLocaleString()}** this month compared to **₱${lastExpense.toLocaleString()}** last month (+${percentageChange}%).\n\n🧠 **Fuzzy Insight:** This increase pushed your expense ratio to **${spendRatio.toFixed(1)}%** (${dominantTier.toUpperCase()} state). Let's trim non-essentials to stabilize your score! ⚠️`;
        node.response.alertTier = "Warning";
      } else {
        node.response.message = `📉 **Great Improvement!** You spent **₱${currentExpense.toLocaleString()}** this month versus **₱${lastExpense.toLocaleString()}** last month (-${percentageChange}%).\n\n🧠 **Fuzzy Insight:** This savings trend maintains your score at **${Math.round(healthScore)}/100** in the **${dominantTier.toUpperCase()}** fuzzy set! 🎉`;
        node.response.alertTier = "Optimal";
      }
    }
  }

  // 10. Surplus Advice Strategy (LOW TIER LEVEL 2 DYNAMIC)
  if (intent === "SURPLUS_ADVICE") {
    const lowMembership = (normLow * 100).toFixed(0);

    node.response.message = `💡 **Savings Surplus Strategy:**\n\n🧠 **Fuzzy Reasoning:** You have a strong **${lowMembership}% membership in the OPTIMAL/LOW Set** with a health score of ${Math.round(healthScore)}/100.\n\n📌 **Lily's Recommendation:** Allocate 70% of your remaining balance (₱${summary.balance.toLocaleString()}) to an Emergency Fund and 30% toward high-yield savings or investments!`;
    node.response.alertTier = "Optimal";

    // 🔀 Override chips with Level 3 Nested Fuzzy Sub-Questions
    suggestedQuestions = getNestedFuzzyQuestions("SURPLUS_ADVICE", memberships);
    node.isTerminal = false;
  }

  // 11. Allocate Surplus into Investments (LOW TIER LEVEL 3 NESTED)
  if (intent === "ALLOCATE_SURPLUS") {
    const totalSurplus = summary.balance;
    const emergencyFundPart = totalSurplus * 0.7;
    const investmentPart = totalSurplus * 0.3;

    node.response.message = `📈 **Optimal Allocation Split:**\n\nBased on your current balance of **₱${totalSurplus.toLocaleString()}**:\n• **₱${emergencyFundPart.toLocaleString()}** (70%) -> High-Yield Emergency Savings\n• **₱${investmentPart.toLocaleString()}** (30%) -> Growth / Investments\n\nThis keeps your risk low while maximizing growth! 🚀`;
    node.response.alertTier = "Optimal";
    suggestedQuestions = [];
    node.isTerminal = true; // Leaf node reached
  }

  // 12. Raise Savings Target (LOW TIER LEVEL 3 NESTED)
  if (intent === "RAISE_SAVINGS_TARGET") {
    const currentTarget = summary.targetSavingsRate || 20;
    const recommendedTarget = currentTarget + 5;

    node.response.message = `🚀 **Target Elevation Advice:**\n\nYour current savings target is **${currentTarget}%**. Because your Expense Ratio sits comfortably at **${spendRatio.toFixed(1)}%**, Lily suggests raising your target rate to **${recommendedTarget}%**!`;
    node.response.alertTier = "Optimal";
    suggestedQuestions = [];
    node.isTerminal = true; // Leaf node reached
  }

  // 🔄 DYNAMIC GIF INJECTION: Automatically assign GIF based on final alertTier
  if (node.response) {
    node.response.gifUrl = getLilyGif(node.response.alertTier);
  }

  // 13. Build Proof of Reasoning for Chat Accordion / Debugger
  const proofOfReasoning = {
    crispInput: `Expense Ratio = ${spendRatio.toFixed(2)}%`,
    dominantSet: dominantTier.toUpperCase(),
    activeRule: `IF expense_ratio IS ${dominantTier} THEN health_status IS ${node.response?.alertTier || 'Evaluated'}`,
    healthScore: Math.round(healthScore),
    memberships: {
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