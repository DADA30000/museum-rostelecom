// 360° Интерактивный просмотрщик экспонатов (Canvas + Image Sequence / Procedural 3D Fallback)
// Оптимизирован для мобильных устройств (touch-action, инерция, 60fps)

export class Exhibit360Viewer {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext("2d");
    this.totalFrames = options.totalFrames || 36;
    this.currentFrame = 0;
    this.images = [];
    this.isLoading = false;
    this.isDragging = false;
    this.startX = 0;
    this.lastX = 0;
    this.velocityX = 0;
    this.lastTime = 0;
    this.isAutoRotating = false;
    this.autoRotateSpeed = 0.4;
    this.zoom = 1;
    this.minZoom = 0.8;
    this.maxZoom = 2.5;
    this.exhibitData = options.exhibitData || null;

    this.onFrameChange = options.onFrameChange || null;

    this.initCanvasSize();
    this.bindEvents();
    this.startLoop();
  }

  initCanvasSize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width || 600;
    const height = rect.height || 450;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.scale(dpr, dpr);
    this.displayWidth = width;
    this.displayHeight = height;
  }

  setExhibit(exhibit) {
    this.exhibitData = exhibit;
    this.currentFrame = 0;
    this.zoom = 1;
    this.velocityX = 0;
    // Если есть реальные кадры:
    if (exhibit && exhibit.frames && exhibit.frames.length > 0) {
      this.loadFrames(exhibit.frames);
    } else {
      this.images = [];
    }
    this.render();
  }

  loadFrames(frameUrls) {
    this.isLoading = true;
    this.totalFrames = frameUrls.length;
    let loadedCount = 0;
    this.images = [];

    frameUrls.forEach((url, i) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === frameUrls.length) {
          this.isLoading = false;
          this.render();
        }
      };
      img.onerror = () => {
        // Fallback to procedural if files not found yet
        this.isLoading = false;
      };
      this.images[i] = img;
    });
  }

  bindEvents() {
    const c = this.canvas;

    c.addEventListener("pointerdown", (e) => {
      this.isDragging = true;
      this.isAutoRotating = false;
      this.startX = e.clientX;
      this.lastX = e.clientX;
      this.lastTime = performance.now();
      this.velocityX = 0;
      c.setPointerCapture(e.pointerId);
      c.style.cursor = "grabbing";
    });

    c.addEventListener("pointermove", (e) => {
      if (!this.isDragging) return;
      const now = performance.now();
      const dt = Math.max(now - this.lastTime, 1);
      const deltaX = e.clientX - this.lastX;

      this.velocityX = deltaX / dt;
      this.lastX = e.clientX;
      this.lastTime = now;

      // Чувствительность вращения:
      const sensitivity = 6;
      const frameDelta = -deltaX / sensitivity;
      this.stepFrame(frameDelta);
    });

    const endDrag = (e) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      c.style.cursor = "grab";
      try {
        c.releasePointerCapture(e.pointerId);
      } catch (_) {}
    };

    c.addEventListener("pointerup", endDrag);
    c.addEventListener("pointercancel", endDrag);

    // Колесико мыши для зума
    c.addEventListener("wheel", (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      this.setZoom(this.zoom * zoomFactor);
    }, { passive: false });

    window.addEventListener("resize", () => {
      this.initCanvasSize();
      this.render();
    });
  }

  stepFrame(delta) {
    this.currentFrame = (this.currentFrame + delta) % this.totalFrames;
    if (this.currentFrame < 0) this.currentFrame += this.totalFrames;
    if (this.onFrameChange) {
      const angle = Math.round((this.currentFrame / this.totalFrames) * 360) % 360;
      this.onFrameChange(Math.round(this.currentFrame), angle);
    }
    this.render();
  }

  setZoom(val) {
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, val));
    this.render();
  }

  toggleAutoRotate() {
    this.isAutoRotating = !this.isAutoRotating;
    return this.isAutoRotating;
  }

  resetView() {
    this.currentFrame = 0;
    this.zoom = 1;
    this.velocityX = 0;
    this.isAutoRotating = false;
    this.render();
  }

  startLoop() {
    const loop = () => {
      if (this.isAutoRotating && !this.isDragging) {
        this.stepFrame(this.autoRotateSpeed);
      } else if (!this.isDragging && Math.abs(this.velocityX) > 0.02) {
        // Затухание инерции
        this.stepFrame(-this.velocityX * 3);
        this.velocityX *= 0.92;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  render() {
    const ctx = this.ctx;
    const w = this.displayWidth;
    const h = this.displayHeight;

    ctx.clearRect(0, 0, w, h);

    const frameIndex = Math.floor(this.currentFrame) % this.totalFrames;

    // 1. Если загружены реальные кадры:
    if (this.images.length > 0 && this.images[frameIndex] && this.images[frameIndex].complete && this.images[frameIndex].naturalWidth > 0) {
      const img = this.images[frameIndex];
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      const scale = Math.min((w * 0.85) / nw, (h * 0.85) / nh) * this.zoom;
      const dw = nw * scale;
      const dh = nh * scale;
      const dx = (w - dw) / 2;
      const dy = (h - dh) / 2;

      ctx.save();
      // Легкая тень под объектом
      ctx.beginPath();
      ctx.ellipse(w / 2, h * 0.82, dw * 0.4, 18, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.filter = "blur(8px)";
      ctx.fill();
      ctx.filter = "none";

      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
    } else {
      // 2. Высококачественный процедурный 3D-рендерер плейсхолдера
      this.renderProceduralExhibit(ctx, w, h, frameIndex);
    }
  }

  // Отрисовка интерактивного стилизованного 3D-экспоната (Телеграф / Винтажный телефон)
  renderProceduralExhibit(ctx, w, h, frameIndex) {
    const angle = (frameIndex / this.totalFrames) * Math.PI * 2;
    const cx = w / 2;
    const cy = h / 2 + 10;
    const scale = this.zoom * (Math.min(w, h) / 380);

    ctx.save();

    // Мягкий музейный пьедестал и градиентная тень
    ctx.beginPath();
    ctx.ellipse(cx, cy + 95 * scale, 130 * scale, 34 * scale, 0, 0, Math.PI * 2);
    const shadowGrad = ctx.createRadialGradient(cx, cy + 95 * scale, 10 * scale, cx, cy + 95 * scale, 130 * scale);
    shadowGrad.addColorStop(0, "rgba(0, 194, 255, 0.25)");
    shadowGrad.addColorStop(0.3, "rgba(10, 16, 33, 0.7)");
    shadowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = shadowGrad;
    ctx.fill();

    // Базовый диск витрины
    ctx.beginPath();
    ctx.ellipse(cx, cy + 85 * scale, 110 * scale, 24 * scale, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(22, 33, 62, 0.85)";
    ctx.strokeStyle = "rgba(0, 194, 255, 0.5)";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    // 3D-вращение объекта (аксонометрическая проекция с псевдо-3D)
    ctx.translate(cx, cy);

    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // Цвет древесины и латуни
    const woodDark = "#4A2810";
    const woodLight = "#7B4B27";
    const brassLight = "#F6D365";
    const brassDark = "#B78A22";
    const steel = "#A0AEC0";

    // 1. Деревянный корпус аппарата (поворачивающийся параллелепипед)
    const bw = 90 * scale;
    const bh = 50 * scale;
    const bd = 70 * scale;

    const corners = [
      { x: -bw / 2, y: 30 * scale, z: -bd / 2 },
      { x: bw / 2, y: 30 * scale, z: -bd / 2 },
      { x: bw / 2, y: 30 * scale, z: bd / 2 },
      { x: -bw / 2, y: 30 * scale, z: bd / 2 },
      { x: -bw / 2, y: (30 - bh) * scale, z: -bd / 2 },
      { x: bw / 2, y: (30 - bh) * scale, z: -bd / 2 },
      { x: bw / 2, y: (30 - bh) * scale, z: bd / 2 },
      { x: -bw / 2, y: (30 - bh) * scale, z: bd / 2 },
    ];

    // Проекция точек с учетом поворота вокруг Y и легкого наклона X (изометрия)
    const pitch = 0.38; // угол обзора сверху
    const proj = corners.map((p) => {
      const rx = p.x * cosA - p.z * sinA;
      const rz = p.x * sinA + p.z * cosA;
      const ry = p.y * Math.cos(pitch) - rz * Math.sin(pitch);
      return { x: rx, y: ry, z: rz };
    });

    // Рисуем грани деревянного корпуса
    ctx.fillStyle = woodLight;
    ctx.strokeStyle = woodDark;
    ctx.lineWidth = 1.5;

    // Верхняя крышка
    ctx.beginPath();
    ctx.moveTo(proj[4].x, proj[4].y);
    ctx.lineTo(proj[5].x, proj[5].y);
    ctx.lineTo(proj[6].x, proj[6].y);
    ctx.lineTo(proj[7].x, proj[7].y);
    ctx.closePath();
    ctx.fillStyle = woodLight;
    ctx.fill();
    ctx.stroke();

    // Боковые грани (с сортировкой по глубине)
    const faces = [
      { pts: [0, 1, 5, 4], normZ: -cosA },
      { pts: [1, 2, 6, 5], normZ: sinA },
      { pts: [2, 3, 7, 6], normZ: cosA },
      { pts: [3, 0, 4, 7], normZ: -sinA },
    ];

    faces.forEach((f) => {
      const p = f.pts;
      ctx.beginPath();
      ctx.moveTo(proj[p[0]].x, proj[p[0]].y);
      ctx.lineTo(proj[p[1]].x, proj[p[1]].y);
      ctx.lineTo(proj[p[2]].x, proj[p[2]].y);
      ctx.lineTo(proj[p[3]].x, proj[p[3]].y);
      ctx.closePath();
      const shade = Math.max(0.3, Math.min(0.9, 0.6 + f.normZ * 0.3));
      ctx.fillStyle = `rgb(${Math.floor(123 * shade)}, ${Math.floor(75 * shade)}, ${Math.floor(39 * shade)})`;
      ctx.fill();
      ctx.stroke();
    });

    // 2. Латунные детали наверху (катушка Морзе, звонковые чаши или ключ телеграфа)
    const topY = proj[4].y - 10 * scale;

    // Латунный манипулятор/ключ
    ctx.beginPath();
    const keyEndX = 55 * scale * cosA;
    const keyEndY = topY - 15 * scale + 25 * scale * sinA;
    ctx.moveTo(0, topY);
    ctx.lineTo(keyEndX, keyEndY);
    ctx.lineWidth = 6 * scale;
    ctx.strokeStyle = brassLight;
    ctx.lineCap = "round";
    ctx.stroke();

    // Наконечник кнопки
    ctx.beginPath();
    ctx.arc(keyEndX, keyEndY, 9 * scale, 0, Math.PI * 2);
    ctx.fillStyle = "#111";
    ctx.fill();
    ctx.strokeStyle = brassDark;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Латунные катушки электромагнита
    [-18, 18].forEach((offset) => {
      const cxK = offset * scale * cosA;
      const cyK = topY - 15 * scale + offset * scale * sinA * 0.4;
      ctx.beginPath();
      ctx.ellipse(cxK, cyK, 12 * scale, 18 * scale, 0, 0, Math.PI * 2);
      ctx.fillStyle = brassDark;
      ctx.fill();
      ctx.strokeStyle = brassLight;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Декоративная табличка с номером
    ctx.restore();

    // Оверлей угла и подсказки
    const deg = Math.round((frameIndex / this.totalFrames) * 360);
    ctx.fillStyle = "rgba(0, 194, 255, 0.9)";
    ctx.font = "600 13px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${deg}° • Вращение 360°`, w / 2, h - 22);
  }
}
