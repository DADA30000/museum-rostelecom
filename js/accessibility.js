// Модуль доступности (ОВЗ / версия для слабовидящих по ГОСТ Р 52872)
// Дополнительные баллы по ТЗ хакатона

export class AccessibilityManager {
  constructor() {
    this.isActive = false;
    this.fontSize = "normal"; // 'normal' | 'large' | 'xlarge'
    this.contrastTheme = "black-yellow"; // 'black-yellow' | 'white-black' | 'high-contrast-dark'
    this.synth = window.speechSynthesis || null;
    this.isSpeaking = false;

    this.init();
  }

  init() {
    // Восстановление настроек из localStorage
    const saved = localStorage.getItem("rt_museum_a11y");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.isActive = parsed.isActive || false;
        this.fontSize = parsed.fontSize || "normal";
        this.contrastTheme = parsed.contrastTheme || "black-yellow";
      } catch (_) {}
    }
    this.applySettings();
  }

  toggleA11y(forceState) {
    this.isActive = typeof forceState === "boolean" ? forceState : !this.isActive;
    this.saveSettings();
    this.applySettings();
    return this.isActive;
  }

  setFontSize(size) {
    this.fontSize = size;
    this.saveSettings();
    this.applySettings();
  }

  setContrastTheme(theme) {
    this.contrastTheme = theme;
    this.saveSettings();
    this.applySettings();
  }

  saveSettings() {
    localStorage.setItem("rt_museum_a11y", JSON.stringify({
      isActive: this.isActive,
      fontSize: this.fontSize,
      contrastTheme: this.contrastTheme
    }));
  }

  applySettings() {
    const root = document.documentElement;
    const body = document.body;

    if (this.isActive) {
      body.classList.add("a11y-active");
      body.setAttribute("data-a11y-font", this.fontSize);
      body.setAttribute("data-a11y-theme", this.contrastTheme);
    } else {
      body.classList.remove("a11y-active");
      body.removeAttribute("data-a11y-font");
      body.removeAttribute("data-a11y-theme");
    }

    // Обновляем состояние кнопки в UI
    const toggleBtn = document.getElementById("a11yToggleBtn");
    if (toggleBtn) {
      toggleBtn.classList.toggle("active", this.isActive);
      toggleBtn.setAttribute("aria-pressed", this.isActive.toString());
    }

    const panel = document.getElementById("a11yPanel");
    if (panel) {
      panel.classList.toggle("hidden", !this.isActive);
    }
  }

  // Голосовое чтение текста для незрячих и слабовидящих
  speakText(text, onEnd) {
    if (!this.synth) {
      alert("Синтез речи не поддерживается вашим браузером");
      return;
    }

    this.stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ru-RU";
    utterance.rate = 0.95; // комфортный темп

    utterance.onend = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    this.isSpeaking = true;
    this.synth.speak(utterance);
  }

  stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.isSpeaking = false;
  }
}
