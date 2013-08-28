var ridersInContacts;

function addToKnownRiders(newKnownRiderId) {
	if (ridersInContacts == undefined)
		ridersInContacts = [];
    if (ridersInContacts.indexOf(newKnownRiderId) < 0)
	    ridersInContacts[ridersInContacts.length] = newKnownRiderId;
}

function removeFromKnownRiders(oldKnownRiderId) {
    if (ridersInContacts == undefined) return;
    
    for (var r=ridersInContacts.length;r>=0;--r) {
        if (ridersInContacts[r] == oldKnownRiderId) {
            ridersInContacts.splice(r, 1);
        }
    }
}

function refreshKnownRiders() {
	ridersInContacts = [];
    refreshContacts();  // Full contacts refresh refreshes me too!
}

function isKnownRider(thisRiderId) {
	for (var r in ridersInContacts) {
		if (ridersInContacts[r] == thisRiderId) {
			return true;
		}
	}
	return false;
}

function getKnownRiderInfo(thisRiderId) {
    var fields = ["name", "displayName", "photos", "phoneNumbers", "id"];
	var options = new ContactFindOptions();
	options.filter = "#rwmid#" + thisRiderId;
	options.multiple = false;
    if (!isSimulator())
	    navigator.contacts.find(fields, onGetKnownRiderInfoSuccess, onGetKnownRiderInfoError, options);
    else {
        var ctk = [ {name:{formatted:"Ian Finnimore"}, displayName:"Ian Finnimore", photos:[{value: "./images/simulator/ian.jpg"}], phoneNumbers: [], id: "1"}];
        onGetKnownRiderInfoSuccess(ctk);
    }
}

function onGetKnownRiderInfoDone(rider) {
    try {
        if (!model.infoBox)
            return;
        var content = model.infoBox.getContent();
        
        var re = new RegExp('##RiderName##', 'g');
    
        content = content.replace(re, rider.name.formatted);
        if (rider.photos != null) {
            content = content.replace('<div style="height: 80px">##RiderPhoto##</div>', '<img src="' + rider.photos[0].value + '" style="height: 80px;"/>');
        }
        else {
            content = content.replace('<div style="height: 80px">##RiderPhoto##</div>', '');
        }
        console.log("rider: " + JSON.stringify(rider));
        
        model.infoBox.setContent(content);
    }
    catch (err) {
        console.log("onGetKnownRiderInfoDone: Error" + err + "\n" + JSON.stringify(rider));
    }
}

function onGetKnownRiderInfoSuccess(contacts) {
    onGetKnownRiderInfoDone(contacts[0]);
}

function onGetKnownRiderInfoError(contactsError){
    console.log("Error onGetKnownRiderInfoError: " + contactsError);
}