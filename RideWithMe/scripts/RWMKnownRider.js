var ridersInContacts;


function onGetKnownRiderInfoDone(rider) {
	var re = new RegExp('##RiderName##', 'g');
	model.infoBoxText.innerHTML = model.infoBoxText.innerHTML.replace(re, rider.displayName);
	model.infoBoxText.innerHTML = model.infoBoxText.innerHTML.replace('##RiderContactID##', rider.id);
	if (rider.photos != null) {
		model.infoBoxText.innerHTML = model.infoBoxText.innerHTML.replace('##RiderPhoto##', '<img src="' + rider.photos[0].value + '" style="width: 80px;"/>');
	}
	else {
		model.infoBoxText.innerHTML = model.infoBoxText.innerHTML.replace('##RiderPhoto##', '');
	}
}
/*
function onRefreshKnownRidersDone(knownRiders) {
	model.knownRiderMarkersArray = [];
	for (var knRr in knownRiders) {
		for (var mrk in model.markersArray) {
			if (knownRiders[knRr] == model.markersArray[mrk].rider.RiderId) {
				model.knownRiderMarkersArray[model.knownRiderMarkersArray.length] = new google.maps.Marker({
					map: model.map,
					position:  model.markersArray[mrk].position,
					icon: 'images/contactsml.png'
				});
			}
		}
	}
}*/


function addToKnwonRiders(newKnownRiderId) {
	if (ridersInContacts == undefined)
		ridersInContacts = [];
	ridersInContacts[ridersInContacts.length] = newKnownRiderId;
}

function refreshKnownRiders() {
	ridersInContacts = [];
	var fields = ["phoneNumbers"];
	var options = new ContactFindOptions();
	options.filter = "#rwmid#";
	options.multiple = true;
	navigator.contacts.find(fields, onFindKnownRidersSuccess, onFindKnownRidersError, options);
}

function onFindKnownRidersSuccess(contacts) {
	for (var c in contacts) {
		if (contacts[c].phoneNumbers != null) {
			for (var p in contacts[c].phoneNumbers) {
				if (contacts[c].phoneNumbers[p].value.indexOf("#rwmid#") == 0) {
					ridersInContacts[ridersInContacts.length] = contacts[c].phoneNumbers[p].value.substr(7);
				}
			}
		}
	}
}

function onFindKnownRidersError(error) {
	console.log("Fehler onFindKnownRidersError: " + error);
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
	options.multiple = true;
	navigator.contacts.find(fields, onGetKnownRiderInfoSuccess, onGetKnownRiderInfoError, options);
}

function onGetKnownRiderInfoSuccess(contacts) {
    onGetKnownRiderInfoDone(contacts[0]); // RideWithMe.js
}

function onGetKnownRiderInfoError(contactsError){
    console.log("Error onGetKnownRiderInfoError: " + contactsError);
}