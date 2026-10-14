// Интерактивный просмотрщик ракурса экспонатов (~120° слева-направо)
// Оптимизирован для мобильных устройств (touch-action: none, плавная физика скраббинга)

export class Exhibit360Viewer {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext("2d");
    this.totalFrames = options.totalFrames || 24;
    this.currentFrame = Math.floor(this.totalFrames / 2); // начинаем с центрального ракурса
    this.images = [];
    this.isLoading = false;
    this.isDragging = false;
    this.startX = 0;
    this.lastX = 0;
    this.velocityX = 0;
    this.lastTime = 0;
    this.isAutoRotating = false;
    this.autoRotateSpeed = 0.35;
    this.autoDirection = 1;
    this.zoom = 1;
    this.minZoom = 0.85;
    this.maxZoom = 2.5;
    this.exhibitData = options.exhibitData || null;

    this.initCanvasSize();
    this.bindEvents();
    this.startLoop();
  }

  initCanvasSize() {
    const dpr = window.devicePixelRatio || 1;
    const parent = this.canvas.parentElement;
    const rect = parent ? parent.getBoundingClientRect() : this.canvas.getBoundingClientRect();
    const width = rect.width || 600;
    const height = rect.height || 540;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.scale(dpr, dpr);
    this.displayWidth = width;
    this.displayHeight = height;
  }

  setExhibit(exhibit) {
    this.exhibitData = exhibit;
    this.zoom = 1;
    this.velocityX = 0;
    this.isAutoRotating = false;

    if (exhibit && exhibit.frames && exhibit.frames.length > 0) {
      this.totalFrames = exhibit.frames.length;
      this.currentFrame = Math.floor(this.totalFrames / 2);
      this.loadFrames(exhibit.frames);
    } else {
      this.images = [];
      this.currentFrame = Math.floor(this.totalFrames / 2);
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
        // Первый кадр отображаем сразу
        if (i === Math.floor(this.totalFrames / 2) || loadedCount === frameUrls.length) {
          this.isLoading = false;
          this.render();
        }
      };
      img.onerror = () => {
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

      // Плавная чувствительность перемещения ракурса
      const sensitivity = 8;
      const frameDelta = deltaX / sensitivity;
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

  // Ограничиваем скраббинг рамками 0 ... totalFrames - 1 (без скачка по кругу)
  stepFrame(delta) {
    this.currentFrame = Math.max(0, Math.min(this.totalFrames - 1, this.currentFrame + delta));
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
    this.currentFrame = Math.floor(this.totalFrames / 2);
    this.zoom = 1;
    this.velocityX = 0;
    this.isAutoRotating = false;
    this.render();
  }

  startLoop() {
    const loop = () => {
      if (this.isAutoRotating && !this.isDragging) {
        // Плавное покачивание ракурса туда-обратно
        if (this.currentFrame >= this.totalFrames - 1) {
          this.autoDirection = -1;
        } else if (this.currentFrame <= 0) {
          this.autoDirection = 1;
        }
        this.stepFrame(this.autoRotateSpeed * this.autoDirection);
      } else if (!this.isDragging && Math.abs(this.velocityX) > 0.02) {
        // Затухание инерции скраббинга
        this.stepFrame(this.velocityX * 2.5);
        this.velocityX *= 0.88;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  render() {
    const ctx = this.ctx;
    const w = this.displayWidth;
    const h = this.displayHeight;
    if (!w || !h) return;

    ctx.clearRect(0, 0, w, h);

    const frameIndex = Math.round(this.currentFrame);

    // Если есть реальные кадры
    if (this.images.length > 0 && this.images[frameIndex] && this.images[frameIndex].complete && this.images[frameIndex].naturalWidth > 0) {
      const img = this.images[frameIndex];
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;

      // Центрируем изображение строго по высоте и ширине канваса
      const scale = Math.min((w * 0.94) / nw, (h * 0.94) / nh) * this.zoom;
      const dw = nw * scale;
      const dh = nh * scale;
      const dx = (w - dw) / 2;
      const dy = (h - dh) / 2;

      ctx.save();
      // Мягкая подсветка витрины
      const glow = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, Math.max(dw, dh) * 0.7);
      glow.addColorStop(0, "rgba(0, 194, 255, 0.12)");
      glow.addColorStop(1, "rgba(6, 11, 23, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
    } else {
      // Загрузка
      ctx.fillStyle = "#060B17";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#00C2FF";
      ctx.font = "500 14px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Загрузка ракурса экспоната...", w / 2, h / 2);
    }
  }
}
