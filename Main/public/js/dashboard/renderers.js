// js/renderers.js

// Quick DOM helper
export function updateEl(id, content, isHTML = false) {
  const el = document.getElementById(id);
  if (el) isHTML ? el.innerHTML = content : el.textContent = content;
}

export function renderHealthCard(summary) {
  const formatCurrency = (val) => `₱${Number(val || 0).toLocaleString()}`;
  const totalExp = summary.totalExpenses ?? summary.totalExpense ?? 0;
  
  let score = summary.healthScore ?? (() => {
    const inc = Number(summary.totalIncome || 0);
    return inc > 0 ? Math.max(0, Math.min(100, Math.round((1 - (totalExp / inc)) * 100))) : 100;
  })();

  updateEl('summaryIncome', formatCurrency(summary.totalIncome));
  updateEl('summaryExpenses', formatCurrency(totalExp));
  updateEl('summarySavings', formatCurrency(summary.balance));
  updateEl('summarySavingsRate', `${summary.savingsPercentage || 0}%`);

  const scoreValue = document.getElementById('scoreValue');
  if (scoreValue) {
    scoreValue.textContent = String(score);
    scoreValue.className = `score-value ${score >= 70 ? 'status-good' : score >= 40 ? 'status-warn' : 'status-bad'}`;
  }

  const normalizedStatus = summary.lily?.status || (score >= 70 ? "Optimal" : score >= 40 ? "Moderate" : "Critical");
  const statusEl = document.getElementById('scoreStatus');
  if (statusEl) {
    statusEl.textContent = (normalizedStatus === "excellent" ? "Optimal" : normalizedStatus).toUpperCase();
    statusEl.className = `score-status ${score >= 70 ? 'status-good' : score >= 40 ? 'status-warn' : 'status-bad'}`;
  }

  const fill = document.getElementById('healthBarFill');
  if (fill) requestAnimationFrame(() => fill.style.width = `${Math.min(100, Math.max(0, score))}%`);

  if (summary.lily) renderLilyState(summary.lily, normalizedStatus);
  if (summary.nudge) renderNudgeUI(summary.nudge);
  
  // 📈 Re-enabled Spending Trend UI render call
  if (summary.burnRateMetrics || summary.lastMonthExpense !== undefined) {
    renderSpendingTrendUI(summary);
  }
}

function renderLilyState(lilyData, normalizedStatus) {
  const emotionMap = {
    excellent: 'happy', optimal: 'happy', good: 'happy', happy: 'happy',
    moderate: 'neutral', neutral: 'neutral', warning: 'neutral', caution: 'neutral',
    sad: 'sad', critical: 'angry', angry: 'angry'
  };
  const rawEmotion = (lilyData.emotion || normalizedStatus || 'neutral').toLowerCase().trim();
  
  updateEl('lilyMood', `Lily status: <strong>${normalizedStatus}</strong> ${lilyData.emoji || ''}`, true);
  updateEl('lilyMessage', `"${lilyData.message}"`);
  
  const avatar = document.getElementById('lilyAvatar');
  if (avatar) avatar.src = `/assets/${emotionMap[rawEmotion] || 'neutral'}.gif`;
}

function renderNudgeUI(nudgeData) {
  const badgeEl = document.getElementById("nudgeBadge");
  if (badgeEl) {
    badgeEl.textContent = nudgeData.badgeText || "STABLE PACE";
    badgeEl.className = `nudge-badge ${nudgeData.tier || 'MODERATE'}`;
  }

  updateEl("nudgeMessage", nudgeData.message || "", true);
  const fillEl = document.getElementById("nudgeBarFill");
  updateEl("nudgeAmountText", nudgeData.reductionNeeded <= 0 ? "On Track 🎉" : `Target Cut: ₱${nudgeData.reductionNeeded.toLocaleString()}`);

  if (fillEl) {
    fillEl.style.width = nudgeData.reductionNeeded <= 0 ? "100%" : `${nudgeData.progressPercent}%`;
    fillEl.style.background = nudgeData.reductionNeeded <= 0 ? "linear-gradient(90deg, #22c55e, #4ade80)" 
      : (nudgeData.tier === "CRITICAL" ? "linear-gradient(90deg, #f87171, #ef4444)" : "linear-gradient(90deg, #38bdf8, #818cf8)");
  }
}

function renderSpendingTrendUI(summary) {
  const metrics = summary.burnRateMetrics || {};
  const prevSpend = summary.lastMonthExpense || 0;
  const currSpend = summary.totalExpense ?? summary.totalExpenses ?? 0;
  
  const accel = metrics.accelerationPct || 0;
  const isAccelerating = metrics.status === "ACCELERATING";
  const sign = accel >= 0 ? "+" : "";

  updateEl("trendPrevMonth", `₱${Number(prevSpend).toLocaleString()}`);
  updateEl("trendCurrMonth", `₱${Number(currSpend).toLocaleString()}`);
  
  const arrowEl = document.getElementById("trendArrow");
  if (arrowEl) {
    arrowEl.textContent = isAccelerating ? "↑" : "↓";
    arrowEl.className = `trend-arrow ${isAccelerating ? "trend-arrow--up" : "trend-arrow--down"}`;
  }

  const indicatorEl = document.getElementById("trendIndicator");
  if (indicatorEl) {
    indicatorEl.className = `trend-indicator ${isAccelerating ? "trend-indicator--bad" : "trend-indicator--good"}`;
  }

  updateEl("trendIcon", isAccelerating ? "📈" : "📉");
  updateEl("trendBadge", isAccelerating ? "Accelerating" : "Decelerating");
  updateEl("trendAccelText", `Daily Burn Rate: ${sign}${accel}%`);
  updateEl("trendPaceText", `Current Pace: ₱${Number(metrics.currentDailyPace || 0).toLocaleString()}/day`);
}

export function renderMonthlyChart(transactions) {
  const chartEl = document.getElementById('barChart');
  if (!chartEl) return;
  if (!transactions.length) return chartEl.innerHTML = `<p style="padding: 1rem; color: #888;">No transactions.</p>`;

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const grouped = transactions.reduce((acc, tx) => {
    const month = monthNames[new Date(tx.transaction_date || tx.date || Date.now()).getMonth()];
    acc[month] = acc[month] || { income: 0, expense: 0 };
    acc[month][tx.type] += Number(tx.amount) || 0;
    return acc;
  }, {});

  const monthlyData = Object.entries(grouped).map(([month, data]) => ({ month, ...data }));
  const maxValue = Math.max(...monthlyData.flatMap(m => [m.income, m.expense]), 1);

  chartEl.innerHTML = monthlyData.map(m => `
    <div class="bar-chart__group">
      <div class="bar-chart__bars">
        <div class="bar-chart__bar bar-chart__bar--income" style="height:${Math.round((m.income / maxValue) * 100)}%"></div>
        <div class="bar-chart__bar bar-chart__bar--expense" style="height:${Math.round((m.expense / maxValue) * 100)}%"></div>
      </div>
      <span class="bar-chart__label">${m.month}</span>
    </div>
  `).join('');
}

export function renderSpendingBreakdown(transactions) {
  const listEl = document.getElementById('breakdownList');
  if (!listEl) return;
  
  const expenses = transactions.filter(tx => tx.type === "expense");
  if (!expenses.length) return listEl.innerHTML = `<p style="padding: 1rem; color: #888;">No expenses.</p>`;

  const categoryTotals = expenses.reduce((acc, tx) => {
    const cat = tx.category || 'Other';
    acc[cat] = (acc[cat] || 0) + Number(tx.amount || 0);
    return acc;
  }, {});

  const total = Object.values(categoryTotals).reduce((sum, amt) => sum + amt, 0);
  const colors = { Food: 'var(--coral-500)', Transportation: 'var(--gold-500)', Bills: 'var(--danger)', Shopping: 'var(--mint-500)', Other: 'var(--ink-500)' };

  listEl.innerHTML = Object.entries(categoryTotals).map(([name, amount]) => `
    <div class="breakdown-row">
      <div class="breakdown-row__top"><span>${name}</span><span>₱${amount.toLocaleString()}</span></div>
      <div class="breakdown-track"><div class="breakdown-fill" style="width:${Math.round((amount / total) * 100)}%; background:${colors[name] || colors.Other};"></div></div>
    </div>
  `).join('');
}

export function renderTransactionsTable(transactions, onDeleteClick) {
  const tbody = document.getElementById("txTableBody");
  if (!tbody) return;

  tbody.innerHTML = transactions.map(tx => {
    const isInc = tx.type === "income";
    return `
      <tr>
        <td>${new Date(tx.transaction_date || tx.date || Date.now()).toLocaleDateString()}</td>
        <td>${tx.category || "General"}</td>
        <td>${tx.description || "N/A"}</td>
        <td><span class="tag ${isInc ? "tag--income" : "tag--expense"}">${tx.type}</span></td>
        <td class="align-right ${isInc ? "amount--income" : "amount--expense"}">${isInc ? '+' : '-'}₱${Number(tx.amount).toLocaleString()}</td>
        <td class="align-right"><button class="tx-delete-btn icon-btn" data-id="${tx.id}">🗑️</button></td>
      </tr>
    `;
  }).join('');

  document.querySelectorAll(".tx-delete-btn").forEach(btn => {
    btn.addEventListener("click", () => onDeleteClick(btn.dataset.id));
  });
}