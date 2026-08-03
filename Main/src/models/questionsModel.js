// src/models/questionsModel.js

const QUESTIONS = {
  // --- Root Intent ---
  CHECK_HEALTH: { intent: "CHECK_HEALTH", label: "How is my financial health? 🏥" },

  // --- Optimal / VeryLow Tier Options ---
  REWARD_CHECK: { intent: "REWARD_CHECK", label: "Can I afford a reward? 🎮" },
  TRANSFER_SAVINGS: { intent: "TRANSFER_SAVINGS", label: "Move surplus to Emergency Savings 🏦" },

  // --- Stable / Low Tier Options ---
  SHOW_BREAKDOWN: { intent: "SHOW_BREAKDOWN", label: "View spending breakdown 📊" },
  SET_GOAL: { intent: "SET_GOAL", label: "Set a new savings goal 🎯" },

  // --- Caution / Moderate Tier Options ---
  SHOW_CATEGORIES: { intent: "SHOW_CATEGORIES", label: "Check top spending categories 🧾" },
  DAILY_ALLOWANCE: { intent: "DAILY_ALLOWANCE", label: "Calculate safe daily allowance 📅" },

  // --- Warning / High Tier Options ---
  CUT_EXPENSES: { intent: "CUT_EXPENSES", label: "How can I cut expenses fast? ✂️" },
  TOP_TRANSACTIONS: { intent: "TOP_TRANSACTIONS", label: "Show top 3 highest transactions 💸" },

  // --- Critical / VeryHigh Tier Options ---
  FREEZE_BUDGET: { intent: "FREEZE_BUDGET", label: "Execute emergency spending freeze 🔒" },
  RECOVERY_PLAN: { intent: "RECOVERY_PLAN", label: "Generate budget recovery plan 🆘" }
};

module.exports = { QUESTIONS };