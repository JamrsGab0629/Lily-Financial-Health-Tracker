// src/public/js/chat.js
import { fetchLilyResponse } from './api.js';
import { 
  scrollToBottom, 
  appendMessage, 
  updateLilyVisuals, 
  updateStatusBadge, 
  renderDynamicChips 
} from './ui.js';

function whenReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  } else {
    fn();
  }
}

whenReady(() => {
  const chatWindow = document.getElementById('chatWindow');
  const typingIndicator = document.getElementById('typingIndicator');
  let lilyFace = document.getElementById('lilyFace');
  const chatReset = document.getElementById('chatReset');
  const suggestedList = document.getElementById('suggestedList');
  const statusBadge = document.getElementById('lilyMoodBadge');

  async function handleSendIntent(intent, userLabelText) {
    appendMessage(chatWindow, userLabelText, 'user');

    typingIndicator.hidden = false;
    if (lilyFace) lilyFace.classList.add('is-talking');
    scrollToBottom(chatWindow);

    const resData = await fetchLilyResponse(intent);

    const delay = 500 + Math.random() * 300;
    setTimeout(() => {
      typingIndicator.hidden = true;
      if (lilyFace) lilyFace.classList.remove('is-talking');

      if (!resData || !resData.success || !resData.data) {
        appendMessage(chatWindow, "Meow... I couldn't reach my financial server right now. Try again in a bit!", 'lily', null, lilyFace);
        return;
      }

      const payload = resData.data;
      const responseObj = payload.response || payload;
      const messageText = responseObj.message || payload.message || "I've processed your financial data.";
      const gifUrl = responseObj.gifUrl || payload.gifUrl;
      const emoji = payload.avatarEmoji || responseObj.emoji || '😺';
      const alertTier = responseObj.alertTier || payload.alertTier || 'Optimal';
      const proof = payload.proofOfReasoning || responseObj.proofOfReasoning;
      const questions = payload.suggestedQuestions || payload.nestedQuestions || responseObj.nestedQuestions;
      const isTerminal = payload.isTerminal ?? responseObj.isTerminal ?? false;

      lilyFace = updateLilyVisuals(lilyFace, gifUrl, emoji);
      updateStatusBadge(statusBadge, alertTier, proof);
      appendMessage(chatWindow, messageText, 'lily', proof, lilyFace);
      renderDynamicChips(suggestedList, questions, isTerminal, handleSendIntent);

    }, delay);
  }

  function initChat() {
    chatWindow.innerHTML = '';
    handleSendIntent('CHECK_HEALTH', 'How is my financial health? 🏥');
  }

  if (chatReset) {
    chatReset.addEventListener('click', () => {
      initChat();
    });
  }

  initChat();
});