(function () {
  const SETTINGS_KEY = "spicetify_visualizer_settings";
  let settings = { mode: "bars" };

  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) settings = JSON.parse(stored);
  } catch {}

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
    let isPaused = false;
    const bar = await waitForElement(".main-nowPlayingBar-nowPlayingBar");

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
    const numBars = 100;
    let bars = Array(numBars).fill(0);
    let targetHeights = Array(numBars).fill(0);
    let color = "white"; 
    let wavePhase = 0;

    function animate() {
      const playing = Spicetify?.Player?.isPlaying();
      if (playing !== !isPaused) {
        isPaused = !playing;
      }

      if (isPaused) {
        for (let i = 0; i < numBars; i++) {
          bars[i] += (0 - bars[i]) * 0.05;
        }
      } else {
        const volume = getFakeVolume();
        const volumeFactor = Math.max(0.2, volume);
        for (let i = 0; i < numBars; i++) {
          if (Math.random() < 0.03) {
            targetHeights [i] = Math.random() * canvas.height * volumeFactor;
          }
          const speedUp = 0.04;  
          const speedDown = 0.02;

          if (targetHeights[i] > bars[i]) {
            bars[i] += (targetHeights[i] - bars[i]) * speedUp;
          } else {
            bars[i] += (targetHeights[i] - bars[i]) *speedDown;
          }
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.shadowBlur = 15;
      ctx.shadowColor = color;
      ctx.fillStyle = color;

      if (settings.mode === "bars") {
        for (let i = 0; i < numBars; i++) {
          const x = (canvas.width / numBars) * i;
          const width = (canvas.width / numBars) - 2;
          const height = bars[i];
          ctx.fillRect(x, canvas.height - height, width, height);
        }

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
