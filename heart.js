(() => {
  "use strict";

  const CONFIG = {
    outlineParticles: 1300,
    edgeParticles: 5800,
    innerParticles: 2200,
    haloParticles: 1400,
    beatSeconds: 1.55,
    colors: ["#8e244c", "#c83d70", "#e95284", "#fa739f", "#ff91b3", "#ffb5cc"],
  };

  const canvas = document.querySelector("#heart");
  const context = canvas.getContext("2d", { alpha: false });
  const pauseButton = document.querySelector("#pause");
  const fullscreenButton = document.querySelector("#fullscreen");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!context) return;

  const TAU = Math.PI * 2;
  const particles = [];
  const sprites = [];
  const curve = [];
  let width = 0;
  let height = 0;
  let scale = 1;
  let pixelRatio = 1;
  let elapsed = 0;
  let previousTime = null;
  let animationFrame = null;
  let paused = reducedMotion.matches;

  let seed = 716499;
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  function normal() {
    return Math.sqrt(-2 * Math.log(Math.max(random(), 0.00001))) * Math.cos(TAU * random());
  }

  function heartPoint(angle) {
    const sine = Math.sin(angle);
    return {
      x: sine * sine * sine,
      y: (-(13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle)) - 2.5) / 15.1,
    };
  }

  function buildCurve() {
    let length = 0;
    let previous = heartPoint(0);
    curve.push({ ...previous, length });
    for (let i = 1; i <= 2048; i++) {
      const point = heartPoint((i / 2048) * TAU);
      length += Math.hypot(point.x - previous.x, point.y - previous.y);
      curve.push({ ...point, length });
      previous = point;
    }
  }

  function randomCurvePoint() {
    const target = random() * curve[curve.length - 1].length;
    let low = 1;
    let high = curve.length - 1;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (curve[middle].length < target) low = middle + 1;
      else high = middle;
    }
    const before = curve[low - 1];
    const after = curve[low];
    const mix = (target - before.length) / (after.length - before.length);
    return { x: before.x + (after.x - before.x) * mix, y: before.y + (after.y - before.y) * mix };
  }

  function addParticle(kind) {
    const point = randomCurvePoint();
    let radius;
    if (kind === "outline") radius = 1 + normal() * 0.015;
    if (kind === "edge") radius = 1 - Math.min(-Math.log(Math.max(random(), 0.00001)) * 0.105, 0.48);
    if (kind === "inner") radius = 0.08 + Math.pow(random(), 0.55) * 0.82;
    if (kind === "halo") radius = 1 + Math.min(-Math.log(Math.max(random(), 0.00001)) * 0.04, 0.18);

    const colorRoll = random();
    const color = kind === "halo"
      ? (colorRoll < 0.6 ? 0 : 2)
      : kind === "inner"
        ? (colorRoll < 0.5 ? 1 : colorRoll < 0.86 ? 2 : 4)
        : (colorRoll < 0.12 ? 1 : colorRoll < 0.44 ? 2 : colorRoll < 0.78 ? 3 : colorRoll < 0.96 ? 4 : 5);

    particles.push({
      x: point.x * radius + normal() * 0.008,
      y: point.y * radius + normal() * 0.008,
      phase: random() * TAU,
      speed: 0.7 + random() * 1.4,
      drift: kind === "halo" ? 0.012 : 0.002 + random() * 0.006,
      size: kind === "halo" ? 0.55 + random() * 0.65 : 0.65 + Math.pow(random(), 2) * 1.35,
      color,
      halo: kind === "halo",
    });
  }

  function buildParticles() {
    const groups = [
      ["outline", CONFIG.outlineParticles],
      ["edge", CONFIG.edgeParticles],
      ["inner", CONFIG.innerParticles],
      ["halo", CONFIG.haloParticles],
    ];
    for (const [kind, count] of groups) {
      for (let i = 0; i < count; i++) addParticle(kind);
    }
    particles.sort((a, b) => a.color - b.color);
  }

  function buildSprites() {
    for (const color of CONFIG.colors) {
      const sprite = document.createElement("canvas");
      sprite.width = sprite.height = 24;
      const brush = sprite.getContext("2d");
      const glow = brush.createRadialGradient(12, 12, 0, 12, 12, 12);
      glow.addColorStop(0, color);
      glow.addColorStop(0.27, color);
      glow.addColorStop(0.45, `${color}85`);
      glow.addColorStop(1, `${color}00`);
      brush.fillStyle = glow;
      brush.fillRect(0, 0, 24, 24);
      sprites.push(sprite);
    }
  }

  function draw(time) {
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.fillStyle = "#000";
    context.fillRect(0, 0, width, height);

    const phase = (time / CONFIG.beatSeconds) * TAU;
    const pulse = 1 + 0.045 * Math.sin(phase) + 0.012 * Math.sin(2 * phase - 0.6);
    const centerX = width / 2;
    const centerY = height / 2;
    const dotScale = Math.max(0.62, scale / 230);

    for (const particle of particles) {
      const shimmer = Math.sin(time * particle.speed * 3 + particle.phase);
      const drift = particle.drift * Math.sin(time * particle.speed + particle.phase);
      const radial = pulse + drift;
      const x = centerX + particle.x * scale * radial + Math.sin(time * 2.3 + particle.phase) * dotScale * 0.7;
      const y = centerY + particle.y * scale * radial + Math.cos(time * 1.7 + particle.phase) * dotScale * 0.7;
      const size = particle.size * dotScale * 4;
      context.globalAlpha = particle.halo ? 0.2 + (shimmer + 1) * 0.17 : 0.63 + (shimmer + 1) * 0.185;
      context.drawImage(sprites[particle.color], x - size / 2, y - size / 2, size, size);
    }
    context.globalAlpha = 1;
  }

  function animate(timestamp) {
    animationFrame = null;
    if (paused || document.hidden) return;
    if (previousTime !== null) elapsed += Math.min((timestamp - previousTime) / 1000, 0.05);
    previousTime = timestamp;
    draw(elapsed);
    animationFrame = requestAnimationFrame(animate);
  }

  function syncAnimation() {
    if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    animationFrame = null;
    previousTime = null;
    pauseButton.setAttribute("aria-pressed", String(paused));
    pauseButton.setAttribute("aria-label", paused ? "Tiếp tục" : "Tạm dừng");
    pauseButton.title = `${paused ? "Tiếp tục" : "Tạm dừng"} (Space)`;
    if (!paused && !document.hidden) animationFrame = requestAnimationFrame(animate);
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    scale = Math.min(width * 0.37, height * 0.31, 255);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    draw(elapsed);
  }

  function togglePause() {
    paused = !paused;
    syncAnimation();
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      fullscreenButton.hidden = true;
    }
  }

  pauseButton.addEventListener("click", togglePause);
  fullscreenButton.addEventListener("click", toggleFullscreen);
  if (!document.fullscreenEnabled) fullscreenButton.hidden = true;
  document.addEventListener("fullscreenchange", () => {
    const active = Boolean(document.fullscreenElement);
    fullscreenButton.setAttribute("aria-pressed", String(active));
    fullscreenButton.setAttribute("aria-label", active ? "Thoát toàn màn hình" : "Bật toàn màn hình");
    fullscreenButton.title = `${active ? "Thoát toàn màn hình" : "Toàn màn hình"} (F)`;
  });
  document.addEventListener("keydown", (event) => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.target.closest("button, input, textarea, select, [contenteditable]")) return;
    if (event.code === "Space") {
      event.preventDefault();
      togglePause();
    }
    if (event.key.toLowerCase() === "f" && document.fullscreenEnabled) toggleFullscreen();
  });
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", syncAnimation);
  reducedMotion.addEventListener("change", (event) => {
    paused = event.matches;
    syncAnimation();
  });

  buildCurve();
  buildParticles();
  buildSprites();
  resize();
  syncAnimation();
})();
