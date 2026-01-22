// content.js

const DISTRACTING_SITES = [
  // Social
  "twitter.com", "x.com", "instagram.com", "facebook.com", "reddit.com", 
  "discord.com", "linkedin.com", "threads.net", "tiktok.com", "pinterest.com",
  
  // Entertainment
  "youtube.com", "netflix.com", "spotify.com", "primevideo.com", 
  "hulu.com", "disneyplus.com", "twitch.tv", "imdb.com",
  
  // Gaming
  "steamcommunity.com", "epicgames.com", "roblox.com",
  
  // Shopping
  "amazon.com", "amazon.in", "ebay.com", "flipkart.com", 
  "temu.com", "shein.com", "etsy.com"
];

function isDistracting(domain) {
  return DISTRACTING_SITES.some(site => domain.includes(site));
}

if (
  location.protocol.startsWith("chrome") ||
  location.protocol.startsWith("edge") ||
  location.protocol === "about:"
) {
  // Do nothing on internal pages
} else {
  initSecondLook();
}

function initSecondLook() {
  if (window.__secondLookChecked) return;
  window.__secondLookChecked = true;
  window.__secondLookPromptShown = false;

  const cssStyles = `
    .sl-overlay {
      all: initial;
      position: fixed;
      inset: 0;
      background: rgba(15, 17, 21, 0.65);
      backdrop-filter: blur(8px);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .sl-modal {
      all: initial;
      font-family: system-ui, -apple-system, sans-serif;
      background: #ffffff;
      color: #111;
      padding: 24px 28px;
      border-radius: 20px;
      width: 340px;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
      animation: sl-pop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      position: relative;
    }

    .sl-modal h3 {
      all: initial;
      font-family: inherit;
      display: block;
      margin: 0 0 10px;
      font-size: 18px;
      font-weight: 700;
      color: #111;
      letter-spacing: -0.02em;
    }

    .sl-modal p {
      all: initial;
      font-family: inherit;
      display: block;
      font-size: 15px;
      line-height: 1.5;
      color: #555;
      margin: 0 0 20px;
    }

    .sl-modal p b {
      font-weight: 600;
      color: #111;
    }

    .sl-actions {
      display: flex;
      gap: 12px;
      width: 100%;
    }

    .sl-btn {
      all: initial;
      font-family: inherit;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.1s, opacity 0.2s;
      text-align: center;
    }

    .sl-btn:active {
      transform: scale(0.96);
    }

    .sl-btn.primary {
      background: #111;
      color: #fff;
    }

    .sl-btn.danger {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .sl-btn.secondary {
      background: #f3f4f6;
      color: #111;
    }
    
    .sl-btn.danger:hover { background: #fecaca; }
    .sl-btn.secondary:hover { background: #e5e7eb; }
    .sl-btn.primary:hover { opacity: 0.9; }

    @keyframes sl-pop {
      from { transform: scale(0.94); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `;

  function createShadowContainer() {
    const existing = document.getElementById("second-look-host");
    if (existing) existing.remove();

    const host = document.createElement("div");
    host.id = "second-look-host";
    
    document.documentElement.appendChild(host);
    
    const shadow = host.attachShadow({ mode: "open" });
    
    const style = document.createElement("style");
    style.textContent = cssStyles;
    shadow.appendChild(style);
    
    return { host, shadow };
  }

  // --- Logic A: One Tab Rule ---
  function checkOneTabPrompt(retry = false) {
    chrome.runtime.sendMessage(
      { type: "CHECK_ONE_TAB_PROMPT" },
      (response) => {
        if (chrome.runtime.lastError) return;

        if (response?.shouldPrompt && !window.__secondLookPromptShown) {
          window.__secondLookPromptShown = true;
          showOneTabRulePrompt(response.tabCount);
          return;
        }
        if (!retry) {
          setTimeout(() => checkOneTabPrompt(true), 600);
        }
      }
    );
  }

  checkOneTabPrompt();

  function showOneTabRulePrompt(tabCount) {
    const { host, shadow } = createShadowContainer();

    const overlay = document.createElement("div");
    overlay.className = "sl-overlay";

    overlay.innerHTML = `
      <div class="sl-modal">
        <h3>One Tab Rule</h3>
        <p>
          You have <b>${tabCount}</b> tabs open.<br>
          Close this tab before opening another?
        </p>
        <div class="sl-actions">
          <button id="otr-keep" class="sl-btn secondary">Keep this tab</button>
          <button id="otr-close" class="sl-btn danger">Close this tab</button>
        </div>
      </div>
    `;

    shadow.appendChild(overlay);
    shadow.getElementById("otr-keep").onclick = () => host.remove();
    shadow.getElementById("otr-close").onclick = () => chrome.runtime.sendMessage({ type: "CLOSE_CURRENT_TAB" });
  }

  // --- Logic B: Second Look (Distracting Sites Only) ---
  const site = window.location.hostname.replace("www.", "");
  
  if (site) {
    chrome.runtime.sendMessage({ type: "SITE_VISIT", site }, (response) => {
      if (chrome.runtime.lastError) return;

      // GET SNOOZE DATA HERE
      chrome.storage.local.get(["oneTabRule", "snoozeUntil"], (data) => {
        if (data.oneTabRule) return;

        // 1. Check if Snooze is active. If so, exit.
        if (data.snoozeUntil && Date.now() < data.snoozeUntil) return;

        // 2. Only run for distracting sites
        if (!isDistracting(site)) return;

        const SITE_LIMIT = 3;
        if (!response || response.count <= SITE_LIMIT) return;
        if (window.__secondLookPromptShown) return;

        window.__secondLookPromptShown = true;

        const { host, shadow } = createShadowContainer();
        const overlay = document.createElement("div");
        overlay.className = "sl-overlay";

        overlay.innerHTML = `
          <div class="sl-modal">
            <h3>Second Look</h3>
            <p>
              You’ve opened <b>${getSiteName(site)}</b> ${response.count} times today.<br>
              This is your second look.
            </p>
            <div class="sl-actions">
              <button id="sl-continue" class="sl-btn secondary">Continue</button>
              <button id="sl-leave" class="sl-btn primary">Leave</button>
            </div>
          </div>
        `;

        shadow.appendChild(overlay);

        shadow.getElementById("sl-continue").onclick = () => host.remove();
        shadow.getElementById("sl-leave").onclick = () => history.back();
      });
    });
  }

  function getSiteName(domain) {
    return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
  }
}