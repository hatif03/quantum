const examples = [
  {
    match: ["electron", "positron", "annihilation", "photon"],
    title: "Electron-positron annihilation",
    short: "e+ e- -> gamma gamma",
    confidence: "95% compile success pattern",
    particles: ["e-", "e+", "gamma", "gamma"],
    color: ["#79f2b0", "#ff6b6b", "#55dff7", "#ffd166"],
    code: String.raw`\feynmandiagram [horizontal=a to b] {
  i1 [particle=\(e^{-}\)] -- [fermion] a -- [fermion] i2 [particle=\(e^{+}\)],
  a -- [photon] b,
  b -- [photon] f1 [particle=\(\gamma\)],
  b -- [photon] f2 [particle=\(\gamma\)],
};`,
  },
  {
    match: ["z", "boson", "lepton", "pair"],
    title: "Z boson decay",
    short: "Z -> l+ l-",
    confidence: "PDG-backed validation path",
    particles: ["Z", "l-", "l+"],
    color: ["#ffd166", "#79f2b0", "#ff6b6b"],
    code: String.raw`\feynmandiagram [horizontal=z to v] {
  z [particle=\(Z^{0}\)] -- [boson] v,
  v -- [fermion] l1 [particle=\(\ell^{-}\)],
  v -- [anti fermion] l2 [particle=\(\ell^{+}\)],
};`,
  },
  {
    match: ["compton", "scattering"],
    title: "Compton scattering",
    short: "e- gamma -> e- gamma",
    confidence: "retrieves scattering examples",
    particles: ["e-", "gamma", "e-", "gamma"],
    color: ["#79f2b0", "#55dff7", "#79f2b0", "#ffd166"],
    code: String.raw`\feynmandiagram [horizontal=a to b] {
  i1 [particle=\(e^{-}\)] -- [fermion] a -- [fermion] b -- [fermion] f1 [particle=\(e^{-}\)],
  i2 [particle=\(\gamma\)] -- [photon] a,
  b -- [photon] f2 [particle=\(\gamma\)],
};`,
  },
  {
    match: ["muon", "decay"],
    title: "Muon decay",
    short: "mu- -> e- nu_mu anti-nu_e",
    confidence: "weak-interaction topology",
    particles: ["mu-", "W-", "e-", "nu_mu", "anti-nu_e"],
    color: ["#ff6b6b", "#ffd166", "#79f2b0", "#55dff7", "#a78bfa"],
    code: String.raw`\feynmandiagram [horizontal=a to b] {
  mu [particle=\(\mu^{-}\)] -- [fermion] a -- [fermion] e [particle=\(e^{-}\)],
  a -- [boson, edge label=\(W^{-}\)] b,
  b -- [fermion] n1 [particle=\(\nu_{\mu}\)],
  b -- [anti fermion] n2 [particle=\(\bar{\nu}_{e}\)],
};`,
  },
];

const agents = [
  {
    title: "Planner Agent",
    body: "Turns the user's phrase into a physics task: particles, likely interaction, conservation rules, and a plan that anticipates validation and correction.",
  },
  {
    title: "Knowledge Base Retriever",
    body: "Searches more than 150 curated Feynman examples with vector similarity, giving the generator grounded patterns instead of asking it to invent from scratch.",
  },
  {
    title: "Physics Validator",
    body: "Checks whether the requested process is physically sensible using local rules and Particle Data Group style data through the MCP integration.",
  },
  {
    title: "Diagram Generator",
    body: "Writes clean TikZ-Feynman code, or enters correction mode when the compiler reports a broken diagram.",
  },
  {
    title: "TikZ Validator",
    body: "Compiles the diagram locally and returns a precise error report if syntax, labels, or package usage fails.",
  },
  {
    title: "Feedback Agent",
    body: "Synthesizes the final user-facing result: explanation, validated code, and a clear note if the process needed repair attempts.",
  },
];

const state = {
  process: examples[0],
  energy: 6,
  pulse: 0,
  mouse: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
};

const cursor = document.querySelector(".cursor-orbit");
const fieldCanvas = document.getElementById("field");
const fieldCtx = fieldCanvas.getContext("2d");
const diagramCanvas = document.getElementById("diagramCanvas");
const diagramCtx = diagramCanvas.getContext("2d");
const input = document.getElementById("processInput");
const processTitle = document.getElementById("processTitle");
const confidence = document.getElementById("confidence");
const tikzCode = document.getElementById("tikzCode");
const attemptCount = document.getElementById("attemptCount");
const agentDetail = document.getElementById("agentDetail");

let particles = [];
let sparks = [];
let lastTime = 0;

function sizeCanvas(canvas, ctx) {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function resize() {
  sizeCanvas(fieldCanvas, fieldCtx);
  sizeCanvas(diagramCanvas, diagramCtx);
  buildParticles();
  drawDiagram(0);
}

function buildParticles() {
  const count = Math.min(130, Math.max(55, Math.floor(window.innerWidth / 12)));
  particles = Array.from({ length: count }, (_, i) => {
    const depth = Math.random() * 1.8 + 0.25;
    return {
      x: Math.random() * window.innerWidth - window.innerWidth / 2,
      y: Math.random() * window.innerHeight - window.innerHeight / 2,
      z: depth,
      r: Math.random() * 1.8 + 0.7,
      spin: Math.random() * Math.PI * 2,
      speed: 0.15 + Math.random() * 0.55,
      hue: i % 5,
    };
  });
}

function fieldColor(i) {
  return ["85,223,247", "121,242,176", "255,209,102", "255,107,107", "167,139,250"][i];
}

function drawField(time) {
  const w = fieldCanvas.clientWidth;
  const h = fieldCanvas.clientHeight;
  fieldCtx.clearRect(0, 0, w, h);
  fieldCtx.save();
  fieldCtx.translate(w / 2, h / 2);

  for (const p of particles) {
    p.spin += 0.0018 * p.speed * (state.energy + 2);
    const orbit = 24 + p.z * 18;
    const x3 = p.x + Math.cos(p.spin) * orbit + (state.mouse.x - w / 2) * 0.018 / p.z;
    const y3 = p.y + Math.sin(p.spin * 0.7) * orbit + (state.mouse.y - h / 2) * 0.018 / p.z;
    const scale = 1 / (p.z * 0.55 + 0.28);
    const x = x3 * scale;
    const y = y3 * scale;
    const alpha = Math.max(0.12, 0.52 - p.z * 0.12);

    fieldCtx.beginPath();
    fieldCtx.fillStyle = `rgba(${fieldColor(p.hue)}, ${alpha})`;
    fieldCtx.arc(x, y, p.r * scale, 0, Math.PI * 2);
    fieldCtx.fill();
  }

  for (let i = 0; i < 36; i += 1) {
    const a = time * 0.00008 * (i % 2 ? 1 : -1) + i * 0.42;
    const radius = 110 + i * 18 + Math.sin(time * 0.001 + i) * 8;
    fieldCtx.strokeStyle = `rgba(${fieldColor(i % 5)}, ${0.025 + i / 2600})`;
    fieldCtx.lineWidth = 1;
    fieldCtx.beginPath();
    fieldCtx.ellipse(0, 0, radius * 1.5, radius * 0.42, a, 0, Math.PI * 2);
    fieldCtx.stroke();
  }
  fieldCtx.restore();
}

function pickExample(value) {
  const text = value.toLowerCase();
  return examples.find((example) => example.match.some((term) => text.includes(term))) || examples[0];
}

function setProcess(example) {
  state.process = example;
  processTitle.textContent = example.title;
  confidence.textContent = example.confidence;
  tikzCode.textContent = example.code;
  attemptCount.textContent = `${Math.min(3, Math.max(1, 11 - state.energy))} / 3`;
  spawnSparks();
  drawDiagram(performance.now());
}

function spawnSparks() {
  const rect = diagramCanvas.getBoundingClientRect();
  sparks = Array.from({ length: 38 }, () => ({
    x: rect.width / 2,
    y: rect.height / 2,
    vx: (Math.random() - 0.5) * 8,
    vy: (Math.random() - 0.5) * 8,
    life: 1,
    color: state.process.color[Math.floor(Math.random() * state.process.color.length)],
  }));
}

function drawPhotonPath(ctx, start, end, color, time) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  const nx = -dy / length;
  const ny = dx / length;
  ctx.beginPath();
  for (let i = 0; i <= 80; i += 1) {
    const t = i / 80;
    const wave = Math.sin(t * Math.PI * 12 + time * 0.01) * 8;
    const x = start.x + dx * t + nx * wave;
    const y = start.y + dy * t + ny * wave;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawLine(ctx, start, end, color, time, dashed = false) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  if (dashed) {
    ctx.setLineDash([8, 11]);
    ctx.lineDashOffset = -time * 0.035;
  }
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  ctx.restore();
}

function drawLabel(ctx, text, x, y, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = "700 16px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawDiagram(time) {
  const w = diagramCanvas.clientWidth;
  const h = diagramCanvas.clientHeight;
  diagramCtx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const energyScale = state.energy / 10;
  const wobble = Math.sin(time * 0.002) * (8 + energyScale * 8);
  const leftTop = { x: w * 0.12, y: h * 0.22 + wobble };
  const leftBottom = { x: w * 0.12, y: h * 0.78 - wobble };
  const rightTop = { x: w * 0.88, y: h * 0.22 - wobble };
  const rightBottom = { x: w * 0.88, y: h * 0.78 + wobble };
  const center = { x: cx, y: cy };

  diagramCtx.save();
  diagramCtx.translate(cx, cy);
  diagramCtx.rotate(Math.sin(time * 0.0008) * 0.015);
  diagramCtx.translate(-cx, -cy);

  const p = state.process;
  if (p.title === "Z boson decay") {
    drawPhotonPath(diagramCtx, { x: w * 0.16, y: cy }, center, p.color[0], time);
    drawLine(diagramCtx, center, rightTop, p.color[1], time, true);
    drawLine(diagramCtx, center, rightBottom, p.color[2], time, true);
    drawLabel(diagramCtx, p.particles[0], w * 0.15, cy - 18, p.color[0]);
    drawLabel(diagramCtx, p.particles[1], rightTop.x, rightTop.y - 18, p.color[1]);
    drawLabel(diagramCtx, p.particles[2], rightBottom.x, rightBottom.y + 30, p.color[2]);
  } else if (p.title === "Compton scattering") {
    const v1 = { x: w * 0.38, y: h * 0.46 };
    const v2 = { x: w * 0.62, y: h * 0.54 };
    drawLine(diagramCtx, leftTop, v1, p.color[0], time, true);
    drawPhotonPath(diagramCtx, leftBottom, v1, p.color[1], time);
    drawLine(diagramCtx, v1, v2, "#d8f8ff", time, true);
    drawLine(diagramCtx, v2, rightTop, p.color[2], time, true);
    drawPhotonPath(diagramCtx, v2, rightBottom, p.color[3], time);
    drawVertex(v1, time);
    drawVertex(v2, time);
    drawLabel(diagramCtx, p.particles[0], leftTop.x, leftTop.y - 18, p.color[0]);
    drawLabel(diagramCtx, p.particles[1], leftBottom.x, leftBottom.y + 30, p.color[1]);
    drawLabel(diagramCtx, p.particles[2], rightTop.x, rightTop.y - 18, p.color[2]);
    drawLabel(diagramCtx, p.particles[3], rightBottom.x, rightBottom.y + 30, p.color[3]);
    diagramCtx.restore();
    drawSparks();
    return;
  } else if (p.title === "Muon decay") {
    const v1 = { x: w * 0.42, y: h * 0.44 };
    const v2 = { x: w * 0.6, y: h * 0.62 };
    drawLine(diagramCtx, { x: w * 0.12, y: h * 0.52 }, v1, p.color[0], time, true);
    drawLine(diagramCtx, v1, { x: w * 0.84, y: h * 0.24 }, p.color[2], time, true);
    drawPhotonPath(diagramCtx, v1, v2, p.color[1], time);
    drawLine(diagramCtx, v2, { x: w * 0.78, y: h * 0.62 }, p.color[3], time, true);
    drawLine(diagramCtx, v2, { x: w * 0.82, y: h * 0.82 }, p.color[4], time, true);
    drawVertex(v1, time);
    drawVertex(v2, time);
    p.particles.forEach((label, i) => {
      const positions = [
        [w * 0.12, h * 0.5],
        [w * 0.52, h * 0.54],
        [w * 0.84, h * 0.22],
        [w * 0.78, h * 0.59],
        [w * 0.82, h * 0.87],
      ];
      drawLabel(diagramCtx, label, positions[i][0], positions[i][1] - 16, p.color[i]);
    });
    diagramCtx.restore();
    drawSparks();
    return;
  } else {
    drawLine(diagramCtx, leftTop, center, p.color[0], time, true);
    drawLine(diagramCtx, leftBottom, center, p.color[1], time, true);
    drawPhotonPath(diagramCtx, center, rightTop, p.color[2], time);
    drawPhotonPath(diagramCtx, center, rightBottom, p.color[3], time);
    drawLabel(diagramCtx, p.particles[0], leftTop.x, leftTop.y - 18, p.color[0]);
    drawLabel(diagramCtx, p.particles[1], leftBottom.x, leftBottom.y + 30, p.color[1]);
    drawLabel(diagramCtx, p.particles[2], rightTop.x, rightTop.y - 18, p.color[2]);
    drawLabel(diagramCtx, p.particles[3], rightBottom.x, rightBottom.y + 30, p.color[3]);
  }

  drawVertex(center, time);
  diagramCtx.restore();
  drawSparks();
}

function drawVertex(point, time) {
  const r = 9 + Math.sin(time * 0.006) * 2 + state.energy * 0.25;
  diagramCtx.save();
  diagramCtx.fillStyle = "#f5fbff";
  diagramCtx.shadowColor = "#55dff7";
  diagramCtx.shadowBlur = 20;
  diagramCtx.beginPath();
  diagramCtx.arc(point.x, point.y, r, 0, Math.PI * 2);
  diagramCtx.fill();
  diagramCtx.restore();
}

function drawSparks() {
  for (const spark of sparks) {
    spark.x += spark.vx;
    spark.y += spark.vy;
    spark.vx *= 0.98;
    spark.vy *= 0.98;
    spark.life -= 0.018;
    if (spark.life <= 0) continue;
    diagramCtx.save();
    diagramCtx.globalAlpha = spark.life;
    diagramCtx.fillStyle = spark.color;
    diagramCtx.shadowColor = spark.color;
    diagramCtx.shadowBlur = 18;
    diagramCtx.beginPath();
    diagramCtx.arc(spark.x, spark.y, 3.5 * spark.life, 0, Math.PI * 2);
    diagramCtx.fill();
    diagramCtx.restore();
  }
  sparks = sparks.filter((spark) => spark.life > 0);
}

function animate(time) {
  const delta = time - lastTime;
  lastTime = time;
  if (delta < 80) {
    drawField(time);
    drawDiagram(time);
  }
  requestAnimationFrame(animate);
}

function hydrateAgents(index = 0) {
  const active = agents[index];
  agentDetail.innerHTML = `<h3>${active.title}</h3><p>${active.body}</p>`;
  document.querySelectorAll(".agent-card").forEach((card) => {
    card.classList.toggle("active", Number(card.dataset.agent) === index);
  });
}

function initReveals() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
      });
    },
    { threshold: 0.16 },
  );
  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

document.addEventListener("mousemove", (event) => {
  state.mouse.x = event.clientX;
  state.mouse.y = event.clientY;
  cursor.style.left = `${event.clientX}px`;
  cursor.style.top = `${event.clientY}px`;
});

document.getElementById("pulseScene").addEventListener("click", () => {
  state.energy = Math.min(10, state.energy + 1);
  document.getElementById("energySlider").value = state.energy;
  spawnSparks();
});

document.getElementById("runAgent").addEventListener("click", () => {
  const picked = pickExample(input.value);
  setProcess(picked);
});

document.getElementById("shuffleProcess").addEventListener("click", () => {
  const next = examples[(examples.indexOf(state.process) + 1) % examples.length];
  input.value = `Generate a Feynman diagram for ${next.short}`;
  setProcess(next);
});

document.getElementById("energySlider").addEventListener("input", (event) => {
  state.energy = Number(event.target.value);
  attemptCount.textContent = `${Math.min(3, Math.max(1, 11 - state.energy))} / 3`;
});

document.querySelectorAll("[data-example]").forEach((button) => {
  button.addEventListener("click", () => {
    input.value = button.dataset.example;
    setProcess(pickExample(input.value));
  });
});

document.querySelectorAll(".agent-card").forEach((card) => {
  card.addEventListener("click", () => hydrateAgents(Number(card.dataset.agent)));
});

window.addEventListener("resize", resize);

resize();
setProcess(examples[0]);
hydrateAgents(0);
initReveals();
requestAnimationFrame(animate);
