document.addEventListener('DOMContentLoaded', () => {

  const chatWindow = document.getElementById('chatWindow');
  const typingIndicator = document.getElementById('typingIndicator');
  const lilyFace = document.getElementById('lilyFace');
  const chatReset = document.getElementById('chatReset');
  const suggestedList = document.getElementById('suggestedList');

  const responses = [
    { keywords: ['overspend', 'over spending', 'spending too much'], reply: "Meow... your expenses are becoming high compared to your income. Let's try reducing unnecessary spending." },
    { keywords: ['health', 'score'], reply: 'Meow! Your financial health score is 78% — that\'s Good! A few small changes could push you into Excellent 🐾' },
    { keywords: ['save more', 'saving', 'savings'], reply: 'Try setting a small automatic transfer to savings right after payday — even ₱200 a week adds up fast. Meow!' },
    { keywords: ['improve', 'better'], reply: 'Trimming your entertainment expenses a little could boost your savings rate nicely this month.' },
    { keywords: ['goal', 'goals'], reply: 'You\'re currently near your savings goal! Keep the pace and you\'ll hit it right on schedule.' },
  ];

  const fallback = "Meow! I'm still learning to answer that one — try asking about your savings, spending, or goals!";

  function getReply(text) {
    const lower = text.toLowerCase();
    const match = responses.find(r => r.keywords.some(k => lower.includes(k)));
    return match ? match.reply : fallback;
  }

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

  function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    appendMessage(trimmed, 'user');

    typingIndicator.hidden = false;
    lilyFace.classList.add('is-talking');
    scrollToBottom();

    const delay = 900 + Math.random() * 700;
    setTimeout(() => {
      typingIndicator.hidden = true;
      lilyFace.classList.remove('is-talking');
      appendMessage(getReply(trimmed), 'lily');
    }, delay);
  }

  suggestedList.querySelectorAll('.suggested-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      sendMessage(chip.textContent);
    });
  });

  chatReset.addEventListener('click', () => {
    chatWindow.innerHTML = '';
    appendMessage("Meow! I'm Lily, your financial health coach. Ask me anything about your money — savings, spending, or goals 🐾", 'lily');
  });

});
