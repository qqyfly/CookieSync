const SETTINGS_MENU_ID = 'cookiesync-open-settings';

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
