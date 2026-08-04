/**
 * Global Loader Controller
 */
const Loader = {
  overlayEl: null,
  textEl: null,

  init() {
    this.overlayEl = document.getElementById('global-loader');
    this.textEl = document.getElementById('global-loader-text');
  },

  show(message = 'Loading...') {
    if (!this.overlayEl) this.init();
    if (this.textEl) this.textEl.textContent = message;
    if (this.overlayEl) {
      this.overlayEl.classList.remove('loader-overlay--hidden');
      this.overlayEl.setAttribute('aria-hidden', 'false');
    }
  },

  hide() {
    if (!this.overlayEl) this.init();
    if (this.overlayEl) {
      this.overlayEl.classList.add('loader-overlay--hidden');
      this.overlayEl.setAttribute('aria-hidden', 'true');
    }
  }
};

// Auto-initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => Loader.init());