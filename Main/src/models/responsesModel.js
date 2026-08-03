// src/models/responsesModel.js

const RESPONSES = {
  // --- LEVEL 1: FUZZY TIER ENTRY RESPONSES ---
  OPTIMAL: {
    alertTier: "Optimal",
    badgeColor: "#28a745",
    gifUrl: "/assets/lily-ecstatic.gif",
    message: "🎉 Excellent job! You've barely touched your budget limit."
  },
  STABLE: {
    alertTier: "Stable",
    badgeColor: "#5cdb5c",
    gifUrl: "/assets/lily-pleased.gif",
    message: "😊 Your financial health is steady. You are well within safe boundaries."
  },
  CAUTION: {
    alertTier: "Caution",
    badgeColor: "#ffc107",
    gifUrl: "/assets/lily-neutral.gif",
    message: "⚠️ You're hovering right around the half-way budget threshold."
  },
  WARNING: {
    alertTier: "Warning",
    badgeColor: "#fd7e14",
    gifUrl: "/assets/lily-annoyed.gif",
    message: "⚡ Warning! You have consumed a significant portion of your budget."
  },
  CRITICAL: {
    alertTier: "Critical",
    badgeColor: "#dc3545",
    gifUrl: "/assets/lily-furious.gif",
    message: "🚨 CRITICAL STATUS! Spending ratio is near or exceeding 100%!"
  },

  // --- LEVEL 2 & 3: ACTION / LEAF NODE RESPONSES ---
  REWARD_APPROVED: {
    alertTier: "Action Complete",
    badgeColor: "#28a745",
    gifUrl: "/assets/lily-ecstatic.gif",
    message: "🎮 Reward approved! You have enough surplus budget to treat yourself."
  },
  SAVINGS_TRANSFERRED: {
    alertTier: "Action Complete",
    badgeColor: "#28a745",
    gifUrl: "/assets/lily-ecstatic.gif",
    message: "🏦 Surplus funds moved toward your High-Yield Savings Goal!"
  },
  BREAKDOWN_SHOWN: {
    alertTier: "Info Provided",
    badgeColor: "#5cdb5c",
    gifUrl: "/assets/lily-pleased.gif",
    message: "📊 Here is your spending breakdown: Most of your expenses were categorized under daily needs."
  },
  GOAL_UPDATED: {
    alertTier: "Action Complete",
    badgeColor: "#5cdb5c",
    gifUrl: "/assets/lily-pleased.gif",
    message: "🎯 Savings goal updated! Keep up this steady spending pace."
  },
  CATEGORIES_AUDITED: {
    alertTier: "Info Provided",
    badgeColor: "#ffc107",
    gifUrl: "/assets/lily-neutral.gif",
    message: "🧾 Category Audit: Food & Dining and Shopping make up your highest spending categories."
  },
  ALLOWANCE_CALCULATED: {
    alertTier: "Info Provided",
    badgeColor: "#ffc107",
    gifUrl: "/assets/lily-neutral.gif",
    message: "📅 Safe Daily Allowance: Keep daily spending below ₱350 to remain inside target boundaries."
  },
  CUTS_SUGGESTED: {
    alertTier: "Advice Given",
    badgeColor: "#fd7e14",
    gifUrl: "/assets/lily-annoyed.gif",
    message: "✂️ Recommendation: Pause subscription renewals and non-essential shopping for 14 days."
  },
  TRANSACTIONS_AUDITED: {
    alertTier: "Info Provided",
    badgeColor: "#fd7e14",
    gifUrl: "/assets/lily-annoyed.gif",
    message: "💸 Top Transactions Flagged: High expenses detected in recent purchases."
  },
  FREEZE_EXECUTED: {
    alertTier: "Action Executed",
    badgeColor: "#dc3545",
    gifUrl: "/assets/lily-furious.gif",
    message: "🔒 Emergency freeze applied! Non-essential category allowances locked to ₱0."
  },
  RECOVERY_ACTIVE: {
    alertTier: "Plan Active",
    badgeColor: "#dc3545",
    gifUrl: "/assets/lily-furious.gif",
    message: "🆘 Budget recovery mode activated. Only essential food and bill items are permitted."
  }
};

module.exports = { RESPONSES };