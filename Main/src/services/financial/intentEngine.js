const { 
  getDominantFuzzyTier, 
  calculateHealthScore, 
  evaluateSavingsFuzzyRules 
} = require("../../utils/fuzzyEngine");
const { DECISION_TREE } = require("../../models/decisionTreeModel");
const { getQuestionsForMood, getNestedFuzzyQuestions } = require("../../models/questionsModel");

const { getFinancialSummary } = require("./summaryService");
const { getFuzzyReactionUI, getLilyGif } = require("./chatFormatter");

class IntentHandler {
  constructor(summary, dominantTier, memberships, healthScore, rawNode) {
    this.summary = summary;
    this.dominantTier = dominantTier;
    this.memberships = memberships;
    this.healthScore = healthScore;
    this.node = rawNode ? JSON.parse(JSON.stringify(rawNode)) : {
      response: {
        alertTier: "Stable",
        badgeColor: "#6c757d",
        gifUrl: "/assets/neutral.gif",
        message: "Processing your request..."
      },
      isTerminal: false,
      nestedQuestions: []
    };
    this.suggestedQuestions = getQuestionsForMood(dominantTier, memberships);
    this.dynamicProofOverride = null;
  }

  handleBreakdown() {
    if (!this.summary.categoryBreakdown || this.summary.categoryBreakdown.length === 0) {
      this.node.response.message = "📊 You don't have any expenses recorded yet!";
    } else {
      const sortedCategories = [...this.summary.categoryBreakdown].sort((a, b) => b.amount - a.amount);
      const topCategory = sortedCategories[0];

      const listText = sortedCategories
        .map(item => `• ${item.category}: ₱${item.amount.toLocaleString()}`)
        .join("\n");

      
      let emotionalToneMessage = "";
      const spendRatio = this.summary.expenseRatio;
      
      if (this.healthScore < 40) {
        emotionalToneMessage = `🙀 *Yikes!* Because your current Expense Ratio is a dangerous **${spendRatio.toFixed(1)}%**, this spending leak is actively pushing your budget into a **VERYHIGH** risk state! We need to freeze non-essential purchases immediately! 🛑`;
      } else if (this.healthScore < 70) {
        emotionalToneMessage = `🐱 *Hmm...* Your Expense Ratio is sitting at **${spendRatio.toFixed(1)}%**. Keeping an eye on this top category will help us pull your dominant state back into safety! 💡`;
      } else {
        emotionalToneMessage = `😺 *Looking great!* Even with this breakdown, your Expense Ratio is a healthy **${spendRatio.toFixed(1)}%**, keeping your financial state totally secure! ✨`;
      }

      this.node.response.message = `🔍 **Highest Expense Audit:**\nYour top spending area is **${topCategory.category}** at ₱${topCategory.amount.toLocaleString()}.\n\n📊 **Full Category Breakdown:**\n${listText}\n\n🧠 **Fuzzy Context:**\n${emotionalToneMessage}`;
    }
  }

  handleNeedsVsWants() {
    const needsAmount = this.summary.totalNeedsAmount || 0;
    const wantsAmount = this.summary.totalWantsAmount || 0;
    const totalSpent = this.summary.totalExpense || (needsAmount + wantsAmount);
    const combinedSpent = needsAmount + wantsAmount;

    const baselineSpent = combinedSpent > 0 ? combinedSpent : (totalSpent > 0 ? totalSpent : 1);

    const needsPct = Math.round((needsAmount / baselineSpent) * 100);
    const wantsPct = Math.round((wantsAmount / baselineSpent) * 100);

    const wantsRatio = baselineSpent > 0 ? wantsAmount / baselineSpent : 0;
    const normalizedExpenseRatio = this.summary.expenseRatio / 100;
    const savingsGapRatio = Math.max(0, (this.summary.targetSavingsRate - this.summary.savingsPercentage) / 100);
    const burnAcceleration = this.summary.burnRateMetrics.accelerationPct ? this.summary.burnRateMetrics.accelerationPct / 100 : 1.0;

    const fuzzyResult = evaluateSavingsFuzzyRules(
      normalizedExpenseRatio,
      savingsGapRatio,
      burnAcceleration,
      wantsRatio
    );

    const optimalUI = getFuzzyReactionUI(fuzzyResult.tier);

    if (fuzzyResult.tier === "CRITICAL" || this.summary.expenseRatio > 100) {
      const criticalUI = getFuzzyReactionUI("CRITICAL");
      
      let criticalAdvice = "";
      if (needsPct > wantsPct) {
        criticalAdvice = `Your essential overhead is too heavy for your current income stream. Look for ways to trim fixed costs! 📉`;
      } else {
        criticalAdvice = `Your discretionary spending on non-essentials is consuming your entire budget. Freeze discretionary purchases immediately! 💔`;
      }

      this.node.response.message = `${criticalUI.reaction} **${criticalUI.headline}**\n\n` +
        `🚨 **Severe Overspending Detected!** Your total expense ratio is **${this.summary.expenseRatio.toFixed(1)}%**!\n\n` +
        `• **Wants (Discretionary):** **${wantsPct}%** (₱${wantsAmount.toLocaleString()})\n` +
        `• **Needs (Essential):** **${needsPct}%** (₱${needsAmount.toLocaleString()})\n\n` +
        `${criticalAdvice}`;
        
      this.node.response.alertTier = "Critical";
      
    } else if (wantsPct >= 60) {
      // FIX: Explicitly fetch warning UI so it doesn't say "Perfect Balance" when wants are high
      const warningUI = getFuzzyReactionUI("WARNING");
      this.node.response.message = `${warningUI.reaction} **${warningUI.headline}**\n\n` +
        `You are allocating **${wantsPct}%** (₱${wantsAmount.toLocaleString()}) to non-essentials/Wants versus **${needsPct}%** (₱${needsAmount.toLocaleString()}) to Needs.\n\n` +
        `💡 **Lily's Tip:** Reining in non-essential purchases will quickly rebuild your savings cushion! 💸`;
      this.node.response.alertTier = "Warning";
    } else {
      this.node.response.message = `${optimalUI.reaction} **${optimalUI.headline}**\n\n` +
        `✅ **Great Priorities!** You are allocating **${needsPct}%** (₱${needsAmount.toLocaleString()}) to essential Needs versus **${wantsPct}%** (₱${wantsAmount.toLocaleString()}) to Wants.\n\n` +
        `Your spending balance and cushion look solid! 🌟`;
      this.node.response.alertTier = "Optimal";
    }

    let gapSet = savingsGapRatio <= 0 ? 'ONTRACK' : (savingsGapRatio >= 0.30 ? 'LARGEGAP' : 'MINORGAP');
    let burnSet = burnAcceleration >= 2.0 ? 'ACCELERATING' : (burnAcceleration > 1.0 ? 'ELEVATED' : 'NORMAL');

    const w = wantsRatio;
    const ess = w <= 0.3 ? 1 : Math.max(0, (0.45 - w) / 0.15);
    const bal = w >= 0.3 && w <= 0.5 ? (w - 0.3) / 0.2 : (w > 0.5 && w <= 0.7 ? (0.7 - w) / 0.2 : 0);
    const disc = w >= 0.7 ? 1 : Math.max(0, (w - 0.5) / 0.2);

    let dominantLabel = wantsRatio >= 0.70 ? 'DISCRETIONARYHEAVY' : (wantsRatio <= 0.30 ? 'ESSENTIALHEAVY' : 'BALANCED');
    let wantsSet = `${dominantLabel} (Essential: ${ess.toFixed(2)}, Balanced: ${bal.toFixed(2)}, Discretionary: ${disc.toFixed(2)})`;

    this.dynamicProofOverride = {
      crispInput: `Ratio = ${this.summary.expenseRatio.toFixed(2)}% | Buffer = ${this.summary.emergencyBufferMonths} mos | Accel = ${this.summary.burnRateMetrics.accelerationPct}% (₱${this.summary.burnRateMetrics.currentDailyPace.toFixed(2)}/day)`,
      dominantSet: `EXPENSE: ${this.dominantTier.toUpperCase()} | GAP: ${gapSet} | PACE: ${burnSet} | WANTS: ${wantsSet}`,
      activeRule: fuzzyResult.activeRule,
      healthScore: Math.round(this.healthScore),
      memberships: fuzzyResult.memberships || this.memberships
    };
  }

  handleSavingsGoal() {
    const netSavings = this.summary.netSavings || 0;
    const normalizedExpenseRatio = this.summary.expenseRatio / 100;
    const rawGapPct = this.summary.targetSavingsRate - this.summary.savingsPercentage;
    const savingsGapRatio = rawGapPct / 100;
    const effectiveGapRatio = Math.max(0, savingsGapRatio);
    const wantsRatio = this.summary.totalWantsAmount ? (this.summary.totalWantsAmount / (this.summary.totalExpense || 1)) : 0.5;

    const fuzzySavingsResult = evaluateSavingsFuzzyRules(
      normalizedExpenseRatio, 
      effectiveGapRatio, 
      (this.summary.burnRateMetrics.accelerationPct || 0) / 100, 
      wantsRatio
    );

    if (this.summary.savingsPercentage >= this.summary.targetSavingsRate) {
      const surplus = this.summary.savingsPercentage - this.summary.targetSavingsRate;
      const ui = getFuzzyReactionUI("OPTIMAL");

      if (surplus > 0) {
        this.node.response.message = `${ui.reaction} **${ui.headline}**\n\nYou are saving an incredible **${this.summary.savingsPercentage}%** of your income (₱${netSavings.toLocaleString()})—beating your **${this.summary.targetSavingsRate}%** target by **${surplus}%**! Keep up this amazing momentum! 🚀`;
      } else {
        this.node.response.message = `${ui.reaction} **${ui.headline}**\n\nYou hit your savings target exactly at **${this.summary.savingsPercentage}%** (₱${netSavings.toLocaleString()})! Fantastic discipline! 🎉`;
      }
      this.node.response.alertTier = "Optimal";

    } else if (fuzzySavingsResult.tier === "CRITICAL" || savingsGapRatio >= 0.30) {
      const ui = getFuzzyReactionUI("CRITICAL");
      this.node.response.message = `${ui.reaction} **${ui.headline}**\n\nYou are saving only **${this.summary.savingsPercentage}%** (₱${netSavings.toLocaleString()}) against your **${this.summary.targetSavingsRate}%** goal. You're falling short by **${rawGapPct}%**! Freeze non-essentials immediately to turn this around. 💔`;
      this.node.response.alertTier = "Critical";

    } else {
      const ui = getFuzzyReactionUI("CAUTION");
      this.node.response.message = `${ui.reaction} **${ui.headline}**\n\nYou are saving **${this.summary.savingsPercentage}%** of your income (₱${netSavings.toLocaleString()}), putting you **${rawGapPct}%** away from your target of **${this.summary.targetSavingsRate}%**. Trim a little non-essential spend to cross the goal line! 🌟`;
      this.node.response.alertTier = "Warning";
    }

    let gapSet = savingsGapRatio <= 0 ? 'ONTRACK' : (savingsGapRatio >= 0.30 ? 'LARGEGAP' : 'MINORGAP');
    let wantsSet = wantsRatio >= 0.70 ? 'DISCRETIONARYHEAVY' : (wantsRatio <= 0.30 ? 'ESSENTIALHEAVY' : 'BALANCED');
    let burnSet = (this.summary.burnRateMetrics.accelerationPct || 0) >= 100 ? 'ACCELERATING' : ((this.summary.burnRateMetrics.accelerationPct || 0) > 0 ? 'ELEVATED' : 'NORMAL');

    this.dynamicProofOverride = {
      crispInput: `Ratio = ${this.summary.expenseRatio.toFixed(2)}% | Gap = ${(savingsGapRatio * 100).toFixed(1)}% | Accel = ${this.summary.burnRateMetrics.accelerationPct}% | Wants = ${(wantsRatio * 100).toFixed(1)}%`,
      dominantSet: `EXPENSE: ${this.dominantTier.toUpperCase()} | GAP: ${gapSet} | PACE: ${burnSet} | WANTS: ${wantsSet}`,
      activeRule: this.summary.savingsPercentage >= this.summary.targetSavingsRate 
        ? "IF expense_ratio IS low AND savings_gap IS onTrack THEN status IS Optimal"
        : fuzzySavingsResult.activeRule,
      healthScore: Math.round(this.healthScore),
      memberships: fuzzySavingsResult.memberships || this.memberships
    };
  }

  handleFreezeBudget() {
    const normHigh = this.memberships.high ?? this.memberships.veryHigh ?? 0;
    const highMembership = (normHigh * 100).toFixed(0);
    
    this.node.response.message = `🚨 **Emergency Freeze Budget Activated!**\n\n🧠 **Fuzzy Reasoning:** Your spending shows a **${highMembership}% membership in the HIGH Risk Set** (Expense Ratio: ${this.summary.expenseRatio.toFixed(1)}%).\n\n📌 **Lily's Action Plan:** Limit spending exclusively to essential Needs for the next 7 days until your Expense Ratio drops back into the SAFE set!`;
    this.node.response.alertTier = "Critical";

    this.suggestedQuestions = getNestedFuzzyQuestions("FREEZE_BUDGET", this.memberships);
    this.node.isTerminal = false;
  }

  handleCutDiscretionary() {
    this.node.response.message = `✂️ **Discretionary Spending Cut Plan:**\n\nBased on your logged expenses, cutting non-essential purchases by 50% this week will help save money and lower your expense ratio!`;
    this.node.response.alertTier = "Warning";
    this.suggestedQuestions = [];
    this.node.isTerminal = true;
  }

  handleCheckRunway() {
    const dailyPace = this.summary.burnRateMetrics.currentDailyPace || 0;
    const runwayDays = dailyPace > 0 ? Math.floor(this.summary.balance / dailyPace) : "Unlimited";

    this.node.response.message = `⏳ **Financial Runway & Pace Check:**\n\n` +
      `• **Daily Pace:** ₱${dailyPace.toLocaleString()}/day\n` +
      `• **Emergency Runway:** **${this.summary.emergencyBufferMonths} months** (~${runwayDays} days)\n` +
      `• **Remaining Balance:** ₱${this.summary.balance.toLocaleString()}\n\n` +
      (this.summary.emergencyBufferMonths < 1 
        ? `⚠️ **Lily's Alert:** Your runway is under 1 month! Slow down your daily burn rate to avoid depleting your balance.`
        : `🛡️ **Lily's Insight:** Your runway is in a safe condition.`);
    
    this.node.response.alertTier = this.summary.emergencyBufferMonths < 1 ? "Critical" : "Optimal";
    this.suggestedQuestions = [];
    this.node.isTerminal = true;
  }

  handleTrimLeaks() {
    const normMed = this.memberships.medium ?? this.memberships.med ?? this.memberships.moderate ?? 0;
    const medMembership = (normMed * 100).toFixed(0);

    let categoryAdvice = "non-essential spending";
    if (this.summary.categoryBreakdown && this.summary.categoryBreakdown.length > 0) {
      const sorted = [...this.summary.categoryBreakdown].sort((a, b) => b.amount - a.amount);
      if (sorted[0]) {
        categoryAdvice = `your **${sorted[0].category}** category`;
      }
    }

    this.node.response.message = `✂️ **Spending Leak Analysis:**\n\n🧠 **Fuzzy Reasoning:** Your expense ratio sits at **${this.summary.expenseRatio.toFixed(1)}%**, placing you at **${medMembership}% membership in the MODERATE Set**.\n\n📌 **Lily's Advice:** Reducing expenses in ${categoryAdvice} by 10% will shift your dominant set from MODERATE to OPTIMAL!`;
    this.node.response.alertTier = "Stable";

    this.suggestedQuestions = getNestedFuzzyQuestions("TRIM_LEAKS", this.memberships);
    this.node.isTerminal = false;
  }

  handleCheckEmergencyFund() {
    if (this.summary.emergencyBufferMonths >= 3) {
      this.node.response.message = `🛡️ **Emergency Buffer Check:**\n\nYour current balance of **₱${this.summary.balance.toLocaleString()}** covers approximately **${this.summary.emergencyBufferMonths} months** of expenses! Your cushion is safe. 🌟`;
      this.node.response.alertTier = "Optimal";
    } else {
      this.node.response.message = `🛡️ **Emergency Buffer Check:**\n\nYour current balance of **₱${this.summary.balance.toLocaleString()}** covers **${this.summary.emergencyBufferMonths} months** of expenses. Try building this up to cover at least 3 months for full safety! ⚠️`;
      this.node.response.alertTier = "Caution";
    }

    this.suggestedQuestions = [];
    this.node.isTerminal = true;
  }

  handleCompareMonths() {
    const lastExpense = this.summary.lastMonthExpense;
    const currentExpense = this.summary.totalExpense;
    const accelStatus = this.summary.burnRateMetrics.status;
    const acceleration = this.summary.burnRateMetrics.accelerationPct || 0;
    const dailyPace = this.summary.burnRateMetrics.currentDailyPace || 0;
    const accelText = acceleration >= 0 ? `+${acceleration}% faster` : `${acceleration}% slower`;

    if (lastExpense === 0) {
      this.node.response.message = `📅 **Monthly Comparison:** You spent **₱${currentExpense.toLocaleString()}** this month at a pace of ₱${dailyPace}/day. (No expenses recorded for last month to calculate acceleration).`;
      this.node.response.alertTier = "Info";
    } else if (accelStatus === "ACCELERATING") {
      this.node.response.message = `📈 **Spending Acceleration Alert!**\n\n` +
        `• **Current Daily Pace:** ₱${dailyPace.toLocaleString()}/day\n` +
        `• **Last Month Daily Pace:** ₱${this.summary.burnRateMetrics.lastMonthDailyPace.toLocaleString()}/day\n` +
        `• **Pace Trend:** Spending **${accelText}** than last month!\n\n` +
        `⚠️ **Lily's Insight:** Even if your raw total spending looks manageable, your current velocity will exhaust your budget faster than usual!`;
      this.node.response.alertTier = "Warning";
    } else {
      this.node.response.message = `📉 **Controlled Spending Speed!**\n\n` +
        `• **Current Daily Pace:** ₱${dailyPace.toLocaleString()}/day\n` +
        `• **Last Month Daily Pace:** ₱${this.summary.burnRateMetrics.lastMonthDailyPace.toLocaleString()}/day\n` +
        `• **Pace Trend:** Spending **${accelText}** than last month.\n\n` +
        `🎉 **Lily's Insight:** Excellent pacing! You are keeping your daily burn rate well under control.`;
      this.node.response.alertTier = "Optimal";
    }
  }

  handleSurplusAdvice() {
    const normLow = this.memberships.low ?? 0;
    const lowMembership = (normLow * 100).toFixed(0);

    this.node.response.message = `💡 **Savings Surplus Strategy:**\n\n🧠 **Fuzzy Reasoning:** You have a strong **${lowMembership}% membership in the OPTIMAL/LOW Set** with a health score of ${Math.round(this.healthScore)}/100.\n\n📌 **Lily's Recommendation:** Allocate 70% of your remaining balance (₱${this.summary.balance.toLocaleString()}) to an Emergency Fund and 30% toward high-yield savings or investments!`;
    this.node.response.alertTier = "Optimal";

    this.suggestedQuestions = getNestedFuzzyQuestions("SURPLUS_ADVICE", this.memberships);
    this.node.isTerminal = false;
  }

  handleAllocateSurplus() {
    const totalSurplus = this.summary.balance;
    const emergencyFundPart = totalSurplus * 0.7;
    const investmentPart = totalSurplus * 0.3;

    this.node.response.message = `📈 **Optimal Allocation Split:**\n\nBased on your current balance of **₱${totalSurplus.toLocaleString()}**:\n• **₱${emergencyFundPart.toLocaleString()}** (70%) -> High-Yield Emergency Savings\n• **₱${investmentPart.toLocaleString()}** (30%) -> Growth / Investments\n\nThis keeps your risk low while maximizing growth! 🚀`;
    this.node.response.alertTier = "Optimal";
    this.suggestedQuestions = [];
    this.node.isTerminal = true;
  }

  handleRaiseSavingsTarget() {
    const currentTarget = this.summary.targetSavingsRate || 20;
    const recommendedTarget = currentTarget + 5;

    this.node.response.message = `🚀 **Target Elevation Advice:**\n\nYour current savings target is **${currentTarget}%**. Because your Expense Ratio sits comfortably at **${this.summary.expenseRatio.toFixed(1)}%**, Lily suggests raising your target rate to **${recommendedTarget}%**!`;
    this.node.response.alertTier = "Optimal";
    this.suggestedQuestions = [];
    this.node.isTerminal = true;
  }
}

async function processLilyChat(intent = "CHECK_HEALTH") {
  const summary = await getFinancialSummary();
  const spendRatio = summary.expenseRatio || 0;

  const { dominantTier, memberships } = getDominantFuzzyTier(spendRatio);
  const healthScore = calculateHealthScore ? calculateHealthScore(memberships) : Math.max(0, 100 - spendRatio);

  const rawNode = DECISION_TREE[intent]?.[dominantTier] || DECISION_TREE[intent]?.default;

  const handler = new IntentHandler(summary, dominantTier, memberships, healthScore, rawNode);

  const intentMap = {
    "SHOW_BREAKDOWN": () => handler.handleBreakdown(),
    "CHECK_HIGHEST_SPENDING": () => handler.handleBreakdown(),
    "SHOW_CATEGORIES": () => handler.handleBreakdown(),
    "CHECK_NEEDS_VS_WANTS": () => handler.handleNeedsVsWants(),
    "CHECK_SAVINGS_GOAL": () => handler.handleSavingsGoal(),
    "SET_GOAL": () => handler.handleSavingsGoal(),
    "FREEZE_BUDGET": () => handler.handleFreezeBudget(),
    "CUT_DISCRETIONARY": () => handler.handleCutDiscretionary(),
    "CHECK_RUNWAY": () => handler.handleCheckRunway(),
    "TRIM_LEAKS": () => handler.handleTrimLeaks(),
    "CHECK_EMERGENCY_FUND": () => handler.handleCheckEmergencyFund(),
    "COMPARE_MONTHS": () => handler.handleCompareMonths(),
    "CHECK_ACCELERATION": () => handler.handleCompareMonths(),
    "SURPLUS_ADVICE": () => handler.handleSurplusAdvice(),
    "ALLOCATE_SURPLUS": () => handler.handleAllocateSurplus(),
    "RAISE_SAVINGS_TARGET": () => handler.handleRaiseSavingsTarget()
  };

  if (intentMap[intent]) {
    intentMap[intent]();
  }

  if (handler.node.response) {
    handler.node.response.gifUrl = getLilyGif(handler.node.response.alertTier);
  }

 // 1. Evaluate the REAL global fuzzy state to prevent chat bubble tiers from overriding the math
  const realFuzzyState = evaluateSavingsFuzzyRules(
    spendRatio / 100,
    Math.max(0, (summary.targetSavingsRate - summary.savingsPercentage) / 100),
    (summary.burnRateMetrics.accelerationPct || 0) / 100,
    summary.totalWantsAmount ? (summary.totalWantsAmount / (summary.totalExpense || 1)) : 0.5
  );

  // 2. Build the fallback proof of reasoning using the real fuzzy math
  const proofOfReasoning = handler.dynamicProofOverride || {
    crispInput: `Ratio = ${spendRatio.toFixed(2)}% | Buffer = ${summary.emergencyBufferMonths} mos | Accel = ${summary.burnRateMetrics.accelerationPct}% (₱${summary.burnRateMetrics.currentDailyPace}/day)`,
    dominantSet: `EXPENSE: ${dominantTier.toUpperCase()} | PACE: ${summary.burnRateMetrics.status}`,
    activeRule: realFuzzyState.activeRule, 
    healthScore: Math.round(healthScore),
    memberships: {
      veryLow: parseFloat((memberships.veryLow ?? 0).toFixed(2)),
      low: parseFloat((memberships.low ?? 0).toFixed(2)),
      medium: parseFloat((memberships.medium ?? memberships.med ?? memberships.moderate ?? 0).toFixed(2)),
      high: parseFloat((memberships.high ?? memberships.veryHigh ?? 0).toFixed(2))
    }
  };

  return {
    financialSummary: summary,
    evaluatedTier: dominantTier, // Ensure your frontend badge pulls from realFuzzyState.tier if needed
    fuzzyMemberships: memberships,
    suggestedQuestions: handler.suggestedQuestions,
    proofOfReasoning: proofOfReasoning,
    ...handler.node
  };
}

module.exports = {
  processLilyChat
};