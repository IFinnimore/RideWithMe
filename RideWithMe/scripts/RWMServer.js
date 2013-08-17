var cachedURL = "";
var callback = null;

var sessionID = "0"
var AppID = "597A6485-F002-43F8-84A7-282779A34C26"

function handleAjaxError(xhr, status, error) {
    if (xhr && xhr.status == 401) {
        if (!(navigator.connection.type == Connection.NONE)) {
            // Get a new session ID
            $.ajax({
                type: "POST",
                url: urls.newSessionID,
                contentType: "application/json; charset=utf-8",
                crossDomain: true,
                dataType: "json",
                data: JSON.stringify(AppID),
                timeout: 15000,
                success: function (data) {
                    // We got a new sessionID
                    sessionID = data.sessionID;
                
                    // redo the original call
                    if (callback)
                        callback();
                },
                fail: function () {
                    // Failed again
                }
            });
        }
    } else {
        // TODO: log error
    }
}

function getNewId() {
	if (!(navigator.connection.type == Connection.NONE)) {
        
        // TODO: add session ID
        cachedURL = urls.getRiderIdUrl;
        callback = getNewId;
        
		$.ajax({
			type: "GET",
			url: urls.getRiderIdUrl,
			contentType: "application/json; charset=utf-8",
			crossDomain: true,
			dataType: "json",
			timeout: 15000,
			success: function (data) {
                $("#devToolsReplies").html("GetID: " + data);
				$("#txtRiderId").val(data);
			},
			fail: function () {
				$("#devToolsReplies").html("Error retrieving string");
			},
			error: handleAjaxError
		});
	}
}

function getId() {
	if (!(navigator.connection.type == Connection.NONE)) {

        // TODO: add session ID
        cachedURL = urls.getRiderIdUrl;
        callback = getId;
        
		$.ajax({
			type: "GET",
			url: urls.getRiderIdUrl,
			contentType: "application/json; charset=utf-8",
			crossDomain: true,
			dataType: "json",
			timeout: 15000,
			success: function (data) {
                cachedURL = "";
                callback = null;
				$("#txtRiderId").val(data);
			},
			fail: function () {
				$("#devToolsReplies").html("Error retrieving string");
			},
			error: handleAjaxError
		});
	}
} 

function UpdateRWMServer(riderId, lat, lng, heading, riderType, rideStyle, hasTrouble, showAll, pelSize, successCallback) {
    if (!(navigator.connection.type == Connection.NONE)) {
        var typestyle = riderType * 10 + rideStyle;
        if (hasTrouble)
            typestyle = -1;

        var myUrl = urls.updateRWMUrl + "riderId=" + riderId + "&lat=" + lat + "&lon=" + lng + "&heading=" + heading + 
                    "&type=" + typestyle + "&pelSize=" + pelSize + "&showAll=" + showAll + "&ts=" + new Date().getTime();
        
        if (cachedURL != "")
            myUrl = passedURL;
        else
            cachedURL= myUrl;
        callback= UpdateRWMServer;
        
        // TODO: add session ID
        myUrl += "" // + sessionID
        
        $.ajax({
            type: "GET",
            url: myUrl,
            contentType: "application/json; charset=utf-8",
            crossDomain: true,
            dataType: "json",
            timeout: 15000,
            success: function(data) {
                cachedURL = "";
                callback = null;
                UpdateRiderData(data);
            },
            error: handleAjaxError
        });
    }
}