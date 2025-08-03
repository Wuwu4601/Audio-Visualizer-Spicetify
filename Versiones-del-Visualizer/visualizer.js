(function () {
  // 1. Variables globales del IIFE
  const SETTINGS_KEY = "spicetify_visualizer_settings";
  let settings = { mode: "bars" };

  async function waitForElement(selector) {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        const el = document.querySelector(selector);
        if (el) {
          clearInterval(interval);
          resolve(el);
        }
      }, 300);
    });
  }

  function getFakeVolume() {
    const volBar = document.querySelector('[aria-label="Volumen"] .progress-bar__bg');
    const volFill = document.querySelector('[aria-label="Volumen"] .progress-bar__fg');
    if (volBar && volFill) {
      const total = volBar.getBoundingClientRect().width;
      const filled = volFill.getBoundingClientRect().width;
      return Math.min(1, filled / total);
    }
    return 0.5;
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  async function main() {
    const bar = await waitForElement(".main-nowPlayingBar-nowPlayingBar");
    const coverImg = await waitForElement(".main-nowPlayingWidget-coverArt img");
    console.log("Carátula:", coverImg.src);

    const numBars = 100;
    let bars = Array(numBars).fill(0);
    let targetHeights = Array(numBars).fill(0);
    let color = "white";

    if (document.getElementById("my-visualizer")) return; 

    const visualizer = document.createElement("div");
    visualizer.id = "my-visualizer";
    visualizer.style.position = "absolute";
    visualizer.style.left = "0";
    visualizer.style.bottom = "0";
    visualizer.style.width = "100%";
    visualizer.style.height = "100%";
    visualizer.style.pointerEvents = "none";
    visualizer.style.zIndex = "1";
    visualizer.style.background = "transparent";

    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.width = window.innerWidth;
    canvas.height = bar.getBoundingClientRect().height;

    visualizer.appendChild(canvas);
    bar.style.position = "relative";
    bar.prepend(visualizer);

    const ctx = canvas.getContext("2d");

    async function updateColor() {
      try {
        const img = document.querySelector(".main-nowPlayingWidget-coverArt img");
        if (!img) {
          color = "white";
          return;
        }
        const cover = new Image();
        cover.crossOrigin = "Anonymous";
        cover.src = img.src;
        await new Promise((res) => (cover.onload = res));
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");
        tempCanvas.width = 10;
        tempCanvas.height = 10;
        tempCtx.drawImage(cover, 0, 0, 10, 10);

        const data = tempCtx.getImageData(0, 0, 10, 10).data;
        let r = 0, g = 0, b = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }
        const pixels = data.length / 4;
        r = Math.floor(r / pixels);
        g = Math.floor(g / pixels);
        b = Math.floor(b / pixels);

        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        if (brightness < 100) {
          r = Math.min(255, r + 100);
          g = Math.min(255, g + 100);
          b = Math.min(255, b + 100);
        }

        color = `rgb(${r},${g},${b})`;
      } catch {
        color = "white";
      }
    }

    await updateColor();
    setInterval(updateColor, 1000);

    let isPaused = false;
    function animate() {
      const playing = Spicetify?.Player?.isPlaying();
      if (playing !== !isPaused) isPaused = !playing;

      const volume = getFakeVolume();
      const progress = Spicetify?.Player?.getProgressPercent?.() ?? 0.5;
      const combinedFactor = Math.max(0.3, progress * volume);

      for (let i = 0; i < numBars; i++) {
        if (isPaused) {
          bars[i] += (0 - bars[i]) * 0.05;
        } else {
          if (Math.random() < 0.08) {
            targetHeights[i] = Math.random() * canvas.height * combinedFactor;
          }
          const speedUp = 0.04;
          const speedDown = 0.02;

          if (targetHeights[i] > bars[i]) {
            bars[i] += (targetHeights[i] - bars[i]) * speedUp;
          } else {
            bars[i] += (targetHeights[i] - bars[i]) * speedDown;
          }
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.shadowBlur = 15;
      ctx.shadowColor = color;
      ctx.fillStyle = color;

      for (let i = 0; i < numBars; i++) {
        const x = (canvas.width / numBars) * i;
        const width = (canvas.width / numBars) - 2;
        const height = bars[i];
        ctx.fillRect(x, canvas.height - height, width, height);
      }

      requestAnimationFrame(animate);
    }

    animate();
  }

  if (document.readyState === "complete") {
    main();
  } else {
    document.addEventListener("DOMContentLoaded", main);
  }
})();
