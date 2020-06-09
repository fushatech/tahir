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
browser.runtime.onInstalled.addListener (function(obj) {
  if (obj.reason === "install") {
    const settings = {'type': 'settings', 'status': true, 'images': true, 'videos': true, 'iframes': true, 'blurAmt': 20, 'grayscale': true, 'bgImages': true, 'ignoredDomains': []}
    browser.storage.sync.set({'settings': settings})
  }

  if (obj.reason === 'update') {
    browser.storage.sync.get(['settings'], function(storage) {
      settings = storage.settings
      if (!settings.ignoredDomains) { settings.ignoredDomains = []; }
      browser.storage.sync.set({'settings': settings})
    });   

    browser.storage.sync.set({'update': true})
    browser.browserAction.setIcon({path: 'assets/img/icon_update_128.png'})
  }

});


/* On extension load, add listeners for user key commands: Alt+K, Alt+L & send appropriate message to active tab */
browser.commands.onCommand.addListener(function (command) {
    if (command === "reverse_status") {
        browser.tabs.query({active: true, currentWindow: true}, function(tabs){
        browser.tabs.sendMessage(tabs[0].id, {"message": "reverse_status"});  
      });
    }
    if (command === "reverse_status_temp") {
        browser.tabs.query({active: true, currentWindow: true}, function(tabs){
        browser.tabs.sendMessage(tabs[0].id, {"message": "reverse_status_temp"});  
      });
    }
    if (command === "toggle_selected") {
      browser.tabs.query({active: true, currentWindow: true}, function(tabs){
        browser.tabs.sendMessage(tabs[0].id, {"message": "toggle_selected"});  
      });
    }
});