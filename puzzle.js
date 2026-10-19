// Swap puzzle: the photo is cut into an n×n grid and shuffled.
// Drag a piece onto another (or tap two) to swap them.

(() => {
  const board = document.getElementById("board");
  const wrap = document.getElementById("board-wrap");
  const list = document.getElementById("photo-list");
  const movesEl = document.getElementById("moves");
  const timeEl = document.getElementById("time");
  const placedEl = document.getElementById("placed");
  const winEl = document.getElementById("win");
  const peekBtn = document.getElementById("peek");

  const photos = window.HIKES || [];
  let photo = photos[0];
  let n = 3;
  let size = 0;          // board edge in px
  let order = [];        // order[slot] = piece id; solved when order[i] === i
  let pieces = [];       // piece elements by id
  let moves = 0;
  let startedAt = 0;
  let timer = null;
  let picked = null;
  let solved = false;

  // ---------- photo list ----------
  list.innerHTML = photos.map((p, i) => `
    <button data-i="${i}" aria-pressed="${i === 0}">
      <img src="${p.src}" alt="">
      <span class="p-name">${p.name}</span>
    </button>`).join("");
  list.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    list.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b));
    photo = photos[+b.dataset.i];
    newGame();
  });

  document.getElementById("sizes").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    document.querySelectorAll("#sizes button").forEach((x) => x.setAttribute("aria-pressed", x === b));
    n = +b.dataset.size;
    newGame();
  });

  document.getElementById("shuffle").addEventListener("click", newGame);

  peekBtn.addEventListener("click", () => {
    const on = !board.classList.contains("peek");
    board.classList.toggle("peek", on);
    peekBtn.setAttribute("aria-pressed", on);
  });

  // ---------- game ----------
  function measure() {
    const r = wrap.getBoundingClientRect();
    const pad = 40; // the card's inner padding
    size = Math.floor(Math.max(240, Math.min(r.width - pad, r.height - pad, 640)));
    size -= size % n; // whole-pixel pieces, no seams
  }

  function shuffled() {
    const a = [...Array(n * n).keys()];
    do {
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
    } while (a.every((v, i) => v === i));
    return a;
  }

  function newGame() {
    order = shuffled();
    moves = 0;
    solved = false;
    picked = null;
    startedAt = 0;
    clearInterval(timer);
    timeEl.textContent = "0:00";
    movesEl.textContent = "0";
    winEl.hidden = true;
    board.classList.remove("solved", "peek");
    peekBtn.setAttribute("aria-pressed", "false");
    const img = new Image();
    img.onload = () => { dims = { w: img.naturalWidth || 1, h: img.naturalHeight || 1 }; build(); };
    img.onerror = () => { dims = { w: 1, h: 1 }; build(); };
    img.src = photo.src;
  }

  // Crop the photo to a centered square, like background-size: cover.
  let dims = { w: 1, h: 1 };
  function cover() {
    const k = size / Math.min(dims.w, dims.h);
    const w = dims.w * k, h = dims.h * k;
    return { w, h, ox: (w - size) / 2, oy: (h - size) / 2 };
  }

  function build() {
    measure();
    const s = size / n;
    board.style.width = board.style.height = `${size}px`;
    const c = cover();
    board.style.backgroundImage = `url("${photo.src}")`;
    board.style.backgroundSize = `${c.w}px ${c.h}px`;
    board.style.backgroundPosition = `${-c.ox}px ${-c.oy}px`;
    board.innerHTML = "";
    pieces = [];
    for (let id = 0; id < n * n; id++) {
      const el = document.createElement("div");
      el.className = "piece";
      el.dataset.id = id;
      el.style.width = el.style.height = `${s}px`;
      el.style.backgroundImage = `url("${photo.src}")`;
      el.style.backgroundSize = `${c.w}px ${c.h}px`;
      el.style.backgroundPosition = `${-(id % n) * s - c.ox}px ${-Math.floor(id / n) * s - c.oy}px`;
      board.appendChild(el);
      pieces[id] = el;
    }
    layout();
  }

  function layout() {
    const s = size / n;
    order.forEach((id, slot) => {
      const el = pieces[id];
      el.style.left = `${(slot % n) * s}px`;
      el.style.top = `${Math.floor(slot / n) * s}px`;
      el.classList.toggle("home", id === slot);
    });
    placedEl.textContent = `${order.filter((id, i) => id === i).length}/${n * n}`;
  }

  function swap(a, b) {
    if (a === b) return;
    [order[a], order[b]] = [order[b], order[a]];
    moves++;
    movesEl.textContent = moves;
    if (!startedAt) {
      startedAt = Date.now();
      timer = setInterval(tick, 1000);
    }
    layout();
    if (order.every((id, i) => id === i)) win();
  }

  function tick() {
    const sec = Math.floor((Date.now() - startedAt) / 1000);
    timeEl.textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
  }

  function win() {
    solved = true;
    clearInterval(timer);
    tick();
    board.classList.add("solved");
    winEl.textContent = `Solved in ${moves} moves and ${timeEl.textContent}. That's ${photo.name}.`;
    winEl.hidden = false;
  }

  const slotOf = (id) => order.indexOf(id);

  function slotAt(x, y) {
    const r = board.getBoundingClientRect();
    const c = Math.floor(((x - r.left) / r.width) * n);
    const row = Math.floor(((y - r.top) / r.height) * n);
    if (c < 0 || row < 0 || c >= n || row >= n) return -1;
    return row * n + c;
  }

  // ---------- pointer: drag to swap, or tap two pieces ----------
  let drag = null;

  board.addEventListener("pointerdown", (e) => {
    const el = e.target.closest(".piece");
    if (!el || solved) return;
    el.setPointerCapture(e.pointerId);
    drag = { el, id: +el.dataset.id, x: e.clientX, y: e.clientY, moved: false,
             left: parseFloat(el.style.left), top: parseFloat(el.style.top) };
  });

  board.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    drag.moved = true;
    drag.el.classList.add("dragging");
    drag.el.style.left = `${drag.left + dx}px`;
    drag.el.style.top = `${drag.top + dy}px`;
  });

  function endDrag(e) {
    if (!drag) return;
    const { el, id, moved } = drag;
    drag = null;
    el.classList.remove("dragging");
    if (moved) {
      clearPick();
      const target = slotAt(e.clientX, e.clientY);
      if (target >= 0) swap(slotOf(id), target);
      else layout();
      return;
    }
    // tap
    if (picked === null) {
      picked = id;
      el.classList.add("picked");
    } else {
      const other = picked;
      clearPick();
      swap(slotOf(other), slotOf(id));
    }
  }
  board.addEventListener("pointerup", endDrag);
  board.addEventListener("pointercancel", () => { if (drag) { drag.el.classList.remove("dragging"); drag = null; layout(); } });

  function clearPick() {
    if (picked !== null) pieces[picked].classList.remove("picked");
    picked = null;
  }

  // Build lazily the first time the tab opens, so the board can measure itself.
  let built = false;
  document.addEventListener("tabshown", (e) => {
    if (e.detail !== "puzzle") return;
    if (!built) { built = true; newGame(); }
  });
  if (location.hash === "#puzzle" && !built) { built = true; newGame(); }

  let rt;
  window.addEventListener("resize", () => {
    if (!built) return;
    clearTimeout(rt);
    rt = setTimeout(() => {
      const before = size;
      measure();
      if (size !== before) build();
    }, 150);
  });
})();
