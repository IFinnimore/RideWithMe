// Android "Back button"
function onBackKeyDown() {
    // Handle the back button

    // DO NOTHING.  This disables the back button    
}


// Battery low
var isPaused = false;
function onBatteryStatus(info) {
	// the battery may be critical, so stop the GPS and calling web service...  
	// don't want to kill the battery!
    if (info.isPlugged) {
        // Level doesn't matter, we are plugged in
        $('.lowBattery').hide();
        if (model.geolocationTime < 0 && !isPaused) {
            model.geolocationTime = model.refreshBase;  // Restore the geolocation timer
            refreshMap();
        }
    } else if (info.level < 15) {
        // Show the Low Battery warning
        $('.lowBattery').show(1000);
        
        // Stop the ride
    	stopRide();    
        
        // Stop the auto refresh.  This is overridden if the user pauses and resumes the app
        model.geolocationTime = -1;
    } else {
        $('.lowBattery').hide();
    }
}

// Suspend/Resume
function onPause() {
    isPaused = true;
    
    if (!model.isStarted) {
        // If we are not transmitting data, then stop the refresh
        model.geolocationTime = -1;
    } else {
        // Slow down the refresh to be once per 30 seconds, and then only if we are running.
        model.geolocationTime = 30000;    
    }
    
    stopCompass();
    
}

function onResume() {
    // Done in an immediate timeout function to run on a separate thread
	window.setTimeout(function() {
        isPaused= false;
        
        // Do we have a data connection?
         checkConnection();
        
		// We have come back to the foreground.  Refresh the known riders list
		refreshKnownRiders();
		
        // Restore the geolocationTime speed;
        model.geolocationTime = model.refreshBase;
        
		// Zoom/pan to the center on me and standard zoom level.  This will automatically cause
		// a RenderRiders()
        model.panOff = true; // Force this to true, to ensure the zoomToDefault resets it to false;
		zoomToDefault();
        
        // Refresh the map to ensure our current location is known
        startCompass();
		refreshMap();
        
        location.href = "#tabstrip-map"; // Go to the map, as we are running
	}, 0);	
}

// Connection/disconnection handler
function onConnectionOffline() {
	// On the Map, show an overlay text box showing no connection
	$('.dataConnection').show(2000);
    $('#lblGetNew').hide();
    model.connected = false;
    sessionID = "0";
}

function onConnectionOnline() {
	// On the map, hide the overlay text box showing no connection
	$('.dataConnection').hide();
    $('#lblGetNew').show(100);

    model.connected = true;
    
    // Get a session ID
    getNewSessionID();
    
	// Setup the map with my location
	refreshMap();
}

function checkConnection() {
	var networkState = navigator.connection.type
	
	if (networkState == Connection.NONE) {
		onConnectionOffline();
        return false;
	}
	else {
		onConnectionOnline();
        return true;
	}
}