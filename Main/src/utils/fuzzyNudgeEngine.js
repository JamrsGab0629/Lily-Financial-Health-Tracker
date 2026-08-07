function generateFuzzyNudge(totalIncome, totalExpenses, topCategory = "General") {
  if (!totalIncome || totalIncome <= 0) {
    return {
      tier: "INFO",
      message: "Log your income to receive real-time spending velocity nudges!",
      reductionNeeded: 0,
      progressPercent: 100
    };
  }

  // 1. Normalize topCategory to safely handle strings, objects, or empty values
  let categoryName = "General";
  if (typeof topCategory === "string") {
    categoryName = topCategory.trim() || "General";
  } else if (topCategory && typeof topCategory === "object") {
    categoryName = topCategory.category || topCategory.name || "General";
  }

  // 2. Calculate Crisp Inputs
  const expenseRatio = totalExpenses / totalIncome;
  
  const today = new Date();
  const currentDay = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const monthProgress = currentDay / daysInMonth; // e.g., Day 10 / 30 = 0.33

  // 3. Define Velocity Safe Limit
  // Ideal pace: Expense Ratio should not significantly exceed Month Progress
  // We allow a healthy 15% buffer (e.g. at Day 10/33%, max safe spend is 48%)
  const maxSafeRatio = Math.min(1.0, monthProgress + 0.15);
  const safeExpenseCap = totalIncome * maxSafeRatio;
  const reductionNeeded = totalExpenses - safeExpenseCap;

  // 4. Format Currency
  const formatPHP = (val) => new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0
  }).format(val);

  // 5. Generate Dynamic Nudge Feedback
  if (reductionNeeded <= 0) {
    return {
      tier: "OPTIMAL",
      badgeText: "STABLE PACE",
      message: `Great pacing! On **Day ${currentDay} of ${daysInMonth}**, your spending ratio (${Math.round(expenseRatio * 100)}%) matches your timeline. Keep it up!`,
      reductionNeeded: 0,
      progressPercent: 100
    };
  } else if (expenseRatio > monthProgress + 0.35) {
    return {
      tier: "CRITICAL",
      badgeText: "HIGH VELOCITY",
      message: `Warning! You've used **${Math.round(expenseRatio * 100)}%** of your budget by **Day ${currentDay}**. To stabilize your pace, cut **${formatPHP(reductionNeeded)}** (focusing on *${categoryName}*).`,
      reductionNeeded: Math.round(reductionNeeded),
      progressPercent: Math.max(15, Math.min(100, (safeExpenseCap / totalExpenses) * 100))
    };
  } else {
    return {
      tier: "MODERATE",
      badgeText: "MODERATE PACE",
      message: `Your spending velocity is slightly ahead for **Day ${currentDay}**. Trimming **${formatPHP(reductionNeeded)}** in *${categoryName}* will return you to the optimal track.`,
      reductionNeeded: Math.round(reductionNeeded),
      progressPercent: Math.max(25, Math.min(100, (safeExpenseCap / totalExpenses) * 100))
    };
  }
}

module.exports = { generateFuzzyNudge };