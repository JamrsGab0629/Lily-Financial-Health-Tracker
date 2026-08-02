document.addEventListener('DOMContentLoaded', () => {

  const chatWindow = document.getElementById('chatWindow');
  const typingIndicator = document.getElementById('typingIndicator');
  const lilyFace = document.getElementById('lilyFace');
  const chatReset = document.getElementById('chatReset');
  const suggestedList = document.getElementById('suggestedList');
  const statusBadge = document.getElementById('statusBadge'); // Make sure you have a badge element!

  function scrollToBottom() {
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function appendMessage(text, sender) {
    const msg = document.createElement('div');
    msg.className = 'msg msg--' + sender;

    const avatar = document.createElement('span');
    avatar.className = 'msg-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = sender === 'lily' ? '😺' : '🙂';

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.textContent = text;

    msg.appendChild(avatar);
    msg.appendChild(bubble);
    chatWindow.appendChild(msg);
    scrollToBottom();
  }

  /*
  =====================================================
  API FETCH: Send Intent to Node.js Backend (FDT Engine)
  =====================================================
  */
  async function fetchLilyResponse(intent) {
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

  /*
  =====================================================
  MAIN CHAT PROCESSOR
  =====================================================
  */
  async function sendIntent(intent, userLabelText) {
    // 1. Render user message in UI
    appendMessage(userLabelText, 'user');

    // 2. Show typing indicator & start talking animation
    typingIndicator.hidden = false;
    lilyFace.classList.add('is-talking');
    scrollToBottom();

    // 3. Query FDT Backend Engine
    const data = await fetchLilyResponse(intent);

    const delay = 600 + Math.random() * 400; // Realistic delay
    setTimeout(() => {
      typingIndicator.hidden = true;
      lilyFace.classList.remove('is-talking');

      if (!data || !data.response) {
        appendMessage("Meow... I couldn't reach my financial server right now. Try again in a bit!", 'lily');
        return;
      }

      // 4. Update Lily Visual State (GIF & Badge Color)
      if (data.response.gifUrl && lilyFace.tagName === 'IMG') {
        lilyFace.src = data.response.gifUrl;
      }
      if (statusBadge && data.response.badgeColor) {
        statusBadge.style.backgroundColor = data.response.badgeColor;
        statusBadge.textContent = data.response.alertTier;
      }

      // 5. Render Lily's FDT Advisory Response
      appendMessage(data.response.message, 'lily');

      // 6. Update Prompt Chips dynamically based on FDT Level
      renderDynamicChips(data.nestedQuestions, data.isTerminal);

    }, delay);
  }

  /*
  =====================================================
  DYNAMIC BUTTON RENDERER (Renders Level 2 & 3 Nodes)
  =====================================================
  */
  function renderDynamicChips(nestedQuestions, isTerminal) {
    suggestedList.innerHTML = ''; // Clear existing chips

    if (isTerminal || !nestedQuestions || nestedQuestions.length === 0) {
      // LEAF NODE REACHED: Offer return to main menu
      const resetChip = document.createElement('button');
      resetChip.className = 'suggested-chip reset-chip';
      resetChip.textContent = 'Back to Main Menu 🔄';
      resetChip.addEventListener('click', () => {
        sendIntent('CHECK_HEALTH', 'How is my financial health? 🏥');
      });
      suggestedList.appendChild(resetChip);
    } else {
      // ACTIVE BRANCH: Render nested question options
      nestedQuestions.forEach(q => {
        const chip = document.createElement('button');
        chip.className = 'suggested-chip';
        chip.textContent = q.label;
        chip.addEventListener('click', () => {
          sendIntent(q.intent, q.label);
        });
        suggestedList.appendChild(chip);
      });
    }
  }

  /*
  =====================================================
  INITIALIZATION & RESET
  =====================================================
  */
  function initChat() {
    chatWindow.innerHTML = '';
    // Start initial conversation by triggering root health evaluation
    sendIntent('CHECK_HEALTH', 'How is my financial health? 🏥');
  }

  chatReset.addEventListener('click', () => {
    initChat();
  });

  // Start chat on load
  initChat();

});