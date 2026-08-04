// services/financialService.js
const transactionModel = require("../models/transactionModel");

// 1. Import Fuzzy Engine and Decision Tree models
const { getDominantFuzzyTier, calculateHealthScore } = require("../utils/fuzzyEngine");
const { DECISION_TREE } = require("../models/decisionTreeModel");

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
    targetSavingsRate: targetRate || 20, // <--- Dynamic target rate added here!
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
  
  // Set target savings percentage (20%)
  const TARGET_SAVINGS_PERCENT = 20;

  // 1. Evaluate Fuzzy Logic
  const { dominantTier, memberships } = getDominantFuzzyTier(spendRatio);
  const healthScore = calculateHealthScore ? calculateHealthScore(memberships) : Math.max(0, 100 - spendRatio);
  
  // 2. Fetch node from Decision Tree
  const rawNode = DECISION_TREE[intent]?.[dominantTier] || DECISION_TREE[intent]?.default;

  // Fallback if node isn't defined in decisionTreeModel.js
  if (!rawNode) {
    return {
      financialSummary: summary,
      evaluatedTier: dominantTier,
      fuzzyMemberships: memberships,
      response: {
        alertTier: "Complete",
        badgeColor: "#6c757d",
        gifUrl: "/assets/lily-neutral.gif",
        message: "Conversation path completed."
      },
      isTerminal: true,
      nestedQuestions: [],
      proofOfReasoning: {
        crispInput: `Expense Ratio = ${spendRatio.toFixed(2)}%`,
        dominantSet: dominantTier.toUpperCase(),
        activeRule: `IF expense_ratio IS ${dominantTier} THEN health_status IS Complete`,
        healthScore: Math.round(healthScore)
      }
    };
  }

  // Clone node so we don't mutate memory reference
  const node = JSON.parse(JSON.stringify(rawNode));

  /*
  =====================================================
  DYNAMIC INTENT INJECTIONS FOR ALL MOODS
  =====================================================
  */

  // 1. Highest Spending / Category Breakdown Audit
  if (intent === "SHOW_BREAKDOWN" || intent === "CHECK_HIGHEST_SPENDING" || intent === "SHOW_CATEGORIES") {
    if (!summary.categoryBreakdown || summary.categoryBreakdown.length === 0) {
      node.response.message = "📊 You don't have any expenses recorded yet!";
    } else {
      // Sort to get highest spending categories first
      const sortedCategories = [...summary.categoryBreakdown].sort((a, b) => b.amount - a.amount);
      const topCategory = sortedCategories[0];

      const listText = sortedCategories
        .map(item => `• ${item.category}: ₱${item.amount.toLocaleString()}`)
        .join("\n");

      node.response.message = `🔍 **Highest Expense Alert:** Your top spending area is **${topCategory.category}** at ₱${topCategory.amount.toLocaleString()}.\n\n📊 **Full Category Breakdown:**\n${listText}\n\n**Total Spent:** ₱${summary.totalExpense.toLocaleString()}`;
    }
  }

  // 2. Needs vs. Wants Audit (Spending Wisdom Check)
  if (intent === "CHECK_NEEDS_VS_WANTS" || intent === "SPENDING_WISDOM") {
    const categories = summary.categoryBreakdown || [];

    // Essential Categories (Needs)
    const essentialCategories = ["food", "transportation", "bills", "utilities"];

    let totalNeeds = 0;
    let totalWants = 0;

    categories.forEach(item => {
      const name = item.category ? item.category.toLowerCase() : "";
      if (essentialCategories.includes(name)) {
        totalNeeds += item.amount;
      } else if (name !== "income") { // Exclude Income if it ever gets passed here
        totalWants += item.amount;
      }
    });

    const totalSpent = summary.totalExpense || (totalNeeds + totalWants);
    const needsRatio = totalSpent > 0 ? Math.round((totalNeeds / totalSpent) * 100) : 0;
    const wantsRatio = totalSpent > 0 ? Math.round((totalWants / totalSpent) * 100) : 0;

    if (totalNeeds >= totalWants) {
      node.response.message = `⚖️ **Spending Wisdom Analysis:**\n\n✅ **Great Priorities!** You are allocating **${needsRatio}%** (₱${totalNeeds.toLocaleString()}) to essential Needs (Food, Transport, Bills, Utilities) versus **${wantsRatio}%** (₱${totalWants.toLocaleString()}) to Wants (Shopping, Entertainment, Dining Out, etc.).\n\nYour spending balance is looking solid! 🌟`;
      node.response.alertTier = "Optimal";
    } else {
      node.response.message = `⚠️ **Spending Wisdom Warning:**\n\n👀 You are spending more on non-essentials/Wants (**${wantsRatio}%** | ₱${totalWants.toLocaleString()}) than essential Needs (**${needsRatio}%** | ₱${totalNeeds.toLocaleString()}).\n\nTry reining in discretionary purchases like Shopping, Dining Out, or Entertainment this week! 💸`;
      node.response.alertTier = "Warning";
    }
  }

  // 3. Savings Percentage Goal Check
  // 2. Savings Percentage Goal Check
if (intent === "CHECK_SAVINGS_GOAL" || intent === "SET_GOAL") {
  const currentSavingsPct = summary.savingsPercentage || 0;
  const netSavings = summary.netSavings || 0;
  const targetSavingsRate = summary.targetSavingsRate || 20; // Dynamic from settings table
  
  if (currentSavingsPct >= targetSavingsRate) {
    node.response.message = `🎯 **Goal Reached!** You are currently saving **${currentSavingsPct}%** of your income (₱${netSavings.toLocaleString()}), which beats your target of ${targetSavingsRate}%! Keep this momentum going! 🎉`;
    node.response.alertTier = "Optimal";
  } else {
    const gap = targetSavingsRate - currentSavingsPct;
    node.response.message = `⚠️ **Goal Pending:** You are currently saving **${currentSavingsPct}%** of your income (₱${netSavings.toLocaleString()}). You are **${gap}%** away from hitting your target of ${targetSavingsRate}%.`;
    node.response.alertTier = "Warning";
  }
}

  // 4. Build Proof of Reasoning for Chat Accordion
  const proofOfReasoning = {
    crispInput: `Expense Ratio = ${spendRatio.toFixed(2)}%`,
    dominantSet: dominantTier.toUpperCase(),
    activeRule: `IF expense_ratio IS ${dominantTier} THEN health_status IS ${node.response?.alertTier || 'Evaluated'}`,
    healthScore: Math.round(healthScore)
  };

  return {
    financialSummary: summary,
    evaluatedTier: dominantTier,
    fuzzyMemberships: memberships,
    proofOfReasoning: proofOfReasoning,
    ...node
  };
}

module.exports = {
  getFinancialSummary,
  processLilyChat
};