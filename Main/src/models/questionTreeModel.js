// src/models/questionTreeModel.js

export const QUESTION_TREE = {
  "CHECK_HEALTH": {
    veryHigh: {
      alertTier: "Critical",
      badgeColor: "darkred",
      gifUrl: "",
      message: "🚨 CRITICAL STATUS! You are near or over your total budget limit!",
      isTerminal: false,
      nestedQuestions: [
        { label: "Execute emergency spending freeze 🔒", intent: "FREEZE_BUDGET" },
        { label: "Request recovery budget plan 🆘", intent: "RECOVERY_PLAN" }
      ]
    },
    veryLow: {
      alertTier: "Optimal",
      badgeColor: "green",
      gifUrl: "/assets/lily-ecstatic.gif",
      message: "🎉 Excellent job! You have spent very little of your allocated budget.",
      isTerminal: false,
      nestedQuestions: [
        { label: "Can I afford a reward? 🎮", intent: "REWARD_CHECK" },
        { label: "Move funds to Emergency Savings 🏦", intent: "TRANSFER_SAVINGS" }
      ]
    }
    // ... add low, moderate, high here!
  },

  "FREEZE_BUDGET": {
    default: {
      alertTier: "Action Completed",
      badgeColor: "orange",
      gifUrl: "/assets/lily-neutral.gif",
      message: "🔒 Emergency freeze activated! Non-essential category allowances locked to ₱0.",
      isTerminal: true, // 👈 TERMINAL / LEAF NODE
      nestedQuestions: []
    }
  }
};