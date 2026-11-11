import { readSiteCookies, readSiteListCookies } from '../cookies/cookies';

const SETTINGS_MENU_ID = 'cookiesync-open-settings';

// Expose on service worker global scope for DevTools console testing
Object.assign(globalThis, {
  readSiteCookies,
  readSiteListCookies,
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: SETTINGS_MENU_ID,
      title: 'Settings',
      contexts: ['action'],
    });
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === SETTINGS_MENU_ID) {
    void chrome.tabs.create({
      url: chrome.runtime.getURL('src/pages/settings/index.html'),
    });
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'READ_SITE_LIST_COOKIES') {
    void readSiteListCookies().then((results) => {
      sendResponse({ success: true, results });
    });
    return true; // Keep message channel open for async response
  }
});
