/* ==========================================================================
   LILY — FINANCIAL HEALTH TRACKER
   Dashboard UI logic (Connected to Node.js Backend)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  renderHealthCard();
  renderMonthlyChart();
  renderSpendingBreakdown();
  renderTransactions();
  initTargetRateEditor();
  initLilyWidget();
  initTransactionModal();
});

/* --------------------------------------------------------------------
   1. Health Score, Summary Metrics & Lily Mood
   -------------------------------------------------------------------- */
async function renderHealthCard() {
  try {
    const response = await fetch("/api/financial/summary");
    if (!response.ok) throw new Error("Failed to fetch financial summary");

    const summary = await response.json();

    // DOM Elements
    const fill = document.getElementById('healthBarFill');
    const scoreValue = document.getElementById('scoreValue');
    const statusEl = document.getElementById('scoreStatus');
    const moodEl = document.getElementById('lilyMood');
    const lilyMessage = document.getElementById('lilyMessage');
    const lilyAvatar = document.getElementById('lilyAvatar');

    const summaryIncome = document.getElementById('summaryIncome');
    const summaryExpenses = document.getElementById('summaryExpenses');
    const summarySavings = document.getElementById('summarySavings');
    const summarySavingsRate = document.getElementById('summarySavingsRate');

    // Extract Expense Value (Handles both totalExpenses and totalExpense key names)
    const totalExp = summary.totalExpenses ?? summary.totalExpense ?? 0;

    // Update Summary Cards
    if (summaryIncome) summaryIncome.textContent = `₱${Number(summary.totalIncome || 0).toLocaleString()}`;
    if (summaryExpenses) summaryExpenses.textContent = `₱${Number(totalExp).toLocaleString()}`;
    if (summarySavings) summarySavings.textContent = `₱${Number(summary.balance || 0).toLocaleString()}`;
    if (summarySavingsRate) summarySavingsRate.textContent = `${summary.savingsPercentage || 0}%`;

    // Calculate/Extract Health Score safely
    let score = summary.healthScore;
    if (score === undefined || score === null) {
      const inc = Number(summary.totalIncome || 0);
      const exp = Number(totalExp);
      
      if (inc > 0) {
        const ratio = (exp / inc);
        score = Math.max(0, Math.min(100, Math.round((1 - ratio) * 100)));
      } else {
        score = 100;
      }
    }

    // Force score to render explicitly as text
    if (scoreValue) {
      scoreValue.textContent = String(score);
      scoreValue.className = `score-value ${score >= 70 ? 'status-good' : score >= 40 ? 'status-warn' : 'status-bad'}`;
    }

    if (statusEl) {
      statusEl.textContent = summary.lily?.status || "Good";
      statusEl.classList.remove('status-good', 'status-warn', 'status-bad');
      const statusClass = score >= 70 ? 'status-good' : score >= 40 ? 'status-warn' : 'status-bad';
      statusEl.classList.add(statusClass);
    }

    // Update Lily's Mood & Speech Bubble Message
    if (summary.lily) {
      if (moodEl) moodEl.innerHTML = `Lily status: <strong>${summary.lily.status}</strong> ${summary.lily.emoji || ''}`;
      if (lilyMessage) lilyMessage.textContent = `"${summary.lily.message}"`;
      
      // 💡 UPDATED: Direct mapping to .gif assets with fallback URL from API
      if (lilyAvatar) {
        if (summary.lily.gifUrl) {
          lilyAvatar.src = summary.lily.gifUrl;
        } else {
          const emotionMap = {
            angry: '/assets/angry.gif',
            sad: '/assets/sad.gif',
            happy: '/assets/happy.gif',
            very_happy: '/assets/happy.gif',
            neutral: '/assets/neutral.gif'
          };
          lilyAvatar.src = emotionMap[summary.lily.emotion] || '/assets/neutral.gif';
        }
      }
    }

    // Animate Health Bar Fill
    if (fill) {
      requestAnimationFrame(() => {
        fill.style.width = `${Math.min(100, Math.max(0, score))}%`;
      });
    }

  } catch (error) {
    console.error("Error updating dashboard health card:", error);
  }
}

/* --------------------------------------------------------------------
   2. Income vs Expenses Bar Chart (Dynamic from Transactions)
   -------------------------------------------------------------------- */
async function renderMonthlyChart() {
  const chartEl = document.getElementById('barChart');
  if (!chartEl) return;

  try {
    const response = await fetch("/api/transactions");
    if (!response.ok) throw new Error("Failed to fetch transactions for chart");

    const transactions = await response.json();
    if (!transactions.length) {
      chartEl.innerHTML = `<p style="padding: 1rem; color: #888;">No transactions logged yet.</p>`;
      return;
    }

    // Group income and expenses by Month
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const grouped = {};

    transactions.forEach(tx => {
      const txDate = new Date(tx.transaction_date || tx.date || Date.now());
      const monthLabel = monthNames[txDate.getMonth()];

      if (!grouped[monthLabel]) {
        grouped[monthLabel] = { income: 0, expense: 0 };
      }

      const amt = Number(tx.amount) || 0;
      if (tx.type === "income") {
        grouped[monthLabel].income += amt;
      } else {
        grouped[monthLabel].expense += amt;
      }
    });

    const monthlyData = Object.keys(grouped).map(month => ({
      month,
      income: grouped[month].income,
      expense: grouped[month].expense
    }));

    const maxValue = Math.max(...monthlyData.flatMap(m => [m.income, m.expense]), 1);

    chartEl.innerHTML = monthlyData.map(m => {
      const incomeHeight = Math.round((m.income / maxValue) * 100);
      const expenseHeight = Math.round((m.expense / maxValue) * 100);
      return `
        <div class="bar-chart__group">
          <div class="bar-chart__bars">
            <div class="bar-chart__bar bar-chart__bar--income" style="height:${incomeHeight}%" title="Income: ₱${m.income.toLocaleString()}">
              <span class="bar-chart__value">₱${m.income.toLocaleString()}</span>
            </div>
            <div class="bar-chart__bar bar-chart__bar--expense" style="height:${expenseHeight}%" title="Expenses: ₱${m.expense.toLocaleString()}">
              <span class="bar-chart__value">₱${m.expense.toLocaleString()}</span>
            </div>
          </div>
          <span class="bar-chart__label">${m.month}</span>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error("Error rendering monthly chart:", error);
  }
}

/* --------------------------------------------------------------------
   3. Spending Breakdown (Dynamic from Expense Transactions)
   -------------------------------------------------------------------- */
async function renderSpendingBreakdown() {
  const listEl = document.getElementById('breakdownList');
  if (!listEl) return;

  const colorPalette = {
    Food: 'var(--coral-500)',
    Transportation: 'var(--gold-500)',
    Bills: 'var(--danger)',
    Shopping: 'var(--mint-500)',
    Other: 'var(--ink-500)'
  };

  try {
    const response = await fetch("/api/transactions");
    if (!response.ok) throw new Error("Failed to fetch transactions for breakdown");

    const transactions = await response.json();
    const expenses = transactions.filter(tx => tx.type === "expense");

    if (!expenses.length) {
      listEl.innerHTML = `<p style="padding: 1rem; color: #888;">No expense records found.</p>`;
      return;
    }

    // Group expenses by category
    const categoryTotals = {};
    expenses.forEach(tx => {
      const cat = tx.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(tx.amount || 0);
    });

    const totalExpense = Object.values(categoryTotals).reduce((sum, amt) => sum + amt, 0);

    listEl.innerHTML = Object.entries(categoryTotals).map(([name, amount]) => {
      const pct = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
      const color = colorPalette[name] || 'var(--coral-500)';

      return `
        <div class="breakdown-row">
          <div class="breakdown-row__top">
            <span>${name}</span>
            <span class="breakdown-row__amount">₱${amount.toLocaleString()}</span>
          </div>
          <div class="breakdown-track">
            <div class="breakdown-fill" style="width:${pct}%; background:${color};"></div>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error("Error rendering spending breakdown:", error);
  }
}

/* --------------------------------------------------------------------
   4. Transactions Table (API Fetch + Delete)
   -------------------------------------------------------------------- */
async function renderTransactions() {
  try {
    const response = await fetch("/api/transactions");
    if (!response.ok) throw new Error("Failed to fetch transactions");

    const transactions = await response.json();
    const tbody = document.getElementById("txTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    transactions.forEach(tx => {
      const isIncome = tx.type === "income";
      const amountText = isIncome
        ? `+₱${Number(tx.amount).toLocaleString()}`
        : `-₱${Number(tx.amount).toLocaleString()}`;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${new Date(tx.transaction_date || tx.date || Date.now()).toLocaleDateString()}</td>
        <td>${tx.category || "General"}</td>
        <td>${tx.description || "N/A"}</td>
        <td>
          <span class="tag ${isIncome ? "tag--income" : "tag--expense"}">
            ${tx.type}
          </span>
        </td>
        <td class="align-right ${isIncome ? "amount--income" : "amount--expense"}">
          ${amountText}
        </td>
        <td class="align-right">
          <button class="tx-delete-btn icon-btn" data-id="${tx.id}" title="Delete">🗑️</button>
        </td>
      `;

      // Attach Delete Handler
      const deleteBtn = row.querySelector(".tx-delete-btn");
      deleteBtn.addEventListener("click", () => deleteTransaction(tx.id));

      tbody.appendChild(row);
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
  }
}

async function deleteTransaction(id) {
  if (!confirm("Are you sure you want to delete this transaction?")) return;

  try {
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (res.ok) {
      refreshAllViews();
    }
  } catch (err) {
    console.error("Failed to delete transaction:", err);
  }
}

// Helper to refresh all component views when data changes
function refreshAllViews() {
  renderTransactions();
  renderHealthCard();
  renderMonthlyChart();
  renderSpendingBreakdown();
}

/* --------------------------------------------------------------------
   5. Target Savings Rate Inline Editor (Connected to /api/settings)
   -------------------------------------------------------------------- */
async function initTargetRateEditor() {
  const valueEl = document.getElementById('targetRateValue');
  const inputEl = document.getElementById('targetRateInput');
  const editBtn = document.getElementById('editTargetBtn');

  if (!valueEl || !inputEl || !editBtn) return;

  // Fetch saved rate on load
  try {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const data = await res.json();
      valueEl.textContent = `${data.target_savings_rate}%`;
    }
  } catch (err) {
    console.error("Failed to fetch settings:", err);
  }

  const enterEditMode = () => {
    inputEl.value = parseInt(valueEl.textContent, 10) || 0;
    valueEl.hidden = true;
    inputEl.hidden = false;
    inputEl.focus();
    inputEl.select();
  };

  // Save edited rate to database
  const commitEdit = async () => {
    let next = parseInt(inputEl.value, 10);
    if (isNaN(next)) next = parseInt(valueEl.textContent, 10) || 0;
    next = Math.min(100, Math.max(0, next));

    valueEl.textContent = `${next}%`;
    valueEl.hidden = false;
    inputEl.hidden = true;

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_savings_rate: next })
      });

      if (res.ok) renderHealthCard();
    } catch (err) {
      console.error("Failed to update settings:", err);
    }
  };

  editBtn.addEventListener('click', enterEditMode);
  inputEl.addEventListener('blur', commitEdit);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') { inputEl.hidden = true; valueEl.hidden = false; }
  });
}

/* --------------------------------------------------------------------
   6. Lily Quick Widget Interaction
   -------------------------------------------------------------------- */
function initLilyWidget() {
  const toggleBtn = document.getElementById('lilyWidgetToggle');
  const widgetBody = document.getElementById('lilyWidgetBody');

  if (!toggleBtn || !widgetBody) return;

  toggleBtn.addEventListener('click', () => {
    const isHidden = widgetBody.hasAttribute('hidden');
    if (isHidden) {
      widgetBody.removeAttribute('hidden');
      toggleBtn.setAttribute('aria-expanded', 'true');
    } else {
      widgetBody.setAttribute('hidden', '');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  });
}

/* --------------------------------------------------------------------
   7. Add Income / Expense Modal (API POST Handler)
   -------------------------------------------------------------------- */
function initTransactionModal() {
  const overlay = document.getElementById('modalOverlay');
  const title = document.getElementById('modalTitle');
  const submitBtn = document.getElementById('submitModalBtn');
  const form = document.getElementById('txForm');

  if (!overlay || !form) return;

  const categorySelect = form.querySelector('select[name="category"]');
  const addIncomeBtn = document.getElementById('addIncomeBtn');
  const addExpenseBtn = document.getElementById('addExpenseBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');

  let currentMode = 'income';

  const openModal = (mode) => {
    currentMode = mode;
    const isIncome = mode === 'income';
    title.textContent = isIncome ? 'Add Income' : 'Add Expense';
    submitBtn.textContent = isIncome ? 'Add Income' : 'Add Expense';
    submitBtn.className = `btn ${isIncome ? 'btn--income' : 'btn--expense'}`;
    if (categorySelect) categorySelect.value = isIncome ? 'Income' : 'Food';
    overlay.removeAttribute('hidden');
  };

  const closeModal = () => {
    overlay.setAttribute('hidden', '');
    form.reset();
  };

  if (addIncomeBtn) addIncomeBtn.addEventListener('click', () => openModal('income'));
  if (addExpenseBtn) addExpenseBtn.addEventListener('click', () => openModal('expense'));
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.hasAttribute('hidden')) closeModal();
  });

  // Handle Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    
    // Extract date from form, fallback to today's date if empty
    const rawDate = formData.get("date") || formData.get("transaction_date");
    const formattedDate = rawDate ? new Date(rawDate).toISOString() : new Date().toISOString();

    const payload = {
      description: formData.get("description") || `${currentMode === 'income' ? 'Income' : 'Expense'} Transaction`,
      amount: parseFloat(formData.get("amount")),
      category: formData.get("category") || "Other",
      type: currentMode,
      transaction_date: formattedDate
    };

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        closeModal();
        refreshAllViews();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || errorData.message || "Failed to create transaction"}`);
      }
    } catch (err) {
      console.error("Error submitting transaction:", err);
    }
  });
}