function onContactError(contactError) {
	console.log(contactError);
	status(contactError);
}

var contactRiderId;

function showContacts(cRiderId) {
	contactRiderId = cRiderId;
	var options = new ContactFindOptions();
	options.filter = "";
	options.multiple = true;
	var fields = ["name", "displayName", "phoneNumbers", "id"];
	// real world
	navigator.contacts.find(fields, onContactSuccess, onContactError, options);
	return;
	// dev
	/*var contacts = []
	contacts[0] = {id: "123", displayName: "Melanie Jaros", name: {formatted: "Melanie Jaros"}, phoneNumbers: null};
	contacts[1] = {id: "223", displayName: "Gerhard Jaros", name: {formatted: "Gerhard Jaros"}, phoneNumbers: null};
	contacts[2] = {id: "323", displayName: "Mario Fernsebner", name: {formatted: "Mario Fernsebner"}, phoneNumbers: null};
	contacts[3] = {id: "423", displayName: "Markus Egger", name: {formatted: "Markus Egger"}, phoneNumbers: null};
	contacts[4] = {id: "523", displayName: "Georg Segl", name: {formatted: "Georg Segl"}, phoneNumbers: null};
	contacts[5] = {id: "623", displayName: "Roman Innerhofer", name: {formatted: "Roman Innerhofer"}, phoneNumbers: null};
	contacts[6] = {id: "723", displayName: "Ian Finnimore", name: {formatted: "Ian Finnimore"}, phoneNumbers: null};
	onContactSuccess(contacts);*/
}

var currentContactId;


function onContactSuccess(contacts) {
	var cdata = [];  
	for (var i = 0; i < contacts.length; i++) {
		cdata[i] = {letter:contacts[i].name.formatted.substr(0, 1), id: contacts[i].id, hasId: false, name2: contacts[i].name.formatted};
		if (contacts[i].phoneNumbers != null) {
			for (var j = 0; j < contacts[i].phoneNumbers.length; j++) {
				if (contacts[i].phoneNumbers[j].value.indexOf("#rwmid#") == 0) {
					cdata[0].hasId = true;
				}
			}
		}
	}
	$("#selContacts").kendoMobileListView({
		filterable:{field: "name2", operator:"contains"},
		sort: {field: "name2"},
		dataSource: kendo.data.DataSource.create({data: cdata, group: "letter"}),
		template: $("#contactsTemplate").html(),
		click: function(item) {
			if (confirm(model.dictionary.saveIDToContact.format(contactRiderId, item.dataItem.name2))) {
				var fields = ["id", "phoneNumbers"];
				var options = new ContactFindOptions();
				currentContactId = item.dataItem.id;
				options.filter = ""; //currentContactId;
				options.multiple = true;
				navigator.contacts.find(fields, onFindContactSuccess, onFindContactError, options);
			}
		}
	});
	location.href = "#tabstrip-contactlist";
}

function onFindContactSuccess(contacts) {
	for (var i = 0; i < contacts.length; i++) {
		if (contacts[i].id === currentContactId) {
			var contact = contacts[i];
			var pn = contact.phoneNumbers;
			if (pn == undefined || pn == null)
				pn = [];
			pn[pn.length] = new ContactField('other', '#rwmid#' + contactRiderId, false);
			//pn[pn.length] = new ContactField('other', 789789789, false);
			contact.phoneNumbers = pn;
			contact.save(onSaveSuccess, onSaveError);
			return;
		}
	}
}

function onFindContactError(error) {
	console.log(error);
}

function onSaveSuccess(contact) {
	alert(model.dictionary.riderIDSaved.format(contact.name.formatted));
	addToKnwonRiders(contactRiderId);
	showMapAfterContact();
}

function onSaveError(contactError) {
    alert('error');
	alert(contactError == null ? "contactError = 0" : contactError);
	alert(contactError.code);
	console.log("Error = " + contactError.code);
	showMapAfterContact();
}

function showMapAfterContact() {
	currentContactId = "";
	location.href = "#tabstrip-map";
	refreshMap();
}

function showContact(contactID, contactName) {
	console.log(contactID + ", " + contactName);
}