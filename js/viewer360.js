/**
 * @fileoverview Interactive object inspection controller for multi-angle frame sequences.
 * Implements bounded linear scrubbing, pointer event tracking, inertia simulation, and hardware-accelerated canvas rendering.
 * @module viewer360
 */

export class Exhibit360Viewer {
  /**
   * @param {HTMLCanvasElement} canvasElement Target HTML5 canvas element for frame rendering.
   * @param {Object} [options] Viewer configuration options.
   * @param {number} [options.totalFrames=24] Initial frame count for sequence scrubbing.
   */
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext("2d");
    this.totalFrames = options.totalFrames || 24;
    this.currentFrame = Math.floor(this.totalFrames / 2);
    this.images = [];
    this.isLoading = false;
    this.isDragging = false;
    this.startX = 0;
    this.lastX = 0;
    this.velocityX = 0;
    this.lastTime = 0;
    this.zoom = 1;
    this.minZoom = 0.85;
    this.maxZoom = 2.5;
    this.exhibitData = options.exhibitData || null;

    this.initCanvasSize();
    this.bindEvents();
    this.startLoop();
  }

  /**
   * Recalculates canvas buffer dimensions based on device pixel ratio and layout dimensions.
   */
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

  /**
   * Sets target exhibit model and triggers image buffer preloading.
   * @param {Object} exhibit Domain exhibit entity.
   */
  setExhibit(exhibit) {
    this.exhibitData = exhibit;
    this.zoom = 1;
    this.velocityX = 0;

    if (exhibit && Array.isArray(exhibit.frames) && exhibit.frames.length > 0) {
      this.totalFrames = exhibit.frames.length;
      this.currentFrame = Math.floor(this.totalFrames / 2);
      this.loadFrames(exhibit.frames);
    } else {
      this.images = [];
      this.currentFrame = 0;
    }
    this.render();
  }

  /**
   * Asynchronously preloads frame sequence into memory.
   * @param {string[]} frameUrls Array of frame image URI paths.
   * @private
   */
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
        // Render initial central frame immediately upon arrival
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

  /**
   * Attaches pointer, touch, and wheel gesture handlers.
   * @private
   */
  bindEvents() {
    const c = this.canvas;

    c.addEventListener("pointerdown", (e) => {
      this.isDragging = true;
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

      const sensitivity = 8;
      const dir = (this.exhibitData && this.exhibitData.invertSwipe) ? -1 : 1;
      const frameDelta = (deltaX / sensitivity) * dir;
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

  /**
   * Advances current frame index within clamped bounds [0, totalFrames - 1].
   * @param {number} delta Step increment value.
   */
  stepFrame(delta) {
    this.currentFrame = Math.max(0, Math.min(this.totalFrames - 1, this.currentFrame + delta));
    this.render();
  }

  /**
   * Updates rendering zoom scale factor.
   * @param {number} val New zoom multiplier.
   */
  setZoom(val) {
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, val));
    this.render();
  }

  /**
   * Resets viewer transform and frame index to default orientation.
   */
  resetView() {
    this.currentFrame = Math.floor(this.totalFrames / 2);
    this.zoom = 1;
    this.velocityX = 0;
    this.render();
  }

  /**
   * Starts inertial animation update loop.
   * @private
   */
  startLoop() {
    const loop = () => {
      if (!this.isDragging && Math.abs(this.velocityX) > 0.02) {
        const dir = (this.exhibitData && this.exhibitData.invertSwipe) ? -1 : 1;
        this.stepFrame(this.velocityX * 2.2 * dir);
        this.velocityX *= 0.88; // Viscous decay coefficient
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /**
   * Renders active frame centered within the canvas viewport.
   */
  render() {
    const ctx = this.ctx;
    const w = this.displayWidth;
    const h = this.displayHeight;
    if (!w || !h) return;

    ctx.clearRect(0, 0, w, h);

    const frameIndex = Math.round(this.currentFrame);

    if (this.images.length > 0 && this.images[frameIndex] && this.images[frameIndex].complete && this.images[frameIndex].naturalWidth > 0) {
      const img = this.images[frameIndex];
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;

      const scale = Math.min((w * 0.95) / nw, (h * 0.95) / nh) * this.zoom;
      const dw = nw * scale;
      const dh = nh * scale;
      const dx = (w - dw) / 2;
      const dy = (h - dh) / 2;

      ctx.save();
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
    } else {
      ctx.fillStyle = "#060B17";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#94A3B8";
      ctx.font = "500 14px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Загрузка ракурса экспоната...", w / 2, h / 2);
    }
  }
}
