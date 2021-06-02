function openInIncognito(url) {
  chrome.windows.getCurrent(
    win => {
      chrome.windows.create(
        {
          url: url,
          top: win.top,
          left: win.left,
          width: win.width,
          height: win.height,
          incognito: true,
          focused: true
        },
        handleLastError
      );
    }
  );
}

function handleLastError() {
  if (chrome.runtime.lastError) {
    console.error(chrome.runtime.lastError.message);
  }
}

function getTranslation(key, fallback) {
  // Due a Chrome bug chrome.i18n.getMessage is not available for Manifest V3
  // https://bugs.chromium.org/p/chromium/issues/detail?id=1159438
  if (chrome.i18n && chrome.i18n.getMessage) {
    return chrome.i18n.getMessage(key);
  }
  else {
    return fallback;
  }
}

const menuItemPrefix = 'incognito_';

function createContextMenu(target, title) {
  if (target !== 'page' &&
    target !== 'link' &&
    target !== 'selection') {
    return console.error('Unsupported target:', target);
  }

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create(
      {
        id: `${menuItemPrefix}${target}`,
        title: title,
        contexts: [target]
      },
      handleLastError
    );
  });
}

function handleCommand(command, tab) {
  if (command === 'incognito') {
    openInIncognito(tab.url);
  }
}

function handleAction(tab) {
  openInIncognito(tab.url);
}

function handleContextMenu(info) {
  let url;

  switch (info.menuItemId) {
    case `${menuItemPrefix}page`:
      url = info.pageUrl;
      break;

    case `${menuItemPrefix}link`:
      url = info.linkUrl;
      break;

    case `${menuItemPrefix}selection`:
      const selection = info.selectionText && info.selectionText.trim();

      if (!selection) {
        url = info.pageUrl;
      }
      else if (selection.startsWith('http://') ||
        selection.startsWith('https://') ||
        selection.startsWith('file://')) {
        url = selection;
      }
      else {
        url = `https://www.google.com/search?q=${selection}`;
      }

      break;
  }

  openInIncognito(url);
}

function register() {
  if (!chrome.commands.onCommand.hasListener(handleCommand)) {
    chrome.commands.onCommand.addListener(handleCommand);
  }

  if (!chrome.action.onClicked.hasListener(handleAction)) {
    chrome.action.onClicked.addListener(handleAction);
  }

  if (!chrome.contextMenus.onClicked.hasListener(handleContextMenu)) {
    chrome.contextMenus.onClicked.addListener(handleContextMenu);
  }

  const contextMenuMessagePrefix = 'context_menu_open_';

  createContextMenu('page', getTranslation(`${contextMenuMessagePrefix}page_in_incognito`, 'Open Page in Incognito'));
  createContextMenu('link', getTranslation(`${contextMenuMessagePrefix}link_in_incognito`, 'Open Link in Incognito'));
  createContextMenu('selection', getTranslation(`${contextMenuMessagePrefix}selection_in_incognito`, 'Open %s in Incognito'));
}

chrome.runtime.onInstalled.addListener(() => {
  register();

  console.log('Extension registered after install/update.');
});

chrome.management.onEnabled.addListener(info => {
  chrome.management.getSelf(extensionSelf => {
    if (info.id === extensionSelf.id) {
      register();

      console.log('Extension registered after re-enable.');
    }
  });
});
