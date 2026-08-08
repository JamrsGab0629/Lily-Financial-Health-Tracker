// src/public/js/ui.js

export function scrollToBottom(chatWindow) {
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

export function appendMessage(chatWindow, text, sender, proofData = null, lilyFaceEl = null) {
  const msg = document.createElement('div');
  msg.className = `msg msg--${sender}`;

  const avatar = document.createElement('span');
  avatar.className = 'msg-avatar';
  avatar.setAttribute('aria-hidden', 'true');

  if (sender === 'lily') {
    if (lilyFaceEl && lilyFaceEl.tagName === 'IMG' && lilyFaceEl.src) {
      const img = document.createElement('img');
      img.src = lilyFaceEl.src;
      img.alt = 'Lily';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.borderRadius = '50%';
      img.style.objectFit = 'cover';
      avatar.appendChild(img);
    } else {
      avatar.textContent = lilyFaceEl ? (lilyFaceEl.textContent || '😺') : '😺';
    }
  } else {
    avatar.textContent = '🙂';
  }

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';

  const textNode = document.createElement('div');
  textNode.style.whiteSpace = 'pre-line';
  textNode.textContent = text;
  bubble.appendChild(textNode);

  // Automated Fuzzy Proof of Reasoning Block
  if (sender === 'lily' && proofData) {
    const proofBox = document.createElement('details');
    proofBox.className = 'proof-box';
    proofBox.open = true;

    const reasoningText = proofData.reasoningText
      || `Calculated Health Score of ${proofData.healthScore ?? 'N/A'}/100 based on active fuzzy set boundaries.`;

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
  scrollToBottom(chatWindow);
}

export function updateLilyVisuals(lilyFace, gifUrl, emoji) {
  let currentFace = lilyFace;
  if (gifUrl && currentFace) {
    if (currentFace.tagName !== 'IMG') {
      const newImg = document.createElement('img');
      newImg.id = 'lilyFace';
      newImg.className = currentFace.className;
      newImg.src = gifUrl;
      newImg.alt = 'Lily Mood';
      currentFace.replaceWith(newImg);
      currentFace = newImg;
    } else {
      currentFace.src = gifUrl;
    }
  } else if (emoji && currentFace && currentFace.tagName !== 'IMG') {
    currentFace.textContent = emoji;
  }
  return currentFace;
}

export function updateStatusBadge(statusBadge, alertTier, proof) {
  if (!statusBadge) return;
  const tierClass = alertTier.toLowerCase();
  statusBadge.className = `score-status status-${tierClass}`;

  if (proof && proof.healthScore !== undefined) {
    statusBadge.textContent = `${alertTier} (Score: ${proof.healthScore})`;
  } else {
    statusBadge.textContent = alertTier;
  }
}

export function renderDynamicChips(suggestedList, nestedQuestions, isTerminal, onSendIntent) {
  suggestedList.innerHTML = '';

  if (isTerminal || !nestedQuestions || nestedQuestions.length === 0) {
    const resetChip = document.createElement('button');
    resetChip.type = 'button';
    resetChip.className = 'suggested-chip reset-chip';
    resetChip.textContent = 'Back to Main Menu 🔄';
    resetChip.addEventListener('click', () => {
      onSendIntent('CHECK_HEALTH', 'How is my financial health? 🏥');
    });
    suggestedList.appendChild(resetChip);
  } else {
    nestedQuestions.forEach(q => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'suggested-chip';

      const chipText = q.text || q.label || (typeof q === 'string' ? q : 'Question');
      chip.textContent = chipText;

      chip.addEventListener('click', () => {
        onSendIntent(q.intent, chipText);
      });
      suggestedList.appendChild(chip);
    });
  }
}