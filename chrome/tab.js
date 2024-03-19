/**
 * @name tab.js
 * @title Modify DOM of active tab
 * @description
 * 	 - On tab load: (1) loads local storage settings & (2) generates & applies blur CSS
 *   - Listens to popup.js (popup modal) & background.js (key commands) for updates & modifies blur CSS as needed.
 *
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
		if (settings.status === true && !isDomainIgnored()) {
			injectBlurCSS()
		}
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

function isDomainIgnored() {
	var list = settings.ignoredDomains;
	return list.indexOf(window.location.host) >= 0;
}


var lastTargetElement = null;
var lastTargetElementCss = null;

/* addListeners - (1) adds message listeners to receive specific messages from popup.js (popup modal) & background.js (key commands) & (2) routes to appropriate functions on receipt */
function addListeners () {
	chrome.runtime.onMessage.addListener(
	  function(request, sender, sendResponse) {
	    if (request.message === 'reverse_status') { reverseStatus() }
	    else if (request.message === 'toggle_selected') { toggleSelected() }
	    else if (request.message.type === 'settings') { updateCSS(request.message) }
	  }
	);	
	//Track mouse event
	document.addEventListener('mouseover', function (event) {
		if (!altKeyPressed || settings.status === false) {
			if (lastTargetElement != null) {
				lastTargetElement.style.cssText = lastTargetElementCss;
				lastTargetElement = null;
			}
			return;
		}

		//If target is an image or video
		if (event && event.target && (["IMG", "IFRAME", "VIDEO"].includes(event.target.nodeName))) {
			//If a new hover item found, put back previous css
			if (lastTargetElement != null) {
				lastTargetElement.style.cssText = lastTargetElementCss;
			}
			//save current element and it's css for putting back
			lastTargetElement = event.target;
			lastTargetElementCss = event.target.style.cssText;
			toggleIfImg(event.target);
		}
		//Invalid target or not a image/video
		else if (lastTargetElement != null) {
			lastTargetElement.style.cssText = lastTargetElementCss;
			lastTargetElement = null;
		}
	});

	//Track ALT/OPTION key state
	document.addEventListener('keydown', function (event) {
		if (event.key === 'Alt') {
			altKeyPressed = true;
		}
	});

	document.addEventListener('keyup', function (event) {
		if (event.key === 'Alt') {
			altKeyPressed = false;
		}
	});
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
	if (settings.bgImages === true) { cssRules += "div[style*='url'], span[style*='url'], a[style*='url'], i[style*='url'] {filter: " + blurAmt + grayscale + "!important }" }

	return cssRules
}


/* updateCSS - (1) Gets updated local storage settings from popup.js (2) updates blur CSS accordingly */
function updateCSS (updatedSettings) {
	settings = updatedSettings
	removeBlurCSS();

	var ignoredDomains = settings.ignoredDomains;

	if (settings.status === true && !isDomainIgnored()) {
		injectBlurCSS()
	}
}


/* reverseStatus - (1) Reverses current status (2) saves this to settings (3) updates blur CSS accordingly  */
function reverseStatus () {
	settings.status = !settings.status
	chrome.storage.sync.set({"settings": settings})
	removeBlurCSS();		
	if (settings.status === true) { injectBlurCSS() }		 
}


/* toggleSelected - (1) Determines objects over hover (2) reverses blur state of objects over hover  */
function toggleSelected () {

	const hover = document.querySelectorAll( ":hover" ); // Determine user hover
	var imgFoundCSS = false; // Track if image found
	

	/* Iterate through all elements under hover. Toggle if contains IMG, IFRAME, VIDEO or inline image. */
	hover.forEach(function (selected, iterator, array) {
		toggleIfImg(selected)
	})


	/* toggleIfImg sub-method - If any element is an (1) IMG, IFRAME, VIDEO or (2) has a in-line background-url --> toggle */
	function toggleIfImg (selected)  {
		if (selected.nodeName === 'IMG' || selected.nodeName === 'IFRAME' || selected.nodeName === 'VIDEO') { toggle(selected) }
		else if (selected.style) {
				if (selected.style.cssText.match(/url\(([^()]+)\)/)) { toggle(selected) }
		}
	}

	/* toggle sub-method - adds forced blur or unblur as appropriate */
	function toggle (selected) {

		/* If this is fist image found */
		if (imgFoundCSS === false) {
			var cssText = selected.style.cssText

			/* If image is blurred by default --> apply forced unblur */
			if (settings.status === true && selected.style.filter === "") {
				selected.style.cssText += ';filter: blur(0px) !important;'		
			}

			/* If image is shown by default --> apply forced reblur */
			else if (settings.status === false && selected.style.filter === "") {
				var blurAmt = "blur(" + settings.blurAmt + "px) "
				var grayscale = (settings.grayscale == true ? "grayscale(100%) " : "")
				selected.style.cssText += ';filter: ' + blurAmt + grayscale + ' !important;'		
			}

			/* If image has been force unblured, then force reblur */
			else if (cssText.substr(cssText.length - 29) === "filter: blur(0px) !important;" ) {
				var blurAmt = "blur(" + settings.blurAmt + "px) "
				var grayscale = (settings.grayscale == true ? "grayscale(100%) " : "")
				selected.style.cssText += ';filter: ' + blurAmt + grayscale + ' !important;'
			}

			/* If image has been forced reblured, then force unblur */
			else {
				selected.style.cssText += ';filter: blur(0px) !important;'
			}

			imgFoundCSS = selected.style.cssText 
		}

		/* If previous image already found, set this image to same blur to prevent opposite-blur bug (where overlaying & underlying imgs in opposite blur states) */
		else {
			selected.style.cssText += ';' + imgFoundCSS.match(/(filter.*$)/)[0]
		}

	}

}

