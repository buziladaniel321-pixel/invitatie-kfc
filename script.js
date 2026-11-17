// Invitația pentru Iaris Gabor: plic -> scrisoare (Da / Nu) -> dată și oră -> artificii

// Arată un singur pas și le ascunde pe celelalte
function showStep(id) {
  document.querySelectorAll(".step").forEach((step) => {
    step.classList.toggle("is-active", step.id === id);
  });
}

/* ---------- Pasul 0: deschiderea plicului ---------- */
const envelope = document.getElementById("envelope");
document.getElementById("open-btn").addEventListener("click", () => {
  envelope.classList.add("is-open");
  // Așteptăm să se deschidă clapa, apoi arătăm scrisoarea
  setTimeout(() => showStep("step-letter"), 650);
});

/* ---------- Pasul 1: butonul „Nu” fuge ---------- */
const noBtn = document.getElementById("no-btn");
const yesBtn = document.getElementById("yes-btn");
const noTexts = ["Nu", "Sigur?", "Hmm…", "Nu se poate", "Încearcă Da", "Doar Da 😄"];
let escapes = 0;

function runAway(event) {
  if (event) event.preventDefault(); // „Nu” nu se poate apăsa niciodată

  // Prima dată îl scoatem din rând și îl lăsăm să plutească pe ecran
  if (!noBtn.classList.contains("is-running")) {
    const start = noBtn.getBoundingClientRect();
    noBtn.style.left = start.left + "px";
    noBtn.style.top = start.top + "px";
    noBtn.classList.add("is-running");
  }

  escapes++;
  noBtn.textContent = noTexts[Math.min(escapes, noTexts.length - 1)];

  // Căutăm un loc nou, departe de butonul „Da”
  const margin = 16;
  const maxX = window.innerWidth - noBtn.offsetWidth - margin;
  const maxY = window.innerHeight - noBtn.offsetHeight - margin;
  const yes = yesBtn.getBoundingClientRect();
  let x, y;
  for (let tries = 0; tries < 20; tries++) {
    x = margin + Math.random() * Math.max(0, maxX - margin);
    y = margin + Math.random() * Math.max(0, maxY - margin);
    const overlapsYes =
      x < yes.right + 20 && x + noBtn.offsetWidth > yes.left - 20 &&
      y < yes.bottom + 20 && y + noBtn.offsetHeight > yes.top - 20;
    if (!overlapsYes) break;
  }
  // Pornește animația spre noul loc în cadrul următor
  requestAnimationFrame(() => {
    noBtn.style.left = x + "px";
    noBtn.style.top = y + "px";
  });

  // „Da” crește puțin la fiecare fugă
  yesBtn.style.transform = `scale(${Math.min(1 + escapes * 0.06, 1.4)})`;
}

// Mouse-ul se apropie (pe telefon ne ocupăm doar de pointerdown, ca să nu fugă de 2 ori)
noBtn.addEventListener("pointerenter", (event) => {
  if (event.pointerType === "mouse") runAway(event);
});
noBtn.addEventListener("pointerdown", runAway);  // deget pe telefon
noBtn.addEventListener("click", runAway);        // tastatură (Enter / Space)

// Trimite în tăcere răspunsul către pagina ta privată (answers.html).
// Dacă nu merge (ex: pagina e deschisă de pe calculator, nu de pe internet), invitația continuă normal.
function sendAnswer(data) {
  fetch("/api/answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, noAttempts: escapes }),
    keepalive: true, // ajunge chiar dacă pagina se închide imediat după
  }).catch(() => {});
}

yesBtn.addEventListener("click", () => {
  sendAnswer({ step: "yes" });
  showStep("step-date");
});

/* ---------- Pasul 2: data (doar azi) și ora ---------- */
const today = new Date().toLocaleDateString("ro-RO", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
document.getElementById("date-choice").textContent = "Azi, " + today;

document.getElementById("times").addEventListener("click", (event) => {
  const btn = event.target.closest("[data-time]");
  if (!btn) return;
  sendAnswer({ step: "time", time: btn.dataset.time });
  document.getElementById("when").textContent =
    `Azi, ${today}, la ora ${btn.dataset.time} · KFC`;
  showStep("step-final");
  document.body.classList.add("is-romantic");
  startFireworks();
  startPetals();
});

/* ---------- Trandafiri și petale care curg ---------- */
function startPetals() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const box = document.getElementById("petals");
  const flowers = ["🌹", "🌹", "🌸", "🌷", "💐", "❤️"];

  function drop() {
    const petal = document.createElement("div");
    // Cam jumătate sunt flori (emoji), restul petale desenate din CSS
    if (Math.random() < 0.5) {
      petal.className = "petal petal-emoji";
      petal.textContent = flowers[Math.floor(Math.random() * flowers.length)];
      petal.style.fontSize = 20 + Math.random() * 18 + "px";
    } else {
      petal.className = "petal";
      petal.innerHTML = '<div class="petal-shape"></div>';
    }
    petal.style.left = Math.random() * 100 + "vw";
    petal.style.setProperty("--sway", (20 + Math.random() * 50) + "px");
    petal.style.animationDuration = 5 + Math.random() * 5 + "s";
    petal.addEventListener("animationend", () => petal.remove()); // nu se adună în pagină
    box.appendChild(petal);
  }

  for (let i = 0; i < 12; i++) setTimeout(drop, i * 120); // o ploaie la început
  setInterval(drop, 260);
}

/* ---------- Pasul 3: artificii pe canvas ---------- */
function startFireworks() {
  const canvas = document.getElementById("fireworks");
  const ctx = canvas.getContext("2d");
  // Culori romantice: roșu, roz, auriu
  const colors = ["#ff4d6d", "#ff8fab", "#ffc2d1", "#e2b75a", "#ffffff", "#c9184a"];
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rockets = [];
  const sparks = [];

  // Canvas clar și pe ecranele cu densitate mare
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  function launch() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    rockets.push({
      x: w * (0.15 + Math.random() * 0.7),
      y: h,
      targetY: h * (0.12 + Math.random() * 0.35),
      speed: 7 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }

  // Racheta ajunge sus și se sparge în scântei: cam jumătate fac o inimă
  function explode(r) {
    const count = calm ? 30 : 80;
    const isHeart = Math.random() < 0.5;
    const size = 0.18 + Math.random() * 0.08; // cât de mare e inima
    for (let i = 0; i < count; i++) {
      const t = (Math.PI * 2 * i) / count;
      let vx, vy;
      if (isHeart) {
        // Formula clasică a inimii (x = 16 sin³t, y = 13 cos t − …)
        vx = 16 * Math.sin(t) ** 3 * size;
        vy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * size;
      } else {
        const power = 1.5 + Math.random() * 3.5;
        vx = Math.cos(t) * power;
        vy = Math.sin(t) * power;
      }
      sparks.push({
        x: r.x, y: r.y, vx, vy,
        gravity: isHeart ? 0.012 : 0.05, // inima cade încet, ca să-și păstreze forma
        life: 1,
        color: Math.random() < 0.75 ? r.color : "#ffffff",
      });
    }
  }

  function frame() {
    // Ștergem ușor, ca să rămână o dâră
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.globalCompositeOperation = "lighter";

    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.y -= r.speed;
      ctx.fillStyle = r.color;
      ctx.fillRect(r.x - 1.5, r.y, 3, 8);
      if (r.y <= r.targetY) {
        explode(r);
        rockets.splice(i, 1);
      }
    }

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.vx *= 0.98;
      s.vy = s.vy * 0.98 + s.gravity;
      s.x += s.vx;
      s.y += s.vy;
      s.life -= 0.012;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      ctx.globalAlpha = s.life;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    requestAnimationFrame(frame);
  }

  // Câteva rachete deodată la început, apoi una din când în când
  for (let i = 0; i < 6; i++) setTimeout(launch, i * 180);
  setInterval(launch, calm ? 1600 : 380);
  frame();
}
