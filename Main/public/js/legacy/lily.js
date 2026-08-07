/* ==========================================================================
   LILY CHAT — FINANCIAL HEALTH TRACKER
   Frontend-only chat UI. No backend, no AI, no real fuzzy logic.
   Everything below is mock data standing in for future fuzzy-logic output.
   ========================================================================== */

/* --------------------------------------------------------------------
   1. Lily's mood (mock — will eventually come from the fuzzy-logic engine)
   -------------------------------------------------------------------- */
let lilyMood = 'happy'; // 'angry' | 'sad' | 'happy' | 'very-happy'

const moodConfig = {
  angry:      { label: 'Angry',     emoji: '😾', sprite: 'assets/lily/angry.png',      talkSprite: 'assets/lily/angry-mouth.png' },
  sad:        { label: 'Sad',       emoji: '😿', sprite: 'assets/lily/sad.png',        talkSprite: 'assets/lily/sad-mouth.png' },
  happy:      { label: 'Happy',     emoji: '😸', sprite: 'assets/lily/happy.png',      talkSprite: 'assets/lily/happy-mouth.png' },
  'very-happy': { label: 'Very Happy', emoji: '😻', sprite: 'assets/lily/very-happy.png', talkSprite: 'assets/lily/very-happy-mouth.png' }
};

/* --------------------------------------------------------------------
   2. Predefined Lily responses (mock — later generated from real
      financial calculations + fuzzy logic results)
   -------------------------------------------------------------------- */
const lilyResponses = {
  'how am i doing financially?':
    "You're doing pretty well! Your spending is currently under control and your savings are on track.",

  'how are my savings?':
    "Your savings are looking good — you're putting away ₱8,000 this month. Keep working toward your target!",

  'am i spending too much?':
    "Not at all! Your expenses actually went down compared to last month. Nice self-control!",

  'how is my spending compared to last month?':
    "Your spending decreased from ₱19,000 to ₱17,000 compared to last month. Great job!",

  'what category am i spending the most on?':
    "Food is currently your biggest expense category, followed by Bills. Might be worth keeping an eye on those.",

  'how much did i save this month?':
    "You saved ₱8,000 this month — that's a 32% savings rate, just above your 30% target!",

  'is my financial health improving?':
    "Yes! Your financial health score is 82 out of 100 and trending upward. Keep it up!",

  'give me some financial advice.':
    "Try setting aside your savings first, right when you get paid. Small, consistent habits add up fast!"
};

const fallbackResponse =
  "I'm still learning! I can only answer a few specific things about your finances right now — try one of the quick questions below.";

/* --------------------------------------------------------------------
   3. DOM references
   -------------------------------------------------------------------- */
const lilySpriteEl = document.getElementById('lilySprite');
const lilyMoodText = document.getElementById('lilyMoodText');
const lilyMoodEmoji = document.getElementById('lilyMoodEmoji');
const lilyHeroFrame = document.querySelector('.lily-hero__frame');

const emptyStateEl = document.getElementById('emptyState');
const chatMessagesEl = document.getElementById('chatMessages');
const chatScrollEl = document.getElementById('chatScroll');

const presetQuestionsEl = document.getElementById('presetQuestions');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');

/* --------------------------------------------------------------------
   4. Init
   -------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  applyMood(lilyMood);
  renderPresetQuestions();
  chatForm.addEventListener('submit', handleFormSubmit);
});

/* --------------------------------------------------------------------
   5. Mood display
   -------------------------------------------------------------------- */
function applyMood(mood) {
  const config = moodConfig[mood] || moodConfig.happy;
  lilySpriteEl.src = config.sprite;
  lilySpriteEl.alt = `Lily the cat, looking ${config.label.toLowerCase()}`;
  lilyMoodEmoji.textContent = config.emoji;
  lilyMoodText.innerHTML = `Lily is <strong>${config.label}</strong> <span id="lilyMoodEmoji">${config.emoji}</span>`;
}

/* --------------------------------------------------------------------
   6. Preset question chips
   -------------------------------------------------------------------- */
function renderPresetQuestions() {
  const questions = Object.keys(lilyResponses);

  presetQuestionsEl.innerHTML = questions.map(q => {
    const displayText = capitalize(q);
    return `<button type="button" class="chip" data-question="${escapeHtml(displayText)}">${escapeHtml(displayText)}</button>`;
  }).join('');

  presetQuestionsEl.querySelectorAll('.chip').forEach(btn => {
    btn.addEventListener('click', () => {
      sendMessage(btn.dataset.question);
    });
  });
}

/* --------------------------------------------------------------------
   7. Chat input handling
   -------------------------------------------------------------------- */
function handleFormSubmit(e) {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  sendMessage(text);
  chatInput.value = '';
}

function sendMessage(text) {
  hideEmptyState();
  appendUserMessage(text);

  const reply = lilyResponses[text.trim().toLowerCase()] || fallbackResponse;

  showTypingIndicator(() => {
    appendLilyMessage(reply);
  });
}

/* --------------------------------------------------------------------
   8. Rendering messages
   -------------------------------------------------------------------- */
function hideEmptyState() {
  if (!emptyStateEl.hidden) emptyStateEl.hidden = true;
}

function appendUserMessage(text) {
  const el = document.createElement('div');
  el.className = 'msg msg--user';
  el.innerHTML = `
    <div class="msg__bubble">
      <span class="msg__name">You</span>
      ${escapeHtml(text)}
    </div>
  `;
  chatMessagesEl.appendChild(el);
  scrollToBottom();
}

function appendLilyMessage(text) {
  const config = moodConfig[lilyMood] || moodConfig.happy;
  const el = document.createElement('div');
  el.className = 'msg msg--lily';
  el.innerHTML = `
    <div class="msg__avatar"><img src="${config.sprite}" alt=""></div>
    <div class="msg__bubble">
      <span class="msg__name">🐱 Lily</span>
      ${escapeHtml(text)}
    </div>
  `;
  chatMessagesEl.appendChild(el);
  scrollToBottom();
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    chatScrollEl.scrollTop = chatScrollEl.scrollHeight;
  });
}

/* --------------------------------------------------------------------
   9. Typing indicator + simple mouth-swap "talking" animation
   -------------------------------------------------------------------- */
function showTypingIndicator(onDone) {
  const config = moodConfig[lilyMood] || moodConfig.happy;

  const typingEl = document.createElement('div');
  typingEl.className = 'msg msg--lily';
  typingEl.id = 'typingIndicator';
  typingEl.innerHTML = `
    <div class="msg__avatar"><img src="${config.sprite}" alt=""></div>
    <div class="msg__bubble">
      <span class="typing-dots"><span></span><span></span><span></span></span>
    </div>
  `;
  chatMessagesEl.appendChild(typingEl);
  scrollToBottom();

  startTalkingAnimation();

  setTimeout(() => {
    stopTalkingAnimation();
    typingEl.remove();
    if (onDone) onDone();
  }, 900);
}

let talkingInterval = null;

function startTalkingAnimation() {
  const config = moodConfig[lilyMood] || moodConfig.happy;
  let showMouthOpen = false;

  lilyHeroFrame.classList.add('is-talking');

  talkingInterval = setInterval(() => {
    showMouthOpen = !showMouthOpen;
    lilySpriteEl.src = showMouthOpen ? config.talkSprite : config.sprite;
  }, 300);
}

function stopTalkingAnimation() {
  clearInterval(talkingInterval);
  talkingInterval = null;
  lilyHeroFrame.classList.remove('is-talking');
  const config = moodConfig[lilyMood] || moodConfig.happy;
  lilySpriteEl.src = config.sprite;
}

/* --------------------------------------------------------------------
   10. Small helpers
   -------------------------------------------------------------------- */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
