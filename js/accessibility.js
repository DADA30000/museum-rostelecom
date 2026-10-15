// Модуль доступности (ОВЗ / версия для слабовидящих по ГОСТ Р 52872)
// Дополнительные баллы по ТЗ хакатона

export class AccessibilityManager {
  constructor() {
    this.isActive = false;
    this.fontSize = "normal"; // 'normal' | 'large' | 'xlarge'
    this.contrastTheme = "black-yellow"; // 'black-yellow' | 'white-black' | 'high-contrast-dark'

    this.init();
  }

  init() {
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

    if (this.isActive) {
      root.classList.add("a11y-active");
      root.setAttribute("data-a11y-font", this.fontSize);
      root.setAttribute("data-a11y-theme", this.contrastTheme);

      // Реальное увеличение базового шрифта страницы
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

    // Обновляем состояние кнопки в шапке
    const toggleBtn = document.getElementById("a11yToggleBtn");
    if (toggleBtn) {
      toggleBtn.classList.toggle("active", this.isActive);
      toggleBtn.setAttribute("aria-pressed", this.isActive.toString());
    }

    const panel = document.getElementById("a11yPanel");
    if (panel) {
      panel.classList.toggle("hidden", !this.isActive);
    }

    // Обновляем активные кнопки внутри панели
    document.querySelectorAll("[data-a11y-set-font]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.a11ySetFont === this.fontSize);
    });

    document.querySelectorAll("[data-a11y-set-theme]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.a11ySetTheme === this.contrastTheme);
    });
  }
}
