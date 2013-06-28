var map, currentPositionMarker, mapCenter, riderId, geoLoc, prevLat, prevLon, markerIcon, timer, markersArray, isStarted;

function geolocationApp() {
}

document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
	var frequ = localStorage.getItem("locFrequency");
	if (frequ != undefined)
		$("#txtUpdateFrequency").val(frequ);
	markersArray = [];
	getId();
	isStarted = false;
}

function getId() {
	var localRiderID = localStorage.getItem("locRiderId");
	if (localRiderID == undefined) {
		$.ajax({
			type: "GET",
			url: "http://85.124.19.16/IFServices/RideWithMeService.svc/GetNewRiderID",
			contentType: "application/json; charset=utf-8",
			crossDomain: true,
			dataType: "json",
			timeout: 15000,
			success: function (data) {
				riderId = data;
				localStorage.setItem("locRiderId", data);
				$("#devToolsReplies").html("Rider Id: " + riderId);
			},
			fail: function () {
				$("#devToolsReplies").html("Error retrieving string");
			},
			error: function (xhr, status, error) {
				$("#devToolsReplies").html("GetId: " + error);
			}

		});
	}
	else {
		riderId = localRiderID;
	}
} 

function writeGeoDataToServer(lat, lon, acc) {
	var myUrl = "http://85.124.19.16/IFServices/RideWithMeService.svc/CollectGeoData/?id=" + riderId + "&latitude=" + lat + "&longitude=" + lon + "&accuracy=" + acc + "&tmstamp=" + new Date().getTime();
	$.ajax({
		type: "GET",
		url: myUrl,
		contentType: "application/json; charset=utf-8",
		crossDomain: true,
		dataType: "json",
		timeout: 15000,
		success: function (data) {
			$("#results3").html("Datens.: " + data);
		},
		fail: function () {
			$("#results3").html("Error retrieving string");
		},
		error: function (xhr, status, error) {
			$("#devToolsReplies").html("WriteGeoDataToServer" + ':' + error);
		}

	});
} 

function startRide() {
	isStarted = !isStarted;
	if (isStarted) {
		location.href = "#tabstrip-map";   
		$("#imgStartStop").attr("src", "images/Stop.png");
	}
	else {
		$("#imgStartStop").attr("src", "images/Start.png");
	}
}

function updateFrequency() {
	localStorage.setItem("locFrequency", $("#txtUpdateFrequency").val());
}

function calcAngle(x1, y1, x2, y2) {
	// Rotationswinkel:
	var value = Math.atan2((y2 - y1), ((x2 - x1) != 0 ? (x2 - x1) : 0.000000000000000001));
	return 180 * value / Math.PI;
}

function showMapTab() {
	if (map == undefined) {
		geolocationApp = new geolocationApp();
		geolocationApp.run();
	}
}

function updateRWM(lat, lon) {
	if (riderId == undefined)
		return;
	var myUrl = "http://85.124.19.16/IFServices/RideWithMeService.svc/UpdateRwm/?riderId=" + riderId + "&lat=" + lat + "&lon=" + lon + "&heading=0&type=1&pelSize10&showAll=true&ts=" + new Date().getTime();
	$.ajax({
		type: "GET",
		url: myUrl,
		contentType: "application/json; charset=utf-8",
		crossDomain: true,
		dataType: "json",
		timeout: 15000,
		success: function (data) {
			for (var i = 0; i < markersArray.length; i++) {
				markersArray[i].setMap(null);
			}
			markersArray = [];
			for (var i = 0; i < data.length; i++) {
				if (data[i].RiderId != riderId) {
					var pos = new google.maps.LatLng(data[i].Lat, data[i].Lon);
					var angle = calcAngle(data[i].PLat, data[i].PLon, data[i].Lat, data[i].Lon);
					var mIcon = { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 6,  fillColor: '#88DD33', fillOpacity: 1, strokeWeight: 1, rotation: angle };
					markersArray[i] = new google.maps.Marker({
						map: map,
						position: pos,
						icon: mIcon
					});
				}
			}
		},
		fail:
		function () {
			$("#results3").html("Error retrieving string");
		},
		error
		: function (xhr, status, error) {
			$("#devToolsReplies").html("UpdateRWM" + ':' + error);
		}
	});
}

function editBike(bikeID){
    $("#test").html(bikeID);
    location.href="#bike-details";
}

geolocationApp.prototype = {
    
	run:function() {
		this._handleWatch();
	},
    
	_handleWatch:function() {
		// Update the watch every second.
		var that = this;
		var refreshTime = parseInt($("#txtUpdateFrequency").val());
		var options = {
			enableHighAccuracy: true
		};
		that._setResults("Waiting for geolocation information...");
		geoLoc = navigator.geolocation;
		geoLoc.getCurrentPosition(
			function() {
				that._onSuccess.apply(that, arguments);
			},
			function() {
				that._onError();
			}, 
			options)
		timer = window.setInterval(function() {
			geoLoc.getCurrentPosition(
				function() {
					that._onSuccess.apply(that, arguments);
				},
				function() {
					that._onError();
				}, 
				options)
		}
        , refreshTime);
	},
    
	_onSuccess:function(position) {
		// Successfully retrieved the geolocation information. Display it all.
		var curPos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
		if (map == undefined) {
			map = new google.maps.Map(document.getElementById('map-canvas'), {
				sensor: true,
				zoom: 15,
				center: curPos,
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				panControl: false,
				streetViewControl: false,
				zoomControl: false
			});
			markerIcon = { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 6,  fillColor: '#DD88EE', fillOpacity: 1, strokeWeight: 1, rotation: 0 };
			currentPositionMarker = new google.maps.Marker({
				map: map,
				position: curPos,
				icon: markerIcon
			});
            var can = $("#map-canvas");
            can.css("height", can[0].parentElement.clientHeight);
			updateRWM(position.coords.latitude, position.coords.longitude);
		}
		else {
			if (prevLat != position.coords.latitude || prevLon != position.coords.longitude) {
				map.panTo(curPos);
				currentPositionMarker.setPosition(curPos);
				var angle = calcAngle(prevLat, prevLon, position.coords.latitude, position.coords.longitude);
				$("#status").html(angle);
				markerIcon = {
					path: markerIcon.path, 
					scale: markerIcon.scale,  
					fillColor: markerIcon.fillColor, 
					fillOpacity: markerIcon.fillOpacity, 
					strokeWeight: markerIcon.strokeWeight, 
					rotation: angle
				};
				currentPositionMarker.setIcon(markerIcon);
				writeGeoDataToServer(position.coords.latitude, position.coords.longitude, position.coords.accuracy)
			}
			updateRWM(position.coords.latitude, position.coords.longitude);
		}
		prevLat = position.coords.latitude;
		prevLon = position.coords.longitude;
	},
    
	_onError:function(error) {
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