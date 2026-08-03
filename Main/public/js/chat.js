document.addEventListener('DOMContentLoaded', () => {

  const chatWindow = document.getElementById('chatWindow');
  const typingIndicator = document.getElementById('typingIndicator');
  const lilyFace = document.getElementById('lilyFace');
  const chatReset = document.getElementById('chatReset');
  const suggestedList = document.getElementById('suggestedList');
  const statusBadge = document.getElementById('lilyMoodBadge'); 

  function scrollToBottom() {
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  /*
  =====================================================
  MESSAGE RENDERER (Supports Text & Fuzzy Proof Accordion)
  =====================================================
  */
  function appendMessage(text, sender, proofData = null) {
    const msg = document.createElement('div');
    msg.className = 'msg msg--' + sender;

    const avatar = document.createElement('span');
    avatar.className = 'msg-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = sender === 'lily' ? (lilyFace.textContent || '😺') : '🙂';

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';

    // Main text
    const textNode = document.createElement('div');
    textNode.textContent = text;
    bubble.appendChild(textNode);

    // 💡 AUTOMATED FUZZY PROOF OF REASONING (Explainable AI)
    if (sender === 'lily' && proofData) {
      const proofBox = document.createElement('details');
      proofBox.className = 'proof-box';
      proofBox.open = true; // Open by default for defense demo

      const reasoningText = proofData.reasoningText 
        || `Calculated Health Score of ${proofData.healthScore ?? 'N/A'}/100 based on active fuzzy set boundaries.`;

      proofBox.innerHTML = `
        <summary class="proof-summary">💡 Proof of Reasoning (Fuzzy Engine)</summary>
        <div class="proof-details">
          <div class="proof-row"><strong>Crisp Input:</strong> ${proofData.crispInput || 'N/A'}</div>
          <div class="proof-row"><strong>Dominant Set:</strong> ${proofData.dominantSet || 'N/A'}</div>
          <div class="proof-row"><strong>Active Rule:</strong> <code>${proofData.activeRule || 'N/A'}</code></div>
          <div class="proof-row"><strong>Reasoning:</strong> ${reasoningText}</div>
        </div>
      `;
      bubble.appendChild(proofBox);
    }

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
    const resData = await fetchLilyResponse(intent);

    const delay = 600 + Math.random() * 400; // Realistic delay
    setTimeout(() => {
      typingIndicator.hidden = true;
      lilyFace.classList.remove('is-talking');

      // Check if payload is valid
      if (!resData || !resData.success || !resData.data) {
        appendMessage("Meow... I couldn't reach my financial server right now. Try again in a bit!", 'lily');
        return;
      }

      const payload = resData.data;

      // Extract response structure safely (handles both flat and response-nested shapes)
      const responseObj = payload.response || payload;
      const messageText = responseObj.message || payload.message;
      const gifUrl = responseObj.gifUrl || payload.gifUrl;
      const emoji = payload.avatarEmoji || responseObj.emoji || '😺';
      const alertTier = responseObj.alertTier || payload.alertTier || 'Optimal';
      const proof = payload.proofOfReasoning || responseObj.proofOfReasoning;
      const questions = payload.suggestedQuestions || payload.nestedQuestions || responseObj.nestedQuestions;
      const isTerminal = payload.isTerminal ?? responseObj.isTerminal ?? false;

      // 4. Update Lily Visual State (Emoji/GIF & Badge)
      if (gifUrl && lilyFace.tagName === 'IMG') {
        lilyFace.src = gifUrl;
      } else if (emoji && lilyFace.tagName !== 'IMG') {
        lilyFace.textContent = emoji;
      }

      if (statusBadge) {
        const tierClass = alertTier.toLowerCase();
        statusBadge.className = `score-status status-${tierClass}`;
        
        // Displays label + score e.g. "Optimal (Score: 84)"
        if (proof && proof.healthScore !== undefined) {
          statusBadge.textContent = `${alertTier} (Score: ${proof.healthScore})`;
        } else {
          statusBadge.textContent = alertTier;
        }
      }

      // 5. Render Lily's Response WITH Fuzzy Proof Block
      appendMessage(messageText, 'lily', proof);

      // 6. Update Prompt Chips dynamically based on FDT Level
      renderDynamicChips(questions, isTerminal);

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
      resetChip.type = 'button';
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
        chip.type = 'button';
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