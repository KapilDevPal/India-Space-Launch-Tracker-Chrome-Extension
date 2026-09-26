# 🚀 Indian Space Hub — Chrome Extension (Manifest V3)

A clean, fast Chrome Extension that tracks upcoming Indian space launches from the Indian Space Research Organisation (ISRO) and private Indian spaceflight companies (Skyroot Aerospace, Agnikul Cosmos, Pixxel, and more) in real time.

Powered by the **Veerexa Space API**, this extension delivers live telemetry, ticking countdowns, and launch alerts directly from your browser toolbar.

---

## 🌌 Core Features

1. **Home / Launches / Settings navigation**: A three-tab layout that puts the next launch, quick actions and upcoming missions on one screen, with a dedicated Launches tab for browsing and Settings for preferences.
2. **Precision Live Countdowns**: Monitors upcoming launches down to the second, automatically ticking in real-time on the home hero card and in every mission list.
3. **Light, Dark and System themes**: A CSS design-token system resolves the effective theme instantly (no restart) and follows the OS `prefers-color-scheme` setting when "System" is selected.
4. **Advanced Alarm & Notification System**:
   - Compares schedules to notify when a *new* space flight is registered.
   - Raises Chrome Notifications at critical windows: **24 Hours Before**, **1 Hour Before**, and at **Liftoff/Launch Time**.
   - Notifications can be scoped independently to 🇮🇳 Indian missions and 🌍 Global launches from Settings.
5. **Action Toolbar Badge**: Dynamically calculates the remaining days to the next launch (e.g. `3D`, `12D` or `Live`).
6. **Search & Region Filters**: Search by mission, rocket or provider, and filter the Launches list to All / 🇮🇳 India / 🌍 Global.
7. **Robust Offline Support**: Seeds and caches synced telemetry in `chrome.storage.local`, with a clear "offline / cached data" indicator when a sync fails.
8. **Progressive Mission Details**: A bottom-sheet modal shows rocket, provider, launch window and countdown up front, with description and orbit tucked behind an expandable "Mission Details" section.
9. **Accessible by default**: Semantic tab/tabpanel roles, labelled controls, visible focus states, and `prefers-reduced-motion` support.

---

## 🛠️ Technology Stack

- **Extension Framework**: Manifest V3
- **Layout & Structure**: HTML5 Semantic Architecture (tabbed screens, no build step)
- **Styling Core**: Vanilla CSS with a design-token system (`:root` custom properties, light/dark overrides) and the system font stack for fast, dependency-free startup
- **Programming Language**: Vanilla JavaScript (ES6+, modern `async/await`, dynamic Chrome Runtime Alarms, background messaging, Storage APIs)
- **Icons**: Pre-generated 16/48/128px PNGs

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
  - `theme`: UI theme preference (`system` (default), `light` or `dark`).
  - `apiUrl`: API Endpoint overrides.
  - `apiKey`: Custom Developer Authorization Key.
  - `remindersEnabled`: Boolean toggle controlling all alarm notifications.
  - `notifyIndia` / `notifyGlobal`: Booleans scoping notifications to Indian and/or Global launches.
  - `lastSyncTime`: String representing standard timestamp.

---

## 🛒 Chrome Web Store Specifications

### Extension Name:
> Indian Space Hub – ISRO Launch Tracker

### Short Description:
> Track upcoming Indian space launches from ISRO and private space companies with live countdown timers, mission alerts, and launch notifications.

### Detailed Web Store Description:
> Explore the new era of Indian space exploration! 🚀
> 
> Indian Space Hub brings the cosmos directly to your Chrome toolbar. Stay up to date with live countdowns, payload specifications, and orbital insertions from the Indian Space Research Organisation (ISRO) and pioneering private aerospace startups including Skyroot Aerospace, Agnikul Cosmos, Pixxel, and more!
> 
> Key Features:
> • Real-time T-Minus Countdown: Precision live timers updating every second for the next scheduled launch.
> • Action Badge Indicator: Displays the remaining days to the next launch on your Chrome action toolbar.
> • Chrome System Notifications: Get alerts exactly 24 hours before launch, 1 hour before liftoff, and at the exact launch time, scoped to Indian and/or Global missions.
> • Detailed Mission Specs: View launch vehicles, target orbits, and payload overviews.
> • Instant Search & Filter: Search by mission or rocket, and filter by 🇮🇳 India / 🌍 Global.
> • Light, Dark and System Themes: A clean, accessible interface that instantly follows your preference.
> • Offline Fallback: Instantly displays cached schedules even without an active internet connection.
> 
> Join the digital gateway tracking India's journeys to the stars! Simple, lightweight, secure, and entirely optimized for maximum performance.
# India-Space-Launch-Tracker-Chrome-Extension
