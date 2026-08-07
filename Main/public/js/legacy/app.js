/* ==========================================================================
   LILY — FINANCIAL HEALTH TRACKER (Single Page App)
   Frontend only — no backend, no AI, no real fuzzy logic.
   One continuous scrolling page: Dashboard section, then Lily Chat section.
   The header nav smooth-scrolls between them; scroll-spy keeps it in sync.
   ========================================================================== */

/* ==========================================================================
   0. Scroll-spy — highlights the active nav link as the page scrolls
   ========================================================================== */
function initScrollSpy() {
  const sections = document.querySelectorAll('.view');
  const navLinks = document.querySelectorAll('.nav-link[data-view]');

  const setActive = (view) => {
    navLinks.forEach(link => {
      link.classList.toggle('is-active', link.dataset.view === view);
    });
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setActive(entry.target.id.replace('view-', ''));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

  sections.forEach(section => observer.observe(section));

  // Default to Dashboard highlighted before any scrolling happens
  setActive('dashboard');
}

/* ==========================================================================
   INIT — runs once on load
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initScrollSpy();

  // Dashboard section
  renderHealthCard();
  renderMonthlyChart();
  renderSpendingBreakdown();
  renderTransactions();
  initTargetRateEditor();
  initLilyWidget();
  initTransactionModal();

  // Lily Chat section
  applyMood(lilyMood);
  renderPresetQuestions();
  chatForm.addEventListener('submit', handleFormSubmit);
});


/* ==========================================================================
   DASHBOARD VIEW
   ========================================================================== */

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
  const moodEl = document.getElementById('lilyMoodCaption');

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


/* ==========================================================================
   LILY CHAT VIEW
   ========================================================================== */

/* --------------------------------------------------------------------
   1. Lily's mood (mock — will eventually come from the fuzzy-logic engine)
   -------------------------------------------------------------------- */
let lilyMood = 'happy'; // 'angry' | 'sad' | 'happy' | 'very-happy'

const moodConfig = {
  angry:      { label: 'Angry',     emoji: '😾', sprite: 'assets/lily/angry.png',      talkSprite: 'assets/lily/angry-mouth.png' },
  sad:        { label: 'Sad',       emoji: '😿', sprite: 'assets/lily/sad.png',        talkSprite: 'assets/lily/sad-mouth.png' },
  happy:      { label: 'Happy',     emoji: '😸', sprite: 'assets/lily/happy.png',      talkSprite: 'assets/lily/happy-mouth.png' },
  'very-happy': { label: 'Very Happy', emoji: '😻', sprite: 'assets/lily/very-happy.png', talkSprite: 'assets/lily/very-happy-mouth.png' }
};

/* --------------------------------------------------------------------
   2. Predefined Lily responses (mock — later generated from real
      financial calculations + fuzzy logic results)
   -------------------------------------------------------------------- */
const lilyResponses = {
  'how am i doing financially?':
    "You're doing pretty well! Your spending is currently under control and your savings are on track.",

  'how are my savings?':
    "Your savings are looking good — you're putting away ₱8,000 this month. Keep working toward your target!",

  'am i spending too much?':
    "Not at all! Your expenses actually went down compared to last month. Nice self-control!",

  'how is my spending compared to last month?':
    "Your spending decreased from ₱19,000 to ₱17,000 compared to last month. Great job!",

  'what category am i spending the most on?':
    "Food is currently your biggest expense category, followed by Bills. Might be worth keeping an eye on those.",

  'how much did i save this month?':
    "You saved ₱8,000 this month — that's a 32% savings rate, just above your 30% target!",

  'is my financial health improving?':
    "Yes! Your financial health score is 82 out of 100 and trending upward. Keep it up!",

  'give me some financial advice.':
    "Try setting aside your savings first, right when you get paid. Small, consistent habits add up fast!"
};

const fallbackResponse =
  "I'm still learning! I can only answer a few specific things about your finances right now — try one of the quick questions below.";

/* --------------------------------------------------------------------
   3. DOM references
   -------------------------------------------------------------------- */
const lilySpriteEl = document.getElementById('lilySprite');
const lilyMoodText = document.getElementById('lilyMoodText');
const lilyMoodEmoji = document.getElementById('lilyMoodEmoji');
const lilyHeroFrame = document.querySelector('.lily-hero__frame');

const emptyStateEl = document.getElementById('emptyState');
const chatMessagesEl = document.getElementById('chatMessages');
const chatScrollEl = document.getElementById('chatScroll');

const presetQuestionsEl = document.getElementById('presetQuestions');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');

/* --------------------------------------------------------------------
   4. Mood display
   -------------------------------------------------------------------- */
function applyMood(mood) {
  const config = moodConfig[mood] || moodConfig.happy;
  lilySpriteEl.src = config.sprite;
  lilySpriteEl.alt = `Lily the cat, looking ${config.label.toLowerCase()}`;
  lilyMoodEmoji.textContent = config.emoji;
  lilyMoodText.innerHTML = `Lily is <strong>${config.label}</strong> <span id="lilyMoodEmoji">${config.emoji}</span>`;
}

/* --------------------------------------------------------------------
   5. Preset question chips
   -------------------------------------------------------------------- */
function renderPresetQuestions() {
  const questions = Object.keys(lilyResponses);

  presetQuestionsEl.innerHTML = questions.map(q => {
    const displayText = capitalize(q);
    return `<button type="button" class="chip" data-question="${escapeHtml(displayText)}">${escapeHtml(displayText)}</button>`;
  }).join('');

  presetQuestionsEl.querySelectorAll('.chip').forEach(btn => {
    btn.addEventListener('click', () => {
      sendMessage(btn.dataset.question);
    });
  });
}

/* --------------------------------------------------------------------
   6. Chat input handling
   -------------------------------------------------------------------- */
function handleFormSubmit(e) {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  sendMessage(text);
  chatInput.value = '';
}

function sendMessage(text) {
  hideEmptyState();
  appendUserMessage(text);

  const reply = lilyResponses[text.trim().toLowerCase()] || fallbackResponse;

  showTypingIndicator(() => {
    appendLilyMessage(reply);
  });
}

/* --------------------------------------------------------------------
   7. Rendering messages
   -------------------------------------------------------------------- */
function hideEmptyState() {
  if (!emptyStateEl.hidden) emptyStateEl.hidden = true;
}

function appendUserMessage(text) {
  const el = document.createElement('div');
  el.className = 'msg msg--user';
  el.innerHTML = `
    <div class="msg__bubble">
      <span class="msg__name">You</span>
      ${escapeHtml(text)}
    </div>
  `;
  chatMessagesEl.appendChild(el);
  scrollToBottom();
}

function appendLilyMessage(text) {
  const config = moodConfig[lilyMood] || moodConfig.happy;
  const el = document.createElement('div');
  el.className = 'msg msg--lily';
  el.innerHTML = `
    <div class="msg__avatar"><img src="${config.sprite}" alt=""></div>
    <div class="msg__bubble">
      <span class="msg__name">🐱 Lily</span>
      ${escapeHtml(text)}
    </div>
  `;
  chatMessagesEl.appendChild(el);
  scrollToBottom();
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    chatScrollEl.scrollTop = chatScrollEl.scrollHeight;
  });
}

/* --------------------------------------------------------------------
   8. Typing indicator + simple mouth-swap "talking" animation
   -------------------------------------------------------------------- */
function showTypingIndicator(onDone) {
  const config = moodConfig[lilyMood] || moodConfig.happy;

  const typingEl = document.createElement('div');
  typingEl.className = 'msg msg--lily';
  typingEl.id = 'typingIndicator';
  typingEl.innerHTML = `
    <div class="msg__avatar"><img src="${config.sprite}" alt=""></div>
    <div class="msg__bubble">
      <span class="typing-dots"><span></span><span></span><span></span></span>
    </div>
  `;
  chatMessagesEl.appendChild(typingEl);
  scrollToBottom();

  startTalkingAnimation();

  setTimeout(() => {
    stopTalkingAnimation();
    typingEl.remove();
    if (onDone) onDone();
  }, 900);
}

let talkingInterval = null;

function startTalkingAnimation() {
  const config = moodConfig[lilyMood] || moodConfig.happy;
  let showMouthOpen = false;

  lilyHeroFrame.classList.add('is-talking');

  talkingInterval = setInterval(() => {
    showMouthOpen = !showMouthOpen;
    lilySpriteEl.src = showMouthOpen ? config.talkSprite : config.sprite;
  }, 300);
}

function stopTalkingAnimation() {
  clearInterval(talkingInterval);
  talkingInterval = null;
  lilyHeroFrame.classList.remove('is-talking');
  const config = moodConfig[lilyMood] || moodConfig.happy;
  lilySpriteEl.src = config.sprite;
}

/* --------------------------------------------------------------------
   9. Small helpers
   -------------------------------------------------------------------- */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
