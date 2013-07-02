var urls;

function model() {
	this.map;
	this.currentPositionMarker;
	this.riderId;
	this.geoLoc;
	this.prevLat;
	this.prevLon;
	this.markerIcon;
	this.timer;
	this.markersArray;
	this.isStarted;
	this.bikersArray;
}

function geolocationApp() {
}

function model() {
}

document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
	//localStorage.clear();
	urls = {
		getRiderIdUrl: "http://85.124.19.16/IFServices/RideWithMeService.svc/GetNewRiderID",
		writeGeoDataUrl: "http://85.124.19.16/IFServices/RideWithMeService.svc/CollectGeoData/?",
		updateRWMUrl: "http://85.124.19.16/IFServices/RideWithMeService.svc/UpdateRwm/?",
	}
	var frequ = localStorage.getItem("locFrequency");
	if (frequ != undefined)
		$("#txtUpdateFrequency").val(frequ);
	model = new model();
	model.markersArray = [];
	model.isStarted = false;
	loadListOfBikes();
	checkForFirstBike();
}

function checkForFirstBike() {
	if (model.bikersArray.length == 0) {
		$("#txtBikeID").val(getBikeId());
		getId();
		saveBike();
		location.href = "#tabstrip-bikes";
	}
}

function getNewId() {
	getId();
}

function getId() {
	if (model.RiderId == undefined) {
		$.ajax({
			type: "GET",
			url: urls.getRiderIdUrl,
			contentType: "application/json; charset=utf-8",
			crossDomain: true,
			dataType: "json",
			timeout: 15000,
			success: function (data) {
				model.riderId = data;
				$("#txtRiderId").val(model.riderId);
			},
			fail: function () {
				$("#devToolsReplies").html("Error retrieving string");
			},
			error: function (xhr, status, error) {
				$("#devToolsReplies").html("GetId: " + error);
			}

		});
	}
} 

function writeGeoDataToServer(lat, lon, acc) {
	var myUrl = urls.writeGeoDataUrl + "id=" + model.riderId + "&latitude=" + lat + "&longitude=" + lon + "&accuracy=" + acc + "&tmstamp=" + new Date().getTime();
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
	model.isStarted = !model.isStarted;
	if (model.isStarted) {
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
	if (model.map == undefined) {
		geolocationApp = new geolocationApp();
		geolocationApp.run();
	}
}

function updateRWM(lat, lon) {
	if (model.riderId == undefined)
		return;
	var myUrl = urls.updateRWMUrl + "riderId=" + model.riderId + "&lat=" + lat + "&lon=" + lon + "&heading=0&type=1&pelSize=10&showAll=true&ts=" + new Date().getTime();
	$.ajax({
		type: "GET",
		url: myUrl,
		contentType: "application/json; charset=utf-8",
		crossDomain: true,
		dataType: "json",
		timeout: 15000,
		success: function (data) {
			for (var i = 0; i < model.markersArray.length; i++) {
				model.markersArray[i].setMap(null);
			}
			model.markersArray = [];
			for (var i = 0; i < data.length; i++) {
				if (data[i].RiderId != model.riderId) {
					var pos = new google.maps.LatLng(data[i].Lat, data[i].Lon);
					var angle = calcAngle(data[i].PLat, data[i].PLon, data[i].Lat, data[i].Lon);
					var mIcon = { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 6,  fillColor: '#88DD33', fillOpacity: 1, strokeWeight: 1, rotation: angle };
					model.markersArray[i] = new google.maps.Marker({
						map: model.map,
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

function editBike(bikeID) {
	$("#txtDescription").val('do samma');
	//location.href = "#tabstrip-bikes";
}

function saveBike() {
	var id = $("#txtBikeID").val();
	if (id == undefined)
		id = getBikeId();
	var bike = {ID: id, RiderID: model.RiderId, Description: $("#txtDescription").val(), Type: $("#selType")[0].selectedIndex, Style: $("#selStyle")[0].selectedIndex};
	syncListOfBikes(bike);
}

function getBikeId() {
	return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}

function syncListOfBikes(bike) {
	if (model.bikersArray == undefined)
		model.bikersArray = [];
	var bikeNumber = model.bikersArray.length;
	for (var i = 0; i < model.bikersArray.length; i++) {
		if (model.bikersArray[i].ID == bike.ID) {
			bikeNumber = i;
			break;
		}
	}
	model.bikersArray[bikeNumber] = bike;
	localStorage.setItem("Bikes", JSON.stringify(model.bikersArray));
}

function loadListOfBikes() {
	var bikes = localStorage.getItem("Bikes");
	if (bikes != undefined) {
		model.bikersArray = JSON.parse(bikes);
		showAllBikesInList();
	}
	else
		model.bikersArray = [];
}

function showAllBikesInList() {
	var lis = "";
	for (var i = 0; i < model.bikersArray.length; i++) {
		var content = model.bikersArray[i].Description;
		if (content == "")
			content = model.bikersArray[i].RiderId;
		lis += '<li><a href="#tabstrip-bikes" onclick="editBike(\'' + model.bikersArray[i].ID + '\')">' + content + "</a></li>";
	}
	$("#lstBikes").html(lis);
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
		model.geoLoc = navigator.geolocation;
		model.geoLoc.getCurrentPosition(
			function() {
				that._onSuccess.apply(that, arguments);
			},
			function() {
				that._onError();
			}, 
			options)
		model.timer = window.setInterval(function() {
			model.geoLoc.getCurrentPosition(
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
		if (model.map == undefined) {
			model.map = new google.maps.Map(document.getElementById('map-canvas'), {
				sensor: true,
				zoom: 15,
				center: curPos,
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				panControl: false,
				streetViewControl: false,
				zoomControl: false
			});
			model.markerIcon = { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 6,  fillColor: '#DD88EE', fillOpacity: 1, strokeWeight: 1, rotation: 0 };
			model.currentPositionMarker = new google.maps.Marker({
				map: model.map,
				position: curPos,
				icon: model.markerIcon
			});
			var can = $("#map-canvas");
			can.css("height", can[0].parentElement.clientHeight);
			updateRWM(position.coords.latitude, position.coords.longitude);
		}
		else {
			if (model.prevLat != position.coords.latitude || model.prevLon != position.coords.longitude) {
				model.map.panTo(curPos);
				model.currentPositionMarker.setPosition(curPos);
				var angle = calcAngle(model.prevLat, model.prevLon, position.coords.latitude, position.coords.longitude);
				$("#status").html(angle);
				model.markerIcon = {
					path: model.markerIcon.path, 
					scale: model.markerIcon.scale,  
					fillColor: model.markerIcon.fillColor, 
					fillOpacity: model.markerIcon.fillOpacity, 
					strokeWeight: model.markerIcon.strokeWeight, 
					rotation: angle
				};
				model.currentPositionMarker.setIcon(model.markerIcon);
				writeGeoDataToServer(position.coords.latitude, position.coords.longitude, position.coords.accuracy)
			}
			updateRWM(position.coords.latitude, position.coords.longitude);
		}
		model.prevLat = position.coords.latitude;
		model.prevLon = position.coords.longitude;
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