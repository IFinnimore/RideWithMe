


function getAllKeys(item) {
	var keys = Object.keys(item);
	var keysstr = ""
	for (var i = 0; i < keys.length; i++) {
		keysstr += "<li>" + keys[i] + "</li>";
	}
	return keysstr;
}

function getAllValues(item) {
	var valuestr = "";
	for (var key in item) {
		valuestr += "<li>" + item[key] + "</li>";
	}
	return valuestr;
}

function writeGeoDataToServer(lat, lon, acc) {
	var myUrl = urls.writeGeoDataUrl + "id=" + model.current.RiderId + "&latitude=" + lat + "&longitude=" + lon + "&accuracy=" + acc + "&tmstamp=" + new Date().getTime();
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

function searchContacts() {
	// used in devtools
	var options = new ContactFindOptions();
	options.filter = "183";
	options.multiple = true;
	var fields = ["id", "name", "displayName", "phoneNumbers"];
	navigator.contacts.find(fields, onContact2Success, onContactError, options);
	/*var contacts = []
	contacts[0] = {id: "123", displayName: "Melanie Jaros", phoneNumbers: null};
	contacts[1] = {id: "223", displayName: "Gerhard Jaros", phoneNumbers: null};
	contacts[2] = {id: "323", displayName: "Mario Fernsebner", phoneNumbers: null};
	contacts[3] = {id: "423", displayName: "Markus Egger", phoneNumbers: null};
	contacts[4] = {id: "523", displayName: "Georg Segl", phoneNumbers: null};
	contacts[5] = {id: "623", displayName: "Roman Innerhofer", phoneNumbers: null};
	contacts[6] = {id: "723", displayName: "Ian Finnimore", phoneNumbers: null};
	onContact2Success(contacts);
	return;
	var ctct = navigator.contacts.create();
	ctct.displayName = "Vittoria";
	ctct.nickname = "Vittoria";
	var name = new ContactName();
	name.givenName = "Vittoria";
	name.familyName = "Cellargo";
	ctct.name = name;
	var phones = [];
	phones[0] = new ContactField('work', '+43 650 5413 513', true);
	phones[1] = new ContactField('other', '#rwmid#56487933', false);
	ctct.phoneNumbers = phones;
	ctct.save(onSaveSuccess, onSaveError);*/
}

function onContact2Success(contacts) {
	//devtools
	for (var ct in contacts) {
		alert(contacts[ct].id);
	}
}

function status(statustext) {
    $("#statusList").html('<li>' + statustext + '</li>' + $("#statusList").html());
}