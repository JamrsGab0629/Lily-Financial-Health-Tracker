// js/dashboard/listeners.js
import { fetchSettings, updateSettings, createTransaction } from './api.js';
import { updateEl } from './renderers.js';

export function initLilyWidget() {
  const toggleBtn = document.getElementById('lilyWidgetToggle');
  const widgetBody = document.getElementById('lilyWidgetBody');
  if (!toggleBtn || !widgetBody) return;

  toggleBtn.addEventListener('click', () => {
    const isHidden = widgetBody.hasAttribute('hidden');
    isHidden ? widgetBody.removeAttribute('hidden') : widgetBody.setAttribute('hidden', '');
  });
}

// Requires a callback to refresh the dashboard when settings change
export async function initTargetRateEditor(onSuccessRefresh) {
  const valueEl = document.getElementById('targetRateValue');
  const inputEl = document.getElementById('targetRateInput');
  const editBtn = document.getElementById('editTargetBtn');
  if (!valueEl || !inputEl || !editBtn) return;

  const data = await fetchSettings();
  if (data) valueEl.textContent = `${data.target_savings_rate}%`;

  const commitEdit = async () => {
    let next = parseInt(inputEl.value, 10) || parseInt(valueEl.textContent, 10) || 0;
    next = Math.min(100, Math.max(0, next));
    valueEl.textContent = `${next}%`;
    valueEl.hidden = false;
    inputEl.hidden = true;
    
    await updateSettings({ target_savings_rate: next });
    onSuccessRefresh();
  };

  editBtn.addEventListener('click', () => {
    inputEl.value = parseInt(valueEl.textContent, 10) || 0;
    valueEl.hidden = true;
    inputEl.hidden = false;
    inputEl.focus();
    inputEl.select();
  });
  inputEl.addEventListener('blur', commitEdit);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') commitEdit();
  });
}

// Requires a callback to refresh the dashboard when a transaction is added
export function initTransactionModal(onSuccessRefresh) {
  const overlay = document.getElementById('modalOverlay');
  const form = document.getElementById('txForm');
  if (!overlay || !form) return;

  let currentMode = 'income';

  const openModal = (mode) => {
    currentMode = mode;
    updateEl('modalTitle', mode === 'income' ? 'Add Income' : 'Add Expense');
    overlay.removeAttribute('hidden');
  };

  const closeModal = () => { overlay.setAttribute('hidden', ''); form.reset(); };

  document.getElementById('addIncomeBtn')?.addEventListener('click', () => openModal('income'));
  document.getElementById('addExpenseBtn')?.addEventListener('click', () => openModal('expense'));
  document.getElementById('closeModalBtn')?.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    
    await createTransaction({
      description: formData.get("description") || `${currentMode} Transaction`,
      amount: parseFloat(formData.get("amount")),
      category: formData.get("category") || "Other",
      type: currentMode,
      transaction_date: (formData.get("date") || formData.get("transaction_date")) 
        ? new Date(formData.get("date")).toISOString() 
        : new Date().toISOString()
    });

    closeModal();
    onSuccessRefresh(); // Tells the main controller to re-fetch and re-render
  });
}