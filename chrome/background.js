/**
 * @name background.js
 * @title Initialize extension & listen for user input via key commands
 * @description
 *   - On extension installation, create default local storage settings
 *   - On extension load, add listeners for key commands & sends appropriate messages to tab.js
        - Listens for "Alt+L", if detected, sends "reverse_status" message to tab.js
        - Listens for "Alt+K", if detected, sends "toggle_selected" message to tab.js
 */


/* On extension installation, create default local storage settings. On extension update, ensure settings.ignoredDomains exists (update 1.0.4) set update to true in local storage. */
chrome.runtime.onInstalled.addListener (function(obj) {
  if (obj.reason === "install") {
    const settings = {'type': 'settings', 'status': true, 'images': true, 'videos': true, 'iframes': true, 'blurAmt': 20, 'grayscale': true, 'bgImages': true, 'ignoredDomains': []}
    chrome.storage.sync.set({'settings': settings})
  }

  if (obj.reason === 'update') {
    chrome.storage.sync.get(['settings'], function(storage) {
      settings = storage.settings
      if (!settings.ignoredDomains) { settings.ignoredDomains = []; }
      chrome.storage.sync.set({'settings': settings})
    });   

    chrome.storage.sync.set({'update': true})
    chrome.action.setIcon({path: 'assets/img/icon_update_128.png'})
  }

});


/* On extension load, add listeners for user key commands: Alt+K, Alt+L & send appropriate message to active tab */
chrome.commands.onCommand.addListener(function (command) {
  if (command === "reverse_status") {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
      chrome.tabs.sendMessage(tabs[0].id, {"message": "reverse_status"}).catch(() => {
              console.log('Error sending message to tab.js');
          });
    });
  }
  if (command === "toggle_selected") {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
      chrome.tabs.sendMessage(tabs[0].id, {"message": "toggle_selected"}).catch(() => {
              console.log('Error sending message to tab.js');
          });
      });
  }
});
