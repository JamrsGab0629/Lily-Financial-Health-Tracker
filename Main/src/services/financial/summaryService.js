// src/services/financial/summaryService.js
const transactionModel = require("../../models/transactionModel");
const { calculateBurnRateAcceleration } = require("../../utils/metricsCalculator");

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

function classifyNeedsAndWants(categoryRows = []) {
  let computedNeeds = 0;
  let computedWants = 0;

  categoryRows.forEach((row) => {
    const catName = (row.category || "Uncategorized").trim().toLowerCase();
    const amt = parseFloat(row.amount) || parseFloat(row.total_amount) || 0;

    if (WANT_CATEGORIES.some(want => catName.includes(want))) {
      computedWants += amt;
    } else {
      computedNeeds += amt;
    }
  });

  return { computedNeeds, computedWants };
}

async function getFinancialSummary() {
  const [totalsRes, categoryRows, targetRate, comparisonRes] = await Promise.all([
    transactionModel.getTotalsFromDB(),
    transactionModel.getCategoryBreakdownFromDB(),
    transactionModel.getTargetSavingsRate(),
    transactionModel.getMonthlyComparisonFromDB().catch(() => ({ current_month_expense: 0, last_month_expense: 0 }))
  ]);

  // Defensive parsing to handle objects, arrays, or pg result wrappers safely
  const totals = Array.isArray(totalsRes) ? totalsRes[0] : (totalsRes?.rows ? totalsRes.rows[0] : totalsRes) || {};
  const comparison = Array.isArray(comparisonRes) ? comparisonRes[0] : (comparisonRes?.rows ? comparisonRes.rows[0] : comparisonRes) || {};

  const totalIncome = parseFloat(totals.total_income || totals.income || 0);
  const totalExpense = parseFloat(totals.total_expense || totals.expense || 0);
  const lastMonthExpense = parseFloat(comparison.last_month_expense || 0);
  
  const categoryBreakdown = (categoryRows?.rows || categoryRows || []).map(row => ({
    category: row.category || "Uncategorized",
    amount: parseFloat(row.total_amount || row.amount) || 0
  }));

  const { computedNeeds, computedWants } = classifyNeedsAndWants(categoryBreakdown);

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
    totalNeedsAmount: computedNeeds,
    totalWantsAmount: computedWants,
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

module.exports = {
  WANT_CATEGORIES,
  classifyNeedsAndWants,
  getFinancialSummary
};