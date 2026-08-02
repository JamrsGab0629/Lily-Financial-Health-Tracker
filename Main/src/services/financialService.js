const transactionModel = require("../models/transactionModel");

// 1. Import Fuzzy Engine and Decision Tree models
const { getDominantFuzzyTier } = require("../utils/fuzzyEngine");
const { DECISION_TREE } = require("../models/decisionTreeModel");

/*const { getDominantFuzzyTier } = require("../utils/fuzzyEngine");
const { DECISION_TREE } = require("../models/decisionTreeModel");
=====================================
HELPER FUNCTIONS
=====================================
*/

function getTotalIncome(transactions) {
    return transactions
        .filter(transaction => transaction.type === "income")
        .reduce((total, transaction) => total + Number(transaction.amount), 0);
}

function getTotalExpenses(transactions) {
    return transactions
        .filter(transaction => transaction.type === "expense")
        .reduce((total, transaction) => total + Number(transaction.amount), 0);
}

function calculateBalance(income, expenses) {
    return income - expenses;
}

function calculateSavingsPercentage(balance, income) {
    if (income <= 0) return 0;
    return Number(((balance / income) * 100).toFixed(2));
}

function calculateExpenseRatio(expenses, income) {
    if (income <= 0) return 0;
    return Number(((expenses / income) * 100).toFixed(2));
}

function getIncomeTransactionCount(transactions) {
    return transactions.filter(t => t.type === "income").length;
}

function getExpenseTransactionCount(transactions) {
    return transactions.filter(t => t.type === "expense").length;
}

function getRecentTransactions(transactions, limit = 5) {
    return [...transactions]
        .sort(
            (a, b) =>
                new Date(b.transaction_date) -
                new Date(a.transaction_date)
        )
        .slice(0, limit);
}

/*
=====================================
FUZZY & FDT INTERACTION HANDLER
=====================================
*/

/**
 * Traverses the Fuzzy Decision Tree based on real transaction data & user intent
 * @param {string} intent - The target question/action intent (e.g., "CHECK_HEALTH", "FREEZE_BUDGET")
 */
async function processLilyChat(intent = "CHECK_HEALTH") {
    const summary = await getFinancialSummary();
    const spendRatio = (summary.expenseRatio || 0) / 100;

    // 🔧 Line 75: Call getDominantFuzzyTier instead of evaluateSpendingFuzzyState
    const { dominantTier, memberships } = getDominantFuzzyTier(spendRatio);

    const node = DECISION_TREE[intent]?.[dominantTier] || DECISION_TREE[intent]?.default;

    if (!node) {
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

    return {
        financialSummary: summary,
        evaluatedTier: dominantTier,
        fuzzyMemberships: memberships,
        ...node
    };
}
/*
=====================================
MAIN SUMMARY
=====================================
*/

async function getFinancialSummary() {
    const transactions = await transactionModel.getTransactions();

    const totalIncome = getTotalIncome(transactions);
    const totalExpenses = getTotalExpenses(transactions);
    const balance = calculateBalance(totalIncome, totalExpenses);

    const savingsPercentage = calculateSavingsPercentage(balance, totalIncome);
    const expenseRatio = calculateExpenseRatio(totalExpenses, totalIncome);

    return {
        totalIncome,
        totalExpenses,
        balance,
        savings: balance,
        savingsPercentage,
        expenseRatio,
        totalTransactions: transactions.length,
        incomeTransactions: getIncomeTransactionCount(transactions),
        expenseTransactions: getExpenseTransactionCount(transactions),
        recentTransactions: getRecentTransactions(transactions)
    };
}

/*
=====================================
EXPORTS
=====================================
*/

module.exports = {
    getFinancialSummary,
    processLilyChat, // 👈 New export for FDT Chat handling!
    getTotalIncome,
    getTotalExpenses,
    calculateBalance,
    calculateSavingsPercentage,
    calculateExpenseRatio,
    getIncomeTransactionCount,
    getExpenseTransactionCount,
    getRecentTransactions
};