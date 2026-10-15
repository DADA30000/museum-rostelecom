/**
 * @fileoverview Accessibility Manager (WCAG 2.1 / ГОСТ Р 52872).
 * Manages high-contrast themes, root typography scaling, and accessibility state persistence.
 * @module accessibility
 */

export class AccessibilityManager {
  /**
   * Initializes accessibility state from persistent storage or default parameters.
   */
  constructor() {
    this.isActive = false;
    this.fontSize = "normal"; // 'normal' | 'large' | 'xlarge'
    this.contrastTheme = "black-yellow"; // 'black-yellow' | 'white-black' | 'high-contrast-dark'

    this.init();
  }

  /**
   * Restores persisted user accessibility preferences.
   * @private
   */
  init() {
    const saved = localStorage.getItem("rt_museum_a11y");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.isActive = Boolean(parsed.isActive);
        this.fontSize = parsed.fontSize || "normal";
        this.contrastTheme = parsed.contrastTheme || "black-yellow";
      } catch (_) {
        // Fallback to default state on corrupted storage
      }
    }
    this.applySettings();
  }

  /**
   * Toggles active state of accessibility mode.
   * @param {boolean} [forceState] Optional explicit target state.
   * @returns {boolean} Current active state.
   */
  toggleA11y(forceState) {
    this.isActive = typeof forceState === "boolean" ? forceState : !this.isActive;
    this.saveSettings();
    this.applySettings();
    return this.isActive;
  }

  /**
   * Updates base root typography scale.
   * @param {'normal'|'large'|'xlarge'} size Target font size scale.
   */
  setFontSize(size) {
    this.fontSize = size;
    this.saveSettings();
    this.applySettings();
  }

  /**
   * Updates high-contrast color scheme.
   * @param {'black-yellow'|'white-black'|'high-contrast-dark'} theme Target contrast theme.
   */
  setContrastTheme(theme) {
    this.contrastTheme = theme;
    this.saveSettings();
    this.applySettings();
  }

  /**
   * Persists current accessibility configuration in localStorage.
   * @private
   */
  saveSettings() {
    localStorage.setItem("rt_museum_a11y", JSON.stringify({
      isActive: this.isActive,
      fontSize: this.fontSize,
      contrastTheme: this.contrastTheme
    }));
  }

  /**
   * Synchronizes DOM attributes and styles with the current accessibility configuration.
   * @private
   */
  applySettings() {
    const root = document.documentElement;

    if (this.isActive) {
      root.classList.add("a11y-active");
      root.setAttribute("data-a11y-font", this.fontSize);
      root.setAttribute("data-a11y-theme", this.contrastTheme);

      // Root typography scale mapping
      if (this.fontSize === "large") {
        root.style.fontSize = "20px";
      } else if (this.fontSize === "xlarge") {
        root.style.fontSize = "24px";
      } else {
        root.style.fontSize = "16px";
      }
    } else {
      root.classList.remove("a11y-active");
      root.removeAttribute("data-a11y-font");
      root.removeAttribute("data-a11y-theme");
      root.style.fontSize = "";
    }

    const toggleBtn = document.getElementById("a11yToggleBtn");
    if (toggleBtn) {
      toggleBtn.classList.toggle("active", this.isActive);
      toggleBtn.setAttribute("aria-pressed", String(this.isActive));
    }

    const panel = document.getElementById("a11yPanel");
    if (panel) {
      panel.classList.toggle("hidden", !this.isActive);
    }

    document.querySelectorAll("[data-a11y-set-font]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.a11ySetFont === this.fontSize);
    });

    document.querySelectorAll("[data-a11y-set-theme]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.a11ySetTheme === this.contrastTheme);
    });
  }
}
