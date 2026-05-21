// Controller logic for ISRO Launch Tracker – India Space Missions Action Popup

// State Management
let launches = [];
let favorites = [];
let currentTheme = "dark";
let selectedAgency = "all";
let searchQuery = "";
let showFavsOnly = false;
let countdownInterval = null;

// DOM Cache
const headerRocket = document.getElementById("headerRocket");
const syncSpinner = document.getElementById("syncSpinner");
const syncText = document.getElementById("syncText");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const favsToggleBtn = document.getElementById("favsToggleBtn");


// Featured Elements
const featuredSection = document.getElementById("featuredSection");
const heroAgency = document.getElementById("heroAgency");
const heroMissionName = document.getElementById("heroMissionName");
const heroRocketName = document.getElementById("heroRocketName");
const heroLaunchDate = document.getElementById("heroLaunchDate");
const heroFavStar = document.getElementById("heroFavStar");
const daysVal = document.getElementById("daysVal");
const hoursVal = document.getElementById("hoursVal");
const minsVal = document.getElementById("minsVal");
const secsVal = document.getElementById("secsVal");

// Controls Elements
const searchInput = document.getElementById("searchInput");
const agencyChips = document.querySelectorAll("#agencyFilterScroll .chip");

// List Elements
const launchesList = document.getElementById("launchesList");

// Modal Elements
const detailOverlay = document.getElementById("detailOverlay");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const modalTitle = document.getElementById("modalTitle");
const modalVehicle = document.getElementById("modalVehicle");
const modalAgency = document.getElementById("modalAgency");
const modalDate = document.getElementById("modalDate");
const modalStatus = document.getElementById("modalStatus");
const modalOrbit = document.getElementById("modalOrbit");
const modalDesc = document.getElementById("modalDesc");


// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  initDashboard();
});

function initDashboard() {
  // 1. Fetch values from local storage
  chrome.storage.local.get(
    ["launchData", "favorites", "theme", "lastSyncTime", "apiUrl", "apiKey", "remindersEnabled"],
    (res) => {
      launches = res.launchData || [];
      favorites = res.favorites || [];
      currentTheme = res.theme || "dark";
      
      // Seed theme
      if (currentTheme === "light") {
        document.body.classList.add("light-theme");
        themeToggleBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`;
      }
      
      // Update sync text representation
      updateSyncStatusText(res.lastSyncTime);
      
      // 2. Render UI immediately (cached fallback state)
      renderDashboard();
      
      // 3. Initiate countdown interval ticking
      startCountdownTicker();
      
      // 4. Trigger foreground refresh sync upon extension open
      triggerForceSync();
    }
  );

  // Set up interactive listeners
  themeToggleBtn.addEventListener("click", toggleTheme);
  favsToggleBtn.addEventListener("click", toggleFavoritesFilter);

  modalCloseBtn.addEventListener("click", () => detailOverlay.classList.remove("active"));
  

  
  // Search filter keyup
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderDashboard();
  });
  
  // Agency filtering chips selection
  agencyChips.forEach(chip => {
    chip.addEventListener("click", () => {
      agencyChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      selectedAgency = chip.getAttribute("data-agency");
      renderDashboard();
    });
  });
}

// Update UI timestamp helper
function updateSyncStatusText(timeStr) {
  if (!timeStr) {
    syncText.textContent = "Never Synced";
    return;
  }
  
  if (timeStr.includes("Offline")) {
    syncText.textContent = "Offline (Cached Data)";
    syncText.style.color = "var(--color-mars)";
    return;
  }
  
  const date = new Date(timeStr);
  const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  syncText.textContent = `Sync: ${formattedTime}`;
  syncText.style.color = "var(--text-secondary)";
}

// Immediate extension load sync trigger
function triggerForceSync() {
  syncSpinner.classList.remove("hidden");
  syncSpinner.classList.add("anim-spin");
  syncText.textContent = "Syncing...";
  
  chrome.runtime.sendMessage({ action: "forceSync" }, (response) => {
    syncSpinner.classList.remove("anim-spin");
    syncSpinner.classList.add("hidden");
    
    if (response && response.success) {
      // Reload refreshed data from storage
      chrome.storage.local.get(["launchData", "lastSyncTime"], (res) => {
        launches = res.launchData || [];
        updateSyncStatusText(res.lastSyncTime);
        renderDashboard();
      });
    } else {
      // Handle error state gracefully by keeping existing cache
      chrome.storage.local.get(["lastSyncTime"], (res) => {
        updateSyncStatusText(res.lastSyncTime || "Offline");
      });
    }
  });
}

// --- RENDERING CORE ---
function renderDashboard() {
  // Apply Search, Agency, and Favorites filter constraints
  const now = Date.now();
  let filtered = [...launches];
  
  // Agency matching logic
  if (selectedAgency !== "all") {
    filtered = filtered.filter(launch => {
      const co = (launch.company_name || "").toLowerCase();
      if (selectedAgency === "isro") return co.includes("isro");
      if (selectedAgency === "skyroot") return co.includes("skyroot");
      if (selectedAgency === "agnikul") return co.includes("agnikul");
      if (selectedAgency === "pixxel") return co.includes("pixxel");
      if (selectedAgency === "others") {
        return !co.includes("isro") && !co.includes("skyroot") && !co.includes("agnikul") && !co.includes("pixxel");
      }
      return true;
    });
  }
  
  // Search query match
  if (searchQuery) {
    filtered = filtered.filter(launch => 
      (launch.mission_name || "").toLowerCase().includes(searchQuery) ||
      (launch.description || "").toLowerCase().includes(searchQuery) ||
      (launch.company_name || "").toLowerCase().includes(searchQuery)
    );
  }
  
  // Favorites toggle filter match
  if (showFavsOnly) {
    const favSet = new Set(favorites.map(id => String(id)));
    filtered = filtered.filter(launch => favSet.has(String(launch.id)));
  }
  
  // Sort chronically: future launches first, ascending
  const upcomingFuture = filtered
    .filter(l => new Date(l.launch_date) > now)
    .sort((a, b) => new Date(a.launch_date) - new Date(b.launch_date));
    
  const launchedPast = filtered
    .filter(l => new Date(l.launch_date) <= now)
    .sort((a, b) => new Date(b.launch_date) - new Date(a.launch_date));
    
  const sortedLaunches = [...upcomingFuture, ...launchedPast];

  // 1. Render Featured hero card (Next valid upcoming launch)
  if (upcomingFuture.length > 0) {
    featuredSection.classList.remove("hidden");
    const nextLaunch = upcomingFuture[0];
    renderHeroCard(nextLaunch);
  } else {
    // Hide hero card if no upcoming missions match filter criteria
    featuredSection.classList.add("hidden");
  }
  
  // 2. Render List Container
  renderList(sortedLaunches);
}

// Hero featured details builder
function renderHeroCard(launch) {
  heroMissionName.textContent = launch.mission_name;
  
  // Clean layout specs
  const vehicle = launch.description?.match(/(?:PSLV|GSLV|LVM3|SSLV|Vikram|Agnibaan)[-\w]*/i)?.[0] || "Launch Rocket";
  heroRocketName.textContent = `${launch.company_name || 'ISRO'} • ${vehicle}`;
  heroAgency.textContent = launch.company_name || 'ISRO';
  
  // Clean badge classing
  heroAgency.className = "badge-agency";
  const co = (launch.company_name || "").toLowerCase();
  if (co.includes("isro")) heroAgency.classList.add("badge-isro");
  else if (co.includes("skyroot")) heroAgency.classList.add("badge-skyroot");
  else if (co.includes("agnikul")) heroAgency.classList.add("badge-agnikul");
  else if (co.includes("pixxel")) heroAgency.classList.add("badge-pixxel");
  
  // Clean Date representation
  const lDate = new Date(launch.launch_date);
  heroLaunchDate.textContent = lDate.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
  
  // Favorite state setting
  const isFav = favorites.map(id => String(id)).includes(String(launch.id));
  heroFavStar.className = isFav ? "favorite-star active" : "favorite-star";
  
  // Clear events and attach favorite toggle
  heroFavStar.onclick = (e) => {
    e.stopPropagation();
    toggleFavorite(launch.id);
  };
  
  // Modal click
  featuredSection.onclick = () => openMissionModal(launch);
  
  // Set launch date on a data attribute for the timer
  featuredSection.setAttribute("data-launchtime", launch.launch_date);
}

// Render dynamic launch records items list
function renderList(list) {
  launchesList.innerHTML = "";
  
  if (list.length === 0) {
    launchesList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-rocket">🛸</div>
        <p>No space missions found.</p>
        <p class="text-xs" style="color: var(--text-muted); margin-top: 4px;">Adjust filters or settings</p>
      </div>
    `;
    return;
  }
  
  list.forEach(launch => {
    const launchItem = document.createElement("div");
    launchItem.className = "launch-item";
    launchItem.addEventListener("click", () => openMissionModal(launch));
    
    const isPast = new Date(launch.launch_date) <= Date.now();
    const cleanDate = new Date(launch.launch_date).toLocaleDateString([], { month: "short", day: "numeric" });
    
    // Abbreviated countdown status
    let timerStr = "";
    if (isPast) {
      timerStr = `<span style="color: var(--color-emerald); font-weight: 800; font-size:10px;">COMPLETED</span>`;
    } else {
      timerStr = `<span class="launch-item-time-val" data-launchtime="${launch.launch_date}">Calculating...</span>`;
    }
    
    // Deduce rocket vehicle
    const vehicle = launch.description?.match(/(?:PSLV|GSLV|LVM3|SSLV|Vikram|Agnibaan)[-\w]*/i)?.[0] || "Launcher";
    
    launchItem.innerHTML = `
      <div class="launch-item-info">
        <span class="launch-item-title">${launch.mission_name}</span>
        <span class="launch-item-sub">${launch.company_name || 'ISRO'} • ${vehicle}</span>
      </div>
      <div class="launch-item-timer">
        <div>${timerStr}</div>
        <div class="launch-item-date">${cleanDate}</div>
      </div>
    `;
    
    launchesList.appendChild(launchItem);
  });
  
  // Fire single tick check to pre-fill item elements immediately
  tickAllListTimers();
}

// --- TICKING TIMERS ENGINE ---
function startCountdownTicker() {
  if (countdownInterval) clearInterval(countdownInterval);
  
  countdownInterval = setInterval(() => {
    tickHeroCountdown();
    tickAllListTimers();
  }, 1000);
}

// Featured countdown clock renderer
function tickHeroCountdown() {
  if (featuredSection.classList.contains("hidden")) return;
  
  const launchTimeStr = featuredSection.getAttribute("data-launchtime");
  if (!launchTimeStr) return;
  
  const diff = new Date(launchTimeStr) - Date.now();
  
  if (diff <= 0) {
    // Liftoff occurred! Re-sync
    triggerForceSync();
    return;
  }
  
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diff % (1000 * 60)) / 1000);
  
  daysVal.textContent = String(d).padStart(2, "0");
  hoursVal.textContent = String(h).padStart(2, "0");
  minsVal.textContent = String(m).padStart(2, "0");
  secsVal.textContent = String(s).padStart(2, "0");
  
  // Add dynamic neon pulse styling class to seconds
  secsVal.classList.add("secs-pulse");
}

// Tick lists dynamic timers
function tickAllListTimers() {
  const elements = document.querySelectorAll(".launch-item-time-val");
  const now = Date.now();
  
  elements.forEach(el => {
    const launchTime = new Date(el.getAttribute("data-launchtime")).getTime();
    const diff = launchTime - now;
    
    if (diff <= 0) {
      el.outerHTML = `<span style="color: var(--color-emerald); font-weight:800; font-size:10px;">LAUNCHED</span>`;
      return;
    }
    
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (d > 0) {
      el.textContent = `${d}d ${h}h`;
    } else if (h > 0) {
      el.textContent = `${h}h ${m}m`;
    } else {
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      el.textContent = `${m}m ${s}s`;
      el.style.color = "var(--color-mars)"; // T-Minus less than an hour gets red/mars color
    }
  });
}

// --- MODAL UTILS ---
function openMissionModal(launch) {
  modalTitle.textContent = launch.mission_name;
  
  // Extract target vehicle
  const vehicle = launch.description?.match(/(?:PSLV|GSLV|LVM3|SSLV|Vikram|Agnibaan)[-\w]*/i)?.[0] || "LVM3-M4 Heavy Lift";
  modalVehicle.textContent = vehicle;
  
  modalAgency.textContent = launch.company_name || 'ISRO';
  
  // Extract Target Orbit or fallback LEO
  const orbit = launch.description?.match(/(?:LEO|GTO|SSO|MEO|Lunar|Sun-Synchronous|SSO polar)[-\w]*/i)?.[0] || "Low Earth Orbit (LEO)";
  modalOrbit.textContent = orbit;
  
  const lDate = new Date(launch.launch_date);
  modalDate.textContent = lDate.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric", hour: '2-digit', minute: '2-digit' }) + " (IST)";
  
  const isPast = new Date(launch.launch_date) <= Date.now();
  modalStatus.textContent = isPast ? "Completed" : "Upcoming";
  modalStatus.style.color = isPast ? "var(--color-emerald)" : "var(--color-cyan)";
  
  modalDesc.textContent = launch.description || "No specific detailed payload details are supplied for this flight. Telemetry status remains operational.";
  
  detailOverlay.classList.add("active");
}



// --- UTILS & INTERACTIONS ---
function toggleFavorite(launchId) {
  const index = favorites.map(id => String(id)).indexOf(String(launchId));
  if (index > -1) {
    // Remove favorite
    favorites.splice(index, 1);
  } else {
    // Add favorite
    favorites.push(launchId);
  }
  
  chrome.storage.local.set({ favorites: favorites }, () => {
    console.log("Favorites updated:", favorites);
    
    // Visually animate rocket in header for micro-interaction
    headerRocket.style.transform = "translateY(-12px) scale(1.3)";
    setTimeout(() => { headerRocket.style.transform = "none"; }, 400);
    
    renderDashboard();
  });
}

function toggleFavoritesFilter() {
  showFavsOnly = !showFavsOnly;
  
  favsToggleBtn.classList.toggle("active", showFavsOnly);
  if (showFavsOnly) {
    favsToggleBtn.style.color = "var(--color-gold)";
    favsToggleBtn.style.borderColor = "var(--color-gold)";
  } else {
    favsToggleBtn.style.color = "var(--text-secondary)";
    favsToggleBtn.style.borderColor = "var(--border-glass)";
  }
  
  renderDashboard();
}

function toggleTheme() {
  const isLight = document.body.classList.toggle("light-theme");
  currentTheme = isLight ? "light" : "dark";
  
  // Icon styling mapping
  if (isLight) {
    themeToggleBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`;
  } else {
    themeToggleBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
  }
  
  chrome.storage.local.set({ theme: currentTheme });
}
