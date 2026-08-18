// Background service worker for Indian Space Hub Extension

const DEFAULT_API_URL = "https://space.veerexa.com/api/space/upcoming_launches";
const GLOBAL_API_URL = "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?format=json&limit=30&ordering=net";
const FALLBACK_API_KEY = "isro_live_7e96e0d26a773dec3256864c91f93681";

// Mock data to seed storage immediately so the extension has a valid state on load or offline
const MOCK_LAUNCHES = [
  {
    id: 1,
    mission_name: "Gaganyaan G1",
    slug: "gaganyaan-g1",
    launch_date: "2026-11-20T00:00:00.000Z",
    status: "upcoming",
    featured: true,
    description: "First uncrewed orbital flight test of India's human spaceflight program. The mission will test the crew module's flight systems, propulsion, and re-entry operations in low Earth orbit.",
    created_at: "2026-05-10T15:12:51.639Z",
    name: "Gaganyaan G1",
    company_name: "ISRO",
    company_logo_url: "",
    image_url: ""
  },
  {
    id: 2,
    mission_name: "Vikram-1 Flight 1",
    slug: "vikram-1-flight-1",
    launch_date: "2026-07-15T06:30:00.000Z",
    status: "upcoming",
    description: "Inaugural orbital flight of Vikram-1, Skyroot Aerospace's multi-stage carbon-fiber launch vehicle carrying commercial payloads into low Earth orbit.",
    created_at: "2026-05-10T15:15:00.000Z",
    name: "Vikram-1 Flight 1",
    company_name: "Skyroot Aerospace",
    company_logo_url: "",
    image_url: ""
  },
  {
    id: 3,
    mission_name: "Agnibaan SOrTeD",
    slug: "agnibaan-sorted",
    launch_date: "2026-08-25T10:00:00.000Z",
    status: "upcoming",
    description: "Sub-orbital tech demonstrator and commercial launch by Agnikul Cosmos featuring their 3D-printed semi-cryogenic engine, Agnilet.",
    created_at: "2026-05-10T15:20:00.000Z",
    name: "Agnibaan SOrTeD",
    company_name: "Agnikul Cosmos",
    company_logo_url: "",
    image_url: ""
  },
  {
    id: 4,
    mission_name: "Pixxel Firefly-3",
    slug: "pixxel-firefly-3",
    launch_date: "2026-09-12T04:15:00.000Z",
    status: "upcoming",
    description: "Deployment of Pixxel's next-generation commercial hyperspectral imaging satellites onto a polar sun-synchronous orbit via ISRO's PSLV.",
    created_at: "2026-05-10T15:25:00.000Z",
    name: "Pixxel Firefly-3",
    company_name: "Pixxel",
    company_logo_url: "",
    image_url: ""
  },
  {
    id: 101,
    mission_name: "Chandrayaan-3",
    slug: "chandrayaan-3",
    launch_date: "2023-07-14T09:05:00.000Z",
    launch_date_end: "2023-08-23T12:34:00.000Z",
    status: "success",
    description: "India's third lunar exploration mission, which successfully demonstrated safe landing and roving capabilities on the Moon's south polar region.",
    created_at: "2023-07-14T00:00:00.000Z",
    name: "Chandrayaan-3",
    company_name: "ISRO",
    company_logo_url: "",
    image_url: ""
  },
  {
    id: 102,
    mission_name: "Aditya-L1",
    slug: "aditya-l1",
    launch_date: "2023-09-02T06:20:00.000Z",
    launch_date_end: "2024-01-06T10:30:00.000Z",
    status: "success",
    description: "India's first dedicated solar observatory mission, placed in a halo orbit around the Lagrange point 1 (L1) of the Sun-Earth system to study the solar corona and solar wind.",
    created_at: "2023-09-02T00:00:00.000Z",
    name: "Aditya-L1",
    company_name: "ISRO",
    company_logo_url: "",
    image_url: ""
  }
];

// Global launch mock data (international agencies)
const MOCK_GLOBAL_LAUNCHES = [
  {
    id: "gl-001",
    mission_name: "Starship IFT-7",
    slug: "starship-ift-7",
    launch_date: "2026-09-15T18:00:00.000Z",
    status: "upcoming",
    description: "Seventh integrated flight test of SpaceX's Starship Super Heavy launch system from Starbase, Boca Chica, testing full booster catch and ship propulsive landing.",
    company_name: "SpaceX",
    vehicle: "Starship / Super Heavy",
    launch_site: "Starbase, Boca Chica, TX",
    orbit: "Trans-atmospheric",
    image_url: "",
    is_global: true
  },
  {
    id: "gl-002",
    mission_name: "Artemis IV",
    slug: "artemis-iv",
    launch_date: "2026-12-01T04:00:00.000Z",
    status: "upcoming",
    description: "NASA's Artemis IV crewed lunar mission. Astronauts will dock with the Gateway lunar space station and prepare for surface operations.",
    company_name: "NASA",
    vehicle: "SLS Block 1B",
    launch_site: "LC-39B, Kennedy Space Center",
    orbit: "Lunar",
    image_url: "",
    is_global: true
  },
  {
    id: "gl-003",
    mission_name: "Falcon 9 — Starlink Group 10-3",
    slug: "falcon9-starlink-10-3",
    launch_date: "2026-08-25T22:30:00.000Z",
    status: "upcoming",
    description: "SpaceX Falcon 9 carrying a batch of Starlink v2 Mini satellites to low Earth orbit from Cape Canaveral.",
    company_name: "SpaceX",
    vehicle: "Falcon 9 Block 5",
    launch_site: "SLC-40, Cape Canaveral SFS",
    orbit: "LEO",
    image_url: "",
    is_global: true
  },
  {
    id: "gl-004",
    mission_name: "Eutelsat KONNECT VHTS",
    slug: "eutelsat-konnect-vhts",
    launch_date: "2026-10-10T21:00:00.000Z",
    status: "upcoming",
    description: "Arianespace Ariane 6 mission deploying the EUTELSAT KONNECT VHTS high-throughput broadband satellite to geostationary transfer orbit.",
    company_name: "Arianespace / ESA",
    vehicle: "Ariane 62",
    launch_site: "ELA-4, Guiana Space Centre",
    orbit: "GTO",
    image_url: "",
    is_global: true
  },
  {
    id: "gl-005",
    mission_name: "Soyuz MS-28",
    slug: "soyuz-ms-28",
    launch_date: "2026-09-24T09:00:00.000Z",
    status: "upcoming",
    description: "Roscosmos Soyuz MS-28 crewed spacecraft delivering new ISS crew members including a cosmonaut and NASA astronaut to the International Space Station.",
    company_name: "Roscosmos",
    vehicle: "Soyuz-2.1a",
    launch_site: "Site 31/6, Baikonur Cosmodrome",
    orbit: "LEO/ISS",
    image_url: "",
    is_global: true
  },
  {
    id: "gl-006",
    mission_name: "New Glenn — Blue Ring Demo",
    slug: "new-glenn-blue-ring-demo",
    launch_date: "2026-11-08T07:00:00.000Z",
    status: "upcoming",
    description: "Blue Origin New Glenn rocket carrying the Blue Ring multi-mission space vehicle for an orbital demonstration mission from Cape Canaveral.",
    company_name: "Blue Origin",
    vehicle: "New Glenn",
    launch_site: "LC-36, Cape Canaveral SFS",
    orbit: "GTO",
    image_url: "",
    is_global: true
  },
  {
    id: "gl-007",
    mission_name: "Tianwen-2",
    slug: "tianwen-2",
    launch_date: "2026-09-01T02:00:00.000Z",
    status: "upcoming",
    description: "China's asteroid and comet sample return mission targeting near-Earth asteroid 469219 Kamo'oalewa and later a comet in the main belt.",
    company_name: "CNSA",
    vehicle: "Long March 3B",
    launch_site: "Xichang Satellite Launch Center",
    orbit: "Heliocentric / Deep Space",
    image_url: "",
    is_global: true
  },
  {
    id: "gl-101",
    mission_name: "Crew Dragon Endurance — Crew-9",
    slug: "crew-dragon-crew-9",
    launch_date: "2024-09-29T06:17:00.000Z",
    status: "success",
    description: "SpaceX Crew Dragon Endurance carried two NASA astronauts to the ISS on Crew-9, also bringing back Butch Wilmore and Suni Williams.",
    company_name: "SpaceX / NASA",
    vehicle: "Falcon 9 / Crew Dragon",
    launch_site: "LC-39A, Kennedy Space Center",
    orbit: "LEO/ISS",
    image_url: "",
    is_global: true
  }
];

// Initialize extension state on installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("Indian Space Hub Extension Installed.");
  
  // Set default settings and seed mock data to guarantee immediate functionality
  chrome.storage.local.get(["apiUrl", "apiKey", "launchData", "remindersEnabled", "favorites", "sentNotifications"], (res) => {
    const updates = {};
    if (!res.apiUrl) updates.apiUrl = DEFAULT_API_URL;
    if (!res.apiKey) updates.apiKey = FALLBACK_API_KEY;
    if (!res.launchData) updates.launchData = MOCK_LAUNCHES;
    if (!res.globalLaunchData) updates.globalLaunchData = MOCK_GLOBAL_LAUNCHES;
    if (res.remindersEnabled === undefined) updates.remindersEnabled = true;
    if (!res.favorites) updates.favorites = [];
    if (!res.sentNotifications) updates.sentNotifications = [];
    
    chrome.storage.local.set(updates, () => {
      console.log("Storage seeded successfully.");
      updateBadge(res.launchData || MOCK_LAUNCHES);
      scheduleSyncAlarm();
      fetchLaunchData(); // Initial immediate sync
      fetchGlobalLaunchData(); // Initial global sync
    });
  });
});

// Alarm Listener
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "sync_data") {
    console.log("Executing background alarm sync...");
    fetchLaunchData();
  } else if (alarm.name.startsWith("notify_")) {
    handleNotificationAlarm(alarm.name);
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "forceSync") {
    Promise.all([fetchLaunchData(), fetchGlobalLaunchData()])
      .then(([data]) => {
        sendResponse({ success: true, count: data ? data.length : 0 });
      })
      .catch((err) => {
        sendResponse({ success: false, error: err.message });
      });
    return true; // Keep channel open for async response
  } else if (request.action === "rescheduleAlarms") {
    chrome.storage.local.get(["launchData", "favorites", "remindersEnabled"], (res) => {
      const data = res.launchData || [];
      const favs = res.favorites || [];
      const enabled = res.remindersEnabled !== false;
      scheduleLaunchAlertAlarms(data, favs, enabled);
      sendResponse({ success: true });
    });
    return true;
  }
});

// Setup background sync alarm daily at 12 noon
function scheduleSyncAlarm() {
  chrome.alarms.clear("sync_data", () => {
    const now = new Date();
    const target = new Date();
    target.setHours(12, 0, 0, 0);
    // If 12 noon has already passed today, schedule for 12 noon tomorrow
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    chrome.alarms.create("sync_data", {
      when: target.getTime(),
      periodInMinutes: 24 * 60 // 1 day
    });
    console.log("Sync alarm configured to run daily at 12 noon. Next run:", target.toString());
  });
}

// Fetch launch schedules from API
async function fetchLaunchData() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["apiUrl", "apiKey", "launchData", "remindersEnabled", "favorites"], async (res) => {
      const url = res.apiUrl || DEFAULT_API_URL;
      const key = res.apiKey || FALLBACK_API_KEY;
      
      console.log(`[Background Fetch] Requesting space API: ${url}`);
      
      try {
        const headers = { "Content-Type": "application/json", "Accept": "application/json" };
        
        // If the user specifies the official Developer API endpoint, supply the authorization header
        if (url.includes("/api/v1/")) {
          headers["Authorization"] = `Bearer ${key}`;
        }
        
        const response = await fetch(url, { headers, cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Server returned HTTP ${response.status}`);
        }
        
        const json = await response.json();
        
        // Extract launch array: API returns `{ upcoming_launches: [...] }` on public /api/space/upcoming_launches, 
        // or `{ data: [...] }` on developers v1 endpoint. Let's normalize it.
        let rawLaunches = [];
        if (json.upcoming_launches && Array.isArray(json.upcoming_launches)) {
          rawLaunches = json.upcoming_launches;
        } else if (json.data && Array.isArray(json.data)) {
          // Normalize JSON:API specs from developer v1 endpoints
          rawLaunches = json.data.map(item => {
            const attr = item.attributes || {};
            return {
              id: item.id || attr.id,
              mission_name: attr.mission_name || attr.name,
              slug: attr.slug,
              launch_date: attr.launch_date,
              launch_date_end: attr.launch_date_end,
              status: attr.status || "upcoming",
              description: attr.description || "",
              company_name: attr.company_name || "ISRO",
              company_logo_url: attr.company_logo_url || "",
              image_url: attr.image_url || "",
              featured: attr.featured || false
            };
          });
        } else {
          throw new Error("Invalid response format. Missing upcoming_launches or data array.");
        }
        
        if (rawLaunches.length === 0) {
          console.warn("No upcoming launches found in API response.");
        }
        
        // Save to storage, merging to keep past (completed) launches that are no longer in the upcoming list
        const oldLaunches = res.launchData || [];
        const rawIds = new Set(rawLaunches.map(l => String(l.id)));
        const mergedLaunches = [...rawLaunches];
        oldLaunches.forEach(oldL => {
          if (!rawIds.has(String(oldL.id))) {
            mergedLaunches.push(oldL);
          }
        });

        chrome.storage.local.set({
          launchData: mergedLaunches,
          lastSyncTime: new Date().toISOString()
        }, () => {
          console.log(`Synced ${rawLaunches.length} upcoming launches. Total stored: ${mergedLaunches.length}`);
          checkForNewLaunches(oldLaunches, rawLaunches);
          updateBadge(mergedLaunches);
          scheduleLaunchAlertAlarms(mergedLaunches, res.favorites || [], res.remindersEnabled);
          resolve(mergedLaunches);
        });
        
      } catch (err) {
        console.error("Failed to fetch space launch data: ", err);
        // On failure, keep existing cached data but update sync time to signal offline status
        chrome.storage.local.set({ lastSyncTime: new Date().toISOString() + " (Offline)" }, () => {
          resolve(res.launchData || MOCK_LAUNCHES);
        });
      }
    });
  });
}

// Fetch global launch schedules from The Space Devs API (LL2)
async function fetchGlobalLaunchData() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["globalLaunchData"], async (res) => {
      try {
        const response = await fetch(GLOBAL_API_URL, {
          headers: { "Accept": "application/json" },
          cache: "no-store"
        });
        
        if (!response.ok) throw new Error(`Global API HTTP ${response.status}`);
        
        const json = await response.json();
        const results = json.results || [];
        
        // Normalize The Space Devs LL2 format to our internal format
        const normalized = results.map(l => ({
          id: `gl-${l.id}`,
          mission_name: l.name || l.mission?.name || "Unknown Mission",
          slug: l.slug || String(l.id),
          launch_date: l.net || l.window_start,
          launch_date_end: l.window_end,
          status: (l.status?.abbrev || "TBD").toLowerCase() === "go" ? "upcoming" :
                  (l.status?.abbrev || "TBD").toLowerCase() === "success" ? "success" :
                  (l.status?.abbrev || "TBD").toLowerCase() === "failure" ? "failure" : "upcoming",
          description: l.mission?.description || l.name || "",
          company_name: l.launch_service_provider?.name || l.rocket?.configuration?.manufacturer?.name || "Unknown Agency",
          vehicle: l.rocket?.configuration?.name || "Unknown Vehicle",
          launch_site: l.pad?.name || l.pad?.location?.name || "Unknown Site",
          orbit: l.mission?.orbit?.abbrev || "Unknown",
          image_url: l.image || l.rocket?.configuration?.image_url || "",
          is_global: true
        }));
        
        if (normalized.length === 0) throw new Error("No global launches in response");
        
        // Merge with old global data to keep history
        const oldGlobal = res.globalLaunchData || [];
        const newIds = new Set(normalized.map(l => String(l.id)));
        const merged = [...normalized];
        oldGlobal.forEach(old => { if (!newIds.has(String(old.id))) merged.push(old); });
        
        chrome.storage.local.set({ globalLaunchData: merged }, () => {
          console.log(`[Global] Synced ${normalized.length} global launches.`);
          resolve(merged);
        });
        
      } catch (err) {
        console.warn("[Global] API fetch failed, using cached/mock data:", err.message);
        // Fall back to cached data or mock data
        const fallback = res.globalLaunchData || MOCK_GLOBAL_LAUNCHES;
        chrome.storage.local.set({ globalLaunchData: fallback });
        resolve(fallback);
      }
    });
  });
}

// Detect and notify if new space launches are added to the roster
function checkForNewLaunches(oldList, newList) {
  // Prevent flood of notifications on first install or when cache is empty
  if (!oldList || oldList.length === 0) return;
  
  const oldIds = new Set(oldList.map(l => String(l.id)));
  const newlyAdded = newList.filter(l => !oldIds.has(String(l.id)));
  
  newlyAdded.forEach(launch => {
    const formattedDate = new Date(launch.launch_date).toLocaleDateString();
    showNotificationOnce(`new_launch_${launch.id}`, {
      type: "basic",
      iconUrl: "icons/chopper_icon.png",
      title: chrome.i18n.getMessage("notify_new_launch_title"),
      message: chrome.i18n.getMessage("notify_new_launch_message", [launch.mission_name, launch.company_name || 'ISRO', formattedDate]),
      priority: 2
    });
  });
}

// Update Extension Action Toolbar Badge with countdown to featured launch (or next launch)
function updateBadge(launches) {
  if (!launches || launches.length === 0) {
    chrome.action.setBadgeText({ text: "" });
    return;
  }
  
  // Filter for valid future launches
  const now = new Date();
  const futureLaunches = launches
    .filter(l => new Date(l.launch_date_end || l.launch_date) > now || (l.status || "").toLowerCase() === "tbd")
    .sort((a, b) => new Date(a.launch_date) - new Date(b.launch_date));
    
  if (futureLaunches.length === 0) {
    chrome.action.setBadgeText({ text: "" });
    return;
  }
  
  // Select featured launch if present in future launches; fallback to first non-TBD, then first TBD
  const featuredLaunch = futureLaunches.find(l => l.featured === true);
  const nextNonTBD = futureLaunches.find(l => (l.status || "").toLowerCase() !== "tbd");
  const nextTBD = futureLaunches.find(l => (l.status || "").toLowerCase() === "tbd");
  const nextLaunch = featuredLaunch || nextNonTBD || nextTBD || futureLaunches[0];
  
  const isTBD = (nextLaunch.status || "").toLowerCase() === "tbd";
  if (isTBD) {
    chrome.action.setBadgeText({ text: "TBD" });
    chrome.action.setBadgeBackgroundColor({ color: "#f59e0b" }); // Gold/Yellow for TBD
    return;
  }
  
  const diffTime = new Date(nextLaunch.launch_date_end || nextLaunch.launch_date) - now;
  if (diffTime <= 0) {
    chrome.action.setBadgeText({ text: chrome.i18n.getMessage("badge_live") || "Live" });
    chrome.action.setBadgeBackgroundColor({ color: "#10b981" }); // Emerald Green for Live
    return;
  }
  
  const d = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const h = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
  
  let badgeText = "";
  if (d > 0) {
    badgeText = `${d}d`;
  } else if (h > 0) {
    badgeText = `${h}h`;
  } else {
    badgeText = `${m}m`;
  }
  
  chrome.action.setBadgeText({ text: badgeText });
  chrome.action.setBadgeBackgroundColor({ color: "#0088ff" }); // Vibrant blue
}

// Schedule localized notification alarms for launches
function scheduleLaunchAlertAlarms(launches, favorites, globalRemindersEnabled) {
  // Clear any existing notification alarms to rebuild them cleanly
  chrome.alarms.getAll(alarms => {
    const notifyAlarms = alarms.filter(a => a.name.startsWith("notify_"));
    notifyAlarms.forEach(alarm => chrome.alarms.clear(alarm.name));
    
    // If notifications are completely disabled, stop here
    if (!globalRemindersEnabled) return;
    
    const now = Date.now();
    const favSet = new Set(favorites.map(id => String(id)));
    
    launches.forEach(launch => {
      const launchTime = new Date(launch.launch_date_end || launch.launch_date).getTime();
      const isFavorited = favSet.has(String(launch.id));
      
      // Limit countdown notifications to favorited launches only
      if (!isFavorited) return;
      
      // 24 Hours Alert
      const time24h = launchTime - (24 * 60 * 60 * 1000);
      if (time24h > now) {
        chrome.alarms.create(`notify_24h_${launch.id}`, { when: time24h });
      }
      
      // 1 Hour Alert
      const time1h = launchTime - (60 * 60 * 1000);
      if (time1h > now) {
        chrome.alarms.create(`notify_1h_${launch.id}`, { when: time1h });
      }
      
      // Launch Time Alert
      if (launchTime > now) {
        chrome.alarms.create(`notify_now_${launch.id}`, { when: launchTime });
      }
    });
  });
}

// Handle trigger of specific notification alarm
function handleNotificationAlarm(alarmName) {
  const parts = alarmName.split("_");
  if (parts.length < 3) return;
  
  const alertType = parts[1]; // "24h", "1h", "now"
  const launchId = parts[2];
  
  chrome.storage.local.get(["launchData"], (res) => {
    const launches = res.launchData || [];
    const launch = launches.find(l => String(l.id) === String(launchId));
    
    if (!launch) return;
    
    let title = "";
    let message = "";
    const company = launch.company_name || 'ISRO';
    
    if (alertType === "24h") {
      title = chrome.i18n.getMessage("notify_24h_title", [launch.mission_name]);
      message = chrome.i18n.getMessage("notify_24h_message", [company, launch.mission_name]);
    } else if (alertType === "1h") {
      title = chrome.i18n.getMessage("notify_1h_title", [launch.mission_name]);
      message = chrome.i18n.getMessage("notify_1h_message", [launch.mission_name, company]);
    } else if (alertType === "now") {
      title = chrome.i18n.getMessage("notify_now_title", [launch.mission_name]);
      message = chrome.i18n.getMessage("notify_now_message", [launch.mission_name]);
    }
    
    showNotificationOnce(`launch_alert_${alertType}_${launchId}`, {
      type: "basic",
      iconUrl: "icons/chopper_icon.png",
      title: title,
      message: message,
      priority: 2,
      requireInteraction: alertType === "now" // Require user dismissal for actual launch
    });
  });
}

// Helper to guarantee a notification is shown only once and at most once per 24 hours
function showNotificationOnce(notificationId, options) {
  chrome.storage.local.get(["sentNotifications", "lastNotificationTime"], (res) => {
    const sent = res.sentNotifications || [];
    if (sent.includes(notificationId)) {
      console.log(`Notification ${notificationId} has already been shown. Skipping.`);
      return;
    }
    
    const now = Date.now();
    const lastTime = res.lastNotificationTime || 0;
    const dayInMs = 24 * 60 * 60 * 1000;
    
    if (now - lastTime < dayInMs) {
      console.log(`Notification throttled. Last notification was shown less than 24 hours ago. ID: ${notificationId}`);
      return;
    }
    
    sent.push(notificationId);
    chrome.storage.local.set({ 
      sentNotifications: sent,
      lastNotificationTime: now
    }, () => {
      chrome.notifications.create(notificationId, options);
    });
  });
}
