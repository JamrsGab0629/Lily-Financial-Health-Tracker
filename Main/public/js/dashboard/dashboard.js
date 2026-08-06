// js/dashboard/dashboard.js
import { fetchDashboardData, deleteTransactionApi } from './api.js';
import { renderHealthCard, renderMonthlyChart, renderSpendingBreakdown, renderTransactionsTable } from './renderers.js';
import { initLilyWidget, initTargetRateEditor, initTransactionModal } from './listeners.js';

// Runs `fn` right away if the DOM is already parsed (true when the router
// injects this script after navigation), or waits for DOMContentLoaded if
// the page was loaded normally and is still parsing.
function whenReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  } else {
    fn();
  }
}

whenReady(() => {
  initDashboard();

  // Pass initDashboard as a callback so these components can refresh the page data
  initTargetRateEditor(initDashboard);
  initTransactionModal(initDashboard);
  initLilyWidget();
});

async function initDashboard() {
  try {
    // 1. Fetch data from API module
    const { summary, transactions } = await fetchDashboardData();

    // 2. Pass data to Rendering modules
    renderHealthCard(summary);
    renderMonthlyChart(transactions);
    renderSpendingBreakdown(transactions);

    // 3. Render table and pass down the delete handler
    renderTransactionsTable(transactions, async (id) => {
      if (confirm("Are you sure you want to delete this transaction?")) {
        await deleteTransactionApi(id);
        initDashboard(); // Refresh after delete
      }
    });

  } catch (error) {
    console.error("Error initializing dashboard:", error);
  }
}