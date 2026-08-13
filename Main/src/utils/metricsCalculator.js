// utils/metricsCalculator.js

/**
 * 
 * @param {number} currentMonthExpense 
 * @param {number} lastMonthExpense 
 * @param {number} [customDay]
 * @returns {Object}
 */

// utils/metricsCalculator.js

function calculateBurnRateAcceleration(currentMonthExpense, lastMonthExpense, customDay = null, totalIncome = 0) {
  const now = new Date();
  const currentDay = customDay || now.getDate() || 1;
  
  const currentDailyPace = currentMonthExpense > 0 ? currentMonthExpense / currentDay : 0;

  let accelerationPct = 0;
  
  if (lastMonthExpense > 0) {
    const lastMonthDailyPace = lastMonthExpense / 30;
    accelerationPct = Math.round(((currentDailyPace - lastMonthDailyPace) / lastMonthDailyPace) * 100);
  } else {
    // Explicitly force 100% growth when starting fresh from ₱0
    accelerationPct = currentMonthExpense > 0 ? 100 : 0;
  }

  let status = "Normal";

  // 🔥 SMART PROJECTION LOGIC:
  const projectedMonthlySpend = currentDailyPace * 30;
  const effectiveIncome = totalIncome > 0 ? totalIncome : 36000;

  if (lastMonthExpense === 0) {
    // If projected spend exceeds income, OR you've already spent >50% of income by mid-month
    if (projectedMonthlySpend > effectiveIncome || (currentDay <= 15 && currentMonthExpense > effectiveIncome * 0.5)) {
      status = "Accelerating";
    } else {
      status = "Normal";
    }
  } else {
    // Standard multi-month rules
    if (accelerationPct > 50 || projectedMonthlySpend > effectiveIncome) {
      status = "Accelerating"; 
    } else if (accelerationPct < -5) {
      status = "Decelerating"; 
    } else {
      status = "Normal";
    }
  }

  return {
    currentDailyPace: parseFloat(currentDailyPace.toFixed(2)),
    lastMonthDailyPace: lastMonthExpense > 0 ? parseFloat((lastMonthExpense / 30).toFixed(2)) : 0,
    accelerationPct,
    status,
    currentDay
  };
}

module.exports = {
  calculateBurnRateAcceleration
};