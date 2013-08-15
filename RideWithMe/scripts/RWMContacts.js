var localContacts = [];

var simulator = true;

var isNoContacts = false;

function contactsSimulatorData() {
    // sim data
        var contacts = [];
        contacts[0] = {id: "123", displayName: "Melanie Jaros", name: {formatted: "Melanie Jaros", familyName: "Jaros" }, phoneNumbers: null};
    	contacts[1] = {id: "223", displayName: "Gerhard Jaros", name: {formatted: "Gerhard Jaros", familyName: "Jaros"},  phoneNumbers: null};
    	contacts[2] = {id: "323", displayName: "Mario Fernsebner", name: {formatted: "Mario Fernsebner", familyName: "Fernsebner"}, phoneNumbers: null};
    	contacts[3] = {id: "423", displayName: "Markus Egger", name: {formatted: "Markus Egger", familyName: "Egger"}, phoneNumbers: null};
    	contacts[4] = {id: "523", displayName: "Georg Segl", name: {formatted: "Georg Segl", familyName: "Segl"}, phoneNumbers: null};
    	contacts[5] = {id: "623", displayName: "Roman Innerhofer", name: {formatted: "Roman Innerhofer", familyName: "Innerhofer"}, phoneNumbers: null};
    	contacts[6] = {id: "723", displayName: "Ian Finnimore", name: {formatted: "Ian Finnimore", familyName: "Finnimore"}
                , phoneNumbers: [{type: "home", value: "+386 30 313 933", pref: false}, {type: "other", value: "#rwmid#123456", pref: false}]};
    
        return contacts;
}


if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

var contactRiderId; // rider selected
var currentContact; // Selected contact to update

function refreshContacts() {
    // Reload the contacs array
    var options = new ContactFindOptions();
	options.filter = "";
	options.multiple = true;
	var fields = ["name", "displayName", "phoneNumbers", "id"];
    
    if (!simulator) {
        // lookup contacts
        navigator.contacts.find(fields, onRefreshContactSuccess, onFindContactError, options);
    } else {
        
        onRefreshContactSuccess(contactsSimulatorData());
    }
}

function onFindContactError(error) {

    switch (error.code) {
        case ContactError.UNKNOWN_ERROR:
        case ContactError.INVALID_ARGUMENT_ERROR:
        case ContactError.TIMEOUT_ERROR:
        case ContactError.PENDING_OPERATION_ERROR:
        case ContactError.IO_ERROR:
        case ContactError.NOT_SUPPORTED_ERROR:
        case ContactError.PERMISSION_DENIED_ERROR:
        default:
            isNoContacts = true;
            break;
    }
    
    showMapAfterContact();
}

function onRefreshContactSuccess(contacts) {
    localContacts = [];
    // Save contacts into local array
    for (var i = 0; i < contacts.length; i++) {
        localContacts[i] = {letter:contacts[i].name.familyName.substr(0, 1), id: contacts[i].id, showIcon: "none", name2: contacts[i].name.formatted, contact: contacts[i]};
        if (contacts[i].phoneNumbers != null) {
            for (var j = 0; j < contacts[i].phoneNumbers.length; j++) {
                if (contacts[i].phoneNumbers[j].value.indexOf("#rwmid#") == 0) {
                    localContacts[i].showIcon = "display";
                    addToKnownRiders(contacts[i].phoneNumbers[j].value.substr(7)) // add this riderID to the KnownRiders lookup
                }
            }
        }
    }
}

function refreshContactList(){
    var listview = $("#selContacts").data("kendoMobileListView");
    if (listview)
        listview.refresh();    
}

function initContactsList() {
    $("#selContacts").kendoMobileListView({
        filterable:{field: "name2", operator:"contains"},
        sort: {field: "name2"},
        type: "group",
        dataSource: kendo.data.DataSource.create({data: localContacts, group: "letter"}),
        template: $("#contactsTemplate").html(),
        click: function(item) {
            if (item && item.dataItem) {
                // Populate the View Contact tab
                $("#contactName").html(item.dataItem.name2);
                if (item.dataItem.showIcon == "none")
                    $("#unlinkContacts").hide();
                else
                    $("#unlinkContacts").show();
                
                currentContact = item.dataItem.contact;
                
                // Show the tab
                location.href = "#contactView";
            }
        }
    });
}

function showContacts(cRiderId) {
	contactRiderId = cRiderId;
    currentContact = null;
    
	location.href = "#tabstrip-contactlist";
}

function saveLinkContacts() {
    // Add this rwmid to this contact
    var pn = currentContact.phoneNumbers;
    if (pn == undefined || pn == null)
        pn = [];
    pn[pn.length] = new ContactField('other', '#rwmid#' + contactRiderId, false);
    currentContact.phoneNumbers = pn;
    if (!simulator)
        currentContact.save(onSaveSuccess, onSaveError);
    else
        onSaveSuccess(currentContact);
}

function cancelLinkContacts() {
    // Cancel linking
    //showMapAfterContact();
    history.back();
}

function unlinkContact() {
    // Unlink this contact from any RWM IDs
    var pn = currentContact.phoneNumbers;
    if (pn == undefined || pn == null)
        return; // How did we get here?  they had to have a link first

    var len = pn.length;
    while (len--) {
        if (pn[len].value.indexOf("#rwmid#") == 0) {
            // Got one
            pn.splice(len, 1);
        }
    }
    currentContact.phoneNumbers = pn;
    if (!simulator)
        currentContact.save(onSaveSuccess, onSaveError);
    else
        onSaveSuccess(currentContact);
}

function onSaveSuccess(contact) {
	addToKnownRiders(contactRiderId);
    reshowLastInfoWindow();
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
	currentContact = null;
	location.href = "#tabstrip-map";
	refreshMap();
}
