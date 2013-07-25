
function geolocationApp() {
}

function calcAngle(x1, y1, x2, y2) {
	// Rotationswinkel:
	var value = Math.atan2((y2 - y1), ((x2 - x1) != 0 ? (x2 - x1) : 0.000000000000000001));
	return 180 * value / Math.PI;
}

function afterShowMapTab() {
	if (model.map == undefined) {
		geolocationApp = new geolocationApp();
		geolocationApp.run();
	}
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
		firstRun = false;
		var googleBlock = document.getElementsByClassName("gmnoprint");

		for (var i = 0; i < googleBlock.length ; i++) {
			var block = googleBlock[i];
			var aLnk = block.getElementsByTagName("a");
			for (var j = 0; j < aLnk.length; j++) {
				aLnk[j].removeAttribute("href");
			}
		}
	}

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
	for (var i = 0; i < model.markersArray.length; i++) {
		model.markersArray[i].setMap(null);
	}
	for (var i = 0; i < model.polylineArray.length; i++) {
		model.polylineArray[i].setMap(null);
	}
	for (var i = 0; i < model.mechanicMarkersArray.length; i++) {
		model.mechanicMarkersArray[i].setMap(null);
	}
	model.markersArray = [];
	model.polylineArray = [];
	model.mechanicMarkersArray = [];
	
	// Lookup my biker IDs
	var myBikeIds = [];
	for (var l = 0; l < model.bikersArray.length; l++) {
		myBikeIds[l] = model.bikersArray[l].RiderId;
	}
	
	// Loop for all the riders, excluding myself
	for (var i = 0; i < model.riderData.length; i++) {
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
				var insetVert = (ne.lat() - sw.lat()) / 80;  // Used to position arrows inside the top/bottom edge
				var insetHorz = (ne.lng() - sw.lng()) / 80;  // Used to position arrows inside the left/right edge
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
				ctn += '</div></font>';
				model.infoBoxText.innerHTML = ctn;
				model.infoBox.open(model.map, this);  
			});
		}
	}
}

function updateRWM(lat, lon) {
	if (model.current.RiderId == undefined)
		return;
	var typestyle = model.current.Type * 10 + model.current.Style;
	if (model.hasTrouble)
		typestyle = -1;
	var showAll = $("#cbOneOrAllTypes").val() == "on" ? "true" : "false";
	var myUrl = urls.updateRWMUrl + "riderId=" + model.current.RiderId + "&lat=" + lat + "&lon=" + lon + "&heading=" + model.markerIcon.rotation + 
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
				console.log("Error retrieving string");
			},
			error: function (xhr, status, error) {
				console.log("UpdateRWM" + ':' + error);
			}
		});
	}
}

function refreshMap() {
	if (model.timer) {
		window.clearTimeout(model.timer);
		model.timer = 0;
	}
	
	var options = {
		enableHighAccuracy: true,
		maximumAge: 0 // parseInt($("#txtUpdateFrequency").val()) / 2
	};
	navigator.geolocation.getCurrentPosition(
		function() {
			geolocationApp._onSuccess.apply(geolocationApp, arguments);
		},
		function() {
			geolocationApp._onError();
		}, 
		options)
		
	// Start an automatic refresh timer if we are running
	if (model.isStarted) {
		model.timer = window.setTimeout(function() {
			refreshMap();
		}, model.refreshTime);
	}
}

function zoomToDefault() {
	model.map.panTo(model.currentPositionMarker.position);
	model.map.setZoom(15);
}

geolocationApp.prototype = {
    
	run:function() {
		this._handleWatch();
	},
    
	_handleWatch:function() {
		var that = this;
		
		that._setResults(model.dictionary.waitingForGeolocationInformation);
		//refreshMap();
	},
    
	_onSuccess:function(position) {
		// Successfully retrieved the geolocation information. Display it all.
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
		if (model.currentPositionMarker == undefined) {
			if (model.current && model.current.Type) {
				var fColor = model.current.Type == 1 ? "#DD88EE" : model.current.Type == 2 ? "#ffff19" : model.current.Type == 3 ? "#194fff" : "#ffffff";
				model.markerIcon = { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 5,  fillColor: fColor, fillOpacity: 1, strokeWeight: 1, rotation: 0 };
				model.currentPositionMarker = new google.maps.Marker({
					map: model.map,
					position: curPos,
					icon: model.markerIcon
				});
				var can = $("#map-canvas");
				can.css("height", can[0].parentElement.clientHeight);
                
                // click on my own arrow
                google.maps.event.addListener(model.currentPositionMarker, 'click', function() {
                    var ctn = '<img src="' + (model.isStarted ? "images/Stop.png" : "images/Start.png") + '" style="width: 80px; margin-left: 10px;" onclick="startRide()" />';

                    if (model.current.Type != 0) {
                        ctn = '<span>' + ctn + '<img src="' + (model.hasTrouble ? "images/WrenchButtonOn.png": "images/WrenchButtonNeutral.png") + '" style="width: 80px; margin-left: 20px;" onclick="startStopTrouble()" class="mechanic"/></span>';                       
                    }
                    model.infoBoxText.innerHTML = ctn;
                    model.infoBox.open(model.map, this);
                 
                });
                
			}
		}
		if (model.prevLat != position.coords.latitude || model.prevLon != position.coords.longitude) {
			if (model.currentPositionMarker) {
				model.currentPositionMarker.setPosition(curPos);
				// we need this one later for all the other markers and their paths.
				// ToDo:  If I am broken, make my icon a wrench instead of arrow
				model.markerIcon = {
					path: model.markerIcon.path, 
					scale: model.markerIcon.scale,  
					fillColor: model.markerIcon.fillColor, 
					fillOpacity: model.markerIcon.fillOpacity, 
					strokeWeight: model.markerIcon.strokeWeight,
					rotation: model.markerIcon.rotation
				};
				model.currentPositionMarker.setIcon(model.markerIcon);
			
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
			
				var speed = position.coords.speed;
				if (speed > 1.5) {
					// We are moving more than 1.5 meter per second.  Auto pan
					model.map.panTo(model.currentPositionMarker.position);
				}
			
				// Setup refresh rate based upon current speed
				if (speed > 20) {
					// > 72 kph
					model.refreshTime = model.refreshBase;
				}
				else if (speed > 15) {
					// 54 kph
					model.refreshTime = model.refreshBase * 2;				
				}
				else if (speed > 10) {
					// 36 kph
					model.refreshTime = model.refreshBase * 3;				
				}
				else if (speed > 5) {
					// 18 kph
					model.refreshTime = model.refreshBase * 4;				
				}
				else {
					// moving slower than 18 kph
					model.refreshTime = model.refreshBase * 6;
				}
			}
		}
		
		// update Riders every time, but only when started
		if (model.isStarted) {
			updateRWM(position.coords.latitude, position.coords.longitude);

			// Save the previous position
			model.prevLat = position.coords.latitude;
			model.prevLon = position.coords.longitude;
		}
	},
    
	_onError:function(error) {
		// ToDo:  better than this!
		$("#status").html('Fehla');
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