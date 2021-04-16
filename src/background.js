const menuItemPrefix = 'incognito_';

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
        () => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
          }
        }
      );
    }
  );
}

function createContextMenu(target, title) {
  if (target !== 'page' &&
    target !== 'link' &&
    target !== 'selection') {
    return console.error(getTranslation('unsupported_target', 'Unsupported target!'));
  }

  chrome.contextMenus.create(
    {
      id: `${menuItemPrefix}${target}`,
      title: title,
      contexts: [target]
    },
    () => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
      }
    }
  );
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.commands.onCommand.addListener((command, tab) => {
    if (command === 'incognito') {
      openInIncognito(tab.url);
    }
  });

  chrome.action.onClicked.addListener(tab => {
    openInIncognito(tab.url);
  });

  chrome.contextMenus.onClicked.addListener((info, tab) => {
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
  });

  const contextMenuMessagePrefix = 'context_menu_open_';

  createContextMenu('page', getTranslation(`${contextMenuMessagePrefix}page_in_incognito`, 'Open Page in Incognito'));
  createContextMenu('link', getTranslation(`${contextMenuMessagePrefix}link_in_incognito`, 'Open Link in Incognito'));
  createContextMenu('selection', getTranslation(`${contextMenuMessagePrefix}selection_in_incognito`, 'Open %s in Incognito'));
});