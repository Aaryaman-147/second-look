// utils/storage.js

const DEFAULT_DATA = {
  tabsOpenedToday: 0,
  peakTabsToday: 0,
  hourlyActivity: {},
  siteVisitsToday: {},
  lastResetDate: new Date().toDateString()
};

export function getData() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["secondLookData"], (result) => {
      resolve(result.secondLookData || DEFAULT_DATA);
    });
  });
}

export function setData(data) {
  chrome.storage.local.set({ secondLookData: data });
}

export function resetIfNewDay(data) {
  const today = new Date().toDateString();

  if (!data || data.lastResetDate !== today) {
    return {
      lastResetDate: today,
      tabsOpenedToday: 0,
      peakTabsToday: 0,
      siteVisitsToday: {},      // ✅ ALWAYS present
      hourlyActivity: {},       // ✅ ALWAYS present
      lastReflectionDate: null
    };
  }

  // 🔒 Ensure shape even on same day
  data.siteVisitsToday = data.siteVisitsToday || {};
  data.hourlyActivity = data.hourlyActivity || {};

  return data;
}
