var cachedURL = "";
var callback = null;

var sessionID = "0";
var AppID = "AC867003-5800-44AC-BDFA-1F46A34D0298";

function failedGetNewSessionID() {
    // Failed again
    // Cause of second failure is commonly undetected non-network communications e.g. has Data Connection but out of credits.
    // Indicate offline and setup a retry timer here
    onConnectionOffline();
            
    window.setTimeout(function() {
        getNewSessionID();
    }, 15000);
}

function getNewSessionID() {
    if (!(navigator.connection.type == Connection.NONE)) {
        // Get a new session ID
        $.ajax({
            type: "POST",
            url: urls.newSessionID,
            contentType: "application/json; charset=utf-8",
            crossDomain: true,
            dataType: "json",
            data: JSON.stringify({ "AppId": AppID }),
            timeout: 15000,
            success: function (data) {
                // We got a new sessionID
                sessionID = data;
                
                // redo the original call
                if (callback) {
                    window.setTimeout(function() {
                        callback();
                    }, 1);
                }
            },
            error: failedGetNewSessionID,
            fail: failedGetNewSessionID
        });    
    }
}

function handleAjaxError(xhr, status, error) {
    if (xhr && xhr.status == 412) {
        // 412 means need new session ID
        if (!(navigator.connection.type == Connection.NONE)) {
            getNewSessionID();
        }
    } else {
        console.log('handleAjaxError: ' + JSON.stringify(xhr));
    }
}

function getNewId() {
	if (!(navigator.connection.type == Connection.NONE)) {

        // TODO: add session ID
        if (cachedURL == "")
            cachedURL = urls.getRiderIdUrl;
        
        callback = getNewId;
        
        if (sessionID=="0") {
            getNewSessionID();
            return;
        }
        
		$.ajax({
			type: "GET",
			url: cachedURL + "&sessionKey=" + sessionID,
			contentType: "application/json; charset=utf-8",
			crossDomain: true,
			dataType: "json",
			timeout: 15000,
			success: function (data) {
                cachedURL = "";
                callback = null;
				$("#txtRiderId").val(data);
			},
			error: handleAjaxError,
			fail: handleAjaxError
		});
	}
} 

var afterSuccess;
function UpdateRWMServer(riderId, lat, lng, heading, riderType, rideStyle, hasTrouble, showAll, pelSize, successCallback) {
    if (!(navigator.connection.type == Connection.NONE)) {

        var myUrl = ""
                
        if (cachedURL != "") {
            myUrl = cachedURL;
        } else {
            // save the callback only if not cachedURL
            afterSuccess = successCallback;

            var typestyle = riderType * 10 + rideStyle;
            if (hasTrouble)
                typestyle = -1;

            myUrl = urls.updateRWMUrl + "riderId=" + riderId + "&lat=" + lat.toFixed(5) + "&lon=" + lng.toFixed(5) + "&heading=" + heading + 
            "&type=" + typestyle + "&pelSize=" + pelSize + "&showAll=" + showAll + "&ts=" + new Date().getTime();
        }
        
        cachedURL = myUrl;
        
        callback= UpdateRWMServer;
        
        if (sessionID=="0") {
            getNewSessionID();
            return;
        }
        
        // Add session ID
        myUrl += "&sessionKey=" + sessionID;
        
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
                if (afterSuccess)
                    afterSuccess(data);
            },
            fail: handleAjaxError,
            error: handleAjaxError
        });
    }
}

