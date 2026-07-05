// Mock Chrome Extension API for local browser development
if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage.local) {
  const mockStorage = {
    launchData: [
      {
        mission_name: "Gaganyaan G1",
        company_name: "ISRO",
        launch_date: new Date(Date.now() + 86400000 * 2.5).toISOString(), // 2.5 days from now
        description: "Gaganyaan G1 mission using LVM3 rocket.",
        status: "Upcoming",
        featured: true
      },
      {
        mission_name: "EOS-08",
        company_name: "ISRO",
        launch_date: new Date(Date.now() + 86400000 * 10).toISOString(),
        description: "Earth Observation Satellite launch using SSLV.",
        status: "Upcoming",
        featured: false
      },
      {
        mission_name: "Agnibaan SOrTeD",
        company_name: "Agnikul",
        launch_date: "2024-05-30T05:00:00.000Z",
        description: "Sub-Orbital Technological Demonstrator using Agnibaan rocket.",
        status: "Success",
        featured: false
      }
    ],
    favorites: [],
    theme: "dark",
    lastSyncTime: new Date().toISOString()
  };

  window.chrome = {
    storage: {
      local: {
        get: (keys, callback) => {
          const res = {};
          keys.forEach(k => { res[k] = mockStorage[k]; });
          setTimeout(() => callback(res), 50);
        },
        set: (data, callback) => {
          Object.assign(mockStorage, data);
          if (callback) setTimeout(callback, 50);
        }
      }
    },
    runtime: {
      sendMessage: (message, callback) => {
        console.log("Mock sendMessage:", message);
        if (callback) setTimeout(() => callback({ success: true }), 50);
      }
    },
    action: {
      setBadgeText: (details) => {
        console.log("Mock setBadgeText:", details.text);
      },
      setBadgeBackgroundColor: (details) => {
        console.log("Mock setBadgeBackgroundColor:", details.color);
      }
    },
    i18n: {
      getMessage: (key, placeholders) => {
        const defaultMessages = {
          "appName": "Indian Space Hub",
          "appDesc": "Track ISRO launches and space events",
          "appTitle": "Indian Space Hub Tracker",
          "featured_mission": "FEATURED MISSION",
          "days": "Days",
          "hours": "Hrs",
          "minutes": "Mins",
          "seconds": "Secs",
          "badge_tbd": "📅 TBD",
          "tooltip_add_reminder": "Add to reminders",
          "tooltip_settings": "Settings",
          "@@bidi_dir": "ltr"
        };
        let msg = defaultMessages[key] || key;
        if (placeholders) {
          if (Array.isArray(placeholders)) {
            placeholders.forEach((p, i) => {
              msg = msg.replace(`$${i + 1}`, p);
            });
          } else {
            msg = msg.replace("$1", placeholders);
          }
        }
        return msg;
      },
      getUILanguage: () => "en"
    }
  };
}

// Controller logic for Indian Space Hub Action Popup

// State Management
let launches = [];
let favorites = [];
let currentTheme = "dark";
let searchQuery = "";
let showFavsOnly = false;
let countdownInterval = null;
let activeTab = "upcoming";
let previousActiveTab = "upcoming";

// DOM Cache
const headerRocket = document.getElementById("headerRocket");
const syncSpinner = document.getElementById("syncSpinner");
const syncText = document.getElementById("syncText");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const favsToggleBtn = document.getElementById("favsToggleBtn");
const settingsToggleBtn = document.getElementById("settingsToggleBtn");

// Featured Elements
const featuredSection = document.getElementById("featuredSection");
const heroAgency = document.getElementById("heroAgency");
const heroMissionName = document.getElementById("heroMissionName");
const heroRocketName = document.getElementById("heroRocketName");
const heroLaunchDate = document.getElementById("heroLaunchDate");
const heroLaunchWindow = document.getElementById("heroLaunchWindow");
const heroWindowBadge = document.getElementById("heroWindowBadge");
const heroBadgeTBD = document.getElementById("heroBadgeTBD");
const heroCountdown = document.getElementById("heroCountdown");
const heroFavStar = document.getElementById("heroFavStar");
const daysVal = document.getElementById("daysVal");
const hoursVal = document.getElementById("hoursVal");
const minsVal = document.getElementById("minsVal");
const secsVal = document.getElementById("secsVal");

// Controls Elements
const searchInput = document.getElementById("searchInput");
const tabBtns = document.querySelectorAll("#tabNav .tab-btn");

// List Elements
const launchesList = document.getElementById("launchesList");
const completedList = document.getElementById("completedList");
const newsList = document.getElementById("newsList");

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

function localizeHtml() {
  const dir = chrome.i18n.getMessage("@@bidi_dir");
  document.documentElement.dir = dir;
  
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    const message = chrome.i18n.getMessage(key);
    if (message) {
      el.textContent = message;
    }
  });
  
  document.querySelectorAll("[data-i18n-title]").forEach(el => {
    const key = el.getAttribute("data-i18n-title");
    const message = chrome.i18n.getMessage(key);
    if (message) {
      el.setAttribute("title", message);
    }
  });
  
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    const message = chrome.i18n.getMessage(key);
    if (message) {
      el.setAttribute("placeholder", message);
    }
  });
}

function initDashboard() {
  localizeHtml();
  // 1. Fetch values from local storage
  chrome.storage.local.get(
    ["launchData", "favorites", "theme", "lastSyncTime", "apiUrl", "apiKey", "remindersEnabled"],
    (res) => {
      launches = res.launchData || [];
      favorites = res.favorites || [];
      currentTheme = res.theme || "dark";
      
      // Seed theme
      applyTheme(currentTheme);
      
      // Update sync text representation
      updateSyncStatusText(res.lastSyncTime);
      
      // 2. Render UI immediately (cached fallback state)
      updateLayoutForTab(activeTab);
      
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
  detailOverlay.addEventListener("click", (e) => {
    if (e.target === detailOverlay) detailOverlay.classList.remove("active");
  });

  // Search filter keyup
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderDashboard();
  });

  // Layout and view state switcher
  function updateLayoutForTab(tab) {
    activeTab = tab;
    
    // Show/hide tab sections
    document.querySelectorAll(".tab-section").forEach(s => s.classList.add("hidden"));
    const targetSec = document.getElementById(`tab-${tab}`);
    if (targetSec) targetSec.classList.remove("hidden");
    
    const searchBox = document.querySelector(".search-box");
    const controlsContainer = document.querySelector(".controls-container");
    
    if (tab === "settings") {
      if (settingsToggleBtn) settingsToggleBtn.classList.add("active");
      tabBtns.forEach(b => b.classList.remove("active"));
    } else {
      if (settingsToggleBtn) settingsToggleBtn.classList.remove("active");
      tabBtns.forEach(b => {
        if (b.getAttribute("data-tab") === tab) {
          b.classList.add("active");
        } else {
          b.classList.remove("active");
        }
      });
      
      // Toggle Hero Card and Search Box visibility based on tab
      if (tab === "upcoming" || tab === "completed") {
        if (searchBox) searchBox.classList.remove("hidden");
        if (controlsContainer) controlsContainer.classList.remove("hidden");
        renderDashboard();
      } else {
        // For news and moon, hide hero and search box to maximize space
        if (featuredSection) featuredSection.classList.add("hidden");
        if (searchBox) searchBox.classList.add("hidden");
        if (controlsContainer) controlsContainer.classList.remove("hidden");
        
        if (tab === "news") {
          fetchAndRenderNews();
        } else if (tab === "moon") {
          const monthSelect = document.getElementById("moonMonthSelect");
          const yearSelect = document.getElementById("moonYearSelect");
          if (monthSelect && yearSelect) {
            const month = parseInt(monthSelect.value, 10) || (new Date().getMonth() + 1);
            const year = parseInt(yearSelect.value, 10) || new Date().getFullYear();
            fetchMoonCalendar(month, year).then(renderMoonCalendar);
          }
        }
      }
    }
  }

  // Tab navigation click handlers
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-tab");
      updateLayoutForTab(tab);
    });
  });

  // Settings toggle button in header
  if (settingsToggleBtn) {
    settingsToggleBtn.addEventListener("click", () => {
      if (activeTab === "settings") {
        updateLayoutForTab(previousActiveTab);
      } else {
        previousActiveTab = activeTab;
        updateLayoutForTab("settings");
      }
    });
  }

  // Settings close button inside the settings panel
  const settingsCloseBtn = document.getElementById("settingsCloseBtn");
  if (settingsCloseBtn) {
    settingsCloseBtn.addEventListener("click", () => {
      updateLayoutForTab(previousActiveTab);
    });
  }

  // Theme Pill Selector Listeners
  const pillDark = document.getElementById("themePillDark");
  const pillLight = document.getElementById("themePillLight");
  if (pillDark && pillLight) {
    pillDark.addEventListener("click", () => applyTheme("dark"));
    pillLight.addEventListener("click", () => applyTheme("light"));
  }

  // Notifications Toggle Selector Listener
  const notificationsCheckbox = document.getElementById("notificationsCheckbox");
  if (notificationsCheckbox) {
    chrome.storage.local.get("remindersEnabled", (res) => {
      notificationsCheckbox.checked = res.remindersEnabled !== false;
    });
    notificationsCheckbox.addEventListener("change", () => {
      chrome.storage.local.set({ remindersEnabled: notificationsCheckbox.checked }, () => {
        chrome.runtime.sendMessage({ action: "rescheduleAlarms" });
      });
    });
  }

  // Moon Calendar Selection & Loading
  const moonMonthSelect = document.getElementById("moonMonthSelect");
  const moonYearSelect = document.getElementById("moonYearSelect");
  const moonFetchBtn = document.getElementById("moonFetchBtn");
  
  if (moonFetchBtn && moonMonthSelect && moonYearSelect) {
    const now = new Date();
    moonMonthSelect.value = String(now.getMonth() + 1);
    moonYearSelect.value = String(now.getFullYear());
    
    // Fetch initial moon phase calendar for current month
    fetchMoonCalendar(now.getMonth() + 1, now.getFullYear()).then(renderMoonCalendar);
    
    moonFetchBtn.addEventListener("click", () => {
      const month = parseInt(moonMonthSelect.value, 10);
      const year = parseInt(moonYearSelect.value, 10);
      moonFetchBtn.disabled = true;
      moonFetchBtn.textContent = chrome.i18n.getMessage("news_loading") || "Loading...";
      fetchMoonCalendar(month, year).then(days => {
        renderMoonCalendar(days);
        moonFetchBtn.disabled = false;
        moonFetchBtn.textContent = chrome.i18n.getMessage("btn_view") || "View";
      });
    });
  }
}

// Update UI timestamp helper
function updateSyncStatusText(timeStr) {
  if (!timeStr) {
    syncText.textContent = chrome.i18n.getMessage("never_synced") || "Never Synced";
    return;
  }
  
  if (timeStr.includes("Offline")) {
    syncText.textContent = chrome.i18n.getMessage("offline_cached") || "Offline (Cached Data)";
    syncText.style.color = "var(--color-mars)";
    return;
  }
  
  const date = new Date(timeStr);
  const formattedTime = date.toLocaleTimeString(chrome.i18n.getUILanguage(), { hour: '2-digit', minute: '2-digit' });
  syncText.textContent = chrome.i18n.getMessage("sync_time", [formattedTime]) || `Sync: ${formattedTime}`;
  syncText.style.color = "var(--text-secondary)";
}

// Immediate extension load sync trigger
function triggerForceSync() {
  syncSpinner.classList.remove("hidden");
  syncSpinner.classList.add("anim-spin");
  syncText.textContent = chrome.i18n.getMessage("syncing") || "Syncing...";
  
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
  const now = Date.now();
  let filtered = [...launches];
  
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
  
  // Separate upcoming vs completed
  const upcomingFuture = filtered
    .filter(l => new Date(l.launch_date) > now || (l.status || "").toLowerCase() === "tbd")
    .sort((a, b) => new Date(a.launch_date) - new Date(b.launch_date));
    
  const launchedPast = filtered
    .filter(l => new Date(l.launch_date) <= now && (l.status || "").toLowerCase() !== "tbd")
    .sort((a, b) => new Date(b.launch_date) - new Date(a.launch_date));

  // 1. Render Featured hero card (Next valid upcoming launch)
  // Pick featured launch first; fallback to first non-TBD, then first TBD
  const featuredLaunch = upcomingFuture.find(l => l.featured === true);
  const nextNonTBD = upcomingFuture.find(l => (l.status || "").toLowerCase() !== "tbd");
  const nextTBD = upcomingFuture.find(l => (l.status || "").toLowerCase() === "tbd");
  const heroLaunch = featuredLaunch || nextNonTBD || nextTBD || null;
  
  if (heroLaunch) {
    featuredSection.classList.remove("hidden");
    renderHeroCard(heroLaunch);
  } else {
    featuredSection.classList.add("hidden");
  }
  
  // 2. Render tab lists
  if (activeTab === "upcoming") {
    renderList(launchesList, upcomingFuture, "upcoming");
  } else if (activeTab === "completed") {
    renderList(completedList, launchedPast, "completed");
  }
}

// Hero featured details builder
function renderHeroCard(launch) {
  heroMissionName.textContent = launch.mission_name;
  
  const vehicle = launch.description?.match(/(?:PSLV|GSLV|LVM3|SSLV|Vikram|Agnibaan)[-\w]*/i)?.[0] || "Launch Rocket";
  heroRocketName.textContent = `${launch.company_name || 'ISRO'} • ${vehicle}`;
  heroAgency.textContent = launch.company_name || 'ISRO';
  
  heroAgency.className = "badge-agency";
  const co = (launch.company_name || "").toLowerCase();
  if (co.includes("isro")) heroAgency.classList.add("badge-isro");
  else if (co.includes("skyroot")) heroAgency.classList.add("badge-skyroot");
  else if (co.includes("agnikul")) heroAgency.classList.add("badge-agnikul");
  else if (co.includes("pixxel")) heroAgency.classList.add("badge-pixxel");
  
  // Set featured highlight class
  if (launch.featured === true) {
    featuredSection.classList.add("featured-highlight");
  } else {
    featuredSection.classList.remove("featured-highlight");
  }

  const isTBD = (launch.status || "").toLowerCase() === "tbd";
  
  if (isTBD) {
    // Show TBD badge, hide countdown
    heroCountdown.classList.add("hidden");
    heroBadgeTBD.classList.remove("hidden");
    heroLaunchDate.textContent = chrome.i18n.getMessage("date_tbd") || "Date To Be Determined";
    heroWindowBadge.classList.add("hidden");
    heroLaunchWindow.textContent = chrome.i18n.getMessage("window_tbd") || "Window: TBD";
    
    // Set action badge to TBD immediately
    chrome.action.setBadgeText({ text: "TBD" });
    chrome.action.setBadgeBackgroundColor({ color: "#f59e0b" });
  } else {
    // Show countdown, hide TBD badge
    heroCountdown.classList.remove("hidden");
    heroBadgeTBD.classList.add("hidden");
    
    const lDate = new Date(launch.launch_date);
    const endDate = launch.launch_date_end ? new Date(launch.launch_date_end) : null;
    const uiLang = chrome.i18n.getUILanguage();
    
    if (endDate && lDate.toDateString() !== endDate.toDateString()) {
       heroLaunchDate.textContent = lDate.toLocaleDateString(uiLang, { month: "short", day: "numeric" }) + " - " + endDate.toLocaleDateString(uiLang, { month: "short", day: "numeric", year: "numeric" });
    } else {
       heroLaunchDate.textContent = lDate.toLocaleDateString(uiLang, { month: "long", day: "numeric", year: "numeric" });
    }
    
    // Show launch window (time of day IST)
    const startTime = lDate.toLocaleTimeString(uiLang, { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
    if (endDate) {
      const endTime = endDate.toLocaleTimeString(uiLang, { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
      heroLaunchWindow.textContent = chrome.i18n.getMessage("window_range", [startTime, endTime]) || `Window: ${startTime} - ${endTime} IST`;
    } else {
      heroLaunchWindow.textContent = chrome.i18n.getMessage("window_single", [startTime]) || `Window: ${startTime} IST`;
    }
    heroWindowBadge.classList.remove("hidden");

    // Update action badge immediately
    const diff = new Date(launch.launch_date_end || launch.launch_date) - Date.now();
    if (diff > 0) {
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      let badgeText = "";
      if (d > 0) {
        badgeText = `${d}d`;
      } else if (h > 0) {
        badgeText = `${h}h`;
      } else {
        badgeText = `${m}m`;
      }
      chrome.action.setBadgeText({ text: badgeText });
      chrome.action.setBadgeBackgroundColor({ color: "#0088ff" });
    } else {
      chrome.action.setBadgeText({ text: chrome.i18n.getMessage("badge_live") || "Live" });
      chrome.action.setBadgeBackgroundColor({ color: "#10b981" });
    }
  }
  
  // Favorite state setting
  const isFav = favorites.map(id => String(id)).includes(String(launch.id));
  heroFavStar.className = isFav ? "favorite-star active" : "favorite-star";
  
  heroFavStar.onclick = (e) => {
    e.stopPropagation();
    toggleFavorite(launch.id);
  };
  
  // Modal click
  featuredSection.onclick = () => openMissionModal(launch);
  
  // Set launch date on a data attribute for the timer (run by end date if available)
  featuredSection.setAttribute("data-launchtime", launch.launch_date_end || launch.launch_date);
  featuredSection.setAttribute("data-status", launch.status || "upcoming");
}

// Render dynamic launch records items list
function renderList(container, list, type) {
  container.innerHTML = "";
  
  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-rocket">${type === "completed" ? "✅" : "🛸"}</div>
        <p>${type === "completed" ? (chrome.i18n.getMessage("empty_completed") || "No completed missions yet.") : (chrome.i18n.getMessage("empty_upcoming") || "No upcoming missions found.")}</p>
        <p class="text-xs" style="color: var(--text-muted); margin-top: 4px;">${chrome.i18n.getMessage("empty_adjust_filters") || "Adjust filters or check back later"}</p>
      </div>
    `;
    return;
  }
  
  list.forEach(launch => {
    const launchItem = document.createElement("div");
    launchItem.className = launch.featured === true ? "launch-item launch-item-featured" : "launch-item";
    launchItem.addEventListener("click", () => openMissionModal(launch));
    
    const isTBD = (launch.status || "").toLowerCase() === "tbd";
    const isPast = new Date(launch.launch_date) <= Date.now() && !isTBD;
    const uiLang = chrome.i18n.getUILanguage();
    const cleanDate = isTBD ? (chrome.i18n.getMessage("status_tbd") || "TBD") : new Date(launch.launch_date).toLocaleDateString(uiLang, { month: "short", day: "numeric" });
    
    // Abbreviated countdown status
    let timerStr = "";
    if (isPast) {
      timerStr = `<span class="status-badge status-completed">${chrome.i18n.getMessage("status_completed") || "COMPLETED"}</span>`;
    } else if (isTBD) {
      timerStr = `<span class="status-badge status-tbd">${chrome.i18n.getMessage("status_tbd") || "TBD"}</span>`;
    } else {
      timerStr = `<span class="launch-item-time-val" data-launchtime="${launch.launch_date}">${chrome.i18n.getMessage("news_loading") || "Loading..."}</span>`;
    }
    
    // Deduce rocket vehicle
    const vehicle = launch.description?.match(/(?:PSLV|GSLV|LVM3|SSLV|Vikram|Agnibaan)[-\w]*/i)?.[0] || "Launcher";
    
    // Agency color dot
    const agencyClass = getAgencyClass(launch.company_name || "");
    const featuredBadge = launch.featured === true ? `<span class="featured-badge-list">${chrome.i18n.getMessage("featured") || "FEATURED"}</span>` : "";
    
    launchItem.innerHTML = `
      <div class="launch-item-info">
        <div class="launch-item-header">
          <span class="agency-dot ${agencyClass}"></span>
          <span class="launch-item-title">${launch.mission_name}</span>
          ${featuredBadge}
        </div>
        <span class="launch-item-sub">${launch.company_name || 'ISRO'} • ${vehicle}</span>
      </div>
      <div class="launch-item-timer">
        <div>${timerStr}</div>
        <div class="launch-item-date">${cleanDate}</div>
      </div>
    `;
    
    container.appendChild(launchItem);
  });
  
  // Fire single tick check to pre-fill item elements immediately
  tickAllListTimers();
}

function getAgencyClass(companyName) {
  const co = companyName.toLowerCase();
  if (co.includes("isro")) return "dot-isro";
  if (co.includes("skyroot")) return "dot-skyroot";
  if (co.includes("agnikul")) return "dot-agnikul";
  if (co.includes("pixxel")) return "dot-pixxel";
  return "dot-other";
}

// --- NEWS FETCHING ---
async function fetchAndRenderNews() {
  newsList.innerHTML = `
    <div class="skeleton-card"></div>
    <div class="skeleton-card"></div>
    <div class="skeleton-card"></div>
  `;
  
  try {
    const response = await fetch("https://api.spaceflightnewsapi.net/v4/articles/?limit=5&search=india+isro", {
      headers: { "Accept": "application/json" }
    });
    
    let articles = [];
    
    if (response.ok) {
      const data = await response.json();
      articles = data.results || data || [];
    }
    
    if (!articles || articles.length === 0) {
      // Fallback: fetch without India filter
      const res2 = await fetch("https://api.spaceflightnewsapi.net/v4/articles/?limit=5", {
        headers: { "Accept": "application/json" }
      });
      if (res2.ok) {
        const d2 = await res2.json();
        articles = d2.results || d2 || [];
      }
    }
    
    renderNews(articles);
  } catch (err) {
    console.error("Failed to fetch news:", err);
    newsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-rocket">📡</div>
        <p>${chrome.i18n.getMessage("news_failed") || "Failed to load news."}</p>
        <p class="text-xs" style="color: var(--text-muted); margin-top: 4px;">${chrome.i18n.getMessage("news_check_connection") || "Check your connection"}</p>
      </div>
    `;
  }
}

function renderNews(articles) {
  newsList.innerHTML = "";
  
  if (!articles || articles.length === 0) {
    newsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-rocket">📰</div>
        <p>${chrome.i18n.getMessage("news_no_articles") || "No news articles found."}</p>
      </div>
    `;
    return;
  }
  
  articles.forEach(article => {
    const newsItem = document.createElement("a");
    newsItem.className = "news-item";
    newsItem.href = article.url || "#";
    newsItem.target = "_blank";
    newsItem.rel = "noopener noreferrer";
    
    const uiLang = chrome.i18n.getUILanguage();
    const pubDate = article.published_at 
      ? new Date(article.published_at).toLocaleDateString(uiLang, { month: "short", day: "numeric", year: "numeric" })
      : (chrome.i18n.getMessage("news_recent") || "Recent");
    
    const site = article.news_site || "Space News";
    const thumb = article.image_url || "";
    
    newsItem.innerHTML = `
      ${thumb ? `<div class="news-thumb" style="background-image: url('${thumb}')"></div>` : `<div class="news-thumb-placeholder">📰</div>`}
      <div class="news-content">
        <span class="news-source">${site} • ${pubDate}</span>
        <p class="news-title">${article.title || "Space News Article"}</p>
        <span class="news-read-more">${chrome.i18n.getMessage("news_read_more") || "Read more →"}</span>
      </div>
    `;
    
    newsList.appendChild(newsItem);
  });
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
  
  const status = featuredSection.getAttribute("data-status") || "";
  if (status.toLowerCase() === "tbd") return; // Don't tick for TBD
  
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
 
  // Update extension badge in real-time to match the timer
  let badgeText = "";
  if (d > 0) {
    badgeText = `${d}d`;
  } else if (h > 0) {
    badgeText = `${h}h`;
  } else {
    badgeText = `${m}m`;
  }
  chrome.action.setBadgeText({ text: badgeText });
  chrome.action.setBadgeBackgroundColor({ color: "#0088ff" });
}
 
// Tick lists dynamic timers
function tickAllListTimers() {
  const elements = document.querySelectorAll(".launch-item-time-val");
  const now = Date.now();
  
  elements.forEach(el => {
    const launchTime = new Date(el.getAttribute("data-launchtime")).getTime();
    const diff = launchTime - now;
    
    if (diff <= 0) {
      el.outerHTML = `<span class="status-badge status-completed">${chrome.i18n.getMessage("status_launched") || "LAUNCHED"}</span>`;
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
      el.style.color = "var(--color-mars)";
    }
  });
}

// --- MODAL UTILS ---
function openMissionModal(launch) {
  modalTitle.textContent = launch.mission_name;
  
  const vehicle = launch.description?.match(/(?:PSLV|GSLV|LVM3|SSLV|Vikram|Agnibaan)[-\w]*/i)?.[0] || "LVM3-M4 Heavy Lift";
  modalVehicle.textContent = vehicle;
  
  modalAgency.textContent = launch.company_name || 'ISRO';
  
  const orbit = launch.description?.match(/(?:LEO|GTO|SSO|MEO|Lunar|Sun-Synchronous|SSO polar)[-\w]*/i)?.[0] || "Low Earth Orbit (LEO)";
  modalOrbit.textContent = orbit;
  
  const isTBD = (launch.status || "").toLowerCase() === "tbd";
  
  if (isTBD) {
    modalDate.textContent = chrome.i18n.getMessage("date_tbd") || "To Be Determined (TBD)";
    modalStatus.textContent = chrome.i18n.getMessage("status_tbd") || "TBD";
    modalStatus.style.color = "var(--color-gold)";
  } else {
    const lDate = new Date(launch.launch_date);
    const uiLang = chrome.i18n.getUILanguage();
    const windowTime = lDate.toLocaleTimeString(uiLang, { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
    modalDate.textContent = lDate.toLocaleDateString(uiLang, { month: "long", day: "numeric", year: "numeric" }) + ` • ${windowTime} IST`;
    
    const isPast = lDate <= Date.now();
    modalStatus.textContent = isPast ? (chrome.i18n.getMessage("status_completed") || "Completed") : (chrome.i18n.getMessage("tab_upcoming") || "Upcoming");
    modalStatus.style.color = isPast ? "var(--color-emerald)" : "var(--color-cyan)";
  }
  
  modalDesc.textContent = launch.description || (chrome.i18n.getMessage("modal_desc_fallback") || "No specific detailed payload details are supplied for this flight. Telemetry status remains operational.");
  
  detailOverlay.classList.add("active");
}


// --- UTILS & INTERACTIONS ---
function toggleFavorite(launchId) {
  const index = favorites.map(id => String(id)).indexOf(String(launchId));
  if (index > -1) {
    favorites.splice(index, 1);
  } else {
    favorites.push(launchId);
  }
  
  chrome.storage.local.set({ favorites: favorites }, () => {
    headerRocket.style.transform = "translateY(-12px) scale(1.3)";
    setTimeout(() => { headerRocket.style.transform = "none"; }, 400);
    chrome.runtime.sendMessage({ action: "rescheduleAlarms" });
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

function applyTheme(themeName) {
  currentTheme = themeName;
  if (themeName === "light") {
    document.body.classList.add("light-theme");
    themeToggleBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`;
    
    // Update theme pills
    const pillLight = document.getElementById("themePillLight");
    const pillDark = document.getElementById("themePillDark");
    if (pillLight) pillLight.classList.add("active");
    if (pillDark) pillDark.classList.remove("active");
  } else {
    document.body.classList.remove("light-theme");
    themeToggleBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
    
    // Update theme pills
    const pillLight = document.getElementById("themePillLight");
    const pillDark = document.getElementById("themePillDark");
    if (pillDark) pillDark.classList.add("active");
    if (pillLight) pillLight.classList.remove("active");
  }
  chrome.storage.local.set({ theme: currentTheme });
}

function toggleTheme() {
  applyTheme(currentTheme === "dark" ? "light" : "dark");
}

/* --- MOON CALENDAR HELPERS --- */
async function fetchMoonCalendar(month, year) {
  return new Promise((resolve) => {
    chrome.storage.local.get(["apiUrl", "apiKey"], async (res) => {
      const apiUrl = res.apiUrl || "https://space.veerexa.com/api/space/upcoming_launches";
      const apiKey = res.apiKey || "";
      
      let origin = "https://space.veerexa.com";
      try {
        const urlObj = new URL(apiUrl);
        origin = urlObj.origin;
      } catch (e) {
        console.error("Invalid api URL, using fallback origin", e);
      }
      
      const endpoint = `${origin}/api/v1/astronomy/moon-calendar?month=${month}&year=${year}`;
      
      try {
        const headers = { "Accept": "application/json" };
        if (apiKey) {
          headers["Authorization"] = `Bearer ${apiKey}`;
        }
        
        console.log(`[Moon API] Fetching: ${endpoint}`);
        const response = await fetch(endpoint, { headers });
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const data = await response.json();
        
        let moonData = data;
        if (data && data.data) {
          moonData = data.data;
        }
        
        if (moonData && Array.isArray(moonData)) {
          resolve(moonData);
          return;
        } else if (moonData && moonData.days && Array.isArray(moonData.days)) {
          resolve(moonData.days);
          return;
        } else if (moonData && typeof moonData === "object") {
          for (const key in moonData) {
            if (Array.isArray(moonData[key])) {
              resolve(moonData[key]);
              return;
            }
          }
          // Wrap single object in array to render as featured single day
          resolve([moonData]);
          return;
        }
        throw new Error("Unexpected API response structure");
      } catch (err) {
        console.warn("[Moon API] Request failed, using client-side astronomical calculation fallback:", err);
        const fallbackDays = generateLocalMoonCalendar(month, year);
        resolve(fallbackDays);
      }
    });
  });
}

function generateLocalMoonCalendar(month, year) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysList = [];
  
  // Reference New Moon: 2000-01-06T18:14:00Z
  const knownNewMoon = new Date(Date.UTC(2000, 0, 6, 18, 14, 0)).getTime();
  const synodicPeriod = 29.530588853 * 86400000;
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const timeDiff = date.getTime() - knownNewMoon;
    let phaseVal = (timeDiff % synodicPeriod) / synodicPeriod;
    if (phaseVal < 0) phaseVal += 1.0;
    
    let phaseKey = "";
    let emoji = "";
    
    if (phaseVal < 0.03 || phaseVal > 0.97) {
      phaseKey = "phase_new_moon";
      emoji = "🌑";
    } else if (phaseVal >= 0.03 && phaseVal < 0.22) {
      phaseKey = "phase_waxing_crescent";
      emoji = "🌒";
    } else if (phaseVal >= 0.22 && phaseVal < 0.28) {
      phaseKey = "phase_first_quarter";
      emoji = "🌓";
    } else if (phaseVal >= 0.28 && phaseVal < 0.47) {
      phaseKey = "phase_waxing_gibbous";
      emoji = "🌔";
    } else if (phaseVal >= 0.47 && phaseVal < 0.53) {
      phaseKey = "phase_full_moon";
      emoji = "🌕";
    } else if (phaseVal >= 0.53 && phaseVal < 0.72) {
      phaseKey = "phase_waning_gibbous";
      emoji = "🌖";
    } else if (phaseVal >= 0.72 && phaseVal < 0.78) {
      phaseKey = "phase_third_quarter";
      emoji = "🌗";
    } else {
      phaseKey = "phase_waning_crescent";
      emoji = "🌘";
    }
    
    const phaseName = chrome.i18n.getMessage(phaseKey) || phaseKey.replace("phase_", "").replace(/_/g, " ");
    
    daysList.push({
      day: day,
      phase_name: phaseName,
      emoji: emoji,
      illumination: Math.round((1 - Math.cos(2 * Math.PI * phaseVal)) / 2 * 100)
    });
  }
  return daysList;
}

function renderMoonCalendar(days) {
  const grid = document.getElementById("moonCalendarGrid");
  if (!grid) return;
  
  grid.innerHTML = "";
  if (!days) {
    grid.innerHTML = `<div class="error-msg" style="grid-column: 1/-1; text-align: center; color: var(--color-mars); padding: 12px; font-weight: 600;">${chrome.i18n.getMessage("moon_no_data") || "No moon phase data available."}</div>`;
    return;
  }
  
  // Ensure array format
  let daysArray = [];
  if (Array.isArray(days)) {
    daysArray = days;
  } else if (typeof days === "object") {
    daysArray = [days];
  } else {
    grid.innerHTML = `<div class="error-msg" style="grid-column: 1/-1; text-align: center; color: var(--color-mars); padding: 12px; font-weight: 600;">${chrome.i18n.getMessage("moon_no_data") || "No moon phase data available."}</div>`;
    return;
  }
  
  // Deduplicate by day number
  const uniqueDays = [];
  const seenDays = new Set();
  
  daysArray.forEach((d, index) => {
    if (!d) return;
    
    // Parse day number
    let dayNum = d.day;
    if (dayNum === undefined || dayNum === null) {
      if (d.date && typeof d.date === 'string') {
        const parts = d.date.split('-');
        if (parts.length === 3) {
          dayNum = parseInt(parts[2], 10);
        } else {
          const parsedDate = new Date(d.date);
          if (!isNaN(parsedDate.getTime())) {
            dayNum = parsedDate.getDate();
          }
        }
      } else if (d.day_number !== undefined) {
        dayNum = d.day_number;
      } else if (d.dayNumber !== undefined) {
        dayNum = d.dayNumber;
      } else {
        dayNum = index + 1;
      }
    }
    
    if (dayNum && !seenDays.has(dayNum)) {
      seenDays.add(dayNum);
      
      // Parse phase name and translate
      let name = d.phase_name || d.phase || d.phaseName || d.name || "Unknown Phase";
      const lowerName = name.toLowerCase().replace(/[\s_-]+/g, " ");
      let phaseKey = "";
      if (lowerName.includes("new")) phaseKey = "phase_new_moon";
      else if (lowerName.includes("waxing crescent")) phaseKey = "phase_waxing_crescent";
      else if (lowerName.includes("first quarter")) phaseKey = "phase_first_quarter";
      else if (lowerName.includes("waxing gibbous")) phaseKey = "phase_waxing_gibbous";
      else if (lowerName.includes("full")) phaseKey = "phase_full_moon";
      else if (lowerName.includes("waning gibbous")) phaseKey = "phase_waning_gibbous";
      else if (lowerName.includes("third quarter") || lowerName.includes("last quarter")) phaseKey = "phase_third_quarter";
      else if (lowerName.includes("waning crescent")) phaseKey = "phase_waning_crescent";
      
      const translatedName = phaseKey ? (chrome.i18n.getMessage(phaseKey) || name) : name;
      
      // Parse emoji
      let emoji = d.emoji || d.phase_emoji || d.phaseEmoji || d.symbol;
      if (!emoji) {
        const lowerName = name.toLowerCase();
        if (lowerName.includes("new")) emoji = "🌑";
        else if (lowerName.includes("waxing crescent") || lowerName.includes("waxing_crescent")) emoji = "🌒";
        else if (lowerName.includes("first quarter") || lowerName.includes("first_quarter")) emoji = "🌓";
        else if (lowerName.includes("waxing gibbous") || lowerName.includes("waxing_gibbous")) emoji = "🌔";
        else if (lowerName.includes("full")) emoji = "🌕";
        else if (lowerName.includes("waning gibbous") || lowerName.includes("waning_gibbous")) emoji = "🌖";
        else if (lowerName.includes("third quarter") || lowerName.includes("third_quarter") || lowerName.includes("last quarter") || lowerName.includes("last_quarter")) emoji = "🌗";
        else if (lowerName.includes("waning crescent") || lowerName.includes("waning_crescent")) emoji = "🌘";
        else emoji = "🌑";
      }
      
      // Parse illumination
      let illumination = d.illumination;
      if (illumination === undefined || illumination === null) {
        illumination = d.illumination_percentage || d.percentage || d.fraction || 0;
      }
      if (typeof illumination === "number" && illumination > 0 && illumination <= 1) {
        illumination = Math.round(illumination * 100);
      } else if (typeof illumination === "number") {
        illumination = Math.round(illumination);
      } else {
        illumination = 0;
      }
      
      uniqueDays.push({
        day: dayNum,
        phase_name: translatedName,
        emoji: emoji,
        illumination: illumination
      });
    }
  });
  
  // Sort chronologically by day
  uniqueDays.sort((a, b) => a.day - b.day);
  
  if (uniqueDays.length === 0) {
    grid.innerHTML = `<div class="error-msg" style="grid-column: 1/-1; text-align: center; color: var(--color-mars); padding: 12px; font-weight: 600;">${chrome.i18n.getMessage("moon_no_data") || "No moon phase data available."}</div>`;
    return;
  }
  
  // Render based on count
  if (uniqueDays.length === 1) {
    grid.className = "moon-calendar-grid single-day-layout";
    const d = uniqueDays[0];
    const card = document.createElement("div");
    card.className = "moon-featured-card glass-panel";
    card.innerHTML = `
      <div class="moon-featured-emoji">${d.emoji}</div>
      <div class="moon-featured-info">
        <h4>${d.phase_name}</h4>
        <p>${chrome.i18n.getMessage("illumination_format", [String(d.illumination)]) || `${d.illumination}% Illuminated`}</p>
      </div>
      <div class="moon-progress-bg">
        <div class="moon-progress-bar" style="width: ${d.illumination}%"></div>
      </div>
    `;
    grid.appendChild(card);
    return;
  }
  
  // Render monthly calendar grid
  grid.className = "moon-calendar-grid monthly-calendar-layout";
  
  // Add weekday header labels (S, M, T, W, T, F, S)
  const weekdays = [];
  const dummyDate = new Date(2026, 0, 4); // Jan 4, 2026 is a Sunday
  const uiLang = chrome.i18n.getUILanguage();
  for (let i = 0; i < 7; i++) {
    const d = new Date(dummyDate);
    d.setDate(dummyDate.getDate() + i);
    weekdays.push(d.toLocaleDateString(uiLang, { weekday: 'narrow' }));
  }

  weekdays.forEach(w => {
    const label = document.createElement("div");
    label.className = "moon-weekday-label";
    label.innerText = w;
    grid.appendChild(label);
  });
  
  // Find start day of the month to prepend empty placeholders
  const monthSelect = document.getElementById("moonMonthSelect");
  const yearSelect = document.getElementById("moonYearSelect");
  const selectedMonth = monthSelect ? parseInt(monthSelect.value, 10) : 6;
  const selectedYear = yearSelect ? parseInt(yearSelect.value, 10) : 2026;
  
  const startDayOfWeek = new Date(selectedYear, selectedMonth - 1, 1).getDay();
  
  // Prepend empty placeholder divs
  for (let i = 0; i < startDayOfWeek; i++) {
    const placeholder = document.createElement("div");
    placeholder.className = "moon-day-placeholder";
    grid.appendChild(placeholder);
  }
  
  // Render actual day cards
  uniqueDays.forEach(d => {
    const card = document.createElement("div");
    card.className = "moon-day-card";
    
    // Check if it's the current date today
    const today = new Date();
    const isToday = today.getDate() === d.day && 
                    (today.getMonth() + 1) === selectedMonth && 
                    today.getFullYear() === selectedYear;
                    
    if (isToday) {
      card.classList.add("today-highlight");
    }
    
    card.title = `${d.phase_name} (${chrome.i18n.getMessage("illumination_format", [String(d.illumination)]) || `${d.illumination}% Illuminated`})`;
    
    card.innerHTML = `
      <span class="moon-day-num">${d.day}</span>
      <span class="moon-phase-emoji">${d.emoji}</span>
    `;
    
    grid.appendChild(card);
  });
}
