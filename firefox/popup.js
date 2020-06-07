/**
 * @name popup.js
 * @title Allow user to update GAB settings via popup modal
 * @description
 *   - Displays popup modal with current GAB settings
 *   - If user updates settings: (1) settings saved (2) updated settings sent to tab.js to update active tab blur CSS.
 *  
 */


/*------------------------------------------------------------------
  Initialize Defaults & Add Listeners
-------------------------------------------------------------------*/

var settings = null
var currentDomain = null

initPopup();


/*------------------------------------------------------------------
  Implementation -- Main Functions
-------------------------------------------------------------------*/
  
/* initPopup - (1) Gets local storage settings (2) After DOM load, displays settings in modal & adds listeners to receive user input */
function initPopup () {
  getSettings().then (function () {
   if (document.readyState === "complete" || "interactive") {
      displaySettings(settings)   
      addListeners() 
    }
    else {
      document.addEventListener("DOMContentLoaded", function () {
        displaySettings(settings)   
        addListeners()    
      })
    }
  })

  checkForUpdate().then (function (update_status) {
    if (update_status === true ) { 
      displayUpdate() 
    }
  })

}


/*------------------------------------------------------------------
  Implementation -- Helper Functions
-------------------------------------------------------------------*/

/* getSettings - (1) Gets local storage settings, (2) sets local settings var to local storage settings, (3) resolves promise when complete  */
function getSettings () {
  return new Promise(function(resolve) {
    browser.storage.sync.get(['settings'], function(storage) {
      settings = storage.settings
      resolve()
    });   
  });
}

function checkForUpdate () {
  return new Promise(function(resolve) {
    browser.storage.sync.get(['update'], function(storage) {
      resolve(storage.update)
    }); 
  })
}

/* displaySettings - Update popup modal with local storage settings */
function displaySettings (settings) {
  document.querySelector("input[name=status]").checked = settings.status
  document.querySelector("input[name=images]").checked = settings.images
  document.querySelector("input[name=bgimages]").checked = settings.bgImages
  document.querySelector("input[name=videos]").checked = settings.videos
  document.querySelector("input[name=iframes]").checked = settings.iframes
  document.querySelector("input[name=bluramt]").value = settings.blurAmt
  document.querySelector("span[name=bluramttext]").innerHTML = settings.blurAmt + "px"
  document.querySelector("input[name=grayscale]").checked = settings.grayscale


  browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var url = new URL(tabs[0].url)
    currentDomain = url.hostname

    var isWhitelisted = settings.ignoredDomains.indexOf(currentDomain) !== -1;

    document.querySelector('#current-domain').innerHTML = currentDomain;
    document.querySelector('#btn-whitelist-add').style.display = isWhitelisted ? 'none' : 'initial';
    document.querySelector('#btn-whitelist-remove').style.display = isWhitelisted ? 'initial' : 'none';
  });
}



/* addListeners - (1) Listen for changes to popup modal inputs (2) route to appropriate function  */
function addListeners () {
    document.querySelector("input[name=status]").addEventListener('change', updateStatus)
    document.querySelector("input[name=bluramt]").addEventListener('change', updateBluramt)
    document.querySelector("input[name=grayscale]").addEventListener('change', updateGrayscale)
    document.querySelector("input[name=images]").addEventListener('change', updateImages)
    document.querySelector("input[name=bgimages]").addEventListener('change', updateBGImages)
    document.querySelector("input[name=videos]").addEventListener('change', updateVideos)
    document.querySelector("input[name=iframes]").addEventListener('change', updateIframes)
    document.querySelector("div[name=readmore]").addEventListener('click', loadFullUpdateMessage)
    document.querySelector("div[name=dismiss]").addEventListener('click', dismissUpdate)
    document.querySelector("#btn-whitelist-add").addEventListener('click', addToWhitelist)
    document.querySelector("#btn-whitelist-remove").addEventListener('click', removeFromWhitelist)
}


/* updateStatus - (1) Update "status" settings with user input (2) save settings (3) send updated settings to tab.js to modify active tab blur css */
function updateStatus () {
    settings.status = document.querySelector("input[name=status]").checked
    browser.storage.sync.set({"settings": settings}) 
    sendUpdatedSettings()
}


/* updateBlurAmt - (1) Update "bluAmt" settings with user input (2) display updated blurAmt on popup modal (3) save settings (4) send updated settings to tab.js to modify active tab blur css */
function updateBluramt () {
  settings.blurAmt = document.querySelector("input[name=bluramt]").value
  document.querySelector("span[name=bluramttext]").innerHTML = settings.blurAmt + "px"
  browser.storage.sync.set({"settings": settings}) 
  sendUpdatedSettings()
}


/* updateGrayscale - (1) Update "grayscale" settings with user input (2) save settings (3) send updated settings to tab.js to modify active tab blur css */
function updateGrayscale () {
    settings.grayscale = document.querySelector("input[name=grayscale]").checked
    browser.storage.sync.set({"settings": settings}) 
    sendUpdatedSettings()
}


/* updateStatus - (1) Update "images" settings with user input (2) save settings (3) send updated settings to tab.js to modify active tab blur css */
function updateImages () {
    settings.images = document.querySelector("input[name=images]").checked
    browser.storage.sync.set({"settings": settings}) 
    sendUpdatedSettings()
}


/* updateStatus - (1) Update "videos" settings with user input (2) save settings (3) send updated settings to tab.js to modify active tab blur css */
function updateVideos () {
    settings.videos = document.querySelector("input[name=videos]").checked
    browser.storage.sync.set({"settings": settings})   
    sendUpdatedSettings()
}


/* updateStatus - (1) Update "iframes" settings with user input (2) save settings (3) send updated settings to tab.js to modify active tab blur css */
function updateIframes () {
    settings.iframes = document.querySelector("input[name=iframes]").checked
    browser.storage.sync.set({"settings": settings})   
    sendUpdatedSettings()
}


/* updateBgImages - (1) Update "iframes" settings with user input (2) save settings (3) send updated settings to tab.js to modify active tab blur css */
function updateBGImages () {
    settings.bgImages = document.querySelector("input[name=bgimages]").checked
    browser.storage.sync.set({"settings": settings})   
    sendUpdatedSettings()
}


/* sendUpdatedSettings - Send updated settings object to tab.js to modify active tab blur CSS */
function sendUpdatedSettings () {
    browser.tabs.query({currentWindow: true, active: true}, function (tabs){
    var activeTab = tabs[0];
    browser.tabs.sendMessage(activeTab.id, {"message": settings});
   });
}


function displayUpdate() {
  document.getElementById('update').style.display = "block"
}

function loadFullUpdateMessage () {
  browser.tabs.create({url: browser.extension.getURL('update.html')});
}

function dismissUpdate () {
  browser.storage.sync.set({'update': false})
  browser.browserAction.setIcon({path: 'assets/img/icon128.png'})
  document.getElementById('update').style.display = "none" 
}

/* addToWhitelist - (1) Adds current domain to ignored domain list */
function addToWhitelist(e) {
    e.preventDefault();
    settings.ignoredDomains.push(currentDomain)
    document.querySelector('#btn-whitelist-add').style.display = 'none';
    document.querySelector('#btn-whitelist-remove').style.display = 'initial';
    browser.storage.sync.set({"settings": settings});
    sendUpdatedSettings();
}

/* removeFromWhitelist - (1) Removes current domain from ignored domain list */
function removeFromWhitelist(e) {
    e.preventDefault();
    settings.ignoredDomains = settings.ignoredDomains.filter(function(d) {
        return d !== currentDomain
    });
    document.querySelector('#btn-whitelist-add').style.display = 'initial';
    document.querySelector('#btn-whitelist-remove').style.display = 'none';
    browser.storage.sync.set({"settings": settings});
    sendUpdatedSettings();
}
