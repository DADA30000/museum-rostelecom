// Модуль виртуального зала на основе РЕАЛЬНЫХ материалов музея связи Липецка
// 3 режима: 3 ракурса от входа с реальными фото, 360° панорама зала с 2D-навигацией и инерцией, интерактивная 2D-схема

export class HallViewController {
  constructor(containerElement, exhibits, onSelectExhibit) {
    this.container = containerElement;
    this.exhibits = exhibits;
    this.onSelectExhibit = onSelectExhibit;
    this.currentMode = "photos"; // 'photos' | 'panorama' | 'map'
    this.currentPhotoIndex = 0;

    // Реальные ракурсы музея связи (пл. Плеханова, 5)
    this.photoScenes = [
      {
        id: "entrance",
        title: "Ракурс 1: Зал телеграфии и ранней связи",
        subtitle: "Рабочее место телеграфиста XIX в., аппараты Морзе с лентой, настенный телефон",
        image: "assets/img/hall_view_1.webp",
        spots: [
          { exhibitId: 1, x: 26, y: 65 },
          { exhibitId: 3, x: 51, y: 56 },
          { exhibitId: 2, x: 64, y: 62 },
          { exhibitId: 4, x: 89, y: 68 }
        ]
      },
      {
        id: "central",
        title: "Ракурс 2: Центральный зал и технологии",
        subtitle: "Релейная стойка АТС, светящийся макет здания с муралом, граммофон и сварочник КСС-111",
        image: "assets/img/hall_view_2.webp",
        spots: [
          { exhibitId: 4, x: 33, y: 46 },
          { exhibitId: 8, x: 63, y: 48 },
          { exhibitId: 5, x: 71, y: 46 },
          { exhibitId: 10, x: 78, y: 68 }
        ]
      },
      {
        id: "modern",
        title: "Ракурс 3: Радиовещание и бытовая электроника",
        subtitle: "Стойка радиосвязи «Липецк — Москва», военный репродуктор «Тарелка», радиола «Латвия», модемы",
        image: "assets/img/hall_view_3.webp",
        spots: [
          { exhibitId: 4, x: 23, y: 55 },
          { exhibitId: 6, x: 57, y: 34 },
          { exhibitId: 7, x: 68, y: 56 },
          { exhibitId: 9, x: 41, y: 76 }
        ]
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
          Ракурсы зала (3 фото)
        </button>
        <button class="mode-btn ${this.currentMode === 'panorama' ? 'active' : ''}" data-mode="panorama">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>
          Панорама музея
        </button>
        <button class="mode-btn ${this.currentMode === 'map' ? 'active' : ''}" data-mode="map">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
          Схема музея
        </button>
      </div>
      <div class="hall-hint">
        💡 Нажимайте на маркер экспоната для детального осмотра ракурса
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

  // Режим 3 реальных ракурсов зала музея
  renderPhotosMode(viewport) {
    const scene = this.photoScenes[this.currentPhotoIndex];

    viewport.innerHTML = `
      <div class="photos-view-container">
        <div class="scene-image-wrapper">
          <img src="${scene.image}" alt="${scene.title}" class="real-scene-img" id="sceneRealImg" loading="eager">
          
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
            ${scene.spots.map(spot => {
              const ex = this.exhibits.find(e => e.id === spot.exhibitId);
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

    // Расстановка хотспотов на реальном фото
    const layer = viewport.querySelector("#hotspotsLayer");
    this.renderHotspotsForScene(layer, scene);
  }

  renderHotspotsForScene(layer, scene) {
    layer.innerHTML = "";
    scene.spots.forEach((spotData) => {
      const ex = this.exhibits.find(e => e.id === spotData.exhibitId);
      if (!ex) return;

      const spot = document.createElement("div");
      spot.className = "exhibit-hotspot";
      spot.style.left = `${spotData.x}%`;
      spot.style.top = `${spotData.y}%`;
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
            <span>Осмотр ракурса</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      `;

      spot.addEventListener("click", (e) => {
        e.stopPropagation();
        this.onSelectExhibit(ex);
      });
      layer.appendChild(spot);
    });
  }

  // Режим панорамы зала: 2D-навигация (X + Y) с физическим импульсом и инерцией
  renderPanoramaMode(viewport) {
    viewport.innerHTML = `
      <div class="panorama-canvas-wrap">
        <canvas id="panoramaCanvas" class="panorama-canvas"></canvas>
        <div class="pano-controls-overlay">
          <div class="pano-hint">↔ ↕ Зажмите и перетаскивайте в любую сторону для осмотра зала</div>
          <div class="pano-btns">
            <button id="panoLeftBtn" class="control-icon-btn" title="Влево">◀</button>
            <button id="panoRightBtn" class="control-icon-btn" title="Вправо">▶</button>
            <button id="panoUpBtn" class="control-icon-btn" title="Вверх">▲</button>
            <button id="panoDownBtn" class="control-icon-btn" title="Вниз">▼</button>
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
    let scrollX = 0;
    let scrollY = 0;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let velocityX = 0;
    let velocityY = 0;
    let lastTime = 0;

    const panoImg = new Image();
    panoImg.src = "assets/img/hall_panorama.webp";

    const clampY = () => {
      const h = canvas.height;
      if (!panoImg.complete || !h) return;
      const ph = panoImg.naturalHeight;
      const scale = (h * 1.35) / ph;
      const scaledHeight = ph * scale;
      const minY = -(scaledHeight - h);
      const maxY = 0;
      scrollY = Math.max(minY, Math.min(maxY, scrollY));
    };

    const resize = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
      if (panoImg.complete) {
        const ph = panoImg.naturalHeight;
        const scale = (canvas.height * 1.35) / ph;
        scrollY = -(ph * scale - canvas.height) / 2; // центрируем по вертикали
      }
      draw();
    };

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      if (!w || !h) return;

      ctx.clearRect(0, 0, w, h);

      if (panoImg.complete && panoImg.naturalWidth > 0) {
        const pw = panoImg.naturalWidth;
        const ph = panoImg.naturalHeight;
        const scale = (h * 1.35) / ph;
        const scaledWidth = pw * scale;
        const scaledHeight = ph * scale;

        // Бесшовное циклическое рисование панорамы по X
        let x = -((scrollX % scaledWidth + scaledWidth) % scaledWidth);
        while (x < w) {
          ctx.drawImage(panoImg, x, scrollY, scaledWidth, scaledHeight);
          x += scaledWidth;
        }

        // Интерактивные маркеры экспонатов вдоль панорамы
        this.exhibits.forEach((ex, i) => {
          const itemNormalizedX = (i + 0.5) / this.exhibits.length;
          const absoluteX = itemNormalizedX * scaledWidth;
          let screenX = (absoluteX - scrollX) % scaledWidth;
          if (screenX < 0) screenX += scaledWidth;

          if (screenX >= 0 && screenX <= w) {
            const screenY = scrollY + scaledHeight * 0.62;

            ctx.beginPath();
            ctx.arc(screenX, screenY, 16, 0, Math.PI * 2);
            ctx.fillStyle = "#FF5E00";
            ctx.shadowColor = "rgba(255, 94, 0, 0.8)";
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 11px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(`№${ex.number}`, screenX, screenY + 4);

            ctx.fillStyle = "rgba(10, 16, 33, 0.9)";
            const textWidth = ctx.measureText(ex.name).width;
            ctx.fillRect(screenX - textWidth / 2 - 8, screenY + 22, textWidth + 16, 22);

            ctx.fillStyle = "#00C2FF";
            ctx.font = "600 11px Inter, sans-serif";
            ctx.fillText(ex.name, screenX, screenY + 37);
          }
        });
      } else {
        ctx.fillStyle = "#080D1A";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#00C2FF";
        ctx.font = "14px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Загрузка панорамы музея...", w / 2, h / 2);
      }
    };

    panoImg.onload = () => {
      const ph = panoImg.naturalHeight;
      const scale = (canvas.height * 1.35) / ph;
      scrollY = -(ph * scale - canvas.height) / 2;
      draw();
    };

    canvas.addEventListener("pointerdown", (e) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      lastTime = performance.now();
      velocityX = 0;
      velocityY = 0;
      canvas.setPointerCapture(e.pointerId);
    });

    canvas.addEventListener("pointermove", (e) => {
      if (!isDragging) return;
      const now = performance.now();
      const dt = Math.max(now - lastTime, 1);
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;

      velocityX = dx / dt;
      velocityY = dy / dt;

      scrollX -= dx * 1.2;
      scrollY += dy * 1.2;

      lastX = e.clientX;
      lastY = e.clientY;
      lastTime = now;

      clampY();
      draw();
    });

    const stop = (e) => {
      if (isDragging) {
        isDragging = false;
        try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
      }
    };
    canvas.addEventListener("pointerup", stop);
    canvas.addEventListener("pointercancel", stop);

    // Цикл плавной инерции
    const inertiaLoop = () => {
      if (!isDragging && (Math.abs(velocityX) > 0.02 || Math.abs(velocityY) > 0.02)) {
        scrollX -= velocityX * 10;
        scrollY += velocityY * 10;
        velocityX *= 0.92;
        velocityY *= 0.92;
        clampY();
        draw();
      }
      requestAnimationFrame(inertiaLoop);
    };
    requestAnimationFrame(inertiaLoop);

    // Клик по маркеру на панораме
    canvas.addEventListener("click", (e) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const h = canvas.height;

      if (!panoImg.complete) return;
      const ph = panoImg.naturalHeight;
      const scale = (h * 1.35) / ph;
      const scaledWidth = panoImg.naturalWidth * scale;
      const scaledHeight = ph * scale;

      this.exhibits.forEach((ex, i) => {
        const itemNormalizedX = (i + 0.5) / this.exhibits.length;
        const absoluteX = itemNormalizedX * scaledWidth;
        let screenX = (absoluteX - scrollX) % scaledWidth;
        if (screenX < 0) screenX += scaledWidth;

        const screenY = scrollY + scaledHeight * 0.62;
        const dist = Math.hypot(clickX - screenX, clickY - screenY);
        if (dist < 36) {
          this.onSelectExhibit(ex);
        }
      });
    });

    window.addEventListener("resize", resize);
    setTimeout(resize, 60);

    const leftBtn = this.container.querySelector("#panoLeftBtn");
    const rightBtn = this.container.querySelector("#panoRightBtn");
    const upBtn = this.container.querySelector("#panoUpBtn");
    const downBtn = this.container.querySelector("#panoDownBtn");
    const resetBtn = this.container.querySelector("#panoResetBtn");

    if (leftBtn) leftBtn.addEventListener("click", () => { velocityX = 0.8; });
    if (rightBtn) rightBtn.addEventListener("click", () => { velocityX = -0.8; });
    if (upBtn) upBtn.addEventListener("click", () => { velocityY = 0.6; });
    if (downBtn) downBtn.addEventListener("click", () => { velocityY = -0.6; });
    if (resetBtn) resetBtn.addEventListener("click", () => {
      scrollX = 0;
      velocityX = 0;
      velocityY = 0;
      const ph = panoImg.naturalHeight;
      const scale = (canvas.height * 1.35) / ph;
      scrollY = -(ph * scale - canvas.height) / 2;
      draw();
    });
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
                <div class="stand-link">Осмотр ракурса →</div>
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
}
