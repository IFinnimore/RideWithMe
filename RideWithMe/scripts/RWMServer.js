var cachedURL = "";
var callback = null;

var sessionID = "0"
var AppID = "AC867003-5800-44AC-BDFA-1F46A34D0298"

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
                data: JSON.stringify({ "AppId": AppID }),
                timeout: 15000,
                success: function (data) {
                    // We got a new sessionID
                    sessionID = data;
                
                    // redo the original call
                    if (callback)
                        callback();
                },
                error: function (xhr, status, error) {
                    // Failed again
                    // TODO: Handle second failure
                    alert("handleAjaxError: " + error);
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
        if (cachedURL == "")
            cachedURL = urls.getRiderIdUrl;
        
        callback = getNewId;
        
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
            myUrl = cachedURL;
        else
            cachedURL= myUrl;
        callback= UpdateRWMServer;
        
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
                UpdateRiderData(data);
            },
            error: handleAjaxError
        });
    }
}

