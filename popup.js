// Controller logic for Indian Space Hub popup

// --- STATE ---
let launches = [];
let favorites = [];
let themePref = "system";           // "system" | "light" | "dark"
let remindersEnabled = true;
let notifyIndia = true;
let notifyGlobal = true;
let regionFilter = "all";           // "all" | "india" | "global"
let searchQuery = "";
let showFavsOnly = false;
let hasLoadError = false;
let countdownInterval = null;

const INDIAN_PROVIDERS = ["isro", "skyroot", "agnikul", "pixxel"];
const SPACE_FACTS = [
  "Chandrayaan-3 made India the first country to land near the Moon's south pole, in August 2023.",
  "ISRO's PSLV rocket has launched satellites for over 30 countries.",
  "Aryabhata, India's first satellite, launched in 1975 aboard a Soviet rocket.",
  "Mangalyaan reached Mars orbit on its very first attempt, on a budget under $75 million.",
  "Skyroot Aerospace's Vikram-S was India's first privately built rocket to reach space.",
  "Gaganyaan will be ISRO's first crewed orbital spaceflight mission.",
  "Agnikul Cosmos 3D-prints its rocket engines almost entirely in a single piece.",
  "India's Sriharikota launch site sits on a barrier island off the Bay of Bengal coast."
];

// --- DOM CACHE ---
const syncDot = document.getElementById("syncDot");
const syncText = document.getElementById("syncText");

const homeLoading = document.getElementById("homeLoading");
const homeContent = document.getElementById("homeContent");
const heroWrap = document.getElementById("heroWrap");
const featuredSection = document.getElementById("featuredSection");
const heroMissionName = document.getElementById("heroMissionName");
const heroRocketName = document.getElementById("heroRocketName");
const heroOriginBadge = document.getElementById("heroOriginBadge");
const heroFavBtn = document.getElementById("heroFavBtn");
const heroViewBtn = document.getElementById("heroViewBtn");
const daysVal = document.getElementById("daysVal");
const hoursVal = document.getElementById("hoursVal");
const minsVal = document.getElementById("minsVal");
const secsVal = document.getElementById("secsVal");
const noLaunchState = document.getElementById("noLaunchState");
const errorState = document.getElementById("errorState");
const retryBtn = document.getElementById("retryBtn");
const homePreviewList = document.getElementById("homePreviewList");
const factText = document.getElementById("factText");
const alertBannerText = document.getElementById("alertBannerText");

const searchInput = document.getElementById("searchInput");
const regionChips = document.querySelectorAll(".chip[data-region]");
const launchesList = document.getElementById("launchesList");

const themeChoiceBtns = document.querySelectorAll(".segmented-btn[data-theme-choice]");
const remindersToggle = document.getElementById("remindersToggle");
const notifyIndiaToggle = document.getElementById("notifyIndiaToggle");
const notifyGlobalToggle = document.getElementById("notifyGlobalToggle");
const settingsSyncText = document.getElementById("settingsSyncText");
const refreshNowBtn = document.getElementById("refreshNowBtn");
const aboutVersion = document.getElementById("aboutVersion");

const tabBtns = document.querySelectorAll(".tab-btn[data-screen]");
const screens = {
  home: document.getElementById("screen-home"),
  launches: document.getElementById("screen-launches"),
  settings: document.getElementById("screen-settings")
};

const detailOverlay = document.getElementById("detailOverlay");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const modalTitle = document.getElementById("modalTitle");
const modalStatusPill = document.getElementById("modalStatusPill");
const modalVehicle = document.getElementById("modalVehicle");
const modalAgency = document.getElementById("modalAgency");
const modalDate = document.getElementById("modalDate");
const modalCountdown = document.getElementById("modalCountdown");
const modalOrbit = document.getElementById("modalOrbit");
const modalDesc = document.getElementById("modalDesc");

// --- INIT ---
document.addEventListener("DOMContentLoaded", init);

function init() {
  aboutVersion.textContent = `Version ${chrome.runtime.getManifest().version}`;
  factText.textContent = SPACE_FACTS[Math.floor(Math.random() * SPACE_FACTS.length)];

  chrome.storage.local.get(
    ["launchData", "favorites", "theme", "lastSyncTime", "remindersEnabled", "notifyIndia", "notifyGlobal"],
    (res) => {
      launches = res.launchData || [];
      favorites = res.favorites || [];
      themePref = res.theme || "system";
      remindersEnabled = res.remindersEnabled !== false;
      notifyIndia = res.notifyIndia !== false;
      notifyGlobal = res.notifyGlobal !== false;

      applyTheme();
      syncSettingsUI();
      updateSyncStatusText(res.lastSyncTime);

      homeLoading.classList.add("hidden");
      homeContent.classList.remove("hidden");

      renderAll();
      startCountdownTicker();
      triggerForceSync();
    }
  );

  setupThemeWatcher();
  bindEvents();
}

function bindEvents() {
  // Tab navigation
  tabBtns.forEach(btn => btn.addEventListener("click", () => switchScreen(btn.dataset.screen)));
  document.querySelectorAll("[data-goto]").forEach(el => {
    el.addEventListener("click", () => switchScreen(el.dataset.goto));
  });

  // Home quick actions
  document.getElementById("qaFavorites").addEventListener("click", () => {
    showFavsOnly = true;
    switchScreen("launches");
    renderLaunchesScreen();
  });
  document.getElementById("qaAlerts").addEventListener("click", () => {
    switchScreen("settings");
    document.getElementById("notificationsSection").scrollIntoView({ block: "start" });
  });

  retryBtn.addEventListener("click", triggerForceSync);
  heroFavBtn.addEventListener("click", () => {
    const id = featuredSection.getAttribute("data-launchid");
    if (id) toggleFavorite(id);
  });
  heroViewBtn.addEventListener("click", () => {
    const id = featuredSection.getAttribute("data-launchid");
    const launch = launches.find(l => String(l.id) === String(id));
    if (launch) openMissionModal(launch);
  });

  // Launches screen
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderLaunchesScreen();
  });
  regionChips.forEach(chip => {
    chip.addEventListener("click", () => {
      regionChips.forEach(c => c.setAttribute("aria-pressed", "false"));
      chip.setAttribute("aria-pressed", "true");
      regionFilter = chip.dataset.region;
      showFavsOnly = false;
      renderLaunchesScreen();
    });
  });

  // Settings
  themeChoiceBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      themePref = btn.dataset.themeChoice;
      chrome.storage.local.set({ theme: themePref });
      applyTheme();
      syncSettingsUI();
    });
  });

  remindersToggle.addEventListener("change", () => {
    remindersEnabled = remindersToggle.checked;
    chrome.storage.local.set({ remindersEnabled });
    syncSettingsUI();
    renderAlertBanner();
    notifyBackgroundSettingsChanged();
  });
  notifyIndiaToggle.addEventListener("change", () => {
    notifyIndia = notifyIndiaToggle.checked;
    chrome.storage.local.set({ notifyIndia });
    renderAlertBanner();
    notifyBackgroundSettingsChanged();
  });
  notifyGlobalToggle.addEventListener("change", () => {
    notifyGlobal = notifyGlobalToggle.checked;
    chrome.storage.local.set({ notifyGlobal });
    renderAlertBanner();
    notifyBackgroundSettingsChanged();
  });

  refreshNowBtn.addEventListener("click", triggerForceSync);

  // Modal
  modalCloseBtn.addEventListener("click", () => detailOverlay.classList.remove("active"));
  detailOverlay.addEventListener("click", (e) => {
    if (e.target === detailOverlay) detailOverlay.classList.remove("active");
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") detailOverlay.classList.remove("active");
  });
}

function notifyBackgroundSettingsChanged() {
  chrome.runtime.sendMessage({ action: "settingsUpdated" });
}

// --- SCREEN / TAB SWITCHING ---
function switchScreen(name) {
  Object.entries(screens).forEach(([key, el]) => {
    el.classList.toggle("hidden", key !== name);
  });
  tabBtns.forEach(btn => {
    btn.setAttribute("aria-selected", String(btn.dataset.screen === name));
  });
  if (name === "launches") renderLaunchesScreen();
}

// --- THEME ---
function effectiveTheme() {
  if (themePref === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return themePref;
}

function applyTheme() {
  document.documentElement.setAttribute("data-theme-effective", effectiveTheme());
}

function setupThemeWatcher() {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", () => {
    if (themePref === "system") applyTheme();
  });
}

function syncSettingsUI() {
  themeChoiceBtns.forEach(btn => {
    btn.setAttribute("aria-checked", String(btn.dataset.themeChoice === themePref));
  });
  remindersToggle.checked = remindersEnabled;
  notifyIndiaToggle.checked = notifyIndia;
  notifyGlobalToggle.checked = notifyGlobal;
  notifyIndiaToggle.disabled = !remindersEnabled;
  notifyGlobalToggle.disabled = !remindersEnabled;
}

// --- SYNC ---
function updateSyncStatusText(timeStr) {
  let display, offline = false;
  if (!timeStr) {
    display = "Never synced";
  } else if (timeStr.includes("Offline")) {
    display = "Offline · showing cached data";
    offline = true;
  } else {
    const date = new Date(timeStr);
    display = `Synced ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
  syncText.textContent = display;
  syncDot.classList.toggle("offline", offline);
  settingsSyncText.textContent = display;
}

function triggerForceSync() {
  syncDot.classList.add("spin");
  syncText.textContent = "Syncing…";

  chrome.runtime.sendMessage({ action: "forceSync" }, (response) => {
    syncDot.classList.remove("spin");

    if (response && response.success) {
      hasLoadError = false;
      chrome.storage.local.get(["launchData", "lastSyncTime"], (res) => {
        launches = res.launchData || [];
        updateSyncStatusText(res.lastSyncTime);
        renderAll();
      });
    } else {
      hasLoadError = launches.length === 0;
      chrome.storage.local.get(["lastSyncTime"], (res) => {
        updateSyncStatusText(res.lastSyncTime || "Offline");
        renderAll();
      });
    }
  });
}

// --- HELPERS ---
function isIndianLaunch(launch) {
  const co = (launch.company_name || "").toLowerCase();
  return INDIAN_PROVIDERS.some(name => co.includes(name));
}

function extractVehicle(launch) {
  return launch.description?.match(/(?:PSLV|GSLV|LVM3|SSLV|Vikram|Agnibaan)[-\w]*/i)?.[0] || "Launch vehicle TBC";
}

function extractOrbit(launch) {
  return launch.description?.match(/(?:LEO|GTO|SSO|MEO|Lunar|Sun-Synchronous|SSO polar)[-\w]*/i)?.[0] || "Low Earth Orbit (LEO)";
}

function isFavorite(id) {
  return favorites.map(String).includes(String(id));
}

function getUpcomingSorted(list) {
  const now = Date.now();
  return list.filter(l => new Date(l.launch_date) > now).sort((a, b) => new Date(a.launch_date) - new Date(b.launch_date));
}

function getPastSorted(list) {
  const now = Date.now();
  return list.filter(l => new Date(l.launch_date) <= now).sort((a, b) => new Date(b.launch_date) - new Date(a.launch_date));
}

// --- RENDER: HOME ---
function renderAll() {
  renderHome();
  renderAlertBanner();
  if (!screens.launches.classList.contains("hidden")) renderLaunchesScreen();
}

function renderHome() {
  const upcoming = getUpcomingSorted(launches);

  errorState.classList.toggle("hidden", !hasLoadError);
  noLaunchState.classList.toggle("hidden", hasLoadError || upcoming.length > 0);
  heroWrap.classList.toggle("hidden", hasLoadError || upcoming.length === 0);

  if (upcoming.length > 0) {
    renderHeroCard(upcoming[0]);
  }

  // Preview list: next 3 upcoming (skip the hero mission)
  homePreviewList.innerHTML = "";
  const previewItems = upcoming.slice(1, 4);
  if (previewItems.length === 0 && upcoming.length <= 1) {
    homePreviewList.innerHTML = `<p class="state-desc" style="text-align:left;padding:4px 2px;">No further missions scheduled yet.</p>`;
  } else {
    previewItems.forEach(launch => homePreviewList.appendChild(buildMissionItem(launch)));
  }

  tickAllListTimers();
}

function renderHeroCard(launch) {
  heroMissionName.textContent = launch.mission_name;
  heroRocketName.textContent = `${launch.company_name || "ISRO"} • ${extractVehicle(launch)}`;
  heroOriginBadge.textContent = isIndianLaunch(launch) ? "🇮🇳 India" : "🌍 Global";

  const fav = isFavorite(launch.id);
  heroFavBtn.setAttribute("aria-pressed", String(fav));
  heroFavBtn.setAttribute("aria-label", fav ? "Remove from favourites" : "Add to favourites");

  featuredSection.setAttribute("data-launchtime", launch.launch_date);
  featuredSection.setAttribute("data-launchid", launch.id);
}

function renderAlertBanner() {
  if (!remindersEnabled) {
    alertBannerText.innerHTML = "Launch alerts are <strong>off</strong>. Turn them on in Settings.";
    return;
  }
  if (notifyIndia && notifyGlobal) {
    alertBannerText.innerHTML = "Launch alerts are <strong>on</strong> for India and Global missions.";
  } else if (notifyIndia) {
    alertBannerText.innerHTML = "Launch alerts are <strong>on</strong> for Indian missions only.";
  } else if (notifyGlobal) {
    alertBannerText.innerHTML = "Launch alerts are <strong>on</strong> for Global missions only.";
  } else {
    alertBannerText.innerHTML = "Launch alerts are on, but no regions are selected. Check Settings.";
  }
}

// --- RENDER: LAUNCHES SCREEN ---
function renderLaunchesScreen() {
  let filtered = [...launches];

  if (regionFilter === "india") filtered = filtered.filter(isIndianLaunch);
  if (regionFilter === "global") filtered = filtered.filter(l => !isIndianLaunch(l));

  if (searchQuery) {
    filtered = filtered.filter(l =>
      (l.mission_name || "").toLowerCase().includes(searchQuery) ||
      (l.description || "").toLowerCase().includes(searchQuery) ||
      (l.company_name || "").toLowerCase().includes(searchQuery)
    );
  }

  if (showFavsOnly) {
    filtered = filtered.filter(l => isFavorite(l.id));
  }

  const sorted = [...getUpcomingSorted(filtered), ...getPastSorted(filtered)];

  launchesList.innerHTML = "";

  if (hasLoadError && launches.length === 0) {
    launchesList.innerHTML = `
      <div class="state-panel">
        <div class="state-icon">📡</div>
        <p class="state-title">Unable to load launch data</p>
        <p class="state-desc">Check your connection and try again.</p>
        <button class="btn-retry" id="listRetryBtn">↻ Retry</button>
      </div>`;
    document.getElementById("listRetryBtn").addEventListener("click", triggerForceSync);
    return;
  }

  if (sorted.length === 0) {
    launchesList.innerHTML = `
      <div class="state-panel">
        <div class="state-icon">🛸</div>
        <p class="state-title">No missions found</p>
        <p class="state-desc">Try a different search or filter.</p>
      </div>`;
    return;
  }

  if (showFavsOnly) {
    const pill = document.createElement("button");
    pill.className = "chip";
    pill.setAttribute("aria-pressed", "true");
    pill.textContent = "★ Favourites only ✕";
    pill.style.marginBottom = "8px";
    pill.addEventListener("click", () => { showFavsOnly = false; renderLaunchesScreen(); });
    launchesList.appendChild(pill);
  }

  sorted.forEach(launch => launchesList.appendChild(buildMissionItem(launch)));
  tickAllListTimers();
}

function buildMissionItem(launch) {
  const item = document.createElement("button");
  item.className = "mission-item";
  item.setAttribute("aria-label", `${launch.mission_name}, view mission details`);
  item.addEventListener("click", () => openMissionModal(launch));

  const isPast = new Date(launch.launch_date) <= Date.now();
  const cleanDate = new Date(launch.launch_date).toLocaleDateString([], { month: "short", day: "numeric" });
  const vehicle = extractVehicle(launch);
  const origin = isIndianLaunch(launch) ? "🇮🇳" : "🌍";

  item.innerHTML = `
    <div class="mission-item-info">
      <span class="mission-item-title">${launch.mission_name}</span>
      <span class="mission-item-sub">${origin} ${launch.company_name || "ISRO"} • ${vehicle}</span>
    </div>
    <div class="mission-item-meta">
      ${isPast
        ? `<span class="mission-item-countdown done">COMPLETED</span>`
        : `<span class="mission-item-countdown js-countdown" data-launchtime="${launch.launch_date}">—</span>`}
      <div class="mission-item-date">${cleanDate}</div>
    </div>
  `;

  return item;
}

// --- TICKING TIMERS ---
function startCountdownTicker() {
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    tickHeroCountdown();
    tickAllListTimers();
  }, 1000);
}

function tickHeroCountdown() {
  if (heroWrap.classList.contains("hidden")) return;
  const launchTimeStr = featuredSection.getAttribute("data-launchtime");
  if (!launchTimeStr) return;

  const diff = new Date(launchTimeStr) - Date.now();
  if (diff <= 0) {
    triggerForceSync();
    return;
  }

  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  daysVal.textContent = String(d).padStart(2, "0");
  hoursVal.textContent = String(h).padStart(2, "0");
  minsVal.textContent = String(m).padStart(2, "0");
  secsVal.textContent = String(s).padStart(2, "0");
}

function tickAllListTimers() {
  const now = Date.now();
  document.querySelectorAll(".js-countdown").forEach(el => {
    const launchTime = new Date(el.getAttribute("data-launchtime")).getTime();
    const diff = launchTime - now;

    if (diff <= 0) {
      el.textContent = "LAUNCHED";
      el.classList.add("done");
      el.classList.remove("urgent", "js-countdown");
      return;
    }

    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);

    if (d > 0) {
      el.textContent = `${d}d ${h}h`;
      el.classList.remove("urgent");
    } else if (h > 0) {
      el.textContent = `${h}h ${m}m`;
      el.classList.remove("urgent");
    } else {
      const s = Math.floor((diff % 60000) / 1000);
      el.textContent = `${m}m ${s}s`;
      el.classList.add("urgent");
    }
  });
}

// --- MODAL ---
function openMissionModal(launch) {
  modalTitle.textContent = launch.mission_name;
  modalVehicle.textContent = extractVehicle(launch);
  modalAgency.textContent = launch.company_name || "ISRO";
  modalOrbit.textContent = `Target orbit: ${extractOrbit(launch)}`;

  const lDate = new Date(launch.launch_date);
  modalDate.textContent = lDate.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " (IST)";

  const isPast = lDate.getTime() <= Date.now();
  modalStatusPill.textContent = isPast ? "Completed" : "Upcoming";
  modalStatusPill.className = `status-pill ${isPast ? "completed" : "upcoming"}`;
  modalCountdown.textContent = isPast ? "Mission complete" : "Calculating…";
  modalCountdown.classList.toggle("js-countdown", !isPast);
  if (!isPast) modalCountdown.setAttribute("data-launchtime", launch.launch_date);

  modalDesc.textContent = launch.description || "No detailed payload information has been published for this flight yet.";

  detailOverlay.classList.add("active");
  modalCloseBtn.focus();
  tickAllListTimers();
}

// --- FAVORITES ---
function toggleFavorite(launchId) {
  const index = favorites.map(String).indexOf(String(launchId));
  if (index > -1) {
    favorites.splice(index, 1);
  } else {
    favorites.push(launchId);
  }

  chrome.storage.local.set({ favorites }, () => {
    renderAll();
  });
}
