/**
 * @name tab.js
 * @title Modify DOM of active tab
 * @description
 * 	 - On tab load: (1) loads local storage settings & (2) generates & applies blur CSS
 *   - Listens to popup.js (popup modal) & background.js (key commands) for updates & modifies blur CSS as needed.
 *
 *
 *	Extension Features
 *		1. By default, all images, videos, iframes for all websites are blurred 
 *		2. Selectively reveal an image, video, iframe. 		
 *		3. Turn off default blurring (via: popup, key command)
 *		4. Customize blurring (bluramt, grayscale, img, video, iframe)
 *
 */



/*------------------------------------------------------------------
  Initialize Defaults & Add Listeners
-------------------------------------------------------------------*/
 
var settings = null

initTab()



/*------------------------------------------------------------------
  Implementation -- Main Wrapper Function
-------------------------------------------------------------------*/

/* initTab - On document start: (1) gets local storage settings (2) generates & applies blur CSS (3) sets up listeners to receive and act on messages from popup.js/background.js */ 
function initTab () {
	getSettings().then (function () {
		if (settings.status === true) { injectBlurCSS() } 
		addListeners() 
	})
}



/*------------------------------------------------------------------
  Implementation -- Helper Functions 
-------------------------------------------------------------------*/

/* getSettings - (1) Gets local storage settings, (2) sets local settings var to local storage settings, (3) resolves promise when complete  */
function getSettings () {
	return new Promise(function(resolve) {
		chrome.storage.sync.get(['settings'], function(storage) {
			settings = storage.settings
			resolve()
		});		
	});
}


/* addListeners - (1) adds message listeners to receive specific messages from popup.js (popup modal) & background.js (key commands) & (2) routes to appropriate functions on receipt */
function addListeners () {
	chrome.runtime.onMessage.addListener(
	  function(request, sender, sendResponse) {
	    if (request.message === 'reverse_status') { reverseStatus() }
	    else if (request.message === 'reveal_selected') { revealSelected() }
	    else if (request.message.type === 'settings') { updateCSS(request.message) }
	  }
	);	
}


/* injectBlurCSS - Appends generated blur CSS to head */
function injectBlurCSS () {
	const style = document.createElement("style");
	style.type = 'text/css';
	style.rel = 'stylesheet';
	style.id = "tahir" 
	style.innerHTML = generateCssRules();
	style.async = false;
	document.documentElement.appendChild (style);
}


/* removeBlurCSS - Removes injected blur CSS */
function removeBlurCSS () {
	const css = document.getElementById("tahir");
	if (css) { css.parentNode.removeChild(css); }	
}


/* generateCssRules - Generates custom blur CSS based on user local storage settings */
function generateCssRules () {
	var cssRules = "";
	var blurAmt = "blur(" + settings.blurAmt + "px) "
	var grayscale = (settings.grayscale == true ? "grayscale(100%) " : "")

	if (settings.images === true) { cssRules += "img {filter: " + blurAmt + grayscale + "!important } "   }
	if (settings.videos === true) { cssRules += "video {filter: " + blurAmt + grayscale + "!important } " }
	if (settings.iframes === true) { cssRules += "iframe {filter: " + blurAmt + grayscale + "!important } " }
	if (settings.bgImages === true) { cssRules += "div[style*='url'], span[style*='url'], a[style*='url'], i[style*='url'] {background-image: none !important; background-color: gray !important;}" }

	return cssRules
}


/* updateCSS - (1) Gets updated local storage settings from popup.js (2) updates blur CSS accordingly */
function updateCSS (updatedSettings) {
	settings = updatedSettings
	removeBlurCSS();		
	if (settings.status === true) { injectBlurCSS() }
}


/* reverseStatus - (1) Reverses current status (2) saves this to settings (3) updates blur CSS accordingly  */
function reverseStatus () {
	settings.status = !settings.status
	chrome.storage.sync.set({"settings": settings})
	removeBlurCSS();		
	if (settings.status === true) { injectBlurCSS() }		 
}


/* revealSelected - Reveals blurred/hidden object under mouse hover */
function revealSelected () {

	/* Determine element user is clicking over */
	const hover = document.querySelectorAll( ":hover" );
	if (hover.length !== 0) {
		var selected = hover[hover.length - 1]
		while (selected.childNodes.length !== 0) {
			selected = selected.childNodes[selected.childNodes.length - 1]
		}
	}

	/* If element found, & is hidden element, reveal element: (1) if IMG, IFRAME, VIDEO --> set filter to blur 0px; (2) if DIV, SPAN, A, I --> append !important to background/background-image URL */ 
	if (selected) {
		if (selected.nodeName === 'IMG' || selected.nodeName === 'IFRAME' || selected.nodeName === 'VIDEO') { selected.style.cssText += ';filter: blur(0px) !important;' }
		if (selected.nodeName === 'DIV' || selected.nodeName === 'SPAN' || selected.nodeName === 'A' || selected.nodeName === 'I') { 
			var hasURL = selected.style.cssText.match(/url\(([^()]+)\)/)
			var hasImportant = selected.style.cssText.match(/url\(([^(]+)\) !important/)
			if (hasURL && !hasImportant) {
				var updatedCSS = selected.style.cssText.replace(/url\(([^()]+)\)/, '$&' + ' !important');
				selected.style.cssText = updatedCSS 			
			}
		}
	}
}

