// Global State
let defaultTeams = [];
let currentTeams = [];

// Chart instances
let oddsChart = null;
let favoritesChart = null;
let groupDistributionChart = null;

// Sandbox Filters & Presets
let selectedSandboxGroup = "ALL";

// Live Sim Interval tracker
let activeLiveSimInterval = null;

// FIFA 3-letter to ISO 2-letter mapping for Flag CDN (flagcdn.com)
const iso2 = {
  USA: "us", COL: "co", POL: "pl", MAR: "ma",
  MEX: "mx", GER: "de", JPN: "jp", CMR: "cm",
  CAN: "ca", POR: "pt", KOR: "kr", SEN: "sn",
  ARG: "ar", NED: "nl", AUS: "au", TUN: "tn",
  FRA: "fr", CRO: "hr", ECU: "ec", KSA: "sa",
  BRA: "br", SUI: "ch", IRN: "ir", GHA: "gh",
  ENG: "gb-eng", URU: "uy", DEN: "dk", EGY: "eg",
  ESP: "es", BEL: "be", UKR: "ua", NGA: "ng",
  ITA: "it", CHI: "cl", ALG: "dz", UZB: "uz",
  AUT: "at", SWE: "se", QAT: "qa", PAN: "pa",
  SRB: "rs", WAL: "gb-wls", PER: "pe", CRC: "cr",
  TUR: "tr", HUN: "hu", NZL: "nz", MLI: "ml"
};

// Native flag emoji fallback for select tags (where images aren't allowed)
const emojiFlags = {
  USA: "🇺🇸", COL: "🇨🇴", POL: "🇵🇱", MAR: "🇲🇦",
  MEX: "🇲🇽", GER: "🇩🇪", JPN: "🇯🇵", CMR: "🇨🇲",
  CAN: "🇨🇦", POR: "🇵🇹", KOR: "🇰🇷", SEN: "🇸🇳",
  ARG: "🇦🇷", NED: "🇳🇱", AUS: "🇦🇺", TUN: "🇹🇳",
  FRA: "🇫🇷", CRO: "🇭🇷", ECU: "🇪🇨", KSA: "🇸🇦",
  BRA: "🇧🇷", SUI: "🇨🇭", IRN: "🇮🇷", GHA: "🇬🇭",
  ENG: "🏴", URU: "🇺🇾", DEN: "🇩🇰", EGY: "🇪🇬",
  ESP: "🇪🇸", BEL: "🇧🇪", UKR: "🇺🇦", NGA: "🇳🇬",
  ITA: "🇮🇹", CHI: "🇨🇱", ALG: "🇩🇿", UZB: "🇺🇿",
  AUT: "🇦🇹", SWE: "🇸🇪", QAT: "🇶🇦", PAN: "🇵🇦",
  SRB: "🇷🇸", WAL: "🏴", PER: "🇵🇪", CRC: "🇨🇷",
  TUR: "🇹🇷", HUN: "🇭🇺", NZL: "🇳🇿", MLI: "🇲🇱"
};

// Helper: Get Flag Image HTML Tag
function getFlagImg(code, size = 40) {
  const file = iso2[code] || "un";
  return `<img src="https://flagcdn.com/w${size}/${file}.png" class="flag-icon" alt="${code}">`;
}

// DOM Elements
const hostBoostToggle = document.getElementById('host-boost-toggle');
const monteCarloCountSelect = document.getElementById('monte-carlo-count');
const btnRunForecast = document.getElementById('btn-run-forecast');
const btnRunSingle = document.getElementById('btn-run-single');

const navDashboard = document.getElementById('nav-dashboard');
const navBracket = document.getElementById('nav-bracket');
const navGroups = document.getElementById('nav-groups');
const navSandbox = document.getElementById('nav-sandbox');

const loaderOverlay = document.getElementById('loader-overlay');
const loaderText = document.getElementById('loader-text');
const toastElement = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

const matchModal = document.getElementById('match-modal');
const modalClose = document.getElementById('modal-close');

// SPA Elements
const landingPage = document.getElementById('landing-page');
const simulatorDashboard = document.getElementById('simulator-dashboard');
const btnLaunchSim = document.getElementById('btn-launch-sim');
const btnLaunchSimNav = document.getElementById('btn-launch-sim-nav');
const btnDashboardBack = document.getElementById('btn-dashboard-back');
const btnBrandHome = document.getElementById('btn-brand-home');

// Quick Predictor Elements
const selectTeam1 = document.getElementById('select-team1');
const selectTeam2 = document.getElementById('select-team2');
const ratingTeam1 = document.getElementById('rating-team1');
const ratingTeam2 = document.getElementById('rating-team2');
const btnPredictMatch = document.getElementById('btn-predict-match');
const predictorResultBox = document.getElementById('predictor-result-box');
const predTeam1Name = document.getElementById('pred-team1-name');
const predTeam2Name = document.getElementById('pred-team2-name');
const predGoals = document.getElementById('pred-goals');
const predShootoutScore = document.getElementById('pred-shootout-score');
const predWinnerText = document.getElementById('pred-winner-text');

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  setupModal();
  setupSPATransitions();
  setupQuickPredictor();
  setupTodayMatches();
  setupSandboxControls();
  await loadTeams();
  
  // Recalculate bracket paths on window resizing
  window.addEventListener('resize', drawBracketLines);
});

// Setup Tab Navigation
function setupTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Deactivate all tabs
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Activate clicked tab
      tab.classList.add('active');
      const contentId = tab.getAttribute('data-tab');
      document.getElementById(contentId).classList.add('active');
      
      // Redraw bracket lines if switching to bracket tab (ensures widths calculate correctly)
      if (contentId === 'tab-bracket') {
        setTimeout(drawBracketLines, 50);
      }
    });
  });
}

// Setup Modal Close Action (Stop active intervals if closed during live cast)
function setupModal() {
  const closeModal = () => {
    if (activeLiveSimInterval) {
      clearInterval(activeLiveSimInterval);
      activeLiveSimInterval = null;
    }
    matchModal.classList.remove('active');
  };

  modalClose.addEventListener('click', closeModal);
  window.addEventListener('click', (e) => {
    if (e.target === matchModal) {
      closeModal();
    }
  });
}

// Show Toast Message
function showToast(message, type = 'success') {
  toastMessage.textContent = message;
  toastElement.className = 'toast'; // Reset classes
  if (type === 'success') {
    toastElement.classList.add('toast-success');
    document.getElementById('toast-icon').textContent = '✓';
  } else {
    toastElement.classList.add('toast-warning');
    document.getElementById('toast-icon').textContent = '⚠';
  }
  toastElement.classList.add('active');
  setTimeout(() => {
    toastElement.classList.remove('active');
  }, 3500);
}

// SPA Transitions (Switching between Landing Page, Simulator Dashboard, and About Me Page)
function setupSPATransitions() {
  const aboutMePage = document.getElementById('about-me-page');
  const btnAboutMeNav = document.getElementById('btn-about-me-nav');
  const btnAboutMeBack = document.getElementById('btn-aboutme-back');

  const launchDashboard = async () => {
    landingPage.style.display = 'none';
    simulatorDashboard.style.display = 'flex';
    aboutMePage.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Auto-run forecast on first launch if not already populated
    if (!oddsChart) {
      await runMonteCarloForecast(true);
    }
  };

  const showLanding = () => {
    simulatorDashboard.style.display = 'none';
    aboutMePage.style.display = 'none';
    landingPage.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showAboutMe = () => {
    landingPage.style.display = 'none';
    simulatorDashboard.style.display = 'none';
    aboutMePage.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  btnLaunchSim.addEventListener('click', launchDashboard);
  btnLaunchSimNav.addEventListener('click', launchDashboard);
  btnDashboardBack.addEventListener('click', showLanding);
  btnBrandHome.addEventListener('click', showLanding);
  
  // About Me Page transitions
  btnAboutMeNav.addEventListener('click', showAboutMe);
  btnAboutMeBack.addEventListener('click', showLanding);

  // Link navbar scroll highlights to landing transitions
  document.querySelectorAll('.landing-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (simulatorDashboard.style.display !== 'none' || aboutMePage.style.display !== 'none') {
        showLanding();
      }
    });
  });
}

// Fetch default team list from FastAPI backend
async function loadTeams() {
  try {
    const res = await fetch('/api/teams');
    if (!res.ok) throw new Error("Failed to fetch teams database.");
    defaultTeams = await res.json();
    currentTeams = JSON.parse(JSON.stringify(defaultTeams)); // deep copy
    
    populateSandbox();
    populatePredictorDropdowns();
  } catch (err) {
    console.error(err);
    showToast("Error loading team data", "error");
  }
}

// Setup Sandbox Tabs and Ratings Presets
function setupSandboxControls() {
  // 1. Group Filtering Tabs
  const filterTabs = document.querySelectorAll('.filter-tab');
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      selectedSandboxGroup = tab.getAttribute('data-group');
      populateSandbox();
    });
  });

  // 2. Presets buttons
  document.getElementById('btn-preset-default').addEventListener('click', () => {
    currentTeams = JSON.parse(JSON.stringify(defaultTeams));
    populateSandbox();
    populatePredictorDropdowns(false);
    showToast("Ratings reset to default settings!");
  });

  document.getElementById('btn-preset-chaos').addEventListener('click', () => {
    currentTeams.forEach(t => {
      if (t.rank > 25) {
        t.attack = Math.min(95, t.attack + 15);
        t.defense = Math.min(95, t.defense + 15);
      } else if (t.rank <= 8) {
        t.attack = Math.max(20, t.attack - 8);
        t.defense = Math.max(20, t.defense - 8);
      }
    });
    populateSandbox();
    populatePredictorDropdowns(false);
    showToast("Chaos Mode active! Underdogs boosted.");
  });

  document.getElementById('btn-preset-heavy').addEventListener('click', () => {
    currentTeams.forEach(t => {
      if (t.rank <= 10) {
        t.attack = Math.min(99, t.attack + 12);
        t.defense = Math.min(99, t.defense + 12);
      } else if (t.rank > 35) {
        t.attack = Math.max(10, t.attack - 12);
        t.defense = Math.max(10, t.defense - 12);
      }
    });
    populateSandbox();
    populatePredictorDropdowns(false);
    showToast("Heavyweight Dominance active! Elite teams maxed.");
  });
}

// Populate the What-If Sandbox with editable team cards
function populateSandbox() {
  const container = document.getElementById('sandbox-grid');
  container.innerHTML = '';
  
  // Filter teams by group if needed
  let filtered = [...currentTeams];
  if (selectedSandboxGroup !== "ALL") {
    filtered = filtered.filter(t => t.group === selectedSandboxGroup);
  }
  
  // Sort teams alphabetically by name
  filtered.sort((a, b) => a.name.localeCompare(b.name));
  
  filtered.forEach(team => {
    const card = document.createElement('div');
    card.className = 'glass-panel team-card';
    card.innerHTML = `
      <div class="team-card-header">
        <h3 class="team-name" style="display: flex; align-items: center; gap: 8px;">
          <span style="display:inline-flex; width:28px; height:auto;">${getFlagImg(team.code, 40)}</span>
          <span>${team.name}</span>
        </h3>
        <span class="group-label">Group ${team.group}</span>
      </div>
      
      <!-- Attack Slider -->
      <div class="slider-container">
        <div class="slider-header">
          <span class="slider-label">Attack Rating</span>
          <span class="slider-value" id="att-val-${team.code}">${team.attack}</span>
        </div>
        <input 
          type="range" 
          min="10" max="99" 
          value="${team.attack}" 
          class="range-slider" 
          id="att-slide-${team.code}"
          data-code="${team.code}"
          data-type="attack"
        >
      </div>

      <!-- Defense Slider -->
      <div class="slider-container">
        <div class="slider-header">
          <span class="slider-label">Defense Rating</span>
          <span class="slider-value defense-val" id="def-val-${team.code}">${team.defense}</span>
        </div>
        <input 
          type="range" 
          min="10" max="99" 
          value="${team.defense}" 
          class="range-slider defense-slider" 
          id="def-slide-${team.code}"
          data-code="${team.code}"
          data-type="defense"
        >
      </div>
    `;
    
    container.appendChild(card);
    
    // Add Event Listeners for sliders
    const attSlider = card.querySelector(`#att-slide-${team.code}`);
    const defSlider = card.querySelector(`#def-slide-${team.code}`);
    
    attSlider.addEventListener('input', (e) => {
      const val = e.target.value;
      document.getElementById(`att-val-${team.code}`).textContent = val;
      updateTeamRating(team.code, 'attack', parseInt(val));
    });
    
    defSlider.addEventListener('input', (e) => {
      const val = e.target.value;
      document.getElementById(`def-val-${team.code}`).textContent = val;
      updateTeamRating(team.code, 'defense', parseInt(val));
    });
  });
}

// Sync sandbox changes to global currentTeams list
function updateTeamRating(code, type, value) {
  const team = currentTeams.find(t => t.code === code);
  if (team) {
    team[type] = value;
  }
}

// Setup Quick Match Predictor logic
function populatePredictorDropdowns(resetSelection = true) {
  const t1Val = selectTeam1.value || "USA";
  const t2Val = selectTeam2.value || "MAR";
  
  selectTeam1.innerHTML = '';
  selectTeam2.innerHTML = '';
  
  const sorted = [...currentTeams].sort((a, b) => a.name.localeCompare(b.name));
  
  sorted.forEach(team => {
    const opt1 = document.createElement('option');
    opt1.value = team.code;
    opt1.textContent = `${emojiFlags[team.code] || '🏳️'} ${team.name}`;
    
    const opt2 = opt1.cloneNode(true);
    
    selectTeam1.appendChild(opt1);
    selectTeam2.appendChild(opt2);
  });
  
  // Set selections
  if (resetSelection) {
    selectTeam1.value = "USA";
    selectTeam2.value = "MAR";
  } else {
    selectTeam1.value = t1Val;
    selectTeam2.value = t2Val;
  }
  
  updatePredictorRatings();
}

function updatePredictorRatings() {
  const t1 = currentTeams.find(t => t.code === selectTeam1.value);
  const t2 = currentTeams.find(t => t.code === selectTeam2.value);
  
  if (t1) {
    ratingTeam1.textContent = `Attack Skill: ${t1.attack} | Defense Skill: ${t1.defense}`;
  }
  if (t2) {
    ratingTeam2.textContent = `Attack Skill: ${t2.attack} | Defense Skill: ${t2.defense}`;
  }
}

function setupQuickPredictor() {
  selectTeam1.addEventListener('change', updatePredictorRatings);
  selectTeam2.addEventListener('change', updatePredictorRatings);
  
  btnPredictMatch.addEventListener('click', () => {
    const t1Code = selectTeam1.value;
    const t2Code = selectTeam2.value;
    
    if (t1Code === t2Code) {
      showToast("Select two different teams to run a match!", "warning");
      return;
    }
    
    const t1 = currentTeams.find(t => t.code === t1Code);
    const t2 = currentTeams.find(t => t.code === t2Code);
    
    const result = runLocalMatchSim(t1, t2);
    
    // Display result with PNG flags
    predTeam1Name.innerHTML = `<span style="display:inline-flex; width:22px; height:auto; margin-right:6px; vertical-align:middle;">${getFlagImg(t1.code, 40)}</span>${t1.name}`;
    predTeam2Name.innerHTML = `${t2.name}<span style="display:inline-flex; width:22px; height:auto; margin-left:6px; vertical-align:middle;">${getFlagImg(t2.code, 40)}</span>`;
    predGoals.textContent = `${result.goals1} - ${result.goals2}`;
    
    if (result.shootout) {
      predShootoutScore.textContent = `(${result.shootout_score1} - ${result.shootout_score2} on pens)`;
      predShootoutScore.style.display = 'block';
    } else {
      predShootoutScore.style.display = 'none';
    }
    
    const winnerName = result.winner_code === t1.code ? t1.name : t2.name;
    predWinnerText.innerHTML = `🏆 Winner: <strong>${winnerName}</strong>`;
    
    predictorResultBox.style.display = 'flex';
    showToast("Match simulated locally!");
  });
}

// Setup "Today's Matches" simulations
function setupTodayMatches() {
  const buttons = document.querySelectorAll('.simulate-fixture-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const t1Code = btn.getAttribute('data-team1');
      const t2Code = btn.getAttribute('data-team2');
      const scoreId = btn.getAttribute('data-score-id');
      
      const t1 = currentTeams.find(t => t.code === t1Code);
      const t2 = currentTeams.find(t => t.code === t2Code);
      
      const result = runLocalMatchSim(t1, t2);
      
      const scoreBox = document.getElementById(scoreId);
      scoreBox.textContent = `${result.goals1} - ${result.goals2}`;
      scoreBox.classList.add('simulated');
      
      // Clean up any existing shootout text
      const existingSo = scoreBox.parentElement.querySelector('.fixture-so-text');
      if (existingSo) {
        existingSo.remove();
      }
      
      if (result.shootout) {
        const shootoutText = document.createElement('div');
        shootoutText.className = 'fixture-so-text';
        shootoutText.textContent = `(${result.shootout_score1}-${result.shootout_score2} pens)`;
        scoreBox.parentElement.appendChild(shootoutText);
      }
      
      btn.textContent = "Re-Simulate";
      btn.classList.replace('btn-secondary', 'btn-primary');
      showToast(`Today's fixture: ${t1.name} vs ${t2.name} simulated!`);
    });
  });
}

// Helper: Run Knuth's Poisson simulator in JavaScript
function runLocalMatchSim(t1, t2) {
  const poissonRandom = (lmbda) => {
    if (lmbda <= 0) return 0;
    const L = Math.exp(-lmbda);
    let k = 0;
    let p = 1.0;
    do {
      k++;
      p *= Math.random();
    } while (p > L);
    return k - 1;
  };
  
  // Calculate multipliers
  const t1_att_mult = 0.35 + (t1.attack / 100.0) * 1.45;
  const t2_att_mult = 0.35 + (t2.attack / 100.0) * 1.45;
  
  const t1_def_mult = 1.65 - (t1.defense / 100.0) * 1.35;
  const t2_def_mult = 1.65 - (t2.defense / 100.0) * 1.35;
  
  const lambda1 = t1_att_mult * t2_def_mult * 1.35;
  const lambda2 = t2_att_mult * t1_def_mult * 1.35;
  
  const goals1 = poissonRandom(lambda1);
  const goals2 = poissonRandom(lambda2);
  
  let result = {
    goals1: goals1,
    goals2: goals2,
    shootout: false,
    shootout_score1: 0,
    shootout_score2: 0,
    winner_code: goals1 > goals2 ? t1.code : t2.code
  };
  
  if (goals1 === goals2) {
    result.shootout = true;
    let so1 = 0, so2 = 0;
    
    // First 5 penalties
    for (let r = 0; r < 5; r++) {
      if (Math.random() < 0.75) so1++;
      if (Math.random() < 0.75) so2++;
    }
    
    // Sudden death
    while (so1 === so2) {
      if (Math.random() < 0.75) so1++;
      if (Math.random() < 0.75) so2++;
    }
    
    result.shootout_score1 = so1;
    result.shootout_score2 = so2;
    result.winner_code = so1 > so2 ? t1.code : t2.code;
  }
  
  return result;
}

// Button Click Event Listeners
btnRunForecast.addEventListener('click', () => runMonteCarloForecast());
btnRunSingle.addEventListener('click', () => playSingleTournament());

// API Call: Monte Carlo Forecast
async function runMonteCarloForecast(isInitial = false) {
  loaderText.textContent = isInitial ? "Retrieving default statistics..." : "Compiling Monte Carlo Forecast...";
  loaderOverlay.classList.add('active');
  
  const count = parseInt(monteCarloCountSelect.value);
  const hostBoost = hostBoostToggle.checked;
  
  try {
    const res = await fetch('/api/monte-carlo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teams: currentTeams,
        simulations_count: count,
        host_boost: hostBoost
      })
    });
    
    if (!res.ok) throw new Error("Forecast simulation failed.");
    const data = await res.json();
    
    renderForecastDashboard(data);
    if (!isInitial) {
      showToast(`Forecast compiled across ${count.toLocaleString()} simulations!`);
    }
  } catch (err) {
    console.error(err);
    showToast("Error executing Monte Carlo simulations", "error");
  } finally {
    loaderOverlay.classList.remove('active');
  }
}

// Render Forecast Dashboard
function renderForecastDashboard(stats) {
  // 1. Render Top Favorites list in Sidebar (Top 10)
  const favList = document.getElementById('favorites-list');
  favList.innerHTML = '';
  
  const top10 = stats.slice(0, 10);
  const maxChampProb = top10[0].champion; // Base progress bars on top team
  
  top10.forEach((team) => {
    const item = document.createElement('div');
    item.className = 'favorite-item';
    
    // Scale progress bar relative to the top favorite
    const progressWidth = maxChampProb > 0 ? (team.champion / maxChampProb) * 100 : 0;
    
    item.innerHTML = `
      <div class="team-info">
        <div class="team-badge" style="width: 26px; height: auto;">
          ${getFlagImg(team.code, 40)}
        </div>
        <div>
          <div class="team-name" style="font-family: var(--font-title); font-weight: 700; margin-left: 6px;">${team.name}</div>
          <div class="team-meta" style="margin-left: 6px;">
            <span>Group ${team.group}</span> • <span>FIFA Rank #${team.rank}</span>
          </div>
        </div>
      </div>
      <div class="win-probability">
        <div class="win-pct" style="font-family: var(--font-title); font-weight: 800;">${team.champion.toFixed(1)}%</div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" style="width: ${progressWidth}%"></div>
        </div>
      </div>
    `;
    favList.appendChild(item);
  });
  
  // 2. Render Charts
  renderProgressionLineChart(stats);
  renderFavoritesBarChart(stats.slice(0, 8));
  renderGroupDoughnutChart(stats);
}

// Chart 1: Progression Line Chart (Top 6 teams survival)
function renderProgressionLineChart(stats) {
  const top6 = stats.slice(0, 6);
  const labels = ["Group", "R32", "R16", "QF", "SF", "Finals", "Winner"];
  
  const colors = [
    '#e5b338',  // FIFA Gold
    '#0077ff',  // Blue
    '#db003f',  // Crimson
    '#00a859',  // Green
    '#8b5cf6',  // Purple
    '#06b6d4'   // Cyan
  ];
  
  const datasets = top6.map((team, idx) => {
    const r32 = 100 - team.group_stage_exit;
    const r16 = r32 - team.r32_exit;
    const qf = r16 - team.r16_exit;
    const sf = qf - team.qf_exit;
    const final = team.runner_up + team.champion;
    const champ = team.champion;
    
    return {
      label: team.name,
      data: [100, r32, r16, qf, sf, final, champ],
      borderColor: colors[idx % colors.length],
      backgroundColor: colors[idx % colors.length],
      borderWidth: 2.5,
      pointBackgroundColor: colors[idx % colors.length],
      pointBorderColor: '#ffffff',
      pointBorderWidth: 1.5,
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.2,
      fill: false
    };
  });
  
  if (oddsChart) oddsChart.destroy();
  
  const ctx = document.getElementById('oddsChart').getContext('2d');
  oddsChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 0,
          max: 100,
          grid: { color: 'rgba(0, 0, 0, 0.04)' },
          ticks: {
            color: '#64748b',
            font: { family: "'Outfit', sans-serif" },
            callback: value => value + '%'
          }
        },
        x: {
          grid: { color: 'rgba(0, 0, 0, 0.04)' },
          ticks: {
            color: '#0f172a',
            font: { family: "'Montserrat', sans-serif", weight: 'bold', size: 10 }
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#0f172a',
            boxWidth: 12,
            font: { family: "'Montserrat', sans-serif", size: 10, weight: 600 }
          }
        },
        tooltip: {
          backgroundColor: '#0a142d',
          titleFont: { family: "'Montserrat', sans-serif" },
          bodyFont: { family: "'Outfit', sans-serif" },
          callbacks: {
            label: context => ` ${context.dataset.label}: ${context.raw.toFixed(1)}%`
          }
        }
      }
    }
  });
}

// Chart 2: Favorites Bar Chart (Top 8 Favorites Win Odds)
function renderFavoritesBarChart(top8) {
  const labels = top8.map(t => t.name);
  const dataValues = top8.map(t => t.champion);
  
  if (favoritesChart) favoritesChart.destroy();
  
  const ctx = document.getElementById('favoritesChart').getContext('2d');
  favoritesChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Win Probability',
        data: dataValues,
        backgroundColor: 'rgba(10, 20, 45, 0.85)',
        hoverBackgroundColor: '#e5b338',
        borderRadius: 4,
        borderWidth: 0
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: '#64748b',
            callback: value => value + '%'
          }
        },
        y: {
          grid: { display: false },
          ticks: {
            color: '#0f172a',
            font: { family: "'Montserrat', sans-serif", weight: 'bold', size: 10 }
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0a142d',
          callbacks: {
            label: context => ` Win Odds: ${context.raw.toFixed(1)}%`
          }
        }
      }
    }
  });
}

// Chart 3: Group Win Odds Distribution (Doughnut Chart)
function renderGroupDoughnutChart(stats) {
  const groupSums = {};
  stats.forEach(team => {
    const grp = team.group;
    if (!groupSums[grp]) groupSums[grp] = 0;
    groupSums[grp] += team.champion;
  });
  
  const sortedGroups = Object.keys(groupSums).sort();
  const labels = sortedGroups.map(g => `Group ${g}`);
  const dataValues = sortedGroups.map(g => groupSums[g]);
  
  const colors = [
    '#e5b338', '#0077ff', '#db003f', '#00a859',
    '#8b5cf6', '#06b6d4', '#ec4899', '#f17b1b',
    '#34495e', '#16a085', '#2980b9', '#8e44ad'
  ];
  
  if (groupDistributionChart) groupDistributionChart.destroy();
  
  const ctx = document.getElementById('groupDistributionChart').getContext('2d');
  groupDistributionChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: dataValues,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#475569',
            boxWidth: 8,
            font: { family: "'Outfit', sans-serif", size: 9 }
          }
        },
        tooltip: {
          backgroundColor: '#0a142d',
          callbacks: {
            label: context => ` Combined Odds: ${context.raw.toFixed(1)}%`
          }
        }
      },
      cutout: '60%'
    }
  });
}

// API Call: Play Single Tournament Simulation
async function playSingleTournament() {
  loaderText.textContent = "Simulating World Cup fixtures...";
  loaderOverlay.classList.add('active');
  
  const hostBoost = hostBoostToggle.checked;
  
  try {
    const res = await fetch('/api/simulate-once', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teams: currentTeams,
        host_boost: hostBoost
      })
    });
    
    if (!res.ok) throw new Error("Match simulator failed.");
    const data = await res.json();
    
    renderGroupStandings(data.group_stage.standings, data.group_stage.advancing_third_codes);
    
    // Render hidden bracket structure first, then trigger reveal animation sequence
    renderKnockoutBracket(data.knockout, true);
    
    showToast("Tournament simulated! Launching reveal animation...");
    
    // Switch to Bracket view and scroll
    navBracket.click();
    
    // Play sequential round staggers
    animateBracketReveal();
    
  } catch (err) {
    console.error(err);
    showToast("Error simulating tournament matches", "error");
  } finally {
    loaderOverlay.classList.remove('active');
  }
}

// Dynamic SVG connection lines rendering for tournament brackets (Item 5)
function drawBracketLines() {
  const container = document.getElementById('bracket-container');
  if (!container) return;
  
  // Find all cards inside bracket rounds
  const rounds = [
    document.querySelectorAll('.bracket-round:nth-child(1) .matchup-card'),
    document.querySelectorAll('.bracket-round:nth-child(2) .matchup-card'),
    document.querySelectorAll('.bracket-round:nth-child(3) .matchup-card'),
    document.querySelectorAll('.bracket-round:nth-child(4) .matchup-card'),
    document.querySelectorAll('.champion-column .matchup-card') // The final card in col 5
  ];
  
  if (rounds[0].length === 0) return;
  
  // Create or clear SVG overlay
  let svg = document.getElementById('bracket-svg');
  if (!svg) {
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = "bracket-svg";
    svg.setAttribute("style", "position: absolute; top: 0; left: 0; pointer-events: none; z-index: 0;");
    container.appendChild(svg);
  } else {
    svg.innerHTML = '';
  }
  
  // Set dimensions relative to bracket scrolling width
  svg.setAttribute("width", container.scrollWidth);
  svg.setAttribute("height", container.scrollHeight);
  svg.style.width = container.scrollWidth + "px";
  svg.style.height = container.scrollHeight + "px";
  
  const containerRect = container.getBoundingClientRect();
  const scrollLeft = container.scrollLeft || 0;
  const scrollTop = container.scrollTop || 0;
  
  const getCardPoints = (card) => {
    const rect = card.getBoundingClientRect();
    return {
      left: rect.left - containerRect.left + scrollLeft,
      right: rect.right - containerRect.left + scrollLeft,
      y: rect.top - containerRect.top + scrollTop + rect.height / 2
    };
  };
  
  // Connect Round r (0 to 3) to Target Round r+1
  for (let r = 0; r < 4; r++) {
    const srcCards = rounds[r];
    const tgtCards = rounds[r+1];
    
    for (let k = 0; k < srcCards.length / 2; k++) {
      const cardA = srcCards[2 * k];
      const cardB = srcCards[2 * k + 1];
      
      // For r=3 (SF), the target is the Final Match card in col 5 (index 0)
      const targetCard = (r === 3) ? tgtCards[0] : tgtCards[k];
      
      if (!cardA || !cardB || !targetCard) continue;
      
      const ptA = getCardPoints(cardA);
      const ptB = getCardPoints(cardB);
      const ptT = getCardPoints(targetCard);
      
      // Midpoint coordinate between columns
      const x_mid = ptA.right + (ptT.left - ptA.right) / 2;
      
      // Vertical midpoint between the two source cards (center y of the bracket)
      const y_mid = (ptA.y + ptB.y) / 2;
      
      // Draw proper bracket connector paths:
      // 1. Card A right edge → horizontal to x_mid → vertical down to midpoint
      // 2. Card B right edge → horizontal to x_mid → vertical up to midpoint
      // 3. Midpoint → horizontal to target card left edge
      const pathData = `
        M ${ptA.right} ${ptA.y}
        H ${x_mid}
        V ${y_mid}
        M ${ptB.right} ${ptB.y}
        H ${x_mid}
        V ${y_mid}
        M ${x_mid} ${y_mid}
        H ${ptT.left}
      `;
      
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathData);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "#cbd5e1");
      path.setAttribute("stroke-width", "1.5");
      
      // Assign class identifiers for stagger animation reveals
      path.className.baseVal = `bracket-path round-path-${r}`;
      
      // Sync visibility class with target card state
      if (targetCard.classList.contains('hidden')) {
        path.className.baseVal += " hidden";
      }
      
      svg.appendChild(path);
    }
  }
}

// Staggered Round-by-Round Reveal Animations
function animateBracketReveal() {
  const r32Cards = document.querySelectorAll('.bracket-round:nth-child(1) .matchup-card');
  const r16Cards = document.querySelectorAll('.bracket-round:nth-child(2) .matchup-card');
  const qfCards = document.querySelectorAll('.bracket-round:nth-child(3) .matchup-card');
  const sfCards = document.querySelectorAll('.bracket-round:nth-child(4) .matchup-card');
  const champCol = document.querySelector('.champion-column');
  const champDisplay = document.querySelector('.champion-display');
  const finalMatches = document.querySelectorAll('.champion-column .matchup-card');

  // Re-hide all elements in case of re-run
  r32Cards.forEach(c => c.classList.add('hidden'));
  r16Cards.forEach(c => c.classList.add('hidden'));
  qfCards.forEach(c => c.classList.add('hidden'));
  sfCards.forEach(c => c.classList.add('hidden'));
  if (champCol) champCol.classList.add('hidden');
  if (champDisplay) champDisplay.classList.add('hidden');
  finalMatches.forEach(c => c.classList.add('hidden'));

  // Draw lines initially (they'll be hidden because target cards are hidden)
  drawBracketLines();

  // Reveal R32 (staggered delay 40ms each)
  let delay = 0;
  r32Cards.forEach((card, idx) => {
    setTimeout(() => {
      card.classList.remove('hidden');
    }, delay);
    delay += 40;
  });

  // Reveal R16 and paths leading into them (round-path-0)
  delay += 400;
  r16Cards.forEach((card, idx) => {
    setTimeout(() => {
      card.classList.remove('hidden');
      if (idx === r16Cards.length - 1) {
        document.querySelectorAll('.round-path-0').forEach(p => p.classList.remove('hidden'));
      }
    }, delay);
    delay += 80;
  });

  // Reveal QF and round-path-1
  delay += 400;
  qfCards.forEach((card, idx) => {
    setTimeout(() => {
      card.classList.remove('hidden');
      if (idx === qfCards.length - 1) {
        document.querySelectorAll('.round-path-1').forEach(p => p.classList.remove('hidden'));
      }
    }, delay);
    delay += 120;
  });

  // Reveal SF and round-path-2
  delay += 400;
  sfCards.forEach((card, idx) => {
    setTimeout(() => {
      card.classList.remove('hidden');
      if (idx === sfCards.length - 1) {
        document.querySelectorAll('.round-path-2').forEach(p => p.classList.remove('hidden'));
      }
    }, delay);
    delay += 160;
  });

  // Reveal Finals & Champion Column
  delay += 500;
  setTimeout(() => {
    if (champCol) champCol.classList.remove('hidden');
    
    // Reveal Final & 3rd place cards and round-path-3
    finalMatches.forEach((m, idx) => {
      setTimeout(() => {
        m.classList.remove('hidden');
        if (idx === finalMatches.length - 1) {
          document.querySelectorAll('.round-path-3').forEach(p => p.classList.remove('hidden'));
        }
      }, idx * 200);
    });
    
    // Reveal Champion trophy
    setTimeout(() => {
      if (champDisplay) champDisplay.classList.remove('hidden');
      showToast("🏆 Champion crowned!", "success");
    }, 500);

  }, delay);

  // Show the animate replay button
  document.getElementById('btn-animate-bracket').style.display = 'block';
}

// Render dynamic group standings tables
function renderGroupStandings(standings, advancingThirdCodes) {
  const container = document.getElementById('groups-container');
  container.innerHTML = '';
  
  // Sort group keys
  const groupKeys = Object.keys(standings).sort();
  
  groupKeys.forEach(grp => {
    const card = document.createElement('div');
    card.className = 'glass-panel group-card';
    
    let tableRows = '';
    standings[grp].forEach((t, index) => {
      let rowClass = '';
      if (index < 2) {
        rowClass = 'advances'; // Top 2 advance
      } else if (index === 2 && advancingThirdCodes.includes(t.code)) {
        rowClass = 'advances-wildcard'; // Advancing 3rd place wildcard
      }
      
      tableRows += `
        <tr class="${rowClass}">
          <td>
            <div style="display: flex; align-items: center; gap: 8px; overflow: hidden; min-width: 0;">
              <span style="display:inline-flex; width:22px; height:auto; vertical-align:middle; flex-shrink: 0;">${getFlagImg(t.code, 40)}</span>
              <span class="bold" style="color:var(--primary-navy); font-family: var(--font-title); flex-shrink: 0;">${t.code}</span>
              <span style="color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; flex: 1;">${t.name}</span>
            </div>
          </td>
          <td class="table-num bold" style="color: var(--success);">${t.points}</td>
          <td class="table-num">${t.played}</td>
          <td class="table-num" style="font-weight: 500; color: ${t.goal_diff > 0 ? 'var(--success)' : t.goal_diff < 0 ? 'var(--danger)' : 'var(--text-light)'}">
            ${t.goal_diff > 0 ? '+' + t.goal_diff : t.goal_diff}
          </td>
          <td class="table-num">${t.goals_for}</td>
        </tr>
      `;
    });
    
    card.innerHTML = `
      <h3 class="group-title" style="font-family: var(--font-title); letter-spacing: 0.5px;">GROUP ${grp}</h3>
      <table class="group-table">
        <thead>
          <tr>
            <th>Team</th>
            <th class="table-num">Pts</th>
            <th class="table-num">Pld</th>
            <th class="table-num">GD</th>
            <th class="table-num">GF</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `;
    
    container.appendChild(card);
  });
}

// Render interactive tournament bracket
function renderKnockoutBracket(ko, startHidden = false) {
  const container = document.getElementById('bracket-container');
  container.innerHTML = '';
  
  // Define rounds lists to draw columns
  const rounds = [
    { title: "Round of 32", matches: ko.r32 },
    { title: "Round of 16", matches: ko.r16 },
    { title: "Quarterfinals", matches: ko.qf },
    { title: "Semifinals", matches: ko.sf }
  ];
  
  // Render columns 1 to 4
  rounds.forEach((roundData) => {
    const col = document.createElement('div');
    col.className = 'bracket-round';
    col.innerHTML = `<div class="round-header" style="font-family: var(--font-title); letter-spacing: 0.5px;">${roundData.title}</div>`;
    
    const list = document.createElement('div');
    list.className = 'bracket-matchups';
    
    roundData.matches.forEach(m => {
      const card = createMatchupCard(m, startHidden);
      list.appendChild(card);
    });
    
    col.appendChild(list);
    container.appendChild(col);
  });
  
  // Render Column 5: Finals, Third Place, and Champion Display
  const finalCol = document.createElement('div');
  finalCol.className = 'bracket-round champion-column';
  if (startHidden) {
    finalCol.classList.add('hidden');
  }
  
  // Final Header
  finalCol.innerHTML = `<div class="round-header" style="width:100%; font-family: var(--font-title); letter-spacing: 0.5px;">Finals & Champion</div>`;
  
  // 1. Champion Display Card
  const champDisplay = document.createElement('div');
  champDisplay.className = 'champion-display';
  if (startHidden) champDisplay.classList.add('hidden');
  
  champDisplay.innerHTML = `
    <div class="champion-crown">🏆</div>
    <div class="champ-title" style="font-family: var(--font-title); font-weight:800;">WORLD CHAMPION</div>
    <div style="margin: 8px 0; display:flex; justify-content:center; align-items:center;">
      <span style="display:inline-flex; width:48px; height:auto; box-shadow:0 2px 4px rgba(0,0,0,0.1); border-radius:3px;">
        ${getFlagImg(ko.champion.code, 80)}
      </span>
    </div>
    <div class="champ-name" style="font-family: var(--font-title); font-weight: 800; color: var(--primary-navy);">${ko.champion.name}</div>
    <div class="champ-code" style="font-family: var(--font-title); font-weight: 700;">${ko.champion.code}</div>
  `;
  finalCol.appendChild(champDisplay);
  
  // 2. Final Matchup Card
  const finalMatchDiv = document.createElement('div');
  finalMatchDiv.style.display = 'flex';
  finalMatchDiv.style.flexDirection = 'column';
  finalMatchDiv.style.gap = '8px';
  finalMatchDiv.innerHTML = `<div style="font-size:0.75rem; text-transform:uppercase; color:var(--secondary); font-weight:700; font-family:var(--font-title);">World Cup Final</div>`;
  const finalCard = createMatchupCard(ko.final, startHidden);
  finalMatchDiv.appendChild(finalCard);
  finalCol.appendChild(finalMatchDiv);
  
  // 3. Third Place Matchup Card
  const thirdMatchDiv = document.createElement('div');
  thirdMatchDiv.style.display = 'flex';
  thirdMatchDiv.style.flexDirection = 'column';
  thirdMatchDiv.style.gap = '8px';
  thirdMatchDiv.innerHTML = `<div style="font-size:0.75rem; text-transform:uppercase; color:var(--warning); font-weight:700; font-family:var(--font-title);">Third Place Play-off</div>`;
  const thirdCard = createMatchupCard(ko.third_place, startHidden);
  thirdMatchDiv.appendChild(thirdCard);
  finalCol.appendChild(thirdMatchDiv);
  
  container.appendChild(finalCol);

  // Setup reveal trigger button handler
  document.getElementById('btn-animate-bracket').onclick = () => {
    animateBracketReveal();
  };
}

// Helper: Create match bracket card element
function createMatchupCard(m, startHidden = false) {
  const card = document.createElement('div');
  card.className = 'matchup-card';
  if (startHidden) {
    card.classList.add('hidden');
  }
  
  const w = m.winner_code;
  const isT1Winner = w === m.code1;
  const isT2Winner = w === m.code2;
  
  // Shootout scores if match was tied
  const so1 = m.shootout ? `<span class="m-shootout">(${m.shootout_score1})</span>` : '';
  const so2 = m.shootout ? `<span class="m-shootout">(${m.shootout_score2})</span>` : '';
  
  card.innerHTML = `
    <div class="matchup-team ${isT1Winner ? 'winner' : 'loser'}">
      <div style="display: flex; align-items: center; gap: 6px; overflow: hidden; min-width: 0; flex: 1;">
        <span style="display:inline-flex; width:20px; height:auto; vertical-align:middle; flex-shrink: 0;">${getFlagImg(m.code1, 40)}</span>
        <span class="m-badge" style="font-family:var(--font-title); font-weight:700; background:transparent; border:none; padding:0; width:auto; margin:0; color:var(--primary-navy); flex-shrink: 0;">${m.code1}</span>
        <span class="m-name" style="flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${m.team1}</span>
      </div>
      <span class="m-score" style="font-family:var(--font-title); margin-left: 6px; flex-shrink: 0;">${m.goals1}${so1}</span>
    </div>
    <div class="matchup-team ${isT2Winner ? 'winner' : 'loser'}">
      <div style="display: flex; align-items: center; gap: 6px; overflow: hidden; min-width: 0; flex: 1;">
        <span style="display:inline-flex; width:20px; height:auto; vertical-align:middle; flex-shrink: 0;">${getFlagImg(m.code2, 40)}</span>
        <span class="m-badge" style="font-family:var(--font-title); font-weight:700; background:transparent; border:none; padding:0; width:auto; margin:0; color:var(--primary-navy); flex-shrink: 0;">${m.code2}</span>
        <span class="m-name" style="flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${m.team2}</span>
      </div>
      <span class="m-score" style="font-family:var(--font-title); margin-left: 6px; flex-shrink: 0;">${m.goals2}${so2}</span>
    </div>
  `;
  
  card.addEventListener('click', () => {
    openMatchDetails(m);
  });
  
  return card;
}

// Open Match Details popup Modal with live ticking simulator cast
function openMatchDetails(m) {
  const stageEl = document.getElementById('modal-match-stage');
  
  let stageText = "Knockout Match";
  if (!m.is_knockout) {
    stageText = "Group Stage Match";
  }
  stageEl.textContent = stageText;
  
  // Set flag images
  const badge1 = document.getElementById('modal-team1-badge');
  const badge2 = document.getElementById('modal-team2-badge');
  
  badge1.innerHTML = `<img src="https://flagcdn.com/w80/${iso2[m.code1]}.png" style="width: 50px; height: auto; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">`;
  badge1.style.background = 'transparent';
  badge1.style.border = 'none';
  badge1.style.boxShadow = 'none';
  
  badge2.innerHTML = `<img src="https://flagcdn.com/w80/${iso2[m.code2]}.png" style="width: 50px; height: auto; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">`;
  badge2.style.background = 'transparent';
  badge2.style.border = 'none';
  badge2.style.boxShadow = 'none';
  
  document.getElementById('modal-team1-name').textContent = m.team1;
  document.getElementById('modal-team2-name').textContent = m.team2;
  
  // Fetch team info
  const team1Info = currentTeams.find(t => t.code === m.code1);
  const team2Info = currentTeams.find(t => t.code === m.code2);
  
  if (team1Info && team2Info) {
    document.getElementById('modal-team1-rank').textContent = `FIFA #${team1Info.rank}`;
    document.getElementById('modal-team2-rank').textContent = `FIFA #${team2Info.rank}`;
    
    document.getElementById('modal-team1-att').textContent = team1Info.attack;
    document.getElementById('modal-team2-att').textContent = team2Info.attack;
    
    document.getElementById('modal-team1-def').textContent = team1Info.defense;
    document.getElementById('modal-team2-def').textContent = team2Info.defense;
    
    const hostBoostEnabled = hostBoostToggle.checked;
    const hosts = ["USA", "CAN", "MEX"];
    document.getElementById('modal-team1-boost').textContent = (hostBoostEnabled && hosts.includes(m.code1)) ? "+5 (Host)" : "None";
    document.getElementById('modal-team2-boost').textContent = (hostBoostEnabled && hosts.includes(m.code2)) ? "+5 (Host)" : "None";
  }
  
  // Reset Modal Sim UI State
  const clockEl = document.getElementById('modal-live-clock');
  const score1El = document.getElementById('modal-team1-score');
  const score2El = document.getElementById('modal-team2-score');
  const shootoutEl = document.getElementById('modal-shootout-score');
  const staticStats = document.getElementById('modal-static-stats');
  const castPanel = document.getElementById('live-match-cast');
  const tickerLog = document.getElementById('modal-ticker-log');
  
  const pos1El = document.getElementById('modal-pos1');
  const pos2El = document.getElementById('modal-pos2');
  const shots1El = document.getElementById('modal-shots1');
  const shots2El = document.getElementById('modal-shots2');
  
  if (activeLiveSimInterval) {
    clearInterval(activeLiveSimInterval);
  }
  
  clockEl.textContent = "0'";
  clockEl.className = "modal-live-clock live";
  score1El.textContent = "0";
  score2El.textContent = "0";
  shootoutEl.style.display = "none";
  staticStats.style.display = "none";
  castPanel.style.display = "flex";
  tickerLog.innerHTML = `<div class="ticker-event"><span class="ticker-event-time">0'</span>Kickoff! The referee blows the whistle.</div>`;
  
  pos1El.style.width = "50%";
  pos1El.textContent = "50%";
  pos2El.style.width = "50%";
  pos2El.textContent = "50%";
  shots1El.textContent = "0";
  shots2El.textContent = "0";
  
  matchModal.classList.add('active');

  // Play Live simulation ticker log over 6 seconds
  let currentTick = 0;
  const totalTicks = 10;
  
  let currentGoals1 = 0;
  let currentGoals2 = 0;
  let simulatedShots1 = 0;
  let simulatedShots2 = 0;
  
  const goalTicks = [];
  for (let g = 0; g < m.goals1; g++) {
    goalTicks.push({ team: 1, tick: Math.floor(Math.random() * 8) + 1 });
  }
  for (let g = 0; g < m.goals2; g++) {
    goalTicks.push({ team: 2, tick: Math.floor(Math.random() * 8) + 1 });
  }

  activeLiveSimInterval = setInterval(() => {
    currentTick++;
    const minute = Math.min(90, currentTick * 9);
    clockEl.textContent = `${minute}'`;
    
    const posVal = Math.round(50 + (Math.random() * 20 - 10));
    pos1El.style.width = `${posVal}%`;
    pos1El.textContent = `${posVal}%`;
    pos2El.style.width = `${100 - posVal}%`;
    pos2El.textContent = `${100 - posVal}%`;
    
    if (Math.random() < 0.6) {
      simulatedShots1 += Math.floor(Math.random() * 2);
      shots1El.textContent = simulatedShots1;
    }
    if (Math.random() < 0.6) {
      simulatedShots2 += Math.floor(Math.random() * 2);
      shots2El.textContent = simulatedShots2;
    }
    
    const goalsThisTick = goalTicks.filter(gt => gt.tick === currentTick);
    goalsThisTick.forEach(goal => {
      if (goal.team === 1) {
        currentGoals1++;
        score1El.textContent = currentGoals1;
        
        const event = document.createElement('div');
        event.className = 'ticker-event';
        event.innerHTML = `<span class="ticker-event-time">${minute}'</span><span class="ticker-event-goal">⚽ GOAL!</span> ${m.team1} scores a brilliant goal!`;
        tickerLog.appendChild(event);
      } else {
        currentGoals2++;
        score2El.textContent = currentGoals2;
        
        const event = document.createElement('div');
        event.className = 'ticker-event';
        event.innerHTML = `<span class="ticker-event-time">${minute}'</span><span class="ticker-event-goal">⚽ GOAL!</span> ${m.team2} finds the back of the net!`;
        tickerLog.appendChild(event);
      }
      tickerLog.scrollTop = tickerLog.scrollHeight;
    });
    
    if (goalsThisTick.length === 0 && currentTick < totalTicks) {
      const genericEvents = [
        "A fierce battle in midfield. Possession changes hand.",
        "Yellow card issued for a reckless sliding tackle.",
        "Great defensive interception blocks a promising cross.",
        "Corner kick awarded. The cross is cleared safely.",
        "A shot from distance goes wide of the post.",
        "Save! The goalkeeper secures a clean catch.",
        "Offside flag raised, halting an attacking run."
      ];
      
      const eventText = genericEvents[Math.floor(Math.random() * genericEvents.length)];
      const event = document.createElement('div');
      event.className = 'ticker-event';
      event.innerHTML = `<span class="ticker-event-time">${minute}'</span>${eventText}`;
      tickerLog.appendChild(event);
      tickerLog.scrollTop = tickerLog.scrollHeight;
    }
    
    if (currentTick >= totalTicks) {
      clearInterval(activeLiveSimInterval);
      activeLiveSimInterval = null;
      
      clockEl.textContent = "FT";
      clockEl.className = "modal-live-clock";
      
      score1El.textContent = m.goals1;
      score2El.textContent = m.goals2;
      
      if (m.shootout) {
        shootoutEl.textContent = `(${m.shootout_score1} - ${m.shootout_score2} on pens)`;
        shootoutEl.style.display = 'block';
        
        const event = document.createElement('div');
        event.className = 'ticker-event';
        event.innerHTML = `<span class="ticker-event-time">FT</span>Match decided on penalties: <strong>${m.winner_code === m.code1 ? m.team1 : m.team2} wins!</strong>`;
        tickerLog.appendChild(event);
      } else {
        const winnerName = m.goals1 > m.goals2 ? m.team1 : m.goals2 > m.goals1 ? m.team2 : 'Draw';
        const event = document.createElement('div');
        event.className = 'ticker-event';
        event.innerHTML = `<span class="ticker-event-time">FT</span>Full time whistle blown. Winner: <strong>${winnerName}</strong>.`;
        tickerLog.appendChild(event);
      }
      
      tickerLog.scrollTop = tickerLog.scrollHeight;
      staticStats.style.display = "flex";
    }
  }, 600);
}
