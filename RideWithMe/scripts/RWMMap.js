function geolocationApp() {
}

function calcAngle(x1, y1, x2, y2) {
	// Rotationswinkel:
	var value = Math.atan2((y2 - y1), ((x2 - x1) != 0 ? (x2 - x1) : 0.000000000000000001));
	return 180 * value / Math.PI;
}

function afterShowMapTab() {
	if (!model.geolocationAppRunning) {
        if (model.connected) { // We are not connected, so we cannot run
            model.geolocationAppRunning = true;
    		geolocationApp = new geolocationApp();
        	geolocationApp.run();
        }
        else return;
	}
    if (model.timer == 0 && model.geolocationTime > 0) {
        model.timer = window.setTimeout(function() {
			refreshMap();
		}, model.geolocationTime); // handle for timer that fires to refresh map;   
    }
    // Refresh now
    refreshMap();
}

function UpdateRiderData(data) {
	model.riderData = data;
	
	// Display the riders
	RenderRiders();
}

var firstRun = true;

// Event handler for google.maps.idle event (fires when zoom/pan has stopped and the map is rendered.
function BoundsChanged() {
	if (firstRun) {
		// this is to prevent iOS trouble with the link
		firstRun = false; }
        
    $("#map-canvas").find('a').removeAttr("href");

	// save the bounds for future use
	model.bounds = model.map.getBounds();

	// Display the riders
    if (!model.infoBox)
	    RenderRiders();
}

// Draw riders on map
function RenderRiders() {
	// If we don't know the scale of the map, we cannot display anything
	if (model.bounds == undefined)
		return;
    
    // Get rid of the old info window, as we are recreating the markers
    HideInfoWindow();
	
	// Clean out old markers and lines
    var i;
	for (i = 0; i < model.markersArray.length; i++) {
		model.markersArray[i].setMap(null);
	}
	for ( i = 0; i < model.polylineArray.length; i++) {
		model.polylineArray[i].setMap(null);
	}
	for ( i = 0; i < model.mechanicMarkersArray.length; i++) {
		model.mechanicMarkersArray[i].setMap(null);
	}
	model.markersArray = [];
	model.polylineArray = [];
	model.mechanicMarkersArray = [];
	
    if (!model.isStarted) return;
    
	// Lookup my biker IDs
	var myBikeIds = [];
	for (i = 0; i < model.bikersArray.length; i++) {
		myBikeIds[i] = model.bikersArray[i].RiderId;
	}
    
    // My location for distance calc
    var distanceMe = new LatLon( model.currentPositionMarker.getPosition().lat(),  model.currentPositionMarker.getPosition().lng());
    
    
	// Loop for all the riders, excluding myself
	for ( i = 0; i < model.riderData.length; i++) {
		var bId = model.riderData[i].RiderId;
		if (myBikeIds.indexOf(bId) == -1) {  // This is not me
			// Determine if contact is known
			var isKnown = isKnownRider(model.riderData[i].RiderId);
			
			// Create fill color based upon type
			var mScale = 6;
			var fColor;
			if (model.riderData[i].Type > -1) {
				var typeOnly = model.riderData[i].Type.toString().substring(0, 1);
				fColor = typeOnly == "1" ? "#DD88EE" : typeOnly == "2" ? "#ffff19" : typeOnly == "3" ? "#194fff" : "#ffffff"; // white circle in case of unknown type
			}
			else {
				// Mechanics trouble type
				mScale = 8;
				fColor = "#ff0000";   
			}
			
			// Setup the stroke color for known riders as black, and unknown as fill color
			var strokeColor = (isKnown ? "#0" : fColor);
			
			// Covert lat/lng to map point
			var pos = new google.maps.LatLng(model.riderData[i].Lat, model.riderData[i].Lon);
			
            // Calc distance to me
            var distance = distanceMe.distanceTo(new LatLon(pos.lat(), pos.lng()));
            
			// Create the marker and path on screen, or marker if offscreen
			if (model.bounds.contains(pos)) {
				// The rider is on the screen, put in a marker and line
				var mIcon = { path: google.maps.SymbolPath.CIRCLE, scale: mScale,  fillColor: fColor, fillOpacity: 1, strokeColor: strokeColor, strokeWeight: 2 };
				model.markersArray[i] = new google.maps.Marker({
					map: model.map,
					position: pos,
					icon: mIcon,
					rider: model.riderData[i],
                    isKnownRider: isKnown, 
                    riderPos: pos,
                    distance: distance
				});
				
				var styleOnly = model.riderData[i].Type > -1 ? model.riderData[i].Type.toString().substring(0, 1) : "-1";
				model.polylineArray[model.polylineArray.length] = new google.maps.Polyline({
					map: model.map,
					strokeColor: styleOnly == "1" ? "#ff000c" : styleOnly == "2" ? "#ff9900" : styleOnly == "-1" ? "#ff0000" : "#0083ff",
					strokeWeight: 2,
					strokeOpacity: 1,
					path: [
						new google.maps.LatLng(model.riderData[i].Lat, model.riderData[i].Lon),
						new google.maps.LatLng(model.riderData[i].PLat, model.riderData[i].PLon)
					]
				});
				
				if (model.riderData[i].Type == -1) {
					model.mechanicMarkersArray[model.mechanicMarkersArray.length] = new google.maps.Marker({
						map: model.map,
						position:  pos,
						icon: 'images/wrench50.png'
					});
				}
			}
			else {
				// Rider is off screen, put in an arrow marker for them,
				// pointing to where they are.
				var ctr = model.bounds.getCenter();  // Center of the map, used for calculations

				var ne = model.bounds.getNorthEast();
				var sw = model.bounds.getSouthWest();
				var insetVert = (ne.lat() - sw.lat()) / 20;  // Used to position arrows inside the top/bottom edge
				var insetHorz = (ne.lng() - sw.lng()) / 40;  // Used to position arrows inside the left/right edge
				var OffScreenLoc;
				
				// Calculate some needed values
				var slope = (pos.lat() - ctr.lat()) / ((pos.lng() - ctr.lng()) != 0 ? (pos.lng() - ctr.lng()) : 0.000000000000000001) // prevents Div zero for vertical lines 
				var halfH = Math.abs(ne.lat() - sw.lat()) / 2
				var halfW = Math.abs(ne.lng() - sw.lng()) / 2
				
				// Figure out which edge the arrow should go next to:
				if (-halfH <= slope * halfW &&
					slope * halfW <= halfH) {
					if (pos.lng() < ctr.lng()) {
						// left edge
						OffScreenLoc = new google.maps.LatLng(ctr.lat() - ((halfW - insetHorz) * slope), sw.lng() + (insetHorz*3));
					}
					else {
						// Right edge
						OffScreenLoc = new google.maps.LatLng((halfW - insetHorz) * slope + ctr.lat() , ne.lng() - insetHorz);
					}
				}
				else {
					if (pos.lat() < ctr.lat()) {
						// bottom edge
						OffScreenLoc = new google.maps.LatLng(sw.lat() + (insetVert*1.5), ctr.lng() - ((halfH - insetVert) / slope));
					}
					else {
						// top edge
						OffScreenLoc = new google.maps.LatLng(ne.lat() - (insetVert*1.5), ctr.lng() + ((halfH - insetVert) / slope));
					}
				}
                
                // Determine scale based upon distance
                if (distance < 2.0)
                    mScale = 6;
                else if (distance < 10.0)
                    mScale = 5;
                else if (distance < 20.0)
                    mScale = 4;
                else
                    mScale = 3;
				
				model.markersArray[i] = new google.maps.Marker({
					map: model.map,
					position: OffScreenLoc,
					icon: {
						path: model.riderData[i].Type < 0 ? model.bikeSymbol[4] : model.bikeSymbol[3] ,
						scale: mScale,
						fillOpacity: 1,
						fillColor: fColor,
						rotation: 450 - calcAngle(ctr.lng(), ctr.lat(), pos.lng(), pos.lat()), // set the rotation for for the arrow
						strokeColor: strokeColor,
						strokeWeight: 2
					},
					rider: model.riderData[i],
                    isKnownRider: isKnown, 
                    riderPos: pos,
                    distance: distance,
                    zIndex: model.riderData[i].Type < 0 ? 1100 : isKnown ? 1000 : 1000-distance // Show known riders in front always, then show close riders in front of far riders
				});
			}
			
			// Handle the clicking of the marker.  this works for both on-screen and offscreen riders
			google.maps.event.addListener(model.markersArray[i], 'click', function() {
                
                ShowInfoWindow(this, MakeInfoWindowContent(this));

			});
		}
	}
}

var lastInfoWindowMarker;

function MakeInfoWindowContent(RiderMarker) {
    var ctn = '<div style="margin: 3px;">' + model.dictionary.type + ": " + getRiderType(RiderMarker.rider.Type) + '</div>' + 
              '<div style="margin: 3px;">' + model.dictionary.style + ": " + getRiderStyle(RiderMarker.rider.Type) + '</div>';

    if (RiderMarker.isKnownRider) {  // RWMContacts.js
        // If the rider is known, add tokens for photo and name
        ctn += '<div style="margin: 3px"><div style="height: 80px">##RiderPhoto##</div></div>';
        ctn += '<div style="margin: 3px">##RiderName##</div>';
        //getKnownRiderInfo(RiderMarker.rider.RiderId, ctn);
    } 
                
    ctn += '<div style="margin: 3px;">' +
           model.dictionary.distance + ": " + RiderMarker.distance +
           ' km</div>';
    ctn += '<div style="margin: 3px; text-align: center;">';
    if (!RiderMarker.isKnownRider && !isNoContacts) { 
        // if rider is not known, add link to add this rider to a contact.
        ctn += '<input type="button" onclick="showContacts(' + RiderMarker.rider.RiderId + 
               ')" value="' + model.dictionary.createAddToContact + '" />';
    } else {
        // if rider is known, add link to show this rider to a contact.
        ctn += '<input type="button" onclick="showContactDetailsClickMarker(' + RiderMarker.rider.RiderId + 
               ')" value="' + model.dictionary.showContact + '" />';
    }
    ctn += '<input type="button" style="align: right;" onclick="panThem(' 
        + RiderMarker.riderPos.lat() + ', ' + RiderMarker.riderPos.lng() + ')" value="' + model.dictionary.showRider + '" />';
    
    return ctn;
}

function ShowInfoWindow(anchor, ctn) {
    if (model.infoBox) { model.infoBox.close(); model.infoBox = undefined; }
    lastInfoWindowMarker = anchor;
    
    var fullContent = '<div id="infoBox" style="width: 200px">' + ctn + '</div>';
    
    // Create and open the infoWindow
    //model.infoBox = new google.maps.InfoWindow({content: fullContent});
    model.infoBox = new InfoBox({content: fullContent, alignBottom: true, pixelOffset: new google.maps.Size(-100,-40) });
	model.infoBox.open(model.map, anchor);
    
    if (anchor.isKnownRider)
        google.maps.event.addListenerOnce(model.infoBox, 'domready', function () { getKnownRiderInfo(lastInfoWindowMarker.rider.RiderId) });
    google.maps.event.addListener(model.infoBox, 'closeclick', HideInfoWindow );
}

function HideInfoWindow() {
    if (model.infoBox) {
        model.infoBox.close();
        model.infoBox = null; 
        RenderRiders();
    }
}

function reshowLastInfoWindow() {
    // TODO:  in RefreshMaps, the marker we have here is distroyed. so remap it to the new one if created
    if (lastInfoWindowMarker)
        google.maps.event.trigger(lastInfoWindowMarker, "click");
}

function updateRWM() {
    if (model.timerUpdateRWM) {
        self.clearTimeout(model.timerUpdateRWM);
        model.timerUpdateRWM = 0;
    }
    
	if (model.current.RiderId == undefined)
		return;
    
    if (model.currentPositionMarker == undefined)
    {
        // ? We should be running, so since we are not, try again in a few seconds
        model.timerUpdateRWM = self.setTimeout( function() { updateRWM(); }, 4000);
        return;
    }
    
    var curPos = model.currentPositionMarker.getPosition();

    
	var showAll = $("#cbOneOrAllTypes").val() == "on" ? "true" : "false";
    UpdateRWMServer(model.current.RiderId, curPos.lat(), curPos.lng(), model.markerIcon.rotation, model.current.Type, model.current.Style, model.hasTrouble, showAll, 10, UpdateRiderData);
        
    // Start another loop if we are running
    if (model.isStarted)
        model.timerUpdateRWM = self.setTimeout( function() { updateRWM(); }, model.refreshTime);
}

function refreshMap() {
    if (!model.geolocationAppRunning) return;  // We are not running yet!
    
    if (firstRun && model.timer == 0) return; // Not showing map yet
    
    if (model.timer != 0) {
        window.clearTimeout(model.timer);
        model.timer = 0;
    }
	
	navigator.geolocation.getCurrentPosition(
		function() {
			geolocationApp._onSuccess.apply(geolocationApp, arguments);
		},
		function(error) {
			geolocationApp._onError(error);
		}, 
		{ enableHighAccuracy: true }
        )
		
	// Start an automatic refresh timer if we are running in the foreground
    if (model.geolocationTime > 0) {
        model.timer = window.setTimeout(function() {
            refreshMap();
        }, model.geolocationTime);
    }
}

function zoomToDefault() {
    model.panOff = !model.panOff;

    if (model.panOff) {
        $("#imgZoom").attr("src","images/PanOff.png");
    } else {
        $("#imgZoom").attr("src","images/Zoom.png");
        model.map.panTo(model.currentPositionMarker.position);
        model.map.setZoom(15);
    }
}

function panThem(lat, lng) {
    var pos = new google.maps.LatLng(lat, lng);
    HideInfoWindow();
    model.map.panTo(pos);
}

geolocationApp.prototype = {
    
	run:function() {
		this._handleWatch();
	},
    
	_handleWatch:function() {
		var that = this;
        if (model.dictionary != undefined) {
            that._setResults(model.dictionary.waitingForGeolocationInformation);
        }
	},
    
	_onSuccess:function(position) {
		// Successfully retrieved the geolocation information. Display it all.
        if (!model.connected) return; // We are not connected, so we cannot run

		var curPos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
		if (model.map == undefined) {
			model.map = new google.maps.Map(document.getElementById('map-canvas'), {
				sensor: true,
				zoom: 15,
				center: curPos,
				mapTypeId: google.maps.MapTypeId.TERRAIN,
				panControl: false,
				streetViewControl: false,
				zoomControl: false
			});
			google.maps.event.addListener(model.map, 'idle', BoundsChanged);
		}
        
        var fColor = model.current.Type == 1 ? "#DD88EE" : model.current.Type == 2 ? "#ffff19" : model.current.Type == 3 ? "#194fff" : "#ffffff" ;
        if (model.currentPositionMarker == undefined) {
            // Create my icon
            model.markerIcon = { path: model.bikeSymbol[ (!model.isStarted ? 0 : model.hasTrouble ? 2 :  1)], scale: 7,  fillColor: fColor, fillOpacity: 1, strokeWeight: 2, rotation: 0 };
			model.currentPositionMarker = new google.maps.Marker({
				map: model.map,
				position: curPos,
				icon: model.markerIcon
			});
			var can = $("#map-canvas");
			can.css("height", can[0].parentElement.clientHeight);
           
			// click on my own arrow
			google.maps.event.addListener(model.currentPositionMarker, 'click', function() {
				var ctn = '<table>'
                        + '<tr>'
                        +     '<td  style="width: 80px; height: 80px; margin-left: 20px; text-align: center; vertical-align:middle">'
                        +         '<img src="' + (model.isStarted ? 'images/Stop.png' : 'images/Start.png') + '" style="width: 80px;" onclick="startRide()" id="imgStartStop"/>'
                        +         '<div>' + (model.isStarted ? model.dictionary.stopTxt : model.dictionary.runTxt) + '</div>'
                        +     '</td>'
                        +     '<td style="width: 80px; height: 80px; margin-left: 20px; text-align: center; vertical-align:middle">'
                        +         '<div><img src="' + (model.hasTrouble ? 'images/WrenchButtonOn.png' : 'images/WrenchButtonNeutral.png') + '" style="width: 80px; margin-left: 20px;" onclick="startStopTrouble()" class="mechanic"/>'
                        +         '<div>' + model.dictionary.trouble + '</div></div>'
                        +     '</td>'
                        + '</tr>'
                    + '</table>';
                
                ShowInfoWindow(this, ctn);
			});
        } else {
            // Update my icon and position
            model.currentPositionMarker.setPosition(curPos);
            // we need this one later for the compass.
            model.markerIcon = {
                path: model.bikeSymbol[ (!model.isStarted ? 0 : model.hasTrouble ? 2 : 1)], 
                scale: model.markerIcon.scale,  
                fillColor: fColor, 
                fillOpacity: model.markerIcon.fillOpacity, 
                strokeWeight: model.markerIcon.strokeWeight,
                rotation: model.markerIcon.rotation
            };
            model.currentPositionMarker.setIcon(model.markerIcon);
        }
        
        var weMoved = Math.abs(Math.floor(model.prevLat * 10000) - Math.floor(position.coords.latitude * 10000)) 
                    + Math.abs(Math.floor(model.prevLon * 10000) - Math.floor(position.coords.longitude * 10000));
        
		if (weMoved) {
            if (!model.panOff) {
                model.map.panTo(curPos);
            }
            
            // Save the previous position
			model.prevLat = position.coords.latitude;
			model.prevLon = position.coords.longitude;
            
            // re-initialize the off-Timer
            watchdogBump();			
		}
	},
    
	_onError:function(error) {
        switch (error.code) {
            case PositionError.PERMISSION_DENIED:
                // WOOPS.  Access to location is denied  How come?  Tell User
                this._setResults(model.dictionary.cannotGetLocation);
                model.geolocationTime = -1;
                stopRide();  // Stop the ride if we are started
                model.map = undefined;
                break;
            case PositionError.POSITION_UNAVAILABLE:
            case PositionError.TIMEOUT:
                // Do Nothing on timeout or unavailable
                break;
        }
	},
    
	_setResults:function(value) {
		if (!value) {
			document.getElementById("map-canvas").innerHTML = "";
		}
		else {
			document.getElementById("map-canvas").innerHTML = value;
		}
	},
}