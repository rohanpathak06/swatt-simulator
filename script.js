/* ================= AUDIO ================= */
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioCtx();

function beep(freq=440, dur=0.12){
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.frequency.value = freq;
  g.gain.value = 0.05;
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + dur);
}

/* ================= STATE ================= */
const screens = {
  intro, targets, forces, mission, success, failure
};

const phases = [
  "Infiltration",
  "Breach & Clear",
  "Extraction"
];


const state = {
  target: null,
  force: null,
  score: 0,
  qIndex: 0,
  total: 9
};

function show(name){
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[name].classList.add("active");
}

/* ================= DATA ================= */
const targetsData = [
  {
    name: "El Diablo",
    threat: 80,
    inspiredBy: "Pablo Escobar (Narcos)",
    image: "assets/targets/el_diablo.jpg",
    profile: "Notorious cartel kingpin controlling cross-border narcotics routes.",
    difficulty: "High"
  },
  {
    name: "Iron Regent",
    threat: 75,
    inspiredBy: "President Snow (The Hunger Games)",
    image: "assets/targets/iron_regent.jpg",
    profile: "Authoritarian ruler of a rogue state, protected by elite guards.",
    difficulty: "Medium-High"
  },
  {
    name: "Shadow Phantom",
    threat: 90,
    inspiredBy: "Vladimir Makarov (Call of Duty)",
    image: "assets/targets/shadow_phantom.jpg",
    profile: "Elusive terror mastermind orchestrating global covert attacks.",
    difficulty: "Extreme"
  },
  {
    name: "Black Viper",
    threat: 70,
    inspiredBy: "Salvatore Maroni–type crime boss (Batman universe)",
    image: "assets/targets/black_viper.jpg",
    profile: "Urban crime lord running weapons and underground networks.",
    difficulty: "Medium"
  },
  {
    name: "Night Broker",
    threat: 65,
    inspiredBy: "Raymond Reddington (The Blacklist)",
    image: "assets/targets/night_broker.jpg",
    profile: "High-IQ information dealer manipulating criminals and governments.",
    difficulty: "Medium"
  }
];


const forcesData = [
  {
    name: "Task Unit Alpha",
    image: "assets/forces/alpha.png",
    perk: "Stealth & Recon",
    bonus: { score: 1.1, time: +5 }
  },
  {
    name: "Task Unit Bravo",
    image: "assets/forces/bravo.png",
    perk: "CQB Coordination",
    bonus: { score: 1.15, mistakePenalty: -5 }
  },
  {
    name: "Task Unit Charlie",
    image: "assets/forces/charlie.png",
    perk: "Intel Accuracy",
    bonus: { skipChance: 1 }
  },
  {
    name: "Task Unit Delta",
    image: "assets/forces/delta.png",
    perk: "Precision Strike",
    bonus: { score: 1.2 }
  },
  {
    name: "Task Unit Echo",
    image: "assets/forces/echo.png",
    perk: "Stress Resistance",
    bonus: { mistakePenalty: -3 }
  }
];



const questions = [
  {q:"Best way to reduce risk?", a:["Communication","Speed","Guessing"], c:0},
  {q:"Unexpected obstacle?", a:["Reassess","Ignore","Rush"], c:0},
  {q:"Ethical priority?", a:["Safety","Force","Speed"], c:0},
  {q:"Intel handling?", a:["Verify","Assume","Skip"], c:0},
  {q:"Team leadership?", a:["Adapt","Freeze","Blame"], c:0},
  {q:"Crowded area?", a:["Caution","Aggression","Speed"], c:0},
  {q:"Mission success?", a:["Objectives","Score","Speed"], c:0},
  {q:"Change of plan?", a:["Calm adjust","Panic","Abort"], c:0},
  {q:"After mission?", a:["Review","Forget","Ignore"], c:0}
];

/* ================= RENDER ================= */
function renderCards(data, container, onSelect){
  container.innerHTML = "";
  data.forEach(item=>{
    const c = document.createElement("div");
    c.className = "card";
    c.innerHTML = `
      <div class="mugshot" style="background-image:url('${item.image}')"></div>
      <strong>${item.name}</strong>
      <p style="font-size:12px; opacity:.8">${item.perk}</p>
      <div class="stat"><span style="width:60%"></span></div>
    `;


    c.onclick = ()=>{
      [...container.children].forEach(x=>x.classList.remove("selected"));
      c.classList.add("selected");
      onSelect(item);
      beep();
    };
    container.appendChild(c);
  });
}

function updatePhase() {
  const phaseIndex = Math.floor((state.qIndex / state.total) * phases.length);
  phasePill.textContent = `Phase ${phaseIndex + 1}: ${phases[phaseIndex]}`;
}


/* ================= MISSION ================= */
function renderQuestion(){
  const q = questions[state.qIndex];
  questionText.textContent = q.q;
  choices.innerHTML = "";

  q.a.forEach((txt,i)=>{
    const d = document.createElement("div");
    d.className = "choice";
    d.textContent = txt;
    d.onclick = ()=>answer(i===q.c);
    choices.appendChild(d);
  });

  progressBar.style.width = ((state.qIndex + 1) / state.total * 100) + "%";
  updatePhase();
  startTimer();
}

function updateHUD(){
  scorePill.textContent = `Score: ${Math.round(state.score)}`;
}


function answer(correct) {
  let gain = 10;
  let penalty = 8;

  if (state.force.bonus.mistakePenalty) {
    penalty = Math.max(1, penalty + state.force.bonus.mistakePenalty);
  }

  if (correct) {
    gain *= state.force.bonus.score || 1;
    state.score += Math.round(gain);
    beep(900);
  } else {
    state.score -= penalty;
    shakeScreen();
    beep(180);
  }

  updateHUD();
  nextQuestion();
}

function nextQuestion() {
  state.qIndex++;

  if (state.qIndex >= state.total) {
    endMission();
    return;
  }

  updatePhase();
  renderQuestion();
  startTimer();
}


function endMission(){
  if(state.score >= 50){
    finalScore.textContent = `Final Score: ${Math.round(state.score)}`;
    show("success");
  } else {
    failReason.textContent = `Score ${Math.round(state.score)} – Objectives not met`;
    show("failure");
  }
}

/* ================= EVENTS ================= */
startBtn.onclick = ()=>{ audioCtx.resume(); show("targets"); };
toForces.onclick = ()=> state.target && show("forces");
toMission.onclick = ()=>{
  if(!state.force) return;
  state.score = 0; state.qIndex = 0;
  scorePill.textContent = "Score: 0";
  renderQuestion();
  show("mission");
};
quitBtn.onclick = ()=>{
  clearInterval(timer);
  show("intro");
};

replayWin.onclick = replayFail.onclick = ()=> show("intro");

/* ================= INIT ================= */
renderCards(targetsData, targetGrid, t=>state.target=t);
renderCards(forcesData, forceGrid, f=>state.force=f);

let timer;
let timeLeft = 30;

function startTimer() {
  clearInterval(timer);
  timeLeft = 30 + (state.force.bonus.time || 0);

  timer = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(timer);
      answer(false);
    }
  }, 1000);
}

