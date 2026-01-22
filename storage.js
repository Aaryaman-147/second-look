// /storage.js

const DEFAULT_DATA = {
  tabsOpenedToday: 0,
  peakTabsToday: 0,
  hourlyActivity: {},
  siteVisitsToday: {},
  siteLabels: {},
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
      ...DEFAULT_DATA,
      hasCompletedOnboarding: data?.hasCompletedOnboarding || false,
      lastResetDate: today
    };
  }

  data.siteVisitsToday ||= {};
  data.hourlyActivity ||= {};
  data.siteLabels ||= {};

  return data;
}
