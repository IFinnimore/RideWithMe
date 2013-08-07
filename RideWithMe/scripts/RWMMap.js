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
        
    $("#map-canvas a").removeAttr("href");

	// save the bounds for future use
	model.bounds = model.map.getBounds();

	// Display the riders
	RenderRiders();
}

// Draw riders on map
function RenderRiders() {
	// If we don't know the scale of the map, we cannot display anything
	if (model.bounds == undefined)
		return;
	
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
	
	// Loop for all the riders, excluding myself
	for ( i = 0; i < model.riderData.length; i++) {
		var bId = model.riderData[i].RiderId;
		if (myBikeIds.indexOf(bId) == -1) {  // This is not me
			// Determine if contact is known
			var ikr = isKnownRider(model.riderData[i].RiderId);
			
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
			var strokeColor = (ikr ? "#0" : fColor);
			
			// Covert lat/lng to map point
			var pos = new google.maps.LatLng(model.riderData[i].Lat, model.riderData[i].Lon);
			
			// Create the marker and path on screen, or marker if offscreen
			if (model.bounds.contains(pos)) {
				// The rider is on the screen, put in a marker and line
				var mIcon = { path: google.maps.SymbolPath.CIRCLE, scale: mScale,  fillColor: fColor, fillOpacity: 1, strokeColor: strokeColor, strokeWeight: 2 };
				model.markersArray[i] = new google.maps.Marker({
					map: model.map,
					position: pos,
					icon: mIcon,
					rider: model.riderData[i]
				});
				
				var styleOnly = model.riderData[i].Type > -1 ? model.riderData[i].Type.toString().substring(0, 1) : "-1";
				model.polylineArray[model.polylineArray.length] = new google.maps.Polyline({
					map: model.map,
					strokeColor: styleOnly == "1" ? "#ff000c" : styleOnly == "2" ? "#ff9900" : styleOnly == "-1", "transparent" : "#0083ff",
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
				var insetVert = (ne.lat() - sw.lat()) / 40;  // Used to position arrows inside the top/bottom edge
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
						OffScreenLoc = new google.maps.LatLng(ctr.lat() - ((halfW - insetHorz) * slope), sw.lng() + insetHorz)
					}
					else {
						// Right edge
						OffScreenLoc = new google.maps.LatLng((halfW - insetHorz) * slope + ctr.lat() , ne.lng() - insetHorz)
					}
				}
				else {
					if (pos.lat() < ctr.lat()) {
						// bottom edge
						OffScreenLoc = new google.maps.LatLng(sw.lat() + insetVert, ctr.lng() - ((halfH - insetVert) / slope))
					}
					else {
						// top edge
						OffScreenLoc = new google.maps.LatLng(ne.lat() - insetVert, ctr.lng() + ((halfH - insetVert) / slope))
					}
				}
				
				model.markersArray[i] = new google.maps.Marker({
					map: model.map,
					position: OffScreenLoc,
					icon: {
						path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
						scale: 3,
						fillOpacity: 1,
						fillColor: fColor,
						rotation: 450 - calcAngle(ctr.lng(), ctr.lat(), pos.lng(), pos.lat()), // set the rotation for for the arrow
						strokeColor: strokeColor,
						strokeWeight: 2
					},
					rider: model.riderData[i]
				});
			}
			
			// Handle the clicking of the marker.  this works for both on-screen and offscreen riders
			google.maps.event.addListener(model.markersArray[i], 'click', function() {
				var ctn = '<div style="margin: 3px;">' + model.dictionary.type + ": " + getRiderType(this.rider.Type) + '</div>' + 
						  '<div style="margin: 3px;">' + model.dictionary.style + ": " + getRiderStyle(this.rider.Type) + '</div>';

				if (ikr) {  // RWMContacts.js
					// If the rider is known, add tokens for photo and name
					getKnownRiderInfo(this.rider.RiderId);
					ctn += '<div style="margin: 3px">##RiderPhoto##</div>';
					ctn += '<div style="margin: 3px">##RiderName##</div>';
				} 
				ctn += '<div style="margin: 3px; text-align: center;">' +
					   '<button style="display: none;">' + model.dictionary.view + '</button>';
				if (!ikr) {
					// if rider is not known, add link to add this rider to a contact.
					ctn += '<a href="#tabstrip-contactlist" onclick="showContacts(' + this.rider.RiderId + 
						   ')">' + model.dictionary.createAddToContact + '</a>';
				}
                ctn += '<div><a href=".." onclick="panThem(' + pos.lat() +', ' + pos.lng() + ')">Go To Rider</a></div>';
				ctn += '</div></font>';
				model.infoBoxText.innerHTML = ctn;
				model.infoBox.open(model.map, this);  
			});
		}
	}
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
    
	var typestyle = model.current.Type * 10 + model.current.Style;
	if (model.hasTrouble)
		typestyle = -1;
	var showAll = $("#cbOneOrAllTypes").val() == "on" ? "true" : "false";
	var myUrl = urls.updateRWMUrl + "riderId=" + model.current.RiderId + "&lat=" + curPos.lat() + "&lon=" + curPos.lng() + "&heading=" + model.markerIcon.rotation + 
				"&type=" + typestyle + "&pelSize=10&showAll=" + showAll + "&ts=" + new Date().getTime();
	if (!(navigator.connection.type == Connection.NONE)) {
		$.ajax({
			type: "GET",
			url: myUrl,
			contentType: "application/json; charset=utf-8",
			crossDomain: true,
			dataType: "json",
			timeout: 15000,
			success: function(data) {
				UpdateRiderData(data)
			},
			fail: function () {
				console.log("Error calling " + myUrl);
			},
			error: function (xhr, status, error) {
				console.log("UpdateRWM" + ':' + error);
			}
		});
	}
    
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
	
	var options = {
		enableHighAccuracy: true,
		maximumAge: 0 
	};
	navigator.geolocation.getCurrentPosition(
		function() {
			geolocationApp._onSuccess.apply(geolocationApp, arguments);
		},
		function() {
			geolocationApp._onError();
		}, 
		options)
		
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
    model.map.panTo(pos);
}

geolocationApp.prototype = {
    
	run:function() {
		this._handleWatch();
	},
    
	_handleWatch:function() {
		var that = this;
		
		that._setResults(model.dictionary.waitingForGeolocationInformation);
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

        if (model.infoBox == undefined) {
        	model.infoBoxText = document.createElement("div");
            model.infoBoxText.id = "infoBox";
        	model.infoBoxText.style.cssText = "border: 1px solid black; margin-top: 8px; padding: 5px;";
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
        		,closeBoxURL: "images/close.gif"
        		,infoBoxClearance: new google.maps.Size(2, 2)
        		,isHidden: false
        		,pane: "floatPane"
        		,enableEventPropagation: false
        	};
            model.infoBox = new InfoBox(model.infoBoxOptions);
        }
        
        if (model.currentPositionMarker == undefined) {
			if (model.current) {
                // Create my icon
                
                var fColor = model.current.Type == 1 ? "#DD88EE" : model.current.Type == 2 ? "#ffff19" : model.current.Type == 3 ? "#194fff" : "#ffffff";
                model.markerIcon = { path: model.bikeSymbol[ (!model.isStarted ? 0 : model.hasTrouble ? 2 :  1)], scale: 5,  fillColor: fColor, fillOpacity: 1, strokeWeight: 2, rotation: 0 }; //google.maps.SymbolPath.FORWARD_CLOSED_ARROW
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
					model.infoBoxText.innerHTML = ctn;
					model.infoBox.open(model.map, this);  
				});
			}
        } else {
            // Update my icon and position
            model.currentPositionMarker.setPosition(curPos);
            // we need this one later for the compass.
            model.markerIcon = {
                path: model.bikeSymbol[ (!model.isStarted ? 0 : model.hasTrouble ? 2 : 1)], 
                scale: model.markerIcon.scale,  
                fillColor: model.current.Type == 1 ? "#DD88EE" : model.current.Type == 2 ? "#ffff19" : model.current.Type == 3 ? "#194fff" : "#ffffff", 
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
            if (model.offTimer) {
                window.clearTimeout(model.offTimer);
                model.offTimer = 0;
            }
            if (model.isStarted) {
                model.offTimer = window.setTimeout(function() {
                    if (model.current.Type > 0) {
                        // AutoStop ride if not mechanics
                        stopRide();
                    }
                }, 3600000);
            }
			
		}
		
		// update Riders every time, but only when started
//		if (model.isStarted) {
//			updateRWM(position.coords.latitude, position.coords.longitude);
//		}
	},
    
	_onError:function(error) {
        alert(model.dictionary.cannotGetLocation);
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