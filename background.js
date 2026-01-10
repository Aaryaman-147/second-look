import { getData, setData, resetIfNewDay } from "./utils/storage.js";

/*
  Pull-based One Tab Rule state
*/
let pendingOneTabTabId = null;
let pendingOneTabTabCount = 0;

/* ----------------------------------
   TAB CREATION (stats + One Tab Rule)
---------------------------------- */
chrome.tabs.onCreated.addListener(async (tab) => {
  let data = await getData();
  data = resetIfNewDay(data);

  data.tabsOpenedToday += 1;

  const hour = new Date().getHours().toString();
  data.hourlyActivity[hour] = (data.hourlyActivity[hour] || 0) + 1;

  chrome.tabs.query({}, (tabs) => {
    data.peakTabsToday = Math.max(data.peakTabsToday, tabs.length);
    setData(data);

    chrome.storage.local.get("oneTabRule", ({ oneTabRule }) => {
      if (!oneTabRule) return;
      if (tabs.length <= 1) return;

      pendingOneTabTabId = tab.id;
      pendingOneTabTabCount = tabs.length;
    });
  });
});

/* ----------------------------------
   MESSAGE HANDLING
---------------------------------- */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  /* Site visit tracking */
  if (message.type === "SITE_VISIT") {
    (async () => {
      let data = await getData();
      data = resetIfNewDay(data);

      // 🔧 GUARANTEE SHAPE
      data.siteVisitsToday = data.siteVisitsToday || {};

      const site = message.site;
      data.siteVisitsToday[site] =
        (data.siteVisitsToday[site] || 0) + 1;

      setData(data);
      sendResponse({ count: data.siteVisitsToday[site] });
    })();

    return true;
  }

  /* One Tab Rule pull check */
  if (message.type === "CHECK_ONE_TAB_PROMPT") {
    const shouldPrompt = sender.tab?.id === pendingOneTabTabId;

    if (shouldPrompt) {
      pendingOneTabTabId = null;
    }

    sendResponse({
      shouldPrompt,
      tabCount: pendingOneTabTabCount
    });
    return true;
  }

  /* Reset when toggle is turned ON again */
  if (message.type === "RESET_ONE_TAB_RULE") {
    pendingOneTabTabId = null;
    pendingOneTabTabCount = 0;
    return;
  }

  /* Close current tab */
  if (message.type === "CLOSE_CURRENT_TAB") {
    if (sender.tab?.id) {
      chrome.tabs.remove(sender.tab.id);
    }
  }
});
