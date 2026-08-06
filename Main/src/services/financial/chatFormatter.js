/**
 * Visual reaction headers based on Mamdani tier
 */
function getFuzzyReactionUI(tier) {
  const upper = (tier || '').toUpperCase();
  switch (upper) {
    case "CRITICAL":
      return {
        reaction: "😱 OH NO!",
        headline: "🚨 SEVERE FINANCIAL RISK!",
        banner: "Emergency action needed to protect your budget!"
      };
    case "CAUTION":
    case "WARNING":
      return {
        reaction: "⚠️ HEADS UP!",
        headline: "⚠️ BUDGET IN CAUTION ZONE",
        banner: "Your budget is slipping out of balance. Let's keep a close eye on this!"
      };
    case "OPTIMAL":
    case "GOOD":
      return {
        reaction: "🎉 AWESOME!",
        headline: "🎯 PERFECT BALANCE!",
        banner: "You are completely crushing your financial goals!"
      };
    default:
      return {
        reaction: "📊 AUDIT",
        headline: "FINANCIAL STATUS AUDIT",
        banner: "Analyzing your health metrics..."
      };
  }
}

/**
 * Map alert tiers directly to public assets
 */
function getLilyGif(status) {
  const upper = (status || '').toUpperCase();
  switch (upper) {
    case 'CRITICAL':
      return '/assets/angry.gif';
    case 'WARNING':
      return '/assets/sad.gif';
    case 'MODERATE':
    case 'NEUTRAL':
    case 'CAUTION':
      return '/assets/neutral.gif';
    case 'OPTIMAL':
    case 'GOOD':
    default:
      return '/assets/happy.gif';
  }
}

module.exports = {
  getFuzzyReactionUI,
  getLilyGif
};