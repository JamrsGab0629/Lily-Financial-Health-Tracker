// utils/metricsCalculator.js

/**
 * Calculates daily pace and burn rate acceleration comparing current month to last month.
 * @param {number} currentMonthExpense Total spent in the current month
 * @param {number} lastMonthExpense Total spent in the previous month
 * @param {number} [customDay] Optional override for current day (useful for testing)
 * @returns {Object} Calculated metrics including paces and acceleration percentage
 */
function calculateBurnRateAcceleration(currentMonthExpense, lastMonthExpense, customDay = null) {
  const now = new Date();
  const currentDay = customDay || now.getDate() || 1;
  
  // Average daily pace for previous month (standard 30 days)
  const lastMonthDailyPace = lastMonthExpense > 0 ? lastMonthExpense / 30 : 0;
  
  // Current daily pace up to today
  const currentDailyPace = currentMonthExpense > 0 ? currentMonthExpense / currentDay : 0;

  // Calculate acceleration %
  let accelerationPct = 0;
  if (lastMonthDailyPace > 0) {
    accelerationPct = Math.round(((currentDailyPace - lastMonthDailyPace) / lastMonthDailyPace) * 100);
  } else if (currentDailyPace > 0) {
    accelerationPct = 100; // Default spike if last month had 0 expenses
  }

  // Determine directional status for UI
  let status = "NEUTRAL";
  if (accelerationPct > 5) status = "ACCELERATING"; // Spending faster 📈
  else if (accelerationPct < -5) status = "DECELERATING"; // Spending slower 📉

  return {
    currentDailyPace: parseFloat(currentDailyPace.toFixed(2)),
    lastMonthDailyPace: parseFloat(lastMonthDailyPace.toFixed(2)),
    accelerationPct, // Crisp input value (e.g. +34 or -10)
    status,
    currentDay
  };
}

module.exports = {
  calculateBurnRateAcceleration
};