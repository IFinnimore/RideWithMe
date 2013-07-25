var urls;

function datacontainer() {
	this.map;
	this.currentPositionMarker;
	this.current;
	this.geoLoc;
	this.prevLat;
	this.prevLon;
	this.markerIcon;
	this.timer;
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
	this.refreshBase;	// Base refresh time.  Currently 60 seconds
	this.refreshTime;
	this.addFirstBike;
	this.oneOrAllTypes;
}

function model() {
}

document.addEventListener("deviceready", onDeviceReady, false);

$(document).ready(function() {
	/* ToDo 
	a) Map laden und leer anzeigen, solange es noch keine map gibt -- Done
	b) Beim erstmaligen Start nicht mit dem Bikes-Tab, sondern mit dem Start-Tab beginnen und 
	den user auf den maps-tab verweisen, wenn es noch keine bikes gibt (siehe dort, wo derzeit der maps-tab als
	erster tab geoeffnet wird) -- Done
	c) die eigene Position nur aktualisieren wenn die Geschwindigkeit hoeher als 1.2 m/s ist. Damit wird vermieden dass 
	der Cursor 'ruckelt' -- Done
	d) es gibt einen 'resume'-event, der ausgeloest wird, wenn das Device vom Sleep mode zurueckkehrt. Hier sollten wir die
	Karte wieder so ausrichten dass der User in der Mitte steht. Weiters ist die updateRWM()-Methode auszufuehren.
	e) Delete-Button anstatt einer MessageBox anzeigen. Alle Messageboxes entfernen, sie werden am iPhone nicht korrekt
	angezeigt. -- Done
	*/
	urls = {
		getRiderIdUrl: "http://ridewithme.co/services/RideWithMe/RideWithMeService.svc/GetNewRiderId",
		updateRWMUrl: "http://ridewithme.co/services/RideWithMe/RideWithMeService.svc/UpdateRwm/?",
	}
	var frequ = localStorage.getItem("locFrequency");
	if (frequ != undefined)
		$("#txtUpdateFrequency").val(frequ);
	model = new datacontainer();
	model.infoBoxText = document.createElement("div");
	model.infoBoxText.style.cssText = "border: 1px solid black; margin-top: 8px; background: white; padding: 5px;";
	model.infoBoxText.innerHTML = "My Text";
	model.infoBoxOptions = {
		content: model.infoBoxText
		,disableAutoPan: false
		,maxWidth: 0
		,pixelOffset: new google.maps.Size(-110, 0)
		,zIndex: null
		,boxStyle: { 
			opacity: 0.9
			,width: "220px"
		}
		,closeBoxMargin: "10px 2px 2px 2px"
		,closeBoxURL: "http://www.google.com/intl/en_us/mapfiles/close.gif"
		,infoBoxClearance: new google.maps.Size(2, 2)
		,isHidden: false
		,pane: "floatPane"
		,enableEventPropagation: false
	};
	model.infoBox = new InfoBox(model.infoBoxOptions);
	model.markersArray = [];
	model.polylineArray = [];
	model.mechanicMarkersArray = [];
	model.riderData = []; // Data back from RWM web sercie
	model.isStarted = false; // true when running, false when not
	model.hasTrouble = false;
	model.bikeListEditMode = false;
	model.refreshBase = 5000; // Basic refresh cycle is one per 5 seconds
	model.refreshTime = model.refreshBase; // Default refresh time once per ten seconds

	model.offTimer = 0; // handle for timer that fires to automatically stop app
	model.timer = 0; // handle for timer that fires to refresh map;
	model.culture = navigator.language.substr(0, 2);
	model.addFirstBike = false;
	var oneOrAll = localStorage.getItem("oneOrAllTypes");
	oneOrAll = oneOrAll == null ? false : oneOrAll;
	if (oneOrAll == "true") {
		$("#cbOneOrAllTypes").prop("checked", true);
	}
	switch (model.culture) {
		case "de":
			model.dictionary = new deutsch();
			break;
		default:
			model.dictionary = new english();
			break;
	}
});

function onDeviceReady() {
	applyDictionary();
	loadListOfBikes();
	refreshKnownRiders();
	// When the battery gets critical, stop the ride no matter what
	document.addEventListener("batterycritical", onBatteryLow, false);
	
	// Connect/ Disconnect event handlers
	document.addEventListener("offline", onConnectionOffline, false);
	document.addEventListener("online", onConnectionOnline, false);

	// Resume event handler.  Done as a setTimeout to avoid race condition
	document.addEventListener("resume", onResume, false);

	// ToDo:  Verify server connectivity.
	checkConnection();	
	var switchData = $("#cbOneOrAllTypes").data("kendoMobileSwitch");
	if (switchData)
		switchData.bind("change", function(e) {
			localStorage.setItem("oneOrAllTypes", e.checked);
		});
}

function startRide() {
    // Close the infobox, if open
    model.infoBox.close();

    
	if (!model.isStarted) {
        // We are not started, so start
        model.isStarted = true;
        
		if ((navigator.connection.type == Connection.NONE)) {
			// No connection. so immediately stop by recursive call;
			startRide();
			return;
		}
        
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
		$("#imgStartStop").attr("src", "images/Stop.png");
		startCompass();
	}
	else {
		stopRide();
	}
}

function stopRide() {
	if (!model.isStarted)
		return; // Not running, don't stop.

    model.isStarted = false;
    
    $("#imgStartStop").attr("src", "images/Start.png");
    if (model.timer != 0)
        clearTimeout(model.timer);

    stopCompass();
    
    // Go to the Start/Stop screen (may already be there)
    location.href = "#tabstrip-play";
    
    // Make AJAX call if we are connected
	if (!(navigatior.connecton.type == connection.NONE)) {
		var typestyle = model.current.Type * 10 + model.current.Style;
		if (model.hasTrouble)
			typestyle = -1;
		var myUrl = urls.updateRWMUrl + "riderId=" + model.current.RiderId + "&lat=0&lon=0&heading=0&type=" + typestyle + "&pelSize=10&showAll=false&ts=" + new Date().getTime();
		$.ajax({
			type: "GET",
			url: myUrl,
			contentType: "application/json; charset=utf-8",
			crossDomain: true,
			dataType: "json",
			timeout: 15000
		});
	}
    

}