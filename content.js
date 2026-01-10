// content.js
(() => {
  // Prevent multiple runs on same page
  if (window.__secondLookChecked) return;
  window.__secondLookChecked = true;

  // Global prompt lock (only ONE overlay per page load)
  window.__secondLookPromptShown = false;

  /* ----------------------------------
     Inject shared styles (once)
  ---------------------------------- */
  const style = document.createElement("style");
  style.textContent = `
    .sl-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 17, 21, 0.55);
      backdrop-filter: blur(6px);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .sl-modal {
      background: #ffffff;
      color: #111;
      padding: 22px 24px;
      border-radius: 18px;
      width: 320px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.25);
      font-family: system-ui, sans-serif;
      animation: sl-pop 0.25s ease;
    }

    .sl-modal h3 {
      margin: 0 0 8px;
      font-size: 16px;
    }

    .sl-modal p {
      font-size: 14px;
      line-height: 1.5;
      color: #444;
      margin-bottom: 16px;
    }

    .sl-actions {
      display: flex;
      gap: 10px;
    }

    .sl-actions button {
      flex: 1;
      padding: 8px 10px;
      border-radius: 10px;
      border: none;
      font-size: 13px;
      cursor: pointer;
      background: #f3f4f6;
    }

    .sl-actions button:hover {
      background: #e5e7eb;
    }

    .sl-actions .danger {
      background: #fee2e2;
      color: #991b1b;
    }

    @keyframes sl-pop {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  /* ----------------------------------
     ONE TAB RULE (PULL-BASED, STABLE)
  ---------------------------------- */
  function checkOneTabPrompt(retry = false) {
  chrome.runtime.sendMessage(
    { type: "CHECK_ONE_TAB_PROMPT" },
    (response) => {
      if (response?.shouldPrompt && !window.__secondLookPromptShown) {
  window.__secondLookPromptShown = true;
  showOneTabRulePrompt(response.tabCount);

        return;
      }

      // Retry once after a short delay (fixes toggle race)
      if (!retry) {
  setTimeout(() => checkOneTabPrompt(true), 600);
}
    }
  );
}

// Initial check
checkOneTabPrompt();


  function showOneTabRulePrompt(tabCount) {
    const overlay = document.createElement("div");
    overlay.className = "sl-overlay";

    const modal = document.createElement("div");
    modal.className = "sl-modal";

    modal.innerHTML = `
      <h3>One Tab Rule</h3>
      <p>
  You already have <b>${tabCount}</b> tabs open.<br>
  Close this tab before opening another?
</p>
      <div class="sl-actions">
        <button id="otr-keep">Keep this tab</button>
        <button id="otr-close" class="danger">Close this tab</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    document.getElementById("otr-keep").onclick = () => {
      overlay.remove();
    };

    document.getElementById("otr-close").onclick = () => {
      chrome.runtime.sendMessage({ type: "CLOSE_CURRENT_TAB" });
    };
  }

  /* ----------------------------------
     SITE REVISIT PROMPT (Second Look)
     Skipped if One Tab Rule triggered
  ---------------------------------- */
  chrome.storage.local.get("oneTabRule", ({ oneTabRule }) => {
    if (oneTabRule) return;

    const SITE_LIMIT = 3;
    const site = window.location.hostname.replace("www.", "");

    chrome.runtime.sendMessage(
      { type: "SITE_VISIT", site },
      (response) => {
        if (!response || response.count <= SITE_LIMIT) return;
        if (window.__secondLookPromptShown) return;

        window.__secondLookPromptShown = true;

        const overlay = document.createElement("div");
        overlay.className = "sl-overlay";

        const modal = document.createElement("div");
        modal.className = "sl-modal";

        modal.innerHTML = `
          <h3>Second Look</h3>
          <p>
            You’ve opened <b>${site}</b> ${response.count} times today.<br>
            This is your second look.
          </p>
          <div class="sl-actions">
            <button id="sl-continue">Continue</button>
            <button id="sl-leave" class="danger">Leave</button>
          </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        document.getElementById("sl-continue").onclick = () => {
          overlay.remove();
        };

        document.getElementById("sl-leave").onclick = () => {
          history.back();
        };
      }
    );
  });
})();
