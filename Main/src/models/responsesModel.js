const RESPONSES = {
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
  FREEZE_EXECUTED: {
    alertTier: "Action Executed",
    badgeColor: "#dc3545",
    gifUrl: "/assets/lily-neutral.gif",
    message: "🔒 Emergency freeze applied! Non-essential category allowances locked to ₱0."
  },
  SAVINGS_TRANSFERRED: {
    alertTier: "Action Completed",
    badgeColor: "#28a745",
    gifUrl: "/assets/lily-ecstatic.gif",
    message: "🏦 Surplus funds moved toward your High-Yield Savings Goal!"
  }
};

module.exports = { RESPONSES };