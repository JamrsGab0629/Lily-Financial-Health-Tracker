// src/public/js/api.js

export async function fetchLilyResponse(intent) {
  try {
    const response = await fetch('/api/financial/lily-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intent })
    });

    const resData = await response.json();
    return resData;
  } catch (error) {
    console.error("FDT API Error:", error);
    return null;
  }
}