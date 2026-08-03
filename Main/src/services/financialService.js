// services/financialService.js
const transactionModel = require("../models/transactionModel");

// 1. Import Fuzzy Engine and Decision Tree models
const { getDominantFuzzyTier } = require("../utils/fuzzyEngine");
const { DECISION_TREE } = require("../models/decisionTreeModel");

/*
=====================================
CALCULATION & BUSINESS LOGIC
=====================================
*/

async function getFinancialSummary() {
  // Fetch raw data using Model layer
  const [totals, categoryRows] = await Promise.all([
    transactionModel.getTotalsFromDB(),
    transactionModel.getCategoryBreakdownFromDB()
  ]);

  const totalIncome = parseFloat(totals.total_income) || 0;
  const totalExpense = parseFloat(totals.total_expense) || 0;
  
  // 1. Calculate Balance / Savings
  const balance = Math.max(0, totalIncome - totalExpense);

  // 2. Calculate Savings Percentage
  const savingsPercentage = totalIncome > 0 
    ? Math.round((balance / totalIncome) * 100) 
    : 0;

  // Calculate expense ratio
  let expenseRatio = 0;
  if (totalIncome > 0) {
    expenseRatio = (totalExpense / totalIncome) * 100;
  } else if (totalExpense > 0) {
    expenseRatio = 100;
  }

  // Format category objects
  const categoryBreakdown = categoryRows.map(row => ({
    category: row.category || "Uncategorized",
    amount: parseFloat(row.total_amount) || 0
  }));

  return {
    totalIncome,
    totalExpense,
    balance,           // 👈 Added so frontend receives summary.balance
    savingsPercentage, // 👈 Added so frontend receives summary.savingsPercentage
    netSavings: balance,
    expenseRatio: parseFloat(expenseRatio.toFixed(2)),
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

  // Run Fuzzy Engine
  const { dominantTier, memberships } = getDominantFuzzyTier(spendRatio);
  const rawNode = DECISION_TREE[intent]?.[dominantTier] || DECISION_TREE[intent]?.default;

  if (!rawNode) {
    return {
      evaluatedTier: dominantTier,
      fuzzyMemberships: memberships,
      response: {
        alertTier: "Complete",
        badgeColor: "#6c757d",
        gifUrl: "/assets/lily-neutral.gif",
        message: "Conversation path completed."
      },
      isTerminal: true,
      nestedQuestions: []
    };
  }

  const node = JSON.parse(JSON.stringify(rawNode));

  // Dynamic Category Breakdown Injection
  if (intent === "SHOW_BREAKDOWN") {
    if (!summary.categoryBreakdown || summary.categoryBreakdown.length === 0) {
      node.response.message = "📊 You don't have any expenses recorded yet!";
    } else {
      const breakdownText = summary.categoryBreakdown
        .map(item => `• ${item.category}: ₱${item.amount.toLocaleString()}`)
        .join("\n");

      node.response.message = `📊 Here is your actual spending breakdown by category:\n\n${breakdownText}\n\nTotal Spent: ₱${summary.totalExpense.toLocaleString()}`;
    }
  }

  return {
    financialSummary: summary,
    evaluatedTier: dominantTier,
    fuzzyMemberships: memberships,
    ...node
  };
}

module.exports = {
  getFinancialSummary,
  processLilyChat
};