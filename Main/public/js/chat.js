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

  const chatWindow = document.getElementById('chatWindow');
  const typingIndicator = document.getElementById('typingIndicator');
  let lilyFace = document.getElementById('lilyFace'); // Marked 'let' to allow element replacement
  const chatReset = document.getElementById('chatReset');
  const suggestedList = document.getElementById('suggestedList');
  const statusBadge = document.getElementById('lilyMoodBadge');

  function scrollToBottom() {
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  /*
  =====================================================
  MESSAGE RENDERER (Supports Dynamic GIF Avatars & Fuzzy Proof)
  =====================================================
  */
  function appendMessage(text, sender, proofData = null) {
    const msg = document.createElement('div');
    msg.className = 'msg msg--' + sender;

    const avatar = document.createElement('span');
    avatar.className = 'msg-avatar';
    avatar.setAttribute('aria-hidden', 'true');

    // 💡 FIXED: Render GIF inside avatar if lilyFace is an <img> tag, else fallback to emoji
    if (sender === 'lily') {
      if (lilyFace && lilyFace.tagName === 'IMG' && lilyFace.src) {
        const img = document.createElement('img');
        img.src = lilyFace.src;
        img.alt = 'Lily';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.borderRadius = '50%';
        img.style.objectFit = 'cover';
        avatar.appendChild(img);
      } else {
        avatar.textContent = lilyFace ? (lilyFace.textContent || '😺') : '😺';
      }
    } else {
      avatar.textContent = '🙂';
    }

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';

    // Main text content (renders newlines safely)
    const textNode = document.createElement('div');
    textNode.style.whiteSpace = 'pre-line';
    textNode.textContent = text;
    bubble.appendChild(textNode);

    // 💡 AUTOMATED FUZZY PROOF OF REASONING (Explainable AI)
    if (sender === 'lily' && proofData) {
      const proofBox = document.createElement('details');
      proofBox.className = 'proof-box';
      proofBox.open = true; // Open by default for thesis/defense demo

      const reasoningText = proofData.reasoningText
        || `Calculated Health Score of ${proofData.healthScore ?? 'N/A'}/100 based on active fuzzy set boundaries.`;

      // Safely read fuzzy membership values if passed
      const membershipsText = proofData.memberships
        ? ` (Low: ${proofData.memberships.low ?? 0}, Med: ${proofData.memberships.medium ?? 0}, High: ${proofData.memberships.high ?? 0})`
        : '';

      proofBox.innerHTML = `
        <summary class="proof-summary">💡 Proof of Reasoning (Fuzzy Engine)</summary>
        <div class="proof-details">
          <div class="proof-row"><strong>Crisp Input:</strong> ${proofData.crispInput || 'N/A'}</div>
          <div class="proof-row"><strong>Dominant Set:</strong> ${proofData.dominantSet || 'N/A'}${membershipsText}</div>
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
    if (lilyFace) lilyFace.classList.add('is-talking');
    scrollToBottom();

    // 3. Query FDT Backend Engine
    const resData = await fetchLilyResponse(intent);

    const delay = 500 + Math.random() * 300; // Natural delay
    setTimeout(() => {
      typingIndicator.hidden = true;
      if (lilyFace) lilyFace.classList.remove('is-talking');

      // Check if payload is valid
      if (!resData || !resData.success || !resData.data) {
        appendMessage("Meow... I couldn't reach my financial server right now. Try again in a bit!", 'lily');
        return;
      }

      const payload = resData.data;

      // Extract response structure safely
      const responseObj = payload.response || payload;
      const messageText = responseObj.message || payload.message || "I've processed your financial data.";
      const gifUrl = responseObj.gifUrl || payload.gifUrl;
      const emoji = payload.avatarEmoji || responseObj.emoji || '😺';
      const alertTier = responseObj.alertTier || payload.alertTier || 'Optimal';
      const proof = payload.proofOfReasoning || responseObj.proofOfReasoning;

      // Look for suggested questions in root or response payload
      const questions = payload.suggestedQuestions || payload.nestedQuestions || responseObj.nestedQuestions;
      const isTerminal = payload.isTerminal ?? responseObj.isTerminal ?? false;

      // 4. 💡 FIXED: Update Lily Visual State (Auto Convert <span>/<div> to <img> if needed)
      if (gifUrl && lilyFace) {
        if (lilyFace.tagName !== 'IMG') {
          const newImg = document.createElement('img');
          newImg.id = 'lilyFace';
          newImg.className = lilyFace.className;
          newImg.src = gifUrl;
          newImg.alt = 'Lily Mood';
          lilyFace.replaceWith(newImg);
          lilyFace = newImg; // Update local DOM reference
        } else {
          lilyFace.src = gifUrl;
        }
      } else if (emoji && lilyFace && lilyFace.tagName !== 'IMG') {
        lilyFace.textContent = emoji;
      }

      // Update status badge
      if (statusBadge) {
        const tierClass = alertTier.toLowerCase();
        statusBadge.className = `score-status status-${tierClass}`;

        // Displays status e.g. "Optimal (Score: 84)"
        if (proof && proof.healthScore !== undefined) {
          statusBadge.textContent = `${alertTier} (Score: ${proof.healthScore})`;
        } else {
          statusBadge.textContent = alertTier;
        }
      }

      // 5. Render Lily's Response WITH Fuzzy Proof Block
      appendMessage(messageText, 'lily', proof);

      // 6. Update Prompt Chips dynamically based on Fuzzy Decision Tree Level
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
      // ACTIVE BRANCH: Render nested fuzzy question options
      nestedQuestions.forEach(q => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'suggested-chip';

        // Read text prop, fallback to label, fallback to string
        const chipText = q.text || q.label || (typeof q === 'string' ? q : 'Question');
        chip.textContent = chipText;

        chip.addEventListener('click', () => {
          sendIntent(q.intent, chipText);
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

  if (chatReset) {
    chatReset.addEventListener('click', () => {
      initChat();
    });
  }

  // Start chat immediately — the DOM is already in place either way
  initChat();

});