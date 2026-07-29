/* ==========================================================================
   LILY — FINANCIAL HEALTH TRACKER
   Dashboard UI logic (frontend only — no backend, no real calculations)
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
   1. Health score + Lily mood
   -------------------------------------------------------------------- */
function renderHealthCard() {
  const mockHealth = {
    score: 82,
    status: 'Good', // Good | Fair | Needs Attention
    mood: 'Happy',
    avatar: 'assets/lily/happy.png'
  };

  const fill = document.getElementById('healthBarFill');
  const scoreValue = document.getElementById('scoreValue');
  const statusEl = document.getElementById('scoreStatus');
  const moodEl = document.getElementById('lilyMood');

  scoreValue.textContent = mockHealth.score;
  statusEl.textContent = mockHealth.status;

  statusEl.classList.remove('status-good', 'status-warn', 'status-bad');
  const statusClass = mockHealth.status === 'Good'
    ? 'status-good'
    : mockHealth.status === 'Fair'
      ? 'status-warn'
      : 'status-bad';
  statusEl.classList.add(statusClass);

  moodEl.innerHTML = `Lily is feeling <strong>${mockHealth.mood}</strong> 😺`;

  // Animate the bar fill in after paint
  requestAnimationFrame(() => {
    fill.style.width = `${mockHealth.score}%`;
  });
}

/* --------------------------------------------------------------------
   2. Income vs Expenses — simple CSS bar chart, mock data
   -------------------------------------------------------------------- */
function renderMonthlyChart() {
  const monthlyData = [
    { month: 'Jun', income: 25000, expense: 19000 },
    { month: 'Jul', income: 25000, expense: 17000 }
  ];

  const maxValue = Math.max(...monthlyData.flatMap(m => [m.income, m.expense]));
  const chartEl = document.getElementById('barChart');

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
}

/* --------------------------------------------------------------------
   3. Spending breakdown — category bars, mock data
   -------------------------------------------------------------------- */
function renderSpendingBreakdown() {
  const categories = [
    { name: 'Food', amount: 5000, color: 'var(--blue-600)' },
    { name: 'Transportation', amount: 2000, color: 'var(--amber-500)' },
    { name: 'Bills', amount: 4000, color: 'var(--coral-500)' },
    { name: 'Shopping', amount: 3000, color: 'var(--green-500)' },
    { name: 'Other', amount: 3000, color: 'var(--navy-soft)' }
  ];

  const total = categories.reduce((sum, c) => sum + c.amount, 0);
  const listEl = document.getElementById('breakdownList');

  listEl.innerHTML = categories.map(c => {
    const pct = Math.round((c.amount / total) * 100);
    return `
      <div class="breakdown-row">
        <div class="breakdown-row__top">
          <span>${c.name}</span>
          <span class="breakdown-row__amount">₱${c.amount.toLocaleString()}</span>
        </div>
        <div class="breakdown-track">
          <div class="breakdown-fill" style="width:${pct}%; background:${c.color};"></div>
        </div>
      </div>
    `;
  }).join('');
}

/* --------------------------------------------------------------------
   4. Recent transactions — mock data, rendered as table rows
   -------------------------------------------------------------------- */
function renderTransactions() {
  const mockTransactions = [
    { date: 'Jul 29', category: 'Food', description: 'Lunch', type: 'Expense', amount: -300 },
    { date: 'Jul 28', category: 'Transportation', description: 'Bus fare', type: 'Expense', amount: -150 },
    { date: 'Jul 27', category: 'Income', description: 'Part-time work', type: 'Income', amount: 5000 },
    { date: 'Jul 25', category: 'Bills', description: 'Electricity bill', type: 'Expense', amount: -1200 },
    { date: 'Jul 22', category: 'Shopping', description: 'New notebook & pens', type: 'Expense', amount: -450 }
  ];

  const tbody = document.getElementById('txTableBody');

  tbody.innerHTML = mockTransactions.map(tx => {
    const isIncome = tx.type === 'Income';
    const amountText = isIncome
      ? `+₱${tx.amount.toLocaleString()}`
      : `-₱${Math.abs(tx.amount).toLocaleString()}`;

    return `
      <tr>
        <td>${tx.date}</td>
        <td>${tx.category}</td>
        <td>${tx.description}</td>
        <td><span class="tag ${isIncome ? 'tag--income' : 'tag--expense'}">${tx.type}</span></td>
        <td class="align-right ${isIncome ? 'amount--income' : 'amount--expense'}">${amountText}</td>
        <td class="row-actions">
          <button type="button" class="tx-edit-btn">Edit</button>
          <button type="button" class="tx-delete-btn">Delete</button>
        </td>
      </tr>
    `;
  }).join('');

  // Buttons are visual only for now — no backend wiring yet.
  tbody.querySelectorAll('.tx-edit-btn, .tx-delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // Intentionally inert — UI-only stage.
    });
  });
}

/* --------------------------------------------------------------------
   5. Target savings rate — inline editable value
   -------------------------------------------------------------------- */
function initTargetRateEditor() {
  const valueEl = document.getElementById('targetRateValue');
  const inputEl = document.getElementById('targetRateInput');
  const editBtn = document.getElementById('editTargetBtn');

  const enterEditMode = () => {
    inputEl.value = parseInt(valueEl.textContent, 10) || 0;
    valueEl.hidden = true;
    inputEl.hidden = false;
    inputEl.focus();
    inputEl.select();
  };

  const commitEdit = () => {
    let next = parseInt(inputEl.value, 10);
    if (isNaN(next)) next = parseInt(valueEl.textContent, 10) || 0;
    next = Math.min(100, Math.max(0, next));
    valueEl.textContent = `${next}%`;
    valueEl.hidden = false;
    inputEl.hidden = true;
  };

  editBtn.addEventListener('click', enterEditMode);
  inputEl.addEventListener('blur', commitEdit);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') { inputEl.hidden = true; valueEl.hidden = false; }
  });
}

/* --------------------------------------------------------------------
   6. Lily's floating quick-interaction widget
   -------------------------------------------------------------------- */
function initLilyWidget() {
  const toggle = document.getElementById('lilyWidgetToggle');
  const body = document.getElementById('lilyWidgetBody');

  toggle.addEventListener('click', () => {
    const isHidden = body.hasAttribute('hidden');
    if (isHidden) {
      body.removeAttribute('hidden');
      toggle.setAttribute('aria-expanded', 'true');
    } else {
      body.setAttribute('hidden', '');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

/* --------------------------------------------------------------------
   7. Add Income / Add Expense modal (frontend only)
   -------------------------------------------------------------------- */
function initTransactionModal() {
  const overlay = document.getElementById('modalOverlay');
  const title = document.getElementById('modalTitle');
  const submitBtn = document.getElementById('submitModalBtn');
  const form = document.getElementById('txForm');
  const categorySelect = form.querySelector('select[name="category"]');

  const addIncomeBtn = document.getElementById('addIncomeBtn');
  const addExpenseBtn = document.getElementById('addExpenseBtn');
  const closeBtn = document.getElementById('closeModalBtn');
  const cancelBtn = document.getElementById('cancelModalBtn');

  let currentMode = 'income';

  const openModal = (mode) => {
    currentMode = mode;
    const isIncome = mode === 'income';
    title.textContent = isIncome ? 'Add Income' : 'Add Expense';
    submitBtn.textContent = isIncome ? 'Add Income' : 'Add Expense';
    submitBtn.className = `btn ${isIncome ? 'btn--income' : 'btn--expense'}`;
    categorySelect.value = isIncome ? 'Income' : '';
    overlay.removeAttribute('hidden');
  };

  const closeModal = () => {
    overlay.setAttribute('hidden', '');
    form.reset();
  };

  addIncomeBtn.addEventListener('click', () => openModal('income'));
  addExpenseBtn.addEventListener('click', () => openModal('expense'));
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.hasAttribute('hidden')) closeModal();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // UI-only stage: no persistence, no API calls yet.
    // A future iteration will wire this up to the fuzzy-logic backend.
    closeModal();
  });
}
