# 🚀 Indian Space Hub — Chrome Extension (Manifest V3)

A gorgeous, futuristic Chrome Extension built to track upcoming Indian space launches from the Indian Space Research Organisation (ISRO) and revolutionary private Indian spaceflight corporations (Skyroot Aerospace, Agnikul Cosmos, Pixxel, Bellatrix Aerospace, Dhruva Space, etc.) in real-time.

Powered by the **Veerexa Space API**, this extension delivers real-time live telemetry, mission counts, custom localized alarms, and ticking countdown timers directly to your browser bar.

---

## 🌌 Core Features

1. **Futuristic Space-Themed Dashboard**: Built on glassmorphism principles with glowing neon borders, customizable dark/light themes, and animated liftoff interactions.
2. **Precision Live Countdowns**: Monitors upcoming launches down to the millisecond, automatically ticking in real-time.
3. **Advanced Alarm & Notification System**:
   - Compares schedules to notify when a *new* space flight is registered.
   - Raises Chrome Notifications at critical windows: **24 Hours Before**, **1 Hour Before**, and at **Liftoff/Launch Time**.
4. **Action Toolbar Badge**: Dynamically calculates the remaining days to the next launch (e.g. `3D`, `12D` or `Live`) using dynamic colors.
5. **Interactive Controls & Search**: 
   - Instant filtering by launcher agencies (ISRO, Skyroot, Agnikul, Pixxel, etc.).
   - Search index to query by mission description, name, or launch vehicle.
6. **Robust Offline Support**: Seeds and caches synced telemetry in `chrome.storage.local`. Works beautifully with complete offline fallback support.
7. **Detailed Mission Modals**: Fluid overlay modules revealing launch sites, target orbits (LEO, GTO, Lunar), specific payloads, and vehicle details.
8. **Developer Mode settings**: Pre-filled out-of-the-box configuration with advanced overrides for custom URL endpoints and Developer API Keys.

---

## 🛠️ Technology Stack

- **Extension Framework**: Manifest V3
- **Layout & Structure**: HTML5 Semantic Architecture
- **Styling Core**: Pre-compiled custom Vanilla CSS (optimized with standard layout systems, CSS variables, glassmorphism, and HSL variables)
- **Programming Language**: Vanilla JavaScript (ES6+, modern `async/await`, dynamic Chrome Runtime Alarms, background messaging, Storage APIs)
- **Icons Generator**: Custom PIL Python Script drawing rocket telemetry vector layers

---

## 📁 File Structure

```
crome extention/
├── manifest.json         # Extension configuration (permissions, background, active popup)
├── popup.html            # Main UI layout structure and overlays
├── popup.js              # Real-time ticking timers, chips filter, favorites index, and events
├── background.js         # Persistent service worker handlingalarms, syncing, badge, and alerts
├── styles.css            # Custom futuristic HSL design tokens, glows, and keyframes
├── icons/                # High-contrast pixel-perfect png icons
│   ├── icon16.png        # Action item toolbar icon
│   ├── icon48.png        # Extension management page icon
│   └── icon128.png       # Install dialogue and Chrome Web Store icon
├── README.md             # Project roadmap and documentation
└── INSTALLATION.md       # Developer load and installation manual
```

---

## 📡 API Integration & Cache Structure

The extension fetches from the **Veerexa Space API** via the background service worker:
- **Default Endpoint**: `https://space.veerexa.com/api/space/upcoming_launches`
- **Fallback Authenticated URL**: `https://space.veerexa.com/api/v1/upcoming_launches`
- **Cached Objects** stored in `chrome.storage.local`:
  - `launchData`: Array of normalized upcoming space launches.
  - `favorites`: Array of favorited launch IDs.
  - `theme`: UI state (`dark` or `light`).
  - `apiUrl`: API Endpoint overrides.
  - `apiKey`: Custom Developer Authorization Key.
  - `remindersEnabled`: Boolean toggle controlling alarm notifications.
  - `lastSyncTime`: String representing standard timestamp.

---

## 🛒 Chrome Web Store Specifications

### Extension Name:
> Indian Space Hub

### Short Description:
> Track upcoming Indian space launches from ISRO and private space companies with live countdown timers, mission alerts, and launch notifications.

### Detailed Web Store Description:
> Explore the new era of Indian space exploration! 🚀
> 
> "Indian Space Hub" brings the cosmos directly to your Chrome toolbar. Stay up to date with real-time flight telemetry, ticking countdowns, payload specifications, and strategic orbital insertions from the Indian Space Research Organisation (ISRO) and pioneering private aerospace startups including Skyroot Aerospace, Agnikul Cosmos, Pixxel, and more!
> 
> Key Features:
> • Real-time T-Minus Countdown: Precision live timers updating every second for the next scheduled launch.
> • Action Badge Indicator: Displays the remaining days to the next launch on your Chrome action toolbar.
> • Chrome System Notifications: Get alerts exactly 24 hours before launch, 1 hour before liftoff, and at the exact launch time so you never miss a historic launch!
> • Detailed Mission Specs: View launch vehicles, target orbits, launch pads (SDSC Sriharikota, etc.), and complete payload overviews.
> • Instant Search & Filter: Group launches by your favorite agency (ISRO, Skyroot, Agnikul, Pixxel) or search for specific rockets (LVM3, PSLV, Vikram, Agnibaan).
> • Dark/Light Space Theme: Premium glassmorphic UI matching stunning sci-fi aesthetics with fluid animations.
> • Offline Fallback: Instantly displays cached schedules even without an active internet connection.
> 
> Join the digital gateway tracking India's journeys to the stars! Simple, lightweight, secure, and entirely optimized for maximum performance.

---

## 🔗 Project Links

- **Play Store App**: [https://space.veerexa.com/app](https://space.veerexa.com/app)
- **GitHub Repository**: [https://github.com/KapilDevPal/ISRO-Live-API](https://github.com/KapilDevPal/ISRO-Live-API)

# India-Space-Launch-Tracker-Chrome-Extension
