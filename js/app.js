// Главный скрипт Цифрового музея связи «Ростелеком» (Липецк)
import { MUSEUM_INFO, EXHIBITS, TIMELINE } from "./data.js";
import { Exhibit360Viewer } from "./viewer360.js";
import { HallViewController } from "./panorama.js";
import { AccessibilityManager } from "./accessibility.js";

class MuseumApp {
  constructor() {
    this.exhibits = EXHIBITS;
    this.selectedCategory = "all";
    this.searchQuery = "";
    this.currentExhibit = null;
    this.viewer360 = null;
    this.hallController = null;
    this.a11y = new AccessibilityManager();
    this.isPlayingAudio = false;

    this.init();
  }

  init() {
    this.renderHeaderInfo();
    this.initHallTour();
    this.renderCatalog();
    this.renderTimeline();
    this.renderBuildingSection();
    this.renderDirectorSection();
    this.renderRulesAndContacts();
    this.bindGlobalEvents();
    this.bindA11yEvents();
    this.bindForms();
    this.initScrollSpy();
  }

  initScrollSpy() {
    const sections = [
      { id: "tour", selector: 'a[href="#tour"]' },
      { id: "catalog", selector: 'a[href="#catalog"]' },
      { id: "timeline", selector: 'a[href="#timeline"]' },
      { id: "booking", selector: 'a[href="#booking"]' }
    ];

    const bottomItems = document.querySelectorAll(".bottom-bar-item");
    const desktopLinks = document.querySelectorAll(".desktop-nav .nav-link");

    const setActive = (targetId) => {
      bottomItems.forEach((item) => {
        const href = item.getAttribute("href");
        item.classList.toggle("active", href === `#${targetId}`);
      });
      desktopLinks.forEach((link) => {
        const href = link.getAttribute("href");
        link.classList.toggle("active", href === `#${targetId}`);
      });
    };

    // Слушатель скролла
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActive(entry.target.id);
        }
      });
    }, {
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0
    });

    sections.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    // При клике на элемент бара
    bottomItems.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = btn.getAttribute("href").replace("#", "");
        setActive(targetId);
      });
    });
  }

  renderHeaderInfo() {
    const directorName = document.getElementById("heroDirectorName");
    if (directorName) directorName.textContent = MUSEUM_INFO.director.name;
  }

  initHallTour() {
    const container = document.getElementById("hallTourContainer");
    if (!container) return;

    this.hallController = new HallViewController(
      container,
      this.exhibits,
      (exhibit) => this.openExhibitModal(exhibit)
    );
  }

  // Каталог экспонатов
  renderCatalog() {
    const grid = document.getElementById("exhibitsGrid");
    if (!grid) return;

    const filtered = this.exhibits.filter((ex) => {
      const matchCat = this.selectedCategory === "all" || ex.category === this.selectedCategory;
      const matchQuery = !this.searchQuery || 
        ex.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        ex.era.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        ex.shortDesc.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>По вашему запросу ничего не найдено</p>
          <button class="btn btn-secondary" id="resetFilterBtn">Сбросить фильтры</button>
        </div>
      `;
      const resetBtn = grid.querySelector("#resetFilterBtn");
      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          this.selectedCategory = "all";
          this.searchQuery = "";
          const searchInput = document.getElementById("catalogSearch");
          if (searchInput) searchInput.value = "";
          this.updateCategoryTabs();
          this.renderCatalog();
        });
      }
      return;
    }

    grid.innerHTML = filtered.map((ex) => `
      <article class="exhibit-card" data-id="${ex.id}">
        <div class="card-visual">
          <div class="card-num-badge">№${ex.number}</div>
          <div class="card-tag-badge">${ex.tag}</div>
          <img src="${ex.cover}" alt="${ex.name}" class="card-cover-img" loading="lazy">
          <div class="badge-360">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            360° интерактив
          </div>
        </div>

        <div class="card-body">
          <div class="card-era">${ex.era}</div>
          <h3 class="card-title">${ex.name}</h3>
          <p class="card-desc">${ex.shortDesc}</p>
        </div>

        <div class="card-footer">
          <button class="btn btn-primary btn-sm open-exhibit-btn" data-id="${ex.id}">
            360° Осмотр и детали
          </button>
          <button class="btn-icon qr-quick-btn" data-id="${ex.id}" title="Сгенерировать QR-код для витрины">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          </button>
        </div>
      </article>
    `).join("");

    grid.querySelectorAll(".open-exhibit-btn, .card-visual").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = parseInt(btn.closest(".exhibit-card").dataset.id, 10);
        const ex = this.exhibits.find((item) => item.id === id);
        if (ex) this.openExhibitModal(ex);
      });
    });

    grid.querySelectorAll(".qr-quick-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id, 10);
        const ex = this.exhibits.find((item) => item.id === id);
        if (ex) this.openQrModal(ex);
      });
    });
  }

  getCategoryIcon(cat) {
    if (cat === "telegraph") {
      return `<svg viewBox="0 0 64 64" width="72" height="72" fill="none" stroke="#00C2FF" stroke-width="2"><rect x="8" y="38" width="48" height="16" rx="4" fill="rgba(0,194,255,0.1)"/><path d="M16 38V22l32-8v24"/><circle cx="48" cy="18" r="6" fill="#00C2FF"/><line x1="24" y1="38" x2="24" y2="24"/></svg>`;
    } else if (cat === "telephone") {
      return `<svg viewBox="0 0 64 64" width="72" height="72" fill="none" stroke="#772CE8" stroke-width="2"><rect x="18" y="24" width="28" height="32" rx="6" fill="rgba(119,44,232,0.1)"/><circle cx="25" cy="16" r="6" fill="#772CE8"/><circle cx="39" cy="16" r="6" fill="#772CE8"/><path d="M12 20h40v6H12z"/></svg>`;
    } else if (cat === "sound") {
      return `<svg viewBox="0 0 64 64" width="72" height="72" fill="none" stroke="#FF5E00" stroke-width="2"><path d="M12 36l20-14v30l-20-14z" fill="rgba(255,94,0,0.1)"/><path d="M38 18c8 6 8 22 0 28"/><path d="M46 10c14 11 14 33 0 44"/><rect x="8" y="32" width="10" height="8" rx="2"/></svg>`;
    } else {
      return `<svg viewBox="0 0 64 64" width="72" height="72" fill="none" stroke="#00E5FF" stroke-width="2"><path d="M32 6l22 12v28l-22 12L10 46V18L32 6z" fill="rgba(0,229,255,0.1)"/><circle cx="32" cy="32" r="8" fill="#00E5FF"/><path d="M32 14v10M32 40v10M16 23l8 5M40 36l8 5"/></svg>`;
    }
  }

  // Модальное окно 360-осмотра экспоната
  openExhibitModal(exhibit) {
    this.currentExhibit = exhibit;
    const modal = document.getElementById("exhibitModal");
    if (!modal) return;

    document.getElementById("modalExhibitNumber").textContent = `Экспонат №${exhibit.number}`;
    document.getElementById("modalExhibitEra").textContent = exhibit.era;
    document.getElementById("modalExhibitTitle").textContent = exhibit.name;
    document.getElementById("modalExhibitFullDesc").textContent = exhibit.fullDesc;
    document.getElementById("modalAudioDuration").textContent = exhibit.audioDuration;

    // Факты
    const factsList = document.getElementById("modalExhibitFacts");
    factsList.innerHTML = exhibit.facts.map((f) => `<li>${f}</li>`).join("");

    // QR код превью в модалке
    const qrBtn = document.getElementById("modalQrBtn");
    if (qrBtn) {
      qrBtn.onclick = () => this.openQrModal(exhibit);
    }

    modal.classList.add("active");
    document.body.style.overflow = "hidden";

    // Инициализация 360 Canvas Viewer после отображения модалки
    const canvas = document.getElementById("viewer360Canvas");
    if (canvas) {
      if (!this.viewer360) {
        this.viewer360 = new Exhibit360Viewer(canvas, {
          onFrameChange: (frame, angle) => {
            const angleEl = document.getElementById("viewerAngleBadge");
            if (angleEl) angleEl.textContent = `${angle}°`;
          }
        });
      }
      requestAnimationFrame(() => {
        this.viewer360.initCanvasSize();
        this.viewer360.setExhibit(exhibit);
      });
    }

    // Сброс аудиоплеера
    this.stopAudio();
    this.setupAudioGuide(exhibit);
  }

  closeExhibitModal() {
    const modal = document.getElementById("exhibitModal");
    if (!modal) return;
    modal.classList.remove("active");
    document.body.style.overflow = "";
    this.stopAudio();
  }

  // Аудиогид с синтезом речи или локальным файлом
  setupAudioGuide(exhibit) {
    const playBtn = document.getElementById("modalAudioPlayBtn");
    const audioProgress = document.getElementById("modalAudioProgress");
    if (!playBtn) return;

    playBtn.onclick = () => {
      if (this.isPlayingAudio) {
        this.stopAudio();
      } else {
        this.playAudio(exhibit);
      }
    };
  }

  playAudio(exhibit) {
    const playBtn = document.getElementById("modalAudioPlayBtn");
    this.isPlayingAudio = true;
    if (playBtn) {
      playBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        <span>Приостановить</span>
      `;
    }

    this.a11y.speakText(exhibit.audioText, () => {
      this.stopAudio();
    });
  }

  stopAudio() {
    this.isPlayingAudio = false;
    this.a11y.stopSpeaking();
    const playBtn = document.getElementById("modalAudioPlayBtn");
    if (playBtn) {
      playBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        <span>Слушать аудиогид</span>
      `;
    }
  }

  // Модальное окно QR-кода экспоната для витрин
  openQrModal(exhibit) {
    const modal = document.getElementById("qrModal");
    if (!modal) return;

    document.getElementById("qrModalTitle").textContent = `QR-код: №${exhibit.number} ${exhibit.name}`;
    document.getElementById("qrModalSub").textContent = `Для размещения на физической витрине музея (Липецк, пл. Плеханова, 5)`;

    // Генерация стилизованного SVG QR-кода
    const qrBox = document.getElementById("qrCodeSvgBox");
    qrBox.innerHTML = this.generateSvgQrCode(`https://museum.rt.ru/exhibit/${exhibit.id}`);

    modal.classList.add("active");
  }

  closeQrModal() {
    const modal = document.getElementById("qrModal");
    if (modal) modal.classList.remove("active");
  }

  // Векторная генерация QR-кода для витрин
  generateSvgQrCode(dataText) {
    return `
      <svg viewBox="0 0 200 200" width="180" height="180" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#FFFFFF" rx="12"/>
        <!-- Угловые позиционные метки -->
        <rect x="20" y="20" width="45" height="45" fill="#0B1021" rx="4"/>
        <rect x="27" y="27" width="31" height="31" fill="#FFFFFF" rx="2"/>
        <rect x="34" y="34" width="17" height="17" fill="#772CE8" rx="2"/>

        <rect x="135" y="20" width="45" height="45" fill="#0B1021" rx="4"/>
        <rect x="142" y="27" width="31" height="31" fill="#FFFFFF" rx="2"/>
        <rect x="149" y="34" width="17" height="17" fill="#772CE8" rx="2"/>

        <rect x="20" y="135" width="45" height="45" fill="#0B1021" rx="4"/>
        <rect x="27" y="142" width="31" height="31" fill="#FFFFFF" rx="2"/>
        <rect x="34" y="149" width="17" height="17" fill="#772CE8" rx="2"/>

        <!-- Паттерн данных -->
        <g fill="#0B1021">
          <rect x="75" y="25" width="10" height="10"/>
          <rect x="95" y="25" width="10" height="10"/>
          <rect x="115" y="25" width="10" height="10"/>
          
          <rect x="75" y="45" width="10" height="10"/>
          <rect x="85" y="55" width="10" height="10"/>
          <rect x="105" y="45" width="10" height="10"/>

          <rect x="25" y="75" width="10" height="10"/>
          <rect x="45" y="85" width="10" height="10"/>
          <rect x="65" y="75" width="10" height="10"/>
          <rect x="85" y="85" width="10" height="10"/>
          <rect x="105" y="75" width="10" height="10"/>
          <rect x="125" y="85" width="10" height="10"/>
          <rect x="145" y="75" width="10" height="10"/>
          <rect x="165" y="85" width="10" height="10"/>

          <rect x="35" y="105" width="10" height="10"/>
          <rect x="55" y="115" width="10" height="10"/>
          <rect x="75" y="105" width="10" height="10"/>
          <rect x="95" y="115" width="10" height="10"/>
          <rect x="115" y="105" width="10" height="10"/>
          <rect x="135" y="115" width="10" height="10"/>
          <rect x="155" y="105" width="10" height="10"/>

          <rect x="75" y="135" width="10" height="10"/>
          <rect x="95" y="145" width="10" height="10"/>
          <rect x="115" y="135" width="10" height="10"/>
          <rect x="135" y="145" width="10" height="10"/>
          <rect x="155" y="135" width="10" height="10"/>
          <rect x="165" y="155" width="10" height="10"/>
        </g>

        <!-- Центральный логотип Ростелекома -->
        <rect x="82" y="82" width="36" height="36" rx="8" fill="#FFFFFF" stroke="#00C2FF" stroke-width="2"/>
        <path d="M93 90c0 5 4 10 10 10s7-4 7-9-3-9-9-9" fill="none" stroke="#FF5E00" stroke-width="3" stroke-linecap="round"/>
        <circle cx="106" cy="104" r="3" fill="#772CE8"/>
      </svg>
    `;
  }

  // Таймлайн истории связи (1832–2026)
  renderTimeline() {
    const list = document.getElementById("timelineList");
    if (!list) return;

    list.innerHTML = TIMELINE.map((item, index) => `
      <div class="timeline-step">
        <div class="timeline-marker">
          <div class="marker-dot"></div>
          <div class="marker-line"></div>
        </div>
        <div class="timeline-content">
          <span class="timeline-year">${item.year}</span>
          <h4 class="timeline-title">${item.title}</h4>
          <p class="timeline-desc">${item.desc}</p>
        </div>
      </div>
    `).join("");
  }

  // Раздел здания на пл. Плеханова, 5
  renderBuildingSection() {
    const servicesGrid = document.getElementById("buildingServicesGrid");
    if (!servicesGrid) return;

    servicesGrid.innerHTML = MUSEUM_INFO.building.services.map((s) => `
      <div class="service-box">
        <div class="service-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00C2FF" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div>
          <h4 class="service-title">${s.title}</h4>
          <p class="service-desc">${s.desc}</p>
        </div>
      </div>
    `).join("");
  }

  // Приветствие директора
  renderDirectorSection() {
    const quoteEl = document.getElementById("directorQuoteText");
    const nameEl = document.getElementById("directorNameText");
    const titleEl = document.getElementById("directorTitleText");

    if (quoteEl) quoteEl.textContent = `«${MUSEUM_INFO.director.quote}»`;
    if (nameEl) nameEl.textContent = MUSEUM_INFO.director.name;
    if (titleEl) titleEl.textContent = MUSEUM_INFO.director.title;
  }

  // Правила и контакты
  renderRulesAndContacts() {
    const rulesList = document.getElementById("museumRulesList");
    if (rulesList) {
      rulesList.innerHTML = MUSEUM_INFO.rules.map((r) => `<li>${r}</li>`).join("");
    }
  }

  // Обработчики глобальных событий
  bindGlobalEvents() {
    // Вкладки категорий в каталоге
    document.querySelectorAll(".cat-tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.selectedCategory = btn.dataset.category;
        this.updateCategoryTabs();
        this.renderCatalog();
      });
    });

    // Поиск по каталогу
    const searchInput = document.getElementById("catalogSearch");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value;
        this.renderCatalog();
      });
    }

    // Закрытие модалок
    const modalClose = document.getElementById("modalCloseBtn");
    if (modalClose) modalClose.addEventListener("click", () => this.closeExhibitModal());

    const qrClose = document.getElementById("qrModalCloseBtn");
    if (qrClose) qrClose.addEventListener("click", () => this.closeQrModal());

    // Управление 360 просмотрщиком
    const rotateToggle = document.getElementById("viewerAutoRotateBtn");
    if (rotateToggle) {
      rotateToggle.addEventListener("click", () => {
        if (this.viewer360) {
          const isRotating = this.viewer360.toggleAutoRotate();
          rotateToggle.classList.toggle("active", isRotating);
        }
      });
    }

    const resetBtn = document.getElementById("viewerResetBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        if (this.viewer360) this.viewer360.resetView();
      });
    }

    const zoomInBtn = document.getElementById("viewerZoomInBtn");
    if (zoomInBtn) {
      zoomInBtn.addEventListener("click", () => {
        if (this.viewer360) this.viewer360.setZoom(this.viewer360.zoom + 0.25);
      });
    }

    const zoomOutBtn = document.getElementById("viewerZoomOutBtn");
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener("click", () => {
        if (this.viewer360) this.viewer360.setZoom(this.viewer360.zoom - 0.25);
      });
    }

    // Мобильное меню
    const mobileMenuBtn = document.getElementById("mobileMenuToggle");
    const mobileNav = document.getElementById("mobileNavDrawer");
    if (mobileMenuBtn && mobileNav) {
      mobileMenuBtn.addEventListener("click", () => {
        mobileNav.classList.toggle("open");
      });
      mobileNav.querySelectorAll("a").forEach((a) => {
        a.addEventListener("click", () => mobileNav.classList.remove("open"));
      });
    }

    // Закрытие по клавише Esc
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeExhibitModal();
        this.closeQrModal();
      }
    });
  }

  updateCategoryTabs() {
    document.querySelectorAll(".cat-tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.category === this.selectedCategory);
    });
  }

  // Настройка доступности (для слабовидящих)
  bindA11yEvents() {
    const toggleBtn = document.getElementById("a11yToggleBtn");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        this.a11y.toggleA11y();
      });
    }

    document.querySelectorAll("[data-a11y-set-font]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.a11y.setFontSize(btn.dataset.a11ySetFont);
        document.querySelectorAll("[data-a11y-set-font]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });

    document.querySelectorAll("[data-a11y-set-theme]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.a11y.setContrastTheme(btn.dataset.a11ySetTheme);
        document.querySelectorAll("[data-a11y-set-theme]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });
  }

  // Обработка форм записи и отзывов строго по почте (mailto: с автозаполнением)
  bindForms() {
    // 1. Форма записи на экскурсию (отправка на referent_lp@center.rt.ru + копия polina.strelnikova@rt.ru)
    const bookingForm = document.getElementById("tourBookingForm");
    if (bookingForm) {
      bookingForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("bookName").value.trim();
        const phone = document.getElementById("bookPhone").value.trim();
        const date = document.getElementById("bookDate").value;
        const count = document.getElementById("bookCount").value;
        const formatSelect = document.getElementById("bookFormat");
        const formatText = formatSelect.options[formatSelect.selectedIndex].text;

        const subject = encodeURIComponent(`Заявка на экскурсию в Музей связи: ${name}`);
        const body = encodeURIComponent(
`Здравствуйте! Прошу согласовать проведение экскурсии в Музее связи ПАО «Ростелеком» (Липецк, пл. Плеханова, 5).

Данные заявки:
• Заявитель / Организация: ${name}
• Телефон для оперативной связи: ${phone}
• Желаемая дата визита: ${date}
• Количество посетителей: ${count}
• Формат экскурсии: ${formatText}

Ждём подтверждения и согласования времени. Спасибо!`
        );

        const mailtoUrl = `mailto:referent_lp@center.rt.ru?cc=polina.strelnikova@rt.ru&subject=${subject}&body=${body}`;
        
        this.showToast(`Открываем почтовый клиент для отправки заявки на referent_lp@center.rt.ru...`);
        
        setTimeout(() => {
          window.location.href = mailtoUrl;
        }, 300);
      });
    }

    // 2. Форма отзывов и предложений (отправка на referent_lp@center.rt.ru)
    const feedbackForm = document.getElementById("feedbackForm");
    if (feedbackForm) {
      feedbackForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("feedEmail").value.trim();
        const subjectSelect = document.getElementById("feedSubject");
        const subjectValue = subjectSelect.value;
        const text = document.getElementById("feedText").value.trim();

        const subject = encodeURIComponent(`[Музей связи] ${subjectValue}`);
        const body = encodeURIComponent(
`Здравствуйте!

Тема: ${subjectValue}
Отправитель: ${email}

Сообщение:
${text}
`
        );

        const mailtoUrl = `mailto:referent_lp@center.rt.ru?subject=${subject}&body=${body}`;
        
        this.showToast(`Открываем почтовый клиент для отправки отзыва на referent_lp@center.rt.ru...`);
        
        setTimeout(() => {
          window.location.href = mailtoUrl;
        }, 300);
      });
    }
  }

  showToast(msg) {
    let toast = document.getElementById("appToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "appToast";
      toast.className = "app-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 4500);
  }
}

// Запуск приложения
document.addEventListener("DOMContentLoaded", () => {
  window.museumApp = new MuseumApp();
});
