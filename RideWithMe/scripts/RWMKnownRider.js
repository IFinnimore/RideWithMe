var ridersInContacts;

function addToKnownRiders(newKnownRiderId) {
	if (ridersInContacts == undefined)
		ridersInContacts = [];
    if (ridersInContacts.indexOf(newKnownRiderId) < 0)
	    ridersInContacts[ridersInContacts.length] = newKnownRiderId;
}

function refreshKnownRiders() {
	ridersInContacts = [];
/*	var fields = ["phoneNumbers"];
	var options = new ContactFindOptions();
	options.filter = "#rwmid#";
	options.multiple = true;
	navigator.contacts.find(fields, onFindKnownRidersSuccess, onFindKnownRidersError, options);*/
    refreshContacts();  // Full contacts refresh
}

function isKnownRider(thisRiderId) {
	for (var r in ridersInContacts) {
		if (ridersInContacts[r] == thisRiderId) {
			return true;
		}
	}
	return false;
}

var localCtn;
function getKnownRiderInfo(thisRiderId, ctn) {
    var fields = ["name", "displayName", "photos", "phoneNumbers", "id"];
	var options = new ContactFindOptions();
	options.filter = "#rwmid#" + thisRiderId;
	options.multiple = true;
    localCtn = ctn;
    if (!simulator)
	    navigator.contacts.find(fields, onGetKnownRiderInfoSuccess, onGetKnownRiderInfoError, options);
    else {
        var ctk = [ {name:"Ian Finnimore", displayName:"Ian Finnimore", photos:"images/simulator/ian.jpg", phoneNumbers: [], id: "1"}];
        onGetKnownRiderInfoSuccess(ctk);
    }
}

function onGetKnownRiderInfoDone(rider, content) {
	var re = new RegExp('##RiderName##', 'g');
	content = content.replace(re, rider.displayName);
	if (rider.photos != null) {
		content = content.replace('##RiderPhoto##', '<img src="' + rider.photos[0].value + '" style="width: 80px;"/>');
	}
	else {
		content = content.replace('##RiderPhoto##', '');
	}
}

function onGetKnownRiderInfoSuccess(contacts) {
    onGetKnownRiderInfoDone(contacts[0], localCtn);
    localCtn = null;
}

function onGetKnownRiderInfoError(contactsError){
    console.log("Error onGetKnownRiderInfoError: " + contactsError);
    localCtn = null;
}