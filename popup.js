document.addEventListener("DOMContentLoaded", () => {
  const welcomeEl = document.getElementById("welcome");
  const appEl = document.getElementById("app");
  const startBtn = document.getElementById("startBtn");

  const tabsTodayEl = document.getElementById("tabsToday");
  const peakTabsEl = document.getElementById("peakTabs");
  const topSiteEl = document.getElementById("topSite");
  const heatmapEl = document.getElementById("heatmap");
  const wrappedEl = document.getElementById("wrapped");

  const focusScoreEl = document.getElementById("focusScore");
  const focusHintEl = document.getElementById("focusHint");
  const focusCardEl = document.querySelector(".focus");

  const darkToggleBtn = document.getElementById("darkToggleBtn");
  const siteCategoryEl = document.getElementById("siteCategory");
  const oneTabToggleBtn = document.getElementById("oneTabToggleBtn");
  const snoozeBtn = document.getElementById("snoozeBtn"); // NEW

  // --- DARK MODE ---
  chrome.storage.local.get("darkMode", ({ darkMode }) => {
    if (darkMode) {
      document.body.classList.add("dark");
      darkToggleBtn?.classList.add("active");
    }
  });

  darkToggleBtn?.addEventListener("click", () => {
    const active = darkToggleBtn.classList.toggle("active");
    document.body.classList.toggle("dark", active);
    chrome.storage.local.set({ darkMode: active });
  });

  // --- ONE TAB RULE ---
  chrome.storage.local.get("oneTabRule", ({ oneTabRule }) => {
    if (oneTabRule) {
      oneTabToggleBtn?.classList.add("active");
    }
  });

  oneTabToggleBtn?.addEventListener("click", () => {
    const active = oneTabToggleBtn.classList.toggle("active");
    chrome.storage.local.set({ oneTabRule: active });
  });

  // --- SNOOZE LOGIC (NEW) ---
  function updateSnoozeUI() {
    chrome.storage.local.get("snoozeUntil", ({ snoozeUntil }) => {
      const now = Date.now();
      const isActive = snoozeUntil && snoozeUntil > now;

      if (isActive) {
        snoozeBtn.classList.add("active");
        const minutesLeft = Math.ceil((snoozeUntil - now) / 60000);
        snoozeBtn.textContent = `💤 On (${minutesLeft}m)`;
      } else {
        snoozeBtn.classList.remove("active");
        snoozeBtn.textContent = "💤 Snooze 1h";
      }
    });
  }

  // Check immediately on load
  updateSnoozeUI();
  // Update every minute while popup is open so the countdown works
  setInterval(updateSnoozeUI, 60000);

  snoozeBtn?.addEventListener("click", () => {
    chrome.storage.local.get("snoozeUntil", ({ snoozeUntil }) => {
      const now = Date.now();
      
      // If active, turn it OFF
      if (snoozeUntil && snoozeUntil > now) {
        chrome.storage.local.set({ snoozeUntil: null }, updateSnoozeUI);
      } else {
        // If inactive, turn it ON for 1 hour (3600000 ms)
        chrome.storage.local.set({ snoozeUntil: now + 3600000 }, updateSnoozeUI);
      }
    });
  });

  // --- DATA LOADING ---
  chrome.storage.local.get("secondLookData", ({ secondLookData }) => {
    if (!secondLookData?.hasCompletedOnboarding) {
      welcomeEl.classList.remove("hidden");
      appEl.classList.add("hidden");
      return;
    }

    welcomeEl.classList.add("hidden");
    appEl.classList.remove("hidden");
    render(secondLookData);
  });

  startBtn?.addEventListener("click", () => {
    chrome.storage.local.get("secondLookData", ({ secondLookData }) => {
      secondLookData ||= {};
      secondLookData.hasCompletedOnboarding = true;

      chrome.storage.local.set({ secondLookData }, () => {
        welcomeEl.classList.add("hidden");
        appEl.classList.remove("hidden");
        render(secondLookData);
      });
    });
  });

  function render(data) {
    animateNumber(tabsTodayEl, data.tabsOpenedToday || 0);
    animateNumber(peakTabsEl, data.peakTabsToday || 0);

    const site = getMostVisitedSite(data);
    const category = site ? getSiteCategory(site) : null;

    topSiteEl.textContent = site ? getSiteName(site) : "—";
    topSiteEl.className = "value";

    if (siteCategoryEl) {
      if (category) {
        siteCategoryEl.textContent = category;
        siteCategoryEl.className = `category-badge ${category}`;
      } else {
        siteCategoryEl.textContent = "—";
        siteCategoryEl.className = "category-badge";
      }
    }

    renderFocusScore(data);
    renderWrapped(data);
    renderHeatmap(data);
  }

  function renderFocusScore(data) {
    if (!focusScoreEl || !focusCardEl || !focusHintEl) return;

    const score = computeFocusScore(data);
    focusScoreEl.textContent = score;

    const ring = document.querySelector(".focus-ring");
    if (ring) {
      const percent = (score / 100) * 360;
      ring.style.setProperty("--percent", `${percent}deg`);
    }

    focusCardEl.classList.remove("good", "ok", "bad");

    if (score >= 75) {
      focusCardEl.classList.add("good");
      focusHintEl.textContent = "Strong focus today";
      ring?.style.setProperty("--ring-color", "#22d3ee");
    } else if (score >= 45) {
      focusCardEl.classList.add("ok");
      focusHintEl.textContent = "Mixed attention";
      ring?.style.setProperty("--ring-color", "#a855f7");
    } else {
      focusCardEl.classList.add("bad");
      focusHintEl.textContent = "High distraction";
      ring?.style.setProperty("--ring-color", "#ec4899");
    }
  }

  function renderWrapped(data) {
    const busiestHour = Object.entries(data.hourlyActivity || {})
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    wrappedEl.innerHTML = `
      <div class="stat full wrapped">
        <span class="label">Today at a glance</span>
        <span class="value">
          🔁 ${getSiteName(getMostVisitedSite(data)) || "—"} ·
          🧭 ${data.tabsOpenedToday} tabs ·
          ⏰ ${busiestHour !== undefined ? busiestHour + ":00" : "—"}
        </span>
      </div>
    `;
  }

  function renderHeatmap(data) {
    if (!heatmapEl) return;

    heatmapEl.innerHTML = "";
    const activity = data.hourlyActivity || {};

    for (let h = 0; h < 24; h++) {
      const count = activity[h.toString()] || 0;

      const cell = document.createElement("div");
      cell.className = "hour";
      cell.title = `${h}:00 → ${count}`;

      let color = "rgba(60,60,70,0.35)";
      let glow = "none";

      if (count === 0) {
        color = "rgba(60,60,70,0.35)";
      } else if (count <= 2) {
        color = "#22d3ee";
        glow = "0 0 6px rgba(34,211,238,0.6)";
      } else if (count <= 5) {
        color = "#a855f7";
        glow = "0 0 8px rgba(168,85,247,0.7)";
      } else {
        color = "#ec4899";
        glow = "0 0 10px rgba(236,72,153,0.8)";
      }

      cell.style.background = color;
      cell.style.boxShadow = glow;
      heatmapEl.appendChild(cell);
    }
  }

  function animateNumber(el, value) {
    let current = 0;
    const step = Math.max(1, Math.floor(value / 20));
    const interval = setInterval(() => {
      current += step;
      if (current >= value) {
        el.textContent = value;
        clearInterval(interval);
      } else {
        el.textContent = current;
      }
    }, 20);
  }

  function getMostVisitedSite(data) {
    const entries = Object.entries(data.siteVisitsToday || {});
    if (!entries.length) return null;
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  }
});


const SITE_CATEGORIES = {
  "coding": [
  "github.com", "gitlab.com", "bitbucket.org", "stackoverflow.com", "stackexchange.com",
  "chat.openai.com", "codepen.io", "jsfiddle.net", "replit.com", "codesandbox.io",
  "vercel.com", "netlify.com", "render.com", "railway.app", "leetcode.com",
  "hackerrank.com", "codeforces.com", "atcoder.jp", "npmjs.com", "pypi.org",
  "developer.mozilla.org", "w3schools.com"
  ],
  "learning": [
  "coursera.org", "udemy.com", "edx.org", "khanacademy.org", "medium.com",
  "dev.to", "towardsdatascience.com", "freecodecamp.org", "geeksforgeeks.org",
  "arxiv.org", "substack.com", "hashnode.com"
  ],
  "social": [
  "twitter.com", "x.com", "instagram.com", "facebook.com", "reddit.com",
  "discord.com", "linkedin.com", "threads.net", "news.ycombinator.com", "quora.com"
  ],
  "entertainment": [
  "youtube.com", "netflix.com", "open.spotify.com",
  "primevideo.com", "hotstar.com", "imdb.com", "soundcloud.com", "crunchyroll.com", "letterboxd.com"
  ],
  "gaming": [
  "twitch.tv", "store.steampowered.com", "epicgames.com", "playvalorant.com",
  "riotgames.com", "battle.net", "itch.io", "tracker.gg"
  ],
  "shopping": [
  "amazon.com", "amazon.in", "flipkart.com", "ebay.com", "myntra.com",
  "ajio.com", "meesho.com", "aliexpress.com"
  ],
  "news": [
  "bbc.com", "theguardian.com", "nytimes.com", "indiatimes.com", "theverge.com"
  ]
};

const CATEGORY_WEIGHTS = {
  coding: 3,
  learning: 2,
  other: 0,
  shopping: -1,
  social: -2,
  entertainment: -2,
  gaming: -3
};

function getSiteCategory(domain) {
  if (!domain) return "other";
  domain = domain.replace(/^www\./, "").replace(/^m\./, "");

  for (const [category, sites] of Object.entries(SITE_CATEGORIES)) {
    if (sites.some(site => domain.includes(site))) {
      return category;
    }
  }
  return "other";
}

function getSiteName(domain) {
  if (!domain) return null;

  domain = domain.replace(/^www\./, "").replace(/^m\./, "");

  const map = {
    "youtube.com": "YouTube",
    "instagram.com": "Instagram",
    "facebook.com": "Facebook",
    "twitter.com": "Twitter",
    "x.com": "X",
    "reddit.com": "Reddit",
    "github.com": "GitHub",
    "stackoverflow.com": "Stack Overflow",
    "chat.openai.com": "ChatGPT",
    "notion.so": "Notion",
    "netflix.com": "Netflix",
    "open.spotify.com": "Spotify",
    "amazon.com": "Amazon",
    "amazon.in": "Amazon"
  };

  if (map[domain]) return map[domain];

  return domain
    .replace(".com", "")
    .replace(".org", "")
    .replace(".net", "")
    .replace(/^\w/, c => c.toUpperCase());
}

function computeFocusScore(data) {
  let score = 100;
  const visits = data.siteVisitsToday || {};

  for (const [site, count] of Object.entries(visits)) {
    const category = getSiteCategory(site);
    const weight = CATEGORY_WEIGHTS[category] ?? 0;

    score += weight * count;

    if (count > 3) {
      score -= (count - 3) * 2;
    }
  }

  if (data.tabsOpenedToday > 30) score -= 10;
  if (data.peakTabsToday > 10) score -= 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}