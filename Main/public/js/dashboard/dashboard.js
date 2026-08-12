// js/dashboard/dashboard.js
import { fetchDashboardData, deleteTransactionApi } from './api.js';
import { renderHealthCard, renderMonthlyChart, renderSpendingBreakdown, renderTransactionsTable } from './renderers.js';
import { initLilyWidget, initTargetRateEditor, initTransactionModal } from './listeners.js';


function whenReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  } else {
    fn();
  }
}

whenReady(() => {
  initDashboard();

  
  initTargetRateEditor(initDashboard);
  initTransactionModal(initDashboard);
  initLilyWidget();
});

async function initDashboard() {
  try {
   
    const { summary, transactions } = await fetchDashboardData();

    
    renderHealthCard(summary);
    renderMonthlyChart(transactions);
    renderSpendingBreakdown(transactions);

   
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