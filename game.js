const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const questChip = document.getElementById("quest-chip");
const speakerEl = document.getElementById("speaker");
const dialogueEl = document.getElementById("dialogue");
const notebookEl = document.getElementById("notebook");
const notebookBox = document.getElementById("notebook-box");
const notebookBtn = document.getElementById("notebook-btn");
const hintPanel = document.getElementById("hint-panel");
const hintText = document.getElementById("hint-text");
const questionModal = document.getElementById("question-modal");
const questionTitle = document.getElementById("question-title");
const questionSubtitle = document.getElementById("question-subtitle");
const questionOptions = document.getElementById("question-options");
const celebrationEl = document.getElementById("celebration");
const interactBtn = document.getElementById("interact-btn");
const toastEl = document.getElementById("floating-toast");

const W = canvas.width;
const H = canvas.height;
const WORLD_TOP = 120;
const WORLD_BOTTOM = 575;

const COLORS = {
  skyTop: "#87b7ff",
  skyBottom: "#d4e8ff",
  grassA: "#4f8648",
  grassB: "#5b9453",
  pathA: "#b99a72",
  pathB: "#9e7f59",
  pondOuter: "#7bb8e7",
  pondInner: "#6798c8",
  mountainA: "#787f90",
  mountainB: "#959cad",
  cave: "#5d606b",
  caveMouth: "#090909",
  sulfur: "#dfd45d",
  treeTrunk: "#6c4b2d",
  treeLeafA: "#407d47",
  treeLeafB: "#63a768",
  house: "#a06e45",
  houseShade: "#845834",
  roofR: "#974545",
  roofB: "#4f6299",
  roofG: "#5a855c",
  furnaceBody: "#6c4526",
  smoke: "rgba(170,170,180,0.58)",
  spark: "#f4d17a",
  treatment: "#717887",
  treatmentInner: "#c7d2e3",
  player: "#5d79d0",
  elder: "#7b694b",
  apprentice: "#ab6978",
  skin: "#e7c8a4",
  gold: "#ffd86b",
  black: "#181818",
  shadow: "rgba(0,0,0,0.22)",
  waterDark: "#2b2b2b",
  waterClean: "#68b6ff"
};

function safeText(el, text) { if (el) el.textContent = text; }
function safeHTML(el, html) { if (el) el.innerHTML = html; }
function addHidden(el) { if (el) el.classList.add("hidden"); }
function removeHidden(el) { if (el) el.classList.remove("hidden"); }
function toggleHidden(el, hide) { if (el) el.classList.toggle("hidden", hide); }

const state = {
  step: 0,
  activeQuestion: null,
  notebookOpen: false,
  shake: 0,
  celebrationTimer: 0,
  springRestored: false,
  sulfurCollected: false,
  acidRecovered: false,
  coagulantKnown: false,
  stabilizerKnown: false,
  tapTarget: null,
  dialogueOpen: true
};

const player = { x: 120, y: 470, w: 28, h: 40, speed: 3.1 };
const elder = { x: 610, y: 285, w: 32, h: 44, name: "Elder" };
const apprentice = { x: 470, y: 330, w: 28, h: 38, name: "Apprentice" };
const blacksmith = { x: 545, y: 266, w: 32, h: 44, name: "Blacksmith" };
const sulfurCave = { x: 1020, y: 140, w: 128, h: 98, name: "Sulfur Cave" };
const furnace = { x: 795, y: 438, w: 100, h: 92, name: "Furnace" };
const treatmentHouse = { x: 930, y: 444, w: 90, h: 68, name: "Treatment House" };
const spring = { x: 168, y: 186, rx: 130, ry: 72 };

let tick = 0;
let keys = {};

let dialogueLines = [
  "Ironford's spring has turned black and corrosive.",
  "Tap the world to move. Talk to villagers, reconstruct the lost chemistry, and save the village."
];

let notebookLines = [
  "Ironford's water crisis is chemical, not supernatural."
];

const clouds = [
  { x: 110, y: 70, s: 1.05, vx: 0.12 },
  { x: 430, y: 55, s: 0.95, vx: 0.09 },
  { x: 760, y: 88, s: 1.10, vx: 0.13 },
  { x: 1060, y: 62, s: 0.92, vx: 0.11 }
];

const motes = Array.from({ length: 30 }, () => ({
  x: Math.random() * W,
  y: Math.random() * H,
  r: 1 + Math.random() * 2,
  vy: 0.08 + Math.random() * 0.28
}));

const caveGas = Array.from({ length: 18 }, () => spawnCaveGas());
const smoke = Array.from({ length: 16 }, () => spawnSmoke());
const sparks = Array.from({ length: 14 }, () => spawnSpark());
const bursts = [];
const celebration = [];

function spawnCaveGas() {
  return {
    x: sulfurCave.x + rand(12, sulfurCave.w - 12),
    y: sulfurCave.y + sulfurCave.h + rand(-5, 24),
    r: rand(3, 7),
    vy: 0.28 + Math.random() * 0.55
  };
}

function spawnSmoke() {
  return {
    x: furnace.x + 50 + rand(-10, 10),
    y: furnace.y + 6 + rand(0, 12),
    r: rand(4, 9),
    vx: -0.28 + Math.random() * 0.56,
    vy: 0.42 + Math.random() * 0.75
  };
}

function spawnSpark() {
  return {
    x: furnace.x + 50,
    y: furnace.y + 34,
    vx: -0.55 + Math.random() * 1.1,
    vy: -1.1 + Math.random() * 0.7,
    life: rand(16, 36)
  };
}

function rand(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function setDialogue(speaker, lines) {
  safeText(speakerEl, speaker);
  dialogueLines = Array.isArray(lines) ? lines : [lines];
  safeText(dialogueEl, dialogueLines.join("\n\n"));
  state.dialogueOpen = true;
}

function setQuest(text) {
  safeText(questChip, text);
}

function addNotebook(text) {
  notebookLines.push(text);
  safeText(notebookEl, notebookLines.join("\n\n"));
}

function showToast(text) {
  safeText(toastEl, text);
  removeHidden(toastEl);
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => addHidden(toastEl), 1600);
}

function showHint(text) {
  removeHidden(hintPanel);
  safeText(hintText, text);
}

function hideHint() {
  addHidden(hintPanel);
}

function showQuestion(q) {
  state.activeQuestion = q;
  safeHTML(questionTitle, q.title);
  safeHTML(questionSubtitle, q.subtitle);
  if (questionOptions) {
    questionOptions.innerHTML = "";
    q.options.forEach((opt, i) => {
      const card = document.createElement("div");
      card.className = "option-card";
      card.innerHTML = `${i + 1}. ${opt}`;
      card.addEventListener("click", () => answerQuestion(i));
      questionOptions.appendChild(card);
    });
  }
  removeHidden(questionModal);
}

function hideQuestion() {
  state.activeQuestion = null;
  addHidden(questionModal);
}

function answerQuestion(i) {
  if (!state.activeQuestion) return;
  const q = state.activeQuestion;
  hideQuestion();
  if (i === q.correct) q.onCorrect();
  else q.onWrong();
}

function setStep(step) {
  state.step = step;
  if (step === 0) setQuest("Talk to the Elder");
  else if (step === 1) setQuest("Talk to the Apprentice");
  else if (step === 2) setQuest("Talk to the Blacksmith");
  else if (step === 3) setQuest("Go to the Sulfur Cave");
  else if (step === 4) setQuest("Go to the Furnace");
  else if (step === 5) setQuest("Go to the Treatment House");
  else if (step === 6) setQuest("Choose the stabilizing mineral");
  else if (step === 7) setQuest("Return to the Blacksmith");
  else if (step === 8) setQuest("Return to the Elder");
  else if (step === 9) setQuest("Ironford is saved");
}

function near(a, b, d = 78) {
  const ax = a.x + a.w / 2;
  const ay = a.y + a.h / 2;
  const bx = b.x + b.w / 2;
  const by = b.y + b.h / 2;
  return Math.hypot(ax - bx, ay - by) <= d;
}

function pulseShake(n = 10) {
  state.shake = Math.max(state.shake, n);
}

function burst(x, y, color) {
  for (let i = 0; i < 26; i++) {
    bursts.push({
      x, y,
      vx: -2 + Math.random() * 4,
      vy: -2.6 + Math.random() * 2.2,
      r: rand(2, 5),
      life: rand(18, 34),
      color
    });
  }
}

function startCelebration() {
  state.celebrationTimer = 220;
  removeHidden(celebrationEl);
  state.springRestored = true;
  for (let i = 0; i < 90; i++) {
    celebration.push({
      x: rand(150, 1120),
      y: rand(90, 430),
      vx: -1.2 + Math.random() * 2.4,
      vy: -2.0 + Math.random() * 1.7,
      r: rand(2, 5),
      life: rand(40, 95),
      color: ["#ffd86b", "#ffffff", "#f5bbcf", "#efe09d"][rand(0, 3)]
    });
  }
}

function interact() {
  if (state.activeQuestion) return;

  if (state.step === 0 && near(player, elder)) {
    setDialogue("Elder", [
      "The spring beneath Ironford has turned black, metallic, and corrosive. Pipes fail, the lower fields die, and even the forge water stings the skin.",
      "Our ancestors used a three-stage treatment chain: first an acid was recovered from mountain sulfur, then a clearing reagent was prepared, and finally the water was stabilized with quarry stone.",
      "Speak to the Apprentice. He remembers the cave."
    ]);
    addNotebook("The lost treatment chain had three stages: acid recovery, coagulant preparation, and mineral stabilization.");
    showToast("Quest updated");
    setStep(1);
    return;
  }

  if (state.step === 1 && near(player, apprentice)) {
    setDialogue("Apprentice", [
      "The cave to the northeast has yellow deposits and choking fumes. The old workers carried samples from there to the furnace.",
      "After that, crates were sent to the treatment house. I never understood what they made there.",
      "The Blacksmith wants someone to identify the mountain source correctly."
    ]);
    addNotebook("Cave clue: yellow deposits + sulfurous fumes.");
    showToast("New clue added");
    setStep(2);
    return;
  }

  if (state.step === 2 && near(player, blacksmith)) {
    setDialogue("Blacksmith", [
      "Then answer carefully: what source from the mountain begins Ironford's lost acid-recovery process?"
    ]);
    showQuestion({
      title: "Which source material most plausibly begins Ironford's lost acid-recovery process?",
      subtitle: "Choose the source that fits the sulfur cave observations and the old furnace route.",
      options: [
        `Sulfur-bearing source <span class="formula">S / FeS₂</span>`,
        `Common salt <span class="formula">NaCl</span>`,
        `Limestone <span class="formula">CaCO₃</span>`,
        `Silica-rich sand <span class="formula">SiO₂</span>`
      ],
      correct: 0,
      onCorrect: () => {
        setDialogue("Blacksmith", [
          "Correct. We begin with sulfur-bearing material. Go to the cave and collect a sample."
        ]);
        addNotebook("Stage 1 source identified: sulfur-bearing material represented as S / FeS₂.");
        pulseShake(8);
        showToast("Sulfur source identified");
        setStep(3);
      },
      onWrong: () => {
        setDialogue("Blacksmith", [
          "No. That would not explain the sulfurous fumes or the old roasting process."
        ]);
      }
    });
    return;
  }

  if (state.step === 3 && near(player, sulfurCave)) {
    state.sulfurCollected = true;
    setDialogue("Narrator", [
      "You collect a sulfur-bearing sample from the cave wall. The deposit is yellow, brittle, and fume-rich."
    ]);
    addNotebook("Sulfur-bearing sample collected from the cave.");
    burst(sulfurCave.x + sulfurCave.w / 2, sulfurCave.y + sulfurCave.h / 2, COLORS.sulfur);
    pulseShake(10);
    showToast("Sample collected");
    setStep(4);
    return;
  }

  if (state.step === 4 && near(player, furnace)) {
    setDialogue("Narrator", [
      "The furnace can recover the acid reagent, but the process must be controlled correctly."
    ]);
    showQuestion({
      title: "Which variable must be controlled most carefully during acid recovery?",
      subtitle: "Think about the roasting/heating stage needed to transform the sulfur-bearing source.",
      options: [
        `Color of the mineral pieces`,
        `Furnace temperature <span class="formula">T</span>`,
        `Shape of the storage jar`,
        `Direction of stirring`
      ],
      correct: 1,
      onCorrect: () => {
        showQuestion({
          title: "Choose the best furnace temperature range",
          subtitle: "200°C: low yield • 300°C: moderate yield • 400°C: high yield • 500°C: product destroyed",
          options: [
            `200°C`,
            `300°C`,
            `400°C`,
            `500°C`
          ],
          correct: 2,
          onCorrect: () => {
            state.acidRecovered = true;
            setDialogue("Narrator", [
              "The furnace stabilizes at 400°C. The lost intermediate acid reagent is recovered: sulfuric acid, H₂SO₄."
            ]);
            addNotebook("Recovered reagent: sulfuric acid, H₂SO₄.");
            burst(furnace.x + furnace.w / 2, furnace.y + furnace.h / 2, "#ffffff");
            pulseShake(14);
            showToast("H₂SO₄ recovered");
            setStep(5);
          },
          onWrong: () => {
            setDialogue("Narrator", [
              "That heating range gives poor yield or destroys the product. Reconsider the temperature that maximizes recovery."
            ]);
          }
        });
      },
      onWrong: () => {
        setDialogue("Narrator", [
          "That is not the critical variable here. The transformation depends primarily on controlled heating."
        ]);
      }
    });
    return;
  }

  if (state.step === 5 && near(player, treatmentHouse)) {
    setDialogue("Narrator", [
      "The treatment house records show that sulfuric acid was not used directly on the spring. It was used to prepare a water-clearing reagent."
    ]);
    showQuestion({
      title: "Which second-stage treatment chemical most plausibly served as Ironford's coagulant?",
      subtitle: "Choose the substance most associated with clearing suspended impurities from contaminated water.",
      options: [
        `Aluminum sulfate <span class="formula">Al₂(SO₄)₃</span>`,
        `Methane <span class="formula">CH₄</span>`,
        `Sodium chloride <span class="formula">NaCl</span>`,
        `Silicon dioxide <span class="formula">SiO₂</span>`
      ],
      correct: 0,
      onCorrect: () => {
        state.coagulantKnown = true;
        setDialogue("Narrator", [
          "Correct. The second-stage coagulant is aluminum sulfate, Al₂(SO₄)₃."
        ]);
        addNotebook("Second-stage coagulant identified: Al₂(SO₄)₃.");
        showToast("Coagulant identified");
        pulseShake(8);
        setStep(6);
      },
      onWrong: () => {
        setDialogue("Narrator", [
          "That would not function as a realistic water-clearing coagulant in the purifier."
        ]);
      }
    });
    return;
  }

  if (state.step === 6 && near(player, treatmentHouse)) {
    setDialogue("Narrator", [
      "After coagulation, the treated water still needs mineral stabilization."
    ]);
    showQuestion({
      title: "Which mineral should be used to stabilize the treated water?",
      subtitle: "Choose the mineral that helps rebalance final chemistry after treatment.",
      options: [
        `Limestone <span class="formula">CaCO₃</span>`,
        `Sulfur <span class="formula">S</span>`,
        `Copper sulfate <span class="formula">CuSO₄</span>`,
        `Ammonia <span class="formula">NH₃</span>`
      ],
      correct: 0,
      onCorrect: () => {
        state.stabilizerKnown = true;
        setDialogue("Narrator", [
          "Correct. The full recovery chain is now known:",
          "Sulfur-bearing source → H₂SO₄ → Al₂(SO₄)₃ → CaCO₃ stabilization."
        ]);
        addNotebook("Final stabilization mineral identified: CaCO₃.");
        showToast("Treatment chain complete");
        pulseShake(10);
        setStep(7);
      },
      onWrong: () => {
        setDialogue("Narrator", [
          "That would not properly stabilize the treated spring water."
        ]);
      }
    });
    return;
  }

  if (state.step === 7 && near(player, blacksmith)) {
    setDialogue("Blacksmith", [
      "Then we have it again: sulfur-bearing source, sulfuric acid, aluminum sulfate for coagulation, and limestone for final stabilization.",
      "That is the chemistry Ironford lost. Go tell the Elder."
    ]);
    addNotebook("Full treatment chain restored.");
    showToast("Return to Elder");
    setStep(8);
    return;
  }

  if (state.step === 8 && near(player, elder)) {
    setDialogue("Elder", [
      "Then Ironford is restored. The spring can run clear again, the purifier can work, and this knowledge can be taught once more.",
      "You did not merely bring a substance. You brought back understanding."
    ]);
    showToast("Village saved");
    pulseShake(18);
    startCelebration();
    setStep(9);
    return;
  }
}

function circle(x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(x, y, rx, ry, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function roundedRect(x, y, w, h, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

function drawBackground() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, COLORS.skyTop);
  g.addColorStop(0.4, COLORS.skyBottom);
  g.addColorStop(1, "#7cc278");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  clouds.forEach(c => {
    ellipse(c.x, c.y, 64 * c.s, 24 * c.s, "rgba(255,255,255,0.72)");
    ellipse(c.x + 40 * c.s, c.y + 8, 52 * c.s, 20 * c.s, "rgba(255,255,255,0.62)");
    ellipse(c.x - 38 * c.s, c.y + 6, 46 * c.s, 18 * c.s, "rgba(255,255,255,0.58)");
  });

  for (let x = 0; x < W; x += 64) {
    for (let y = WORLD_TOP; y < H; y += 64) {
      ctx.fillStyle = ((x / 64 + y / 64) % 2 === 0) ? COLORS.grassA : COLORS.grassB;
      ctx.fillRect(x, y, 64, 64);
    }
  }

  const springOuter = state.springRestored ? COLORS.waterClean : COLORS.waterDark;
  const springInner = state.springRestored ? "#4d9cf0" : "#454545";

  ellipse(spring.x, spring.y, spring.rx, spring.ry, springOuter);
  ellipse(spring.x + 5, spring.y + 5, spring.rx - 22, spring.ry - 20, springInner);

  ctx.strokeStyle = state.springRestored ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.08)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(spring.x + 8, spring.y + 6, 70 + Math.sin(tick * 0.05) * 3, 0.3, 2.8);
  ctx.stroke();

  roundedRect(340, 250, 560, 120, 24, COLORS.pathB);
  roundedRect(785, 345, 118, 220, 22, COLORS.pathB);
  roundedRect(860, 176, 212, 88, 18, COLORS.pathB);

  roundedRect(350, 255, 540, 110, 20, COLORS.pathA);
  roundedRect(790, 350, 108, 210, 20, COLORS.pathA);
  roundedRect(866, 181, 200, 78, 16, COLORS.pathA);

  ctx.beginPath();
  ctx.moveTo(880, 0);
  ctx.lineTo(1280, 0);
  ctx.lineTo(1280, 360);
  ctx.lineTo(1125, 292);
  ctx.lineTo(1035, 318);
  ctx.lineTo(920, 225);
  ctx.closePath();
  ctx.fillStyle = COLORS.mountainA;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(980, 0);
  ctx.lineTo(1280, 0);
  ctx.lineTo(1280, 240);
  ctx.lineTo(1164, 190);
  ctx.lineTo(1089, 228);
  ctx.lineTo(1015, 172);
  ctx.closePath();
  ctx.fillStyle = COLORS.mountainB;
  ctx.fill();
}

function drawTree(x, y, s = 1) {
  const sway = Math.sin(tick * 0.04 + x * 0.02) * 3;
  roundedRect(x, y, 14 * s, 28 * s, 4, COLORS.treeTrunk);
  circle(x + 7 * s + sway, y, 18 * s, COLORS.treeLeafA);
  circle(x - 10 * s + sway, y + 6 * s, 14 * s, COLORS.treeLeafB);
  circle(x + 24 * s + sway, y + 8 * s, 14 * s, COLORS.treeLeafB);
}

function drawFlowers(x, y) {
  ["#f4d38a", "#eca8b9", "#f1e6a2"].forEach(c => {
    circle(x + rand(-18, 18), y + rand(-10, 10), 3, c);
    circle(x + rand(-18, 18), y + rand(-10, 10), 2, c);
  });
}

function drawDecor() {
  [
    [90, 252, 1.0], [170, 312, 0.9], [260, 225, 1.05],
    [1090, 430, 1.0], [980, 490, 0.92], [1182, 405, 1.0], [900, 580, 0.95]
  ].forEach(t => drawTree(t[0], t[1], t[2]));

  [[365, 396], [455, 415], [620, 418], [290, 525], [1112, 505], [1040, 412]].forEach(p => drawFlowers(p[0], p[1]));

  motes.forEach(m => circle(m.x, m.y, m.r, "rgba(244,250,244,0.65)"));
}

function drawHouse(x, y, w, h, roof) {
  roundedRect(x, y, w, h, 8, COLORS.house);
  roundedRect(x, y + h * 0.45, w, h * 0.55, 8, COLORS.houseShade);

  ctx.fillStyle = roof;
  ctx.beginPath();
  ctx.moveTo(x - 6, y + 6);
  ctx.lineTo(x + w / 2, y - 42);
  ctx.lineTo(x + w + 6, y + 6);
  ctx.closePath();
  ctx.fill();

  roundedRect(x + w / 2 - 10, y + h - 26, 20, 26, 4, "#6b472c");
}

function drawVillage() {
  drawHouse(430, 230, 100, 88, COLORS.roofB);
  drawHouse(570, 208, 126, 112, COLORS.roofR);
  drawHouse(720, 232, 154, 116, COLORS.roofG);

  if (state.step >= 9) {
    roundedRect(310, 118, 156, 98, 12, "#a39561");
    circle(386, 160, 14, "#f1ea93");
  }

  ctx.fillStyle = COLORS.black;
  ctx.font = "bold 28px Arial";
  ctx.fillText("IRONFORD", 470, 70);

  ctx.font = "15px Arial";
  ctx.fillText("Workshop", 770, 218);
}

function drawCave() {
  ellipse(sulfurCave.x + sulfurCave.w / 2, sulfurCave.y + sulfurCave.h / 2, sulfurCave.w / 2, sulfurCave.h / 2, COLORS.cave);
  ellipse(sulfurCave.x + 62, sulfurCave.y + 48, 40, 22, COLORS.caveMouth);

  for (let i = 0; i < 8; i++) {
    circle(sulfurCave.x + 12 + i * 13, sulfurCave.y + 82 + (i % 2) * 6, 5, COLORS.sulfur);
  }

  caveGas.forEach(g => {
    ctx.strokeStyle = "rgba(239,228,136,0.8)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
    ctx.stroke();
  });

  ctx.fillStyle = COLORS.black;
  ctx.font = "16px Arial";
  ctx.fillText("Sulfur Cave", sulfurCave.x + 10, sulfurCave.y - 14);
}

function drawFurnace() {
  roundedRect(furnace.x, furnace.y, furnace.w, furnace.h, 14, COLORS.furnaceBody);
  const glow = 180 + Math.floor(75 * Math.sin(tick * 0.13));
  roundedRect(furnace.x + 18, furnace.y + 20, furnace.w - 36, furnace.h - 28, 10, `rgb(${glow},125,38)`);

  smoke.forEach(s => circle(s.x, s.y, s.r, COLORS.smoke));
  sparks.forEach(s => circle(s.x, s.y, 2, COLORS.spark));

  ellipse(furnace.x + 50, furnace.y + 100, 90, 36, "rgba(255,180,70,0.12)");

  ctx.fillStyle = COLORS.black;
  ctx.font = "16px Arial";
  ctx.fillText("Furnace", furnace.x + 18, furnace.y - 14);
}

function drawTreatmentHouse() {
  roundedRect(treatmentHouse.x, treatmentHouse.y, treatmentHouse.w, treatmentHouse.h, 12, COLORS.treatment);
  roundedRect(treatmentHouse.x + 10, treatmentHouse.y + 10, treatmentHouse.w - 20, treatmentHouse.h - 20, 10, COLORS.treatmentInner);
  circle(treatmentHouse.x + 20, treatmentHouse.y + 20, 6, "#dfe7f5");
  circle(treatmentHouse.x + 38, treatmentHouse.y + 28, 5, "#dfe7f5");
  circle(treatmentHouse.x + 55, treatmentHouse.y + 18, 5, "#dfe7f5");

  if (state.step >= 5) {
    ellipse(treatmentHouse.x + 44, treatmentHouse.y + 78, 58, 18, "rgba(170,210,255,0.15)");
  }

  ctx.fillStyle = COLORS.black;
  ctx.font = "16px Arial";
  ctx.fillText("Treatment House", treatmentHouse.x - 8, treatmentHouse.y - 14);
}

function drawMarker(x, y) {
  const py = y + Math.sin(tick * 0.16) * 3;
  circle(x, py, 10, COLORS.gold);
  ctx.fillStyle = COLORS.black;
  ctx.font = "bold 14px Arial";
  ctx.fillText("!", x - 3, py + 5);
}

function drawPerson(e, color, marker = false) {
  const bob = Math.sin(tick * 0.08 + e.x * 0.02) * 2.4;
  const x = e.x;
  const y = e.y + bob;

  ellipse(x + e.w / 2, y + e.h - 2, e.w / 2 - 2, 5, COLORS.shadow);
  circle(x + e.w / 2, y + 10, 9, COLORS.skin);
  roundedRect(x + 6, y + 18, e.w - 12, 16, 5, color);
  roundedRect(x + 9, y + 32, 6, 10, 3, color);
  roundedRect(x + e.w - 15, y + 32, 6, 10, 3, color);
  roundedRect(x + 4, y + 20, 4, 12, 2, COLORS.skin);
  roundedRect(x + e.w - 8, y + 20, 4, 12, 2, COLORS.skin);

  ctx.fillStyle = COLORS.black;
  ctx.font = "bold 16px Arial";
  ctx.fillText(e.name, x - 10, y - 12);

  if (marker) drawMarker(x + e.w / 2, y - 18);
}

function drawPlayer() {
  const moving = state.tapTarget !== null || keys["ArrowLeft"] || keys["ArrowRight"] || keys["ArrowUp"] || keys["ArrowDown"] || keys["a"] || keys["d"] || keys["w"] || keys["s"];
  const bob = moving ? Math.sin(tick * 0.22) * 3 : Math.sin(tick * 0.08) * 1.4;
  const x = player.x;
  const y = player.y + bob;

  ellipse(x + player.w / 2, y + player.h - 2, player.w / 2 - 2, 5, COLORS.shadow);
  circle(x + player.w / 2, y + 10, 9, COLORS.skin);
  roundedRect(x + 6, y + 18, player.w - 12, 16, 5, COLORS.player);
  roundedRect(x + 9, y + 32, 6, 10, 3, COLORS.player);
  roundedRect(x + player.w - 15, y + 32, 6, 10, 3, COLORS.player);
  roundedRect(x + 4, y + 20, 4, 12, 2, COLORS.skin);
  roundedRect(x + player.w - 8, y + 20, 4, 12, 2, COLORS.skin);
}

function drawBursts() {
  bursts.forEach(b => circle(b.x, b.y, b.r, b.color));
}

function drawCelebrationParticles() {
  celebration.forEach(c => circle(c.x, c.y, c.r, c.color));
}

function drawWorld() {
  const sx = state.shake > 0 ? (-state.shake / 2 + Math.random() * state.shake) : 0;
  const sy = state.shake > 0 ? (-state.shake / 2 + Math.random() * state.shake) : 0;

  ctx.save();
  ctx.translate(sx, sy);

  drawBackground();
  drawDecor();
  drawVillage();
  drawCave();
  drawFurnace();
  drawTreatmentHouse();

  drawPerson(elder, COLORS.elder, state.step === 0 || state.step === 8);
  drawPerson(apprentice, COLORS.apprentice, state.step === 1);
  drawPerson(blacksmith, COLORS.player, state.step === 2 || state.step === 7);
  drawPlayer();
  drawBursts();
  drawCelebrationParticles();

  if (state.tapTarget) {
    circle(state.tapTarget.x, state.tapTarget.y, 8 + Math.sin(tick * 0.2) * 2, "rgba(255,216,107,0.75)");
  }

  ctx.fillStyle = "rgba(18,10,0,0.05)";
  ctx.fillRect(0, 0, W, H);

  ctx.restore();
}

function updateHint() {
  if (state.activeQuestion) {
    hideHint();
    return;
  }

  if (state.step === 0 && near(player, elder)) showHint("Tap E to talk to Elder");
  else if (state.step === 1 && near(player, apprentice)) showHint("Tap E to talk to Apprentice");
  else if (state.step === 2 && near(player, blacksmith)) showHint("Tap E to talk to Blacksmith");
  else if (state.step === 3 && near(player, sulfurCave)) showHint("Tap E to collect sulfur sample");
  else if (state.step === 4 && near(player, furnace)) showHint("Tap E to use furnace");
  else if ((state.step === 5 || state.step === 6) && near(player, treatmentHouse)) showHint("Tap E to inspect treatment house");
  else if (state.step === 7 && near(player, blacksmith)) showHint("Tap E to return to Blacksmith");
  else if (state.step === 8 && near(player, elder)) showHint("Tap E to return to Elder");
  else hideHint();
}

function movePlayer() {
  let dx = 0;
  let dy = 0;

  if (!state.activeQuestion) {
    if (keys["ArrowLeft"] || keys["a"] || keys["A"]) dx -= 1;
    if (keys["ArrowRight"] || keys["d"] || keys["D"]) dx += 1;
    if (keys["ArrowUp"] || keys["w"] || keys["W"]) dy -= 1;
    if (keys["ArrowDown"] || keys["s"] || keys["S"]) dy += 1;
  }

  if (dx !== 0 || dy !== 0) {
    state.tapTarget = null;
    const mag = Math.hypot(dx, dy);
    player.x += (dx / mag) * player.speed;
    player.y += (dy / mag) * player.speed;
    return;
  }

  if (state.tapTarget && !state.activeQuestion) {
    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;
    const tx = state.tapTarget.x;
    const ty = state.tapTarget.y;
    const dist = Math.hypot(tx - px, ty - py);

    if (dist < 8) {
      state.tapTarget = null;
    } else {
      player.x += ((tx - px) / dist) * player.speed;
      player.y += ((ty - py) / dist) * player.speed;
    }
  }
}

function updateWorld() {
  tick += 1;

  movePlayer();

  player.x = Math.max(0, Math.min(W - player.w, player.x));
  player.y = Math.max(WORLD_TOP, Math.min(WORLD_BOTTOM - player.h, player.y));

  clouds.forEach(c => {
    c.x += c.vx;
    if (c.x > W + 140) c.x = -140;
  });

  motes.forEach(m => {
    m.y -= m.vy;
    if (m.y < -5) {
      m.y = H + rand(0, 30);
      m.x = rand(0, W);
    }
  });

  caveGas.forEach((g, i) => {
    g.y -= g.vy;
    if (g.y < sulfurCave.y - 20) caveGas[i] = spawnCaveGas();
  });

  smoke.forEach((s, i) => {
    s.x += s.vx;
    s.y -= s.vy;
    if (s.y < furnace.y - 72) smoke[i] = spawnSmoke();
  });

  sparks.forEach((s, i) => {
    s.x += s.vx;
    s.y += s.vy;
    s.life--;
    if (s.life <= 0) sparks[i] = spawnSpark();
  });

  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i];
    b.x += b.vx;
    b.y += b.vy;
    b.vy += 0.08;
    b.life--;
    if (b.life <= 0) bursts.splice(i, 1);
  }

  for (let i = celebration.length - 1; i >= 0; i--) {
    const c = celebration[i];
    c.x += c.vx;
    c.y += c.vy;
    c.vy += 0.03;
    c.life--;
    if (c.life <= 0) celebration.splice(i, 1);
  }

  if (state.celebrationTimer > 0) {
    state.celebrationTimer--;
    if (state.celebrationTimer % 10 === 0) {
      for (let i = 0; i < 4; i++) {
        celebration.push({
          x: rand(150, 1130),
          y: rand(100, 420),
          vx: -1.2 + Math.random() * 2.4,
          vy: -2 + Math.random() * 1.6,
          r: rand(2, 5),
          life: rand(28, 78),
          color: ["#ffd86b", "#ffffff", "#f4b2c8", "#f0e49b"][rand(0, 3)]
        });
      }
    }
  } else {
    addHidden(celebrationEl);
  }

  if (state.shake > 0) state.shake *= 0.85;

  updateHint();
}

function gameLoop() {
  try {
    updateWorld();
    drawWorld();
  } catch (err) {
    console.error(err);
    setDialogue("Error", [String(err)]);
  }
  requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if ((e.key === "e" || e.key === "E") && !state.activeQuestion) interact();
  if (state.activeQuestion) {
    if (e.key === "1") answerQuestion(0);
    if (e.key === "2") answerQuestion(1);
    if (e.key === "3") answerQuestion(2);
    if (e.key === "4") answerQuestion(3);
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

if (interactBtn) interactBtn.addEventListener("click", interact);

if (notebookBtn) {
  notebookBtn.addEventListener("click", () => {
    state.notebookOpen = !state.notebookOpen;
    toggleHidden(notebookBox, !state.notebookOpen);
  });
}

function setTapTargetFromEvent(ev) {
  if (state.activeQuestion) return;
  const rect = canvas.getBoundingClientRect();
  const x = ((ev.clientX - rect.left) / rect.width) * W;
  const y = ((ev.clientY - rect.top) / rect.height) * H;
  state.tapTarget = {
    x: Math.max(0, Math.min(W, x)),
    y: Math.max(WORLD_TOP, Math.min(WORLD_BOTTOM, y))
  };
}

canvas.addEventListener("pointerdown", (ev) => {
  setTapTargetFromEvent(ev);
});

document.addEventListener("pointerdown", (ev) => {
  const dialogueBox = document.getElementById("dialogue-box");
  const qCard = document.getElementById("question-card");
  const noteBox = notebookBox;

  if (state.activeQuestion) return;

  const insideDialogue = dialogueBox && dialogueBox.contains(ev.target);
  const insideQuestion = qCard && qCard.contains(ev.target);
  const insideNotebook = noteBox && noteBox.contains(ev.target);
  const onButtons = interactBtn && interactBtn.contains(ev.target) || notebookBtn && notebookBtn.contains(ev.target);

  if (!insideDialogue && !insideQuestion && !insideNotebook && !onButtons && state.dialogueOpen) {
    safeText(dialogueEl, "");
    safeText(speakerEl, "");
    state.dialogueOpen = false;
  }
});

setDialogue("Narrator", dialogueLines);
safeText(notebookEl, notebookLines.join("\n\n"));
setQuest("Talk to the Elder");
toggleHidden(notebookBox, true);
gameLoop();
