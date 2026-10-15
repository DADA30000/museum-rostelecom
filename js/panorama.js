/**
 * @fileoverview Virtual exhibition hall controller.
 * Provides multi-view scene management and a 2D panoramic canvas viewport with momentum inertia.
 * Uses calibrated production coordinates for all exhibit markers.
 * @module panorama
 */

export class HallViewController {
  /**
   * @param {HTMLElement} containerElement Target DOM root for the tour viewport.
   * @param {Array<Object>} exhibits Exhibition catalog data.
   * @param {Function} onSelectExhibit Callback invoked when an exhibit hotspot is selected.
   */
  constructor(containerElement, exhibits, onSelectExhibit) {
    this.container = containerElement;
    this.exhibits = exhibits;
    this.onSelectExhibit = onSelectExhibit;
    this.currentMode = "photos"; // 'photos' | 'panorama'
    this.currentPhotoIndex = 0;

    // Выверенные эталонные координаты экспонатов для ракурсов зала
    this.photoScenes = [
      {
        id: "entrance",
        title: "Ракурс 1: Зал телеграфии и ранней связи",
        subtitle: "Рабочее место телеграфиста XIX в., аппараты Морзе с лентой, настенный телефон",
        image: "assets/img/hall_view_1.webp",
        spots: [
          { exhibitId: 1, x: 30, y: 64 },
          { exhibitId: 3, x: 51, y: 56 },
          { exhibitId: 2, x: 65, y: 63 }
        ]
      },
      {
        id: "central",
        title: "Ракурс 2: Центральный зал и технологии",
        subtitle: "Релейная стойка АТС, светящийся макет здания с муралом, граммофон и сварочник КСС-111",
        image: "assets/img/hall_view_2.webp",
        spots: [
          { exhibitId: 4, x: 33, y: 46 },
          { exhibitId: 8, x: 65, y: 43 },
          { exhibitId: 5, x: 73, y: 46 },
          { exhibitId: 10, x: 70, y: 51 },
          { exhibitId: 9, x: 69, y: 46 }
        ]
      },
      {
        id: "modern",
        title: "Ракурс 3: Радиовещание и бытовая электроника",
        subtitle: "Стойка радиосвязи «Липецк — Москва», военный репродуктор «Тарелка», радиола «Латвия», модемы",
        image: "assets/img/hall_view_3.webp",
        spots: [
          { exhibitId: 6, x: 58, y: 46 },
          { exhibitId: 7, x: 70, y: 53 }
        ]
      }
    ];

    // Выверенные эталонные координаты экспонатов для панорамы зала
    this.panoSpots = [
      { exhibitId: 1, normX: 0.116, normY: 0.608 },
      { exhibitId: 3, normX: 0.183, normY: 0.514 },
      { exhibitId: 2, normX: 0.23, normY: 0.593 },
      { exhibitId: 4, normX: 0.437, normY: 0.417 },
      { exhibitId: 8, normX: 0.546, normY: 0.432 },
      { exhibitId: 5, normX: 0.576, normY: 0.475 },
      { exhibitId: 10, normX: 0.561, normY: 0.439 },
      { exhibitId: 6, normX: 0.844, normY: 0.425 },
      { exhibitId: 7, normX: 0.884, normY: 0.511 },
      { exhibitId: 9, normX: 0.565, normY: 0.511 }
    ];

    this.render();
  }

  /**
   * Sets active tour visualization mode.
   * @param {'photos'|'panorama'} mode Target mode.
   */
  setMode(mode) {
    this.currentMode = mode;
    this.render();
  }

  /**
   * Sets active stationary photo index.
   * @param {number} idx Target scene index.
   */
  setPhotoIndex(idx) {
    this.currentPhotoIndex = idx;
    this.render();
  }

  /**
   * Renders the complete virtual hall DOM layout.
   */
  render() {
    this.container.innerHTML = "";

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
      </div>
    `;

    header.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.addEventListener("click", () => this.setMode(btn.dataset.mode));
    });

    this.container.appendChild(header);

    const viewport = document.createElement("div");
    viewport.className = "hall-viewport";

    if (this.currentMode === "photos") {
      this.renderPhotosMode(viewport);
    } else if (this.currentMode === "panorama") {
      this.renderPanoramaMode(viewport);
    }

    this.container.appendChild(viewport);
  }

  /**
   * Renders stationary photographic scene with hotspot overlay.
   * @param {HTMLElement} viewport Viewport DOM container.
   * @private
   */
  renderPhotosMode(viewport) {
    const scene = this.photoScenes[this.currentPhotoIndex];

    viewport.innerHTML = `
      <div class="photos-view-container">
        <div class="scene-image-wrapper" id="sceneImageWrapper">
          <img src="${scene.image}" alt="${scene.title}" class="real-scene-img" id="sceneRealImg" loading="eager">
          
          <div class="hotspots-layer" id="hotspotsLayer"></div>

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
            ${scene.spots.map((spot) => {
              const ex = this.exhibits.find((e) => e.id === spot.exhibitId);
              return ex ? `<button class="pill-btn" data-exhibit-id="${ex.id}">№${ex.number} ${ex.name}</button>` : '';
            }).join('')}
          </div>
        </div>
      </div>
    `;

    viewport.querySelectorAll(".scene-chip").forEach((btn) => {
      btn.addEventListener("click", () => this.setPhotoIndex(parseInt(btn.dataset.idx, 10)));
    });

    viewport.querySelectorAll(".pill-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.exhibitId, 10);
        const ex = this.exhibits.find((e) => e.id === id);
        if (ex) this.onSelectExhibit(ex);
      });
    });

    const layer = viewport.querySelector("#hotspotsLayer");
    this.renderHotspotsForScene(layer, scene);
  }

  /**
   * Injects interactive hotspot DOM elements for a given stationary scene.
   * @param {HTMLElement} layer Layer element.
   * @param {Object} scene Scene configuration.
   * @private
   */
  renderHotspotsForScene(layer, scene) {
    layer.innerHTML = "";
    scene.spots.forEach((spotData) => {
      const ex = this.exhibits.find((e) => e.id === spotData.exhibitId);
      if (!ex) return;

      const spot = document.createElement("div");
      spot.className = "exhibit-hotspot";
      spot.style.left = `${spotData.x}%`;
      spot.style.top = `${spotData.y}%`;
      spot.setAttribute("role", "button");
      spot.setAttribute("aria-label", `Экспонат ${ex.name}`);

      spot.innerHTML = `
        <div class="hotspot-core">
          <span>№${ex.number}</span>
        </div>
        <div class="hotspot-card">
          <div class="card-tag">${ex.era}</div>
          <div class="card-name">${ex.name}</div>
          <div class="card-action">
            <span>Осмотр экспоната</span>
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

  /**
   * Initializes 2D panoramic canvas viewport with momentum physics.
   * @param {HTMLElement} viewport Viewport DOM container.
   * @private
   */
  renderPanoramaMode(viewport) {
    viewport.innerHTML = `
      <div class="panorama-canvas-wrap" id="panoWrap">
        <canvas id="panoramaCanvas" class="panorama-canvas"></canvas>
        <div class="hotspots-layer" id="panoHotspotsLayer"></div>
        <div class="pano-controls-overlay">
          <div class="pano-hint">↔ ↕ Свободный 2D-обзор зала с инерцией</div>
        </div>
      </div>
    `;

    const canvas = viewport.querySelector("#panoramaCanvas");
    const hotspotsLayer = viewport.querySelector("#panoHotspotsLayer");
    this.initPanoramaCanvas(canvas, hotspotsLayer);
  }

  /**
   * Sets up 2D canvas rendering and inertial interaction loop for cylindrical panorama.
   * @param {HTMLCanvasElement} canvas Target canvas.
   * @param {HTMLElement} hotspotsLayer Overlay container for vector hotspot nodes.
   * @private
   */
  initPanoramaCanvas(canvas, hotspotsLayer) {
    const ctx = canvas.getContext("2d");
    let scrollX = 0;
    let scrollY = 0;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let velocityX = 0;
    let velocityY = 0;
    let lastTime = 0;

    const markerElements = this.panoSpots.map((spotData) => {
      const ex = this.exhibits.find((e) => e.id === spotData.exhibitId);
      if (!ex) return null;

      const spot = document.createElement("div");
      spot.className = "exhibit-hotspot pano-dom-hotspot";
      spot.innerHTML = `
        <div class="hotspot-core">
          <span>№${ex.number}</span>
        </div>
        <div class="hotspot-card">
          <div class="card-tag">${ex.era}</div>
          <div class="card-name">${ex.name}</div>
          <div class="card-action">
            <span>Осмотр экспоната</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      `;

      spot.addEventListener("click", (e) => {
        e.stopPropagation();
        this.onSelectExhibit(ex);
      });

      hotspotsLayer.appendChild(spot);
      return { el: spot, spotData, ex };
    }).filter(Boolean);

    const panoImg = new Image();
    panoImg.src = "assets/img/hall_panorama.webp";

    const clampY = () => {
      const h = canvas.height;
      if (!panoImg.complete || !h) return;
      const ph = panoImg.naturalHeight;
      const scale = (h * 1.08) / ph;
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
        const scale = (canvas.height * 1.08) / ph;
        scrollY = -(ph * scale - canvas.height) / 2;
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
        const scale = (h * 1.08) / ph;
        const scaledWidth = pw * scale;
        const scaledHeight = ph * scale;

        let x = -((scrollX % scaledWidth + scaledWidth) % scaledWidth);
        while (x < w) {
          ctx.drawImage(panoImg, x, scrollY, scaledWidth, scaledHeight);
          x += scaledWidth;
        }

        markerElements.forEach(({ el, spotData }) => {
          const absoluteX = spotData.normX * scaledWidth;
          let screenX = (absoluteX - scrollX) % scaledWidth;
          if (screenX < 0) screenX += scaledWidth;

          if (screenX >= -40 && screenX <= w + 40) {
            const screenY = scrollY + scaledHeight * (spotData.normY || 0.6);
            el.style.display = "block";
            el.style.left = `${screenX}px`;
            el.style.top = `${screenY}px`;
          } else {
            el.style.display = "none";
          }
        });
      } else {
        ctx.fillStyle = "#0B101D";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#94A3B8";
        ctx.font = "500 14px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Загрузка панорамы музея...", w / 2, h / 2);
      }
    };

    panoImg.onload = () => {
      const ph = panoImg.naturalHeight;
      const scale = (canvas.height * 1.08) / ph;
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

    window.addEventListener("resize", resize);
    setTimeout(resize, 60);
  }
}
