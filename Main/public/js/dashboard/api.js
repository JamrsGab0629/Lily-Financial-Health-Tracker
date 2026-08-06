// js/dashboard/api.js

export async function fetchDashboardData() {
  const [summaryRes, transactionsRes] = await Promise.all([
    fetch("/api/financial/summary"),
    fetch("/api/transactions")
  ]);

  if (!summaryRes.ok || !transactionsRes.ok) throw new Error("Failed to load data");

  return {
    summary: await summaryRes.json(),
    transactions: await transactionsRes.json()
  };
}

export async function fetchSettings() {
  const res = await fetch("/api/settings");
  return res.ok ? await res.json() : null;
}

export async function updateSettings(settingsData) {
  return fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settingsData)
  });
}

export async function createTransaction(payload) {
  return fetch("/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function deleteTransactionApi(id) {
  return fetch(`/api/transactions/${id}`, { method: "DELETE" });
}