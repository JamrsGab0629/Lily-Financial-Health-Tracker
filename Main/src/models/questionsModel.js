const QUESTIONS = {
  CHECK_HEALTH: { intent: "CHECK_HEALTH", label: "How is my financial health? 🏥" },
  REWARD_CHECK: { intent: "REWARD_CHECK", label: "Can I afford a reward? 🎮" },
  TRANSFER_SAVINGS: { intent: "TRANSFER_SAVINGS", label: "Move surplus to Emergency Savings 🏦" },
  SHOW_BREAKDOWN: { intent: "SHOW_BREAKDOWN", label: "View spending breakdown 📊" },
  SET_GOAL: { intent: "SET_GOAL", label: "Set a new savings goal 🎯" },
  SHOW_CATEGORIES: { intent: "SHOW_CATEGORIES", label: "Check top spending categories 🧾" },
  DAILY_ALLOWANCE: { intent: "DAILY_ALLOWANCE", label: "Calculate safe daily allowance 📅" },
  CUT_EXPENSES: { intent: "CUT_EXPENSES", label: "How can I cut expenses fast? ✂️" },
  TOP_TRANSACTIONS: { intent: "TOP_TRANSACTIONS", label: "Show top 3 highest transactions 💸" },
  FREEZE_BUDGET: { intent: "FREEZE_BUDGET", label: "Execute emergency spending freeze 🔒" },
  RECOVERY_PLAN: { intent: "RECOVERY_PLAN", label: "Generate budget recovery plan 🆘" }
};

module.exports = { QUESTIONS };