// Battery low
function onBatteryLow(info) {
	// the battery is critical, so stop the GPS and calling web service...  
	// don't want to kill the battery!
	stopRide();
}

// Suspend/Resume
function onResume() {
	window.setTimeout(function() {
		// We have come back to the foreground.  Refresh the known riders list
		refreshKnownRiders();
		
		// Zoom/pan to the center on me and standard zoom level.  This will automatically cause
		// a RenderRiders()
		zoomToDefault();
		refreshMap();
	}, 0);	
}

// Connection/disconnection handler
function onConnectionOffline() {
	// On the Map, show an overlay text box showing no connection
	$('.dataConnection').show(2000);
}

function onConnectionOnline() {
	// On the map, hide the overlay text box showing no connection
	$('.dataConnection').hide();

	// Setup the map with my location
	refreshMap();
}

function checkConnection() {
	var networkState = navigator.connection.type
	
	if (networkState == Connection.NONE) {
		onConnectionOffline();
	}
	else {
		onConnectionOnline();
	}
}