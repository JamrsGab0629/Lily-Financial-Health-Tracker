// utils/metricsCalculator.js

/**
 * 
 * @param {number} currentMonthExpense 
 * @param {number} lastMonthExpense 
 * @param {number} [customDay]
 * @returns {Object}
 */
function calculateBurnRateAcceleration(currentMonthExpense, lastMonthExpense, customDay = null) {
  const now = new Date();
  const currentDay = customDay || now.getDate() || 1;
  
  
  const lastMonthDailyPace = lastMonthExpense > 0 ? lastMonthExpense / 30 : 0;
  
  
  const currentDailyPace = currentMonthExpense > 0 ? currentMonthExpense / currentDay : 0;

  
  let accelerationPct = 0;
  if (lastMonthDailyPace > 0) {
    accelerationPct = Math.round(((currentDailyPace - lastMonthDailyPace) / lastMonthDailyPace) * 100);
  } else if (currentDailyPace > 0) {
    accelerationPct = 100;
  }

  
  let status = "NEUTRAL";
  if (accelerationPct > 5) status = "ACCELERATING"; 
  else if (accelerationPct < -5) status = "DECELERATING"; 

  return {
    currentDailyPace: parseFloat(currentDailyPace.toFixed(2)),
    lastMonthDailyPace: parseFloat(lastMonthDailyPace.toFixed(2)),
    accelerationPct,
    status,
    currentDay
  };
}

module.exports = {
  calculateBurnRateAcceleration
};