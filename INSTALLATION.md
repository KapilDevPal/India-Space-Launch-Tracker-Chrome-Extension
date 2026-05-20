# 🛠️ Installation & Loading Guide — India Space Launch Tracker

This document provides complete instructions for developers and users to load the **India Space Launch Tracker** Chrome Extension locally in Google Chrome.

---

## 📋 Prerequisites

- **Google Chrome Browser** (or any Chromium-based browser like Brave, Edge, or Opera).
- Access to the extension directory: `/home/kapil-dev-pal/Desktop/school/crome extention/`.

---

## ⚡ Step 1: Load the Extension into Chrome

1. Launch your **Google Chrome** browser.
2. Navigate to the Extensions Management page by:
   - Typing `chrome://extensions` in the URL search bar and pressing **Enter**.
   - **OR** clicking on the Extensions puzzle icon in the top-right toolbar and selecting **Manage Extensions**.
3. Toggle the **"Developer mode"** switch on in the upper-right corner of the Extensions page.
4. Click on the **"Load unpacked"** button in the upper-left corner of the header.
5. In the file selection dialogue, navigate to and select the project folder:
   ```
   /home/kapil-dev-pal/Desktop/school/crome extention
   ```
6. Click **Select Folder** (or **Open**).

---

## 📌 Step 2: Pin the Action Button

For the best experience, pin the tracker so you can see live countdown action badges:

1. Click on the **Extensions puzzle piece icon** in the top-right toolbar of Chrome.
2. Find **"India Space Launch Tracker"** in the list.
3. Click the **Pin icon** 📌 next to it.
4. The tracker icon (with a circular space gradient and rocket symbol) will now be visible in your top toolbar.

---

## 🧪 Step 3: Verify & Test Features

Once loaded, you can test all features directly:

### 1. Main UI & Real-Time Countdowns
- Click the tracker icon to open the popup.
- The UI will load cached mockup data instantly and trigger a background fetch request from the space API.
- Verify that the countdown clock in the **Featured Next Launch** card ticks down every second.

### 2. Live Filters & Search
- Type a launch vehicle (e.g. `LVM3` or `Vikram`) in the search input to instantly filter results.
- Click on the chips (`ISRO`, `Skyroot`, `Agnikul`, `Pixxel`) to filter by specific flight providers.
- Click the **Star Icon** in the top-right corner to view only your favorited missions.

### 3. Detail Modals
- Click on the **Featured Card** or any item in the **Upcoming List**.
- A detailed overlay modal will float into view showing targets, dates, launch vehicle types, and flight overviews.

### 4. Background Sync & Console Logs
- Go back to `chrome://extensions` and look at the India Space Launch Tracker card.
- Click on the link next to **Inspect views** marked **`service worker`** (or `background page`).
- This will open the Chrome developer inspector panel for the extension background engine.
- Verify the recurring sync triggers (`[Background Fetch] Requesting space API`) and storage logs.
- You can manually trigger an alarm sync by going to the console and executing `fetchLaunchData()`.

### 5. Advanced Custom Settings
- Click the **Gear icon** ⚙️ in the popup top header.
- The developer settings modal will slide open.
- Verify that the default API Endpoint is pre-loaded: `https://space.veerexa.com/api/space/upcoming_launches`
- Enter your authenticated endpoint and custom Developer API Key:
  - **URL**: `https://space.veerexa.com/api/v1/upcoming_launches`
  - **Key**: `isro_live_7e96e0d26a773dec3256864c91f93681`
- Click **Save Configuration**. The extension will automatically connect to the authenticated endpoint, fetch the scheduled dataset, and update your UI.
