import { getData, setData, resetIfNewDay } from "./storage.js";

chrome.tabs.onCreated.addListener(async (tab) => {
  let data = await getData();
  data = resetIfNewDay(data);

  data.tabsOpenedToday += 1;

  const hour = new Date().getHours().toString().padStart(2, "0");
  data.hourlyActivity[hour] = (data.hourlyActivity[hour] || 0) + 1;

  chrome.tabs.query({}, (tabs) => {
    data.peakTabsToday = Math.max(data.peakTabsToday, tabs.length);
    setData(data);

    chrome.storage.local.get("oneTabRule", ({ oneTabRule }) => {
      if (!oneTabRule) return;
      if (tabs.length <= 1) return;

      chrome.storage.session.set({
        pendingOneTabTabId: tab.id,
        pendingOneTabTabCount: tabs.length
      });
    });
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.type === "SITE_VISIT") {

    (async () => {
      let data = await getData();
      data = resetIfNewDay(data);

      data.siteVisitsToday = data.siteVisitsToday || {};

      const site = message.site;
      data.siteVisitsToday[site] = (data.siteVisitsToday[site] || 0) + 1;

      await setData(data);
      sendResponse({ count: data.siteVisitsToday[site] });
    })();

    return true; 
  }

  if (message.type === "CHECK_ONE_TAB_PROMPT") {

    chrome.storage.session.get(["pendingOneTabTabId", "pendingOneTabTabCount"], (result) => {
      const pendingId = result.pendingOneTabTabId;
      const count = result.pendingOneTabTabCount || 0;
      
      const shouldPrompt = sender.tab?.id === pendingId;

      if (shouldPrompt) {

        chrome.storage.session.remove(["pendingOneTabTabId", "pendingOneTabTabCount"]);
      }

      sendResponse({
        shouldPrompt,
        tabCount: count
      });
    });
    return true; 
  }

  if (message.type === "RESET_ONE_TAB_RULE") {
    chrome.storage.session.remove(["pendingOneTabTabId", "pendingOneTabTabCount"]);
    return;
  }

  if (message.type === "CLOSE_CURRENT_TAB") {
    if (sender.tab?.id) {
      chrome.tabs.remove(sender.tab.id);
    }
  }
});