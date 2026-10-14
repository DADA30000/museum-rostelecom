// Модуль виртуального зала (3 режима: 360° панорама, 3 ракурса от входа, 2D-схема залов)

export class HallViewController {
  constructor(containerElement, exhibits, onSelectExhibit) {
    this.container = containerElement;
    this.exhibits = exhibits;
    this.onSelectExhibit = onSelectExhibit;
    this.currentMode = "photos"; // 'panorama' | 'photos' | 'map'
    this.currentPhotoIndex = 0;

    // Ракурсы зала от входа
    this.photoScenes = [
      {
        id: "entrance",
        title: "Ракурс 1: Вид от главного входа",
        subtitle: "Сектор зарождения связи: рабочее место телеграфиста и аппараты Морзе",
        image: "assets/img/hall_entrance.svg",
        exhibits: [1, 2, 3]
      },
      {
        id: "central",
        title: "Ракурс 2: Центральная экспозиция",
        subtitle: "Эпоха телефонизации, коммутаторы, действующий граммофон и военные репродукторы",
        image: "assets/img/hall_central.svg",
        exhibits: [4, 5, 6]
      },
      {
        id: "modern",
        title: "Ракурс 3: Сектор новейшей истории и оптики",
        subtitle: "Бытовая электроника, макет здания на пл. Плеханова, модемы и оптоволокно",
        image: "assets/img/hall_modern.svg",
        exhibits: [7, 8, 9, 10]
      }
    ];

    this.render();
  }

  setMode(mode) {
    this.currentMode = mode;
    this.render();
  }

  setPhotoIndex(idx) {
    this.currentPhotoIndex = idx;
    this.render();
  }

  render() {
    this.container.innerHTML = "";

    // Шапка переключателей режимов зала
    const header = document.createElement("div");
    header.className = "hall-modes-bar";
    header.innerHTML = `
      <div class="modes-toggle-group">
        <button class="mode-btn ${this.currentMode === 'photos' ? 'active' : ''}" data-mode="photos">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          Ракурсы от входа (3 фото)
        </button>
        <button class="mode-btn ${this.currentMode === 'panorama' ? 'active' : ''}" data-mode="panorama">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>
          360° Панорама зала
        </button>
        <button class="mode-btn ${this.currentMode === 'map' ? 'active' : ''}" data-mode="map">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
          Схема музея
        </button>
      </div>
      <div class="hall-hint">
        💡 Нажмите на пульсирующий маркер экспоната для 360°-осмотра и аудиогида
      </div>
    `;

    header.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.addEventListener("click", () => this.setMode(btn.dataset.mode));
    });

    this.container.appendChild(header);

    // Основное видовое пространство
    const viewport = document.createElement("div");
    viewport.className = "hall-viewport";

    if (this.currentMode === "photos") {
      this.renderPhotosMode(viewport);
    } else if (this.currentMode === "panorama") {
      this.renderPanoramaMode(viewport);
    } else if (this.currentMode === "map") {
      this.renderMapMode(viewport);
    }

    this.container.appendChild(viewport);
  }

  // Режим 3 ракурсов от входа
  renderPhotosMode(viewport) {
    const scene = this.photoScenes[this.currentPhotoIndex];

    viewport.innerHTML = `
      <div class="photos-view-container">
        <div class="scene-image-wrapper">
          <div class="museum-hall-canvas-bg" id="hallSceneVisual"></div>
          
          <!-- Хотспоты экспонатов -->
          <div class="hotspots-layer" id="hotspotsLayer"></div>

          <!-- Навигация между 3 ракурсами -->
          <div class="scene-subnav">
            ${this.photoScenes.map((s, i) => `
              <button class="scene-chip ${i === this.currentPhotoIndex ? 'active' : ''}" data-idx="${i}">
                <span class="chip-num">0${i + 1}</span>
                <span class="chip-title">${s.title.split(':')[1] || s.title}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <div class="scene-footer-info">
          <div>
            <h3 class="scene-info-title">${scene.title}</h3>
            <p class="scene-info-sub">${scene.subtitle}</p>
          </div>
          <div class="scene-exhibit-pills">
            ${scene.exhibits.map(id => {
              const ex = this.exhibits.find(e => e.id === id);
              return ex ? `<button class="pill-btn" data-exhibit-id="${ex.id}">№${ex.number} ${ex.name}</button>` : '';
            }).join('')}
          </div>
        </div>
      </div>
    `;

    // Переключение между 3 ракурсами
    viewport.querySelectorAll(".scene-chip").forEach(btn => {
      btn.addEventListener("click", () => this.setPhotoIndex(parseInt(btn.dataset.idx, 10)));
    });

    viewport.querySelectorAll(".pill-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.exhibitId, 10);
        const ex = this.exhibits.find(e => e.id === id);
        if (ex) this.onSelectExhibit(ex);
      });
    });

    // Отрисовка стилизованного зала и хотспотов
    const visual = viewport.querySelector("#hallSceneVisual");
    this.drawHallSceneBackground(visual, this.currentPhotoIndex);

    // Добавляем маркеры экспонатов
    const layer = viewport.querySelector("#hotspotsLayer");
    this.renderHotspotsForScene(layer, scene);
  }

  renderHotspotsForScene(layer, scene) {
    layer.innerHTML = "";
    scene.exhibits.forEach((exId, idx) => {
      const ex = this.exhibits.find(e => e.id === exId);
      if (!ex) return;

      // Расположение хотспотов по витринам в кадре
      const coords = [
        { x: 26, y: 56 },
        { x: 50, y: 52 },
        { x: 74, y: 55 },
        { x: 88, y: 48 }
      ][idx] || { x: 50, y: 50 };

      const spot = document.createElement("div");
      spot.className = "exhibit-hotspot";
      spot.style.left = `${coords.x}%`;
      spot.style.top = `${coords.y}%`;
      spot.setAttribute("role", "button");
      spot.setAttribute("aria-label", `Экспонат ${ex.name}`);

      spot.innerHTML = `
        <div class="hotspot-pulse"></div>
        <div class="hotspot-core">
          <span>№${ex.number}</span>
        </div>
        <div class="hotspot-card">
          <div class="card-tag">${ex.era}</div>
          <div class="card-name">${ex.name}</div>
          <div class="card-action">
            <span>360° Осмотр и аудио</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      `;

      spot.addEventListener("click", () => this.onSelectExhibit(ex));
      layer.appendChild(spot);
    });
  }

  // Режим сферической панорамы 360°
  renderPanoramaMode(viewport) {
    viewport.innerHTML = `
      <div class="panorama-canvas-wrap">
        <canvas id="panoramaCanvas" class="panorama-canvas"></canvas>
        <div class="pano-controls-overlay">
          <div class="pano-hint">↔ Зажмите и перетаскивайте для обзора зала 360°</div>
          <div class="pano-btns">
            <button id="panoLeftBtn" class="control-icon-btn" title="Влево">◀</button>
            <button id="panoRightBtn" class="control-icon-btn" title="Вправо">▶</button>
            <button id="panoResetBtn" class="control-icon-btn" title="К центру">⊙</button>
          </div>
        </div>
      </div>
    `;

    const canvas = viewport.querySelector("#panoramaCanvas");
    this.initPanoramaCanvas(canvas);
  }

  initPanoramaCanvas(canvas) {
    const ctx = canvas.getContext("2d");
    let yaw = 0;
    let isDragging = false;
    let lastX = 0;

    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
      draw();
    };

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Фон панорамного зала с перспективой
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#080D1A");
      grad.addColorStop(0.5, "#141C33");
      grad.addColorStop(1, "#0A0F1D");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Перспективная сетка музейного зала
      ctx.strokeStyle = "rgba(0, 194, 255, 0.15)";
      ctx.lineWidth = 1;
      const step = 60;
      const offset = (yaw % step + step) % step;

      for (let x = offset; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, h * 0.45);
        ctx.lineTo(w / 2 + (x - w / 2) * 2.2, h);
        ctx.stroke();
      }

      // Линия горизонта и стендов
      ctx.beginPath();
      ctx.moveTo(0, h * 0.45);
      ctx.lineTo(w, h * 0.45);
      ctx.strokeStyle = "rgba(119, 44, 232, 0.35)";
      ctx.stroke();

      // Витрины и экспонаты вдоль панорамы
      this.exhibits.forEach((ex, i) => {
        const itemAngle = (i / this.exhibits.length) * 360;
        let diff = (itemAngle - yaw) % 360;
        if (diff < -180) diff += 360;
        if (diff > 180) diff -= 360;

        // Поле зрения ~110 градусов
        if (Math.abs(diff) < 55) {
          const screenX = w / 2 + (diff / 55) * (w / 2);
          const screenY = h * 0.52;

          // Подставка витрины
          ctx.beginPath();
          ctx.ellipse(screenX, screenY + 40, 48, 16, 0, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(0, 194, 255, 0.25)";
          ctx.fill();

          // Стенд
          ctx.fillStyle = "rgba(20, 30, 55, 0.9)";
          ctx.strokeStyle = "rgba(0, 194, 255, 0.6)";
          ctx.lineWidth = 1.5;
          ctx.fillRect(screenX - 35, screenY - 45, 70, 75);
          ctx.strokeRect(screenX - 35, screenY - 45, 70, 75);

          // Метка с номером
          ctx.fillStyle = "#FF5E00";
          ctx.beginPath();
          ctx.arc(screenX, screenY - 60, 14, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#FFFFFF";
          ctx.font = "bold 11px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(`№${ex.number}`, screenX, screenY - 56);

          ctx.fillStyle = "#E2E8F0";
          ctx.font = "600 12px Inter, sans-serif";
          ctx.fillText(ex.name.length > 18 ? ex.name.slice(0, 16) + '...' : ex.name, screenX, screenY + 15);
        }
      });
    };

    canvas.addEventListener("pointerdown", (e) => {
      isDragging = true;
      lastX = e.clientX;
      canvas.setPointerCapture(e.pointerId);
    });

    canvas.addEventListener("pointermove", (e) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      yaw -= dx * 0.35;
      lastX = e.clientX;
      draw();
    });

    const stop = () => { isDragging = false; };
    canvas.addEventListener("pointerup", stop);
    canvas.addEventListener("pointercancel", stop);

    // Клик по экспонату на панораме
    canvas.addEventListener("click", (e) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const w = canvas.width;
      const h = canvas.height;

      this.exhibits.forEach((ex, i) => {
        const itemAngle = (i / this.exhibits.length) * 360;
        let diff = (itemAngle - yaw) % 360;
        if (diff < -180) diff += 360;
        if (diff > 180) diff -= 360;

        if (Math.abs(diff) < 55) {
          const screenX = w / 2 + (diff / 55) * (w / 2);
          const screenY = h * 0.52;
          const dist = Math.hypot(clickX - screenX, clickY - screenY);
          if (dist < 45) {
            this.onSelectExhibit(ex);
          }
        }
      });
    });

    window.addEventListener("resize", resize);
    setTimeout(resize, 50);

    const leftBtn = this.container.querySelector("#panoLeftBtn");
    const rightBtn = this.container.querySelector("#panoRightBtn");
    const resetBtn = this.container.querySelector("#panoResetBtn");

    if (leftBtn) leftBtn.addEventListener("click", () => { yaw += 25; draw(); });
    if (rightBtn) rightBtn.addEventListener("click", () => { yaw -= 25; draw(); });
    if (resetBtn) resetBtn.addEventListener("click", () => { yaw = 0; draw(); });
  }

  // Режим интерактивной схемы зала музея
  renderMapMode(viewport) {
    viewport.innerHTML = `
      <div class="museum-map-container">
        <div class="map-blueprint">
          <div class="map-legend-bar">
            <span>🚪 Главный вход</span>
            <span>➡️ Маршрут осмотра</span>
            <span>🏛️ Музей связи (пл. Плеханова, 5)</span>
          </div>

          <div class="map-stands-grid">
            ${this.exhibits.map(ex => `
              <div class="stand-card" data-exhibit-id="${ex.id}">
                <div class="stand-badge">Стенд №${ex.number}</div>
                <div class="stand-category">${ex.era}</div>
                <div class="stand-title">${ex.name}</div>
                <div class="stand-link">Перейти к 360° осмотру →</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    viewport.querySelectorAll(".stand-card").forEach(card => {
      card.addEventListener("click", () => {
        const id = parseInt(card.dataset.exhibitId, 10);
        const ex = this.exhibits.find(e => e.id === id);
        if (ex) this.onSelectExhibit(ex);
      });
    });
  }

  // Отрисовка атмосферного интерьера зала связи
  drawHallSceneBackground(element, sceneIndex) {
    element.innerHTML = `
      <svg viewBox="0 0 1200 680" class="hall-svg-bg" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0E162B"/>
            <stop offset="60%" stop-color="#141E38"/>
            <stop offset="100%" stop-color="#0B1021"/>
          </linearGradient>
          <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#16223E"/>
            <stop offset="40%" stop-color="#1A2A4D"/>
            <stop offset="100%" stop-color="#0D1426"/>
          </linearGradient>
          <linearGradient id="glowStand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#00C2FF" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#772CE8" stop-opacity="0.05"/>
          </linearGradient>
        </defs>

        <!-- Стены и освещение зала -->
        <rect width="1200" height="420" fill="url(#wallGrad)"/>
        
        <!-- Верхние музейные софиты -->
        <circle cx="280" cy="40" r="140" fill="#00C2FF" opacity="0.07" filter="blur(20px)"/>
        <circle cx="600" cy="40" r="180" fill="#772CE8" opacity="0.08" filter="blur(25px)"/>
        <circle cx="920" cy="40" r="140" fill="#FF5E00" opacity="0.06" filter="blur(20px)"/>

        <!-- Потолочные споты -->
        <line x1="100" y1="20" x2="1100" y2="20" stroke="#22325A" stroke-width="3"/>
        <circle cx="280" cy="20" r="6" fill="#00C2FF"/>
        <circle cx="600" cy="20" r="6" fill="#772CE8"/>
        <circle cx="920" cy="20" r="6" fill="#FF5E00"/>

        <!-- Пол выставочного зала с перспективой -->
        <polygon points="0,420 1200,420 1200,680 0,680" fill="url(#floorGrad)"/>
        
        <!-- Линии стыков плитки / дорожек -->
        <line x1="600" y1="420" x2="600" y2="680" stroke="#24345C" stroke-width="2" stroke-dasharray="8 6"/>
        <line x1="600" y1="420" x2="150" y2="680" stroke="#202F54" stroke-width="1.5"/>
        <line x1="600" y1="420" x2="1050" y2="680" stroke="#202F54" stroke-width="1.5"/>

        <!-- Настенный информационный стенд с историей -->
        <rect x="440" y="90" width="320" height="150" rx="6" fill="#111B33" stroke="#2E4273" stroke-width="2"/>
        <rect x="460" y="110" width="280" height="24" rx="4" fill="#00C2FF" opacity="0.2"/>
        <text x="600" y="127" fill="#00C2FF" font-size="12" font-family="sans-serif" font-weight="bold" text-anchor="middle">
          МУЗЕЙ СВЯЗИ • ЛИПЕЦКИЙ ФИЛИАЛ ПАО «РОСТЕЛЕКОМ»
        </text>
        <line x1="470" y1="150" x2="730" y2="150" stroke="#334B80" stroke-width="1"/>
        <line x1="470" y1="170" x2="690" y2="170" stroke="#334B80" stroke-width="1"/>
        <line x1="470" y1="190" x2="710" y2="190" stroke="#334B80" stroke-width="1"/>
        <line x1="470" y1="210" x2="620" y2="210" stroke="#334B80" stroke-width="1"/>

        <!-- Витрины экспонатов -->
        <!-- Витрина 1 -->
        <rect x="180" y="320" width="180" height="150" rx="8" fill="#131D38" stroke="#00C2FF" stroke-width="1.5"/>
        <rect x="180" y="320" width="180" height="150" fill="url(#glowStand)"/>
        <ellipse cx="270" cy="470" rx="100" ry="24" fill="#0A1024" opacity="0.8"/>

        <!-- Витрина 2 (центральная) -->
        <rect x="500" y="300" width="200" height="170" rx="8" fill="#152040" stroke="#772CE8" stroke-width="1.5"/>
        <rect x="500" y="300" width="200" height="170" fill="url(#glowStand)"/>
        <ellipse cx="600" cy="470" rx="115" ry="26" fill="#0A1024" opacity="0.8"/>

        <!-- Витрина 3 -->
        <rect x="840" y="320" width="180" height="150" rx="8" fill="#131D38" stroke="#FF5E00" stroke-width="1.5"/>
        <rect x="840" y="320" width="180" height="150" fill="url(#glowStand)"/>
        <ellipse cx="930" cy="470" rx="100" ry="24" fill="#0A1024" opacity="0.8"/>
      </svg>
    `;
  }
}
