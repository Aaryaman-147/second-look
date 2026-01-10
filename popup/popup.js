document.addEventListener("DOMContentLoaded", () => {
  const darkToggle = document.getElementById("darkToggle");
  const oneTabRule = document.getElementById("oneTabRule");

  const tabsTodayEl = document.getElementById("tabsToday");
  const peakTabsEl = document.getElementById("peakTabs");
  const mostVisitedEl = document.getElementById("topSite");
  const heatmapEl = document.getElementById("heatmap");

  /* ----------------------------------
     Load settings
  ---------------------------------- */
  chrome.storage.local.get(
    ["darkMode", "oneTabRule"],
    ({ darkMode, oneTabRule: otr }) => {
      if (darkMode) {
        document.body.classList.add("dark");
        darkToggle.checked = true;
      }
      oneTabRule.checked = !!otr;
    }
  );

  darkToggle.addEventListener("change", () => {
    document.body.classList.toggle("dark");
    chrome.storage.local.set({ darkMode: darkToggle.checked });
  });

  oneTabRule.addEventListener("change", () => {
    chrome.storage.local.set({ oneTabRule: oneTabRule.checked }, () => {
      if (oneTabRule.checked) {
        chrome.runtime.sendMessage({ type: "RESET_ONE_TAB_RULE" });
      }
    });
  });

  /* ----------------------------------
     Load activity data
  ---------------------------------- */
  chrome.storage.local.get("secondLookData", ({ secondLookData }) => {
    if (!secondLookData) return;

    renderStats(secondLookData);
    renderHeatmap(secondLookData);
    maybeShowReflection(secondLookData);
  });

  /* ----------------------------------
     Render stats
  ---------------------------------- */
  function renderStats(data) {
  if (tabsTodayEl) {
    tabsTodayEl.textContent = data.tabsOpenedToday || 0;
  }

  if (peakTabsEl) {
    peakTabsEl.textContent = data.peakTabsToday || 0;
  }

  if (mostVisitedEl) {
    const site = getMostVisitedSite(data);
    mostVisitedEl.textContent = site
      ? `${site} (${data.siteVisitsToday[site]})`
      : "No repeats yet";
  }
}

  function getMostVisitedSite(data) {
    const visits = data.siteVisitsToday || {};
    const entries = Object.entries(visits);
    if (!entries.length) return null;
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  }

  /* ----------------------------------
     Heatmap
  ---------------------------------- */
  function renderHeatmap(data) {
  if (!heatmapEl) return;

  heatmapEl.innerHTML = "";

  const activity = data.hourlyActivity || {};
  const values = Object.values(activity);
  const max = values.length ? Math.max(...values) : 1;

  for (let h = 0; h < 24; h++) {
    const count = activity[h] || 0;
    const intensity = Math.round((count / max) * 180);

    const cell = document.createElement("div");
    cell.className = "hour";
    cell.title = `${h}:00 → ${count}`;
    cell.style.background = `rgb(${255 - intensity}, ${255 - intensity}, 255)`;

    heatmapEl.appendChild(cell);
  }
}

  /* ----------------------------------
     Daily reflection (after 9 PM, once)
  ---------------------------------- */
  function maybeShowReflection(data) {
    const now = new Date();
    const hour = now.getHours();
    const today = now.toDateString();

    if (hour < 21) return;
    if (data.lastReflectionDate === today) return;

    showReflection(data);

    chrome.storage.local.set({
      lastReflectionDate: today
    });
  }

  function showReflection(data) {
    const container = document.querySelector(".container");

    const reflection = document.createElement("div");
    reflection.className = "reflection-card";

    reflection.innerHTML = `
      <h4>Daily Reflection</h4>
      <p>
        Today, you opened <b>${data.tabsOpenedToday}</b> tabs and
        reached a peak of <b>${data.peakTabsToday}</b> simultaneous tabs.
      </p>
      <p class="muted">
        Most visited site: <b>${getMostVisitedSite(data) || "None yet"}</b>
      </p>
    `;

    container.appendChild(reflection);
  }
});
