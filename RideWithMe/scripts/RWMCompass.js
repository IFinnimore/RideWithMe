
function startCompass() {
	var options = {frequency: 1000};
	model.compassWatchID = navigator.compass.watchHeading(onCompassSuccess, onCompassError, options);
}

function onCompassSuccess(heading) {
	if (model.markerIcon) {
		//model.markerIcon.rotation = heading.magneticHeading;    
		model.markerIcon = {
			path: model.markerIcon.path, 
			scale: model.markerIcon.scale,  
			fillColor: model.markerIcon.fillColor, 
			fillOpacity: model.markerIcon.fillOpacity, 
			strokeWeight: model.markerIcon.strokeWeight,
			rotation: heading.magneticHeading
		};
		model.currentPositionMarker.setIcon(model.markerIcon);
	}
}

function onCompassError(compassError) {
	// Do nothing on error
}

function stopCompass() {
	if (model.compassWatchID) {
		navigator.compass.clearWatch(model.compassWatchID);
		model.compassWatchID = null;
	}
}
