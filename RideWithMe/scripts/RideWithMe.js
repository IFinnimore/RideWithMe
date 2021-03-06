var urls;
var app;

function datacontainer() {
	this.map;
    this.geolocationAppRunning;
	this.currentPositionMarker;
	this.current;
	this.geoLoc;
	this.prevLoc;
	this.markerIcon;
	this.timer; // Refresh Position Timer.  Always running
    this.timerUpdateRWM; // Runs only when user presses start
	this.markersArray;
	this.polylineArray;
	this.mechanicMarkersArray;
	this.riderData;
	this.isStarted;
	this.bikersArray;
	this.infoBoxText;
	this.infoBoxOptions;
	this.infoBox;
	this.compassWatchID;
	this.hasTrouble;
	this.bikeListEditMode;
	this.culture;
	this.dictionary;
	this.offTimer;
	this.offTimerLastLat;
	this.offTimerLastLon;
	this.bounds;
	this.refreshBase;	// Base refresh time.  Currently 5 seconds
	this.refreshTime;
    this.geolocationTime;
	this.addFirstBike;
	this.oneOrAllTypes;
    this.bikeSymbol;
    this.panOff; // Toggle for autopan
    this.connected;
}

function model() {
}


$(document).ready(function() {
    //jQuery.noConflict();
	urls = {
		getRiderIdUrl: "http://ridewithme.co/services/RideWithMe/RideWithMeService.svc/GetNewRiderId/?",
		updateRWMUrl: "http://ridewithme.co/services/RideWithMe/RideWithMeService.svc/UpdateRwm/?",
        newSessionID: "http://ridewithme.co/services/RideWithMe/KeyService.svc/GetSessionKey"
        /*getRiderIdUrl: "http://85.124.19.16/IFServices/RideWithMeService.svc/GetNewRiderId/?",
		updateRWMUrl: "http://85.124.19.16/IFServices/RideWithMeService.svc/UpdateRwm/?",
        newSessionID: "http://85.124.19.16/IFServices/KeyService.svc/GetSessionKey"*/
	}

	model = new datacontainer();
    model.geolocationAppRunning = false;
	model.markersArray = [];
	model.polylineArray = [];
	model.mechanicMarkersArray = [];
	model.riderData = []; // Data back from RWM web sercie
	model.isStarted = false; // true when running, false when not
	model.hasTrouble = false;
	model.bikeListEditMode = false;
	model.refreshBase = 10000; // Basic refresh cycle is one per 10 seconds
	model.refreshTime = model.refreshBase * 6; // time for updating other riders
    model.geolocationTime = model.refreshBase; // time for getting our position
    
    // SVG paths for the symbols about the bike
    model.bikeSymbol = [];
     model.bikeSymbol[0] = 'M1 2.5L2.5 1 2.5 -1 1 -2.5 -1 -2.5 -2.5 -1 -2.5 1 -1 2.5z M1 -4L0 -6 -1 -4z'; // me stopped
     model.bikeSymbol[1] = 'M0 3.5L2 2.5 0 -2.5 -2 2.5z'; // me running
     model.bikeSymbol[2] = 'M0 1L2 3 C0.5 4.5 2.5 6.5 4 5L3 4 4 3 5 4 C6.5 2.5 4.5 0.5 3 2L-2 -3 C-0.5 -4.5 -2.5 -6.5 -4 -5L-3 -4 -4 -3 -5 -4C-6.5 -2.5 -4.5 -0.5 -3 -2z'; // me.Wrench
     model.bikeSymbol[3] = 'M0 1.5L2 2.5 0 -2.5 -2 2.5z'; // Offscreen other
     model.bikeSymbol[4] = 'M0 1.5L2 2.5 0 -2.5 -2 2.5zM0 1L2 3 C0.5 4.5 2.5 6.5 4 5L3 4 4 3 5 4 C6.5 2.5 4.5 0.5 3 2L-2 -3 C-0.5 -4.5 -2.5 -6.5 -4 -5L-3 -4 -4 -3 -5 -4C-6.5 -2.5 -4.5 -0.5 -3 -2z'; // offscreen other with wrench

    // defaulting to an empty "Current"
    model.current = {
        Style: 0,
        Type: 0,
        RiderId: undefined
    };
    this.panOff = false;
    
    model.prevLoc = null;

	model.offTimer = 0; // handle for timer that fires to automatically stop app
	model.timer = 0; // handle for timer that updates position;
    model.timerUpdateRWM = 0; // Handle for timer that fires to update ridewithme
    

	model.addFirstBike = false;
    model.bikersArray = [];
	var oneOrAll = localStorage.getItem("oneOrAllTypes");
	oneOrAll = oneOrAll == null ? false : oneOrAll;
	if (oneOrAll == "true") {
		$("#cbOneOrAllTypes").prop("checked", true);
	}
    setupLanguage(); // RMWCulture.js
    
    startMap();
    
    window.setTimeout(function () { initContactsList(); }, 500);
});

document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
    // setup dictionary and bikes
    setupLanguage(); // RMWCulture.js
	loadListOfBikes();
	refreshKnownRiders();
    
	// When the battery gets critical, stop the ride no matter what
	document.addEventListener("batterystatus", onBatteryStatus, false);
	
	// Connect/ Disconnect event handlers
	document.addEventListener("offline", onConnectionOffline, false);
	document.addEventListener("online", onConnectionOnline, false);

	// Resume event handler.  Done as a setTimeout to avoid race condition
	document.addEventListener("pause", onPause, false);
    document.addEventListener("resume", onResume, false);
    
    // Handle the back button on the Android
    document.addEventListener("backbutton", onBackKeyDown, false);

	// Verify server connectivity.
	checkConnection();

    // setup the switch    
	var switchData = $("#cbOneOrAllTypes").data("kendoMobileSwitch");
	if (switchData)
		switchData.bind("change", function(e) {
			localStorage.setItem("oneOrAllTypes", e.checked);
		});
    
    // Start the compass
    startCompass();
    
    // Setup the map
    startMap();
}

var mapStartState = 0;
function startMap() {
    mapStartState += 1;
    if (mapStartState == 2) {
        window.setTimeout(function() {
            afterShowMapTab();
        }, 100);
    }
}

function startRide() {

	if (!model.isStarted) {
        // We are not started, so start
        model.isStarted = true;

		if ((navigator.connection.type == Connection.NONE)) {
			// No connection. so immediately stop by recursive call;
			startRide();
			return;
		}
        
        // Hide the overlay
        overlayStartStop(false);
        
		switch (model.bikersArray.length) {
			case 0:
				model.addFirstBike = true;
				newBike();
				break;
			case 1:
				// one bike - start the ride immediately
				model.current = model.bikersArray[0];
				location.href = "#tabstrip-map";
				break;
			default:
				// more than one bike - choose bike before ride starts
                loadListOfBikes();
				location.href = "#tabstrip-choosebike";
				break;
		}

        // Get rid of the prev
        
        model.prevLoc = null;
        
        // Paint the current map
        refreshMap();
        
        // Reset to the default zoom and center me, turning on pan following
        if (model.panOff) {
            zoomToDefault();
        }
        

        watchdogBump();

        // Start the UpdateRWM timer by updating RWM in 2 seconds (allows time for initial GPS location)
        model.timerUpdateRWM = window.setTimeout( function() { updateRWM(); }, 2000);
        
        // Show we are running
        displayRunState(true);
    }
	else {
		stopRide();
	}
}

function stopRide() {
	if (!model.isStarted)
		return; // Not running, don't stop.

    // we are stopped
    model.isStarted = false;
   
    
    // Stop the update timer
    if (model.timerUpdateRWM != 0) {
        self.clearInterval(model.timerUpdateRWM);
        model.timerUpdateRWM = 0;
    }
    
    // Clear trouble
    if (model.hasTrouble) {
        startStopTrouble();
    }

    watchdogBump();
    
    // Go to the Start/Stop screen (may already be there)
    location.href = "#tabstrip-map";
    
    // Clear out the old data.  If we dont share, we don't see others.
    model.riderData = []; // Data back from RWM web sercie
    
    // Update the position to 0,0 (forces them off the map);
    UpdateRWMServer(model.current.RiderId, 0.0, 0.0, 0, model.current.Type, model.current.Style, model.hasTrouble, false, 10, null);
    
    // clear the "current" rider
    model.current = {
        Style: 0,
        Type: 0,
        RiderId: undefined
    };
    
    // Clear the info box and show the overlay
    overlayStartStop(true);
    
    displayRunState(false);

    
    // Redraw us
    refreshMap();
    
    // Clear everyone else out
    RenderRiders();
}

function watchdogBump() {
    if (model.offTimer) {
        window.clearTimeout(model.offTimer);
        model.offTimer = 0;
    }
    if (model.isStarted) {
        model.offTimer = window.setTimeout(function() {
            // AutoStop ride if not mechanics
            stopRide();
        }, 900000);
    }
}

function displayRunState(Running) {
    if (Running) {
        $("#stopLightGO").show();     
        // setup the start/stop overlay for stop    
        $("#imgStartStop").attr("src", "images/Stop.png");
        $("#lblRunStop").html(model.dictionary.stopTxt);
        $("#stopLightStop").hide();
    } else {
        $("#stopLightStop").show();
        // Set the start icon
        $("#imgStartStop").attr("src", "images/Start.png");
        $("#lblRunStop").html(model.dictionary.runTxt);
        $("#stopLightGO").hide();
    }
}

function overlaySwipe(e) {
    overlayStartStop();
}

var isOverlayShow = true;
function overlayStartStop(ShowIt) {
    HideInfoWindow();
    if (ShowIt == undefined) ShowIt = !isOverlayShow;
    
    if (ShowIt) {
        // Clear any info box if visible
//        $("#startStopOverlay").show(1000);
        $("#startStopOverlay").animate({left: "-120px"}, 500);
        isOverlayShow = true;
    } else {
//        $("#startStopOverlay").hide(300);
        $("#startStopOverlay").animate({left: "-300px", }, 500);
        isOverlayShow = false;
    }

}