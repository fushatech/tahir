/**
 * @name background.js
 * @title Initialize extension & listen for user input via key commands
 * @description
 *   - On extension installation, create default local storage settings
 *   - On extension load, add listeners for key commands & sends appropriate messages to tab.js
        - Listens for "Alt+L", if detected, sends "reverse_status" message to tab.js
        - Listens for "Alt+K", if detected, sends "unblur_selected" message to tab.js
 */


/* On extension installation, create default local storage settings */
chrome.runtime.onInstalled.addListener (function(obj) {
  if (obj.reason === "install") {
    const settings = {'type': 'settings', 'status': true, 'images': true, 'videos': true, 'iframes': true, 'blurAmt': 20, 'grayscale': true, 'bgImages': true}
    chrome.storage.sync.set({'settings': settings})
  }
});


/* On extension load, add listeners for user key commands: Alt+K, Alt+L & send appropriate message to active tab */
chrome.commands.onCommand.addListener(function (command) {
    if (command === "reverse_status") {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    		chrome.tabs.sendMessage(tabs[0].id, {"message": "reverse_status"});  
		});
    }
    if (command === "unblur_selected") {
    	chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    		chrome.tabs.sendMessage(tabs[0].id, {"message": "reveal_selected"});  
		});
    }
});
