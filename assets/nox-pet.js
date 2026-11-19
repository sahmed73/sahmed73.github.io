(() => {
  const openButton = document.getElementById("nox-open");
  if (!openButton) return;
  const dialog = document.getElementById("nox-dialog");
  const petButton = document.getElementById("nox-pet");
  const sprite = document.getElementById("nox-sprite");
  const message = document.getElementById("nox-message");
  const count = document.getElementById("nox-count");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const artwork = new Image();
  const replies = ["That's the spot!", "More head scratches? Yes, please.", "You're my favorite human.", "One happy little moon fox."];
  let ready = false;
  let scratches = 0;
  let row = 6;
  let frames = 6;
  let startedAt = 0;
  let animation = 0;
  let settleTimer = 0;
  let askTimer = 0;

  function draw(frame = 0) {
    // The existing Nox atlas uses 192 × 208 cells; its rows stay unchanged.
    if (ready) sprite.style.backgroundPosition = `${-frame * 192}px ${-row * 208}px`;
  }

  function animate(time) {
    if (!dialog.open) return;
    draw(Math.floor(Math.max(0, time - startedAt) / 160) % frames);
    animation = requestAnimationFrame(animate);
  }

  function play(nextRow, frameCount) {
    row = nextRow;
    frames = frameCount;
    startedAt = performance.now();
    cancelAnimationFrame(animation);
    animation = 0;
    draw();
    if (ready && dialog.open && !reducedMotion.matches) animation = requestAnimationFrame(animate);
  }

  function clearTimers() {
    clearTimeout(settleTimer);
    clearTimeout(askTimer);
  }

  artwork.addEventListener("load", () => {
    ready = true;
    sprite.style.backgroundImage = `url("${artwork.src}")`;
    play(row, frames);
  });

  openButton.addEventListener("click", () => {
    dialog.showModal();
    message.textContent = scratches ? "Back for more head scratches?" : "Pet me, please!";
    play(6, 6);
    if (!artwork.src) artwork.src = dialog.dataset.sprites;
    petButton.focus();
  });

  petButton.addEventListener("click", () => {
    clearTimers();
    scratches += 1;
    message.textContent = replies[(scratches - 1) % replies.length];
    count.textContent = `${scratches} head ${scratches === 1 ? "scratch" : "scratches"}. Nox says thank you!`;
    play(4, 5);
    settleTimer = setTimeout(() => play(0, 6), 800);
    askTimer = setTimeout(() => {
      message.textContent = "Pet me, please!";
      play(6, 6);
    }, 6000);
  });

  document.getElementById("nox-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    clearTimers();
    cancelAnimationFrame(animation);
    animation = 0;
    openButton.focus();
  });
  reducedMotion.addEventListener("change", () => play(row, frames));
})();
