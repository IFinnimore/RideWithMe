var localContacts = [];

function isSimulator() {
    if (device && (device.uuid=='e0101010d38bde8e6740011221af335301010333' || device.uuid=='e0908060g38bde8e6740011221af335301010333'))  // IOS is ...333 Android is 
        return true;
    else
        console.log(device.uuid);
}

var isNoContacts = false;

function contactsSimulatorData() {
    // sim data
    var contacts = [];
    var i = 0;
    contacts[i++] = {id: "123", displayName: "Melanie Jaros", name: {formatted: "Melanie Jaros", familyName: "Jaros" }, phoneNumbers: null};
    contacts[i++] = {id: "223", displayName: "Gerhard Jaros", name: {formatted: "Gerhard Jaros", familyName: "Jaros"},  phoneNumbers: null};
    contacts[i++] = {id: "323", displayName: "Mario Fernsebner", name: {formatted: "Mario Fernsebner", familyName: "Fernsebner"}, phoneNumbers: null};
    contacts[i++] = {id: "423", displayName: "Markus Egger", name: {formatted: "Markus Egger", familyName: "Egger"}, phoneNumbers: null};
    contacts[i++] = {id: "523", displayName: "Georg Segl", name: {formatted: "Georg Segl", familyName: "Segl"}, phoneNumbers: null};
    contacts[i++] = {id: "623", displayName: "Roman Innerhofer", name: {formatted: "Roman Innerhofer", familyName: "Innerhofer"}, phoneNumbers: null};
    contacts[i++] = {
        id: "723", displayName: "Ian Finnimore", name: {formatted: "Ian Finnimore", familyName: "Finnimore"}
        , phoneNumbers: [{type: "home", value: "+386 30 313 933", pref: false}, {type: "other", value: "#rwmid#123456", pref: false}]
    };

    // Double set to test paging
    contacts[i++] = {id: "1231", displayName: "Melanie Jaros", name: {formatted: "Melanie Jaros", familyName: "Jaros" }, phoneNumbers: null};
    contacts[i++] = {id: "2231", displayName: "Gerhard Jaros", name: {formatted: "Gerhard Jaros", familyName: "Jaros"},  phoneNumbers: null};
    contacts[i++] = {id: "3231", displayName: "Mario Fernsebner", name: {formatted: "Mario Fernsebner", familyName: "Fernsebner"}, phoneNumbers: null};
    contacts[i++] = {id: "4231", displayName: "Markus Egger", name: {formatted: "Markus Egger", familyName: "Egger"}, phoneNumbers: null};
    contacts[i++] = {id: "5231", displayName: "Georg Segl", name: {formatted: "Georg Segl", familyName: "Segl"}, phoneNumbers: null};
    contacts[i++] = {id: "6231", displayName: "Roman Innerhofer", name: {formatted: "Roman Innerhofer", familyName: "Innerhofer"}, phoneNumbers: null};
    contacts[i++] = {
        id: "723", displayName: "Ian Finnimore", name: {formatted: "Ian Finnimore", familyName: "Finnimore"}
        , phoneNumbers: [{type: "home", value: "+386 30 313 933", pref: false}, {type: "other", value: "#rwmid#123456", pref: false}]
    };
    
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
    
    try {
        if (!isSimulator()) {
            // lookup contacts
            navigator.contacts.find(fields, onRefreshContactSuccess, onFindContactError, options);
        }
        else {
            onRefreshContactSuccess(contactsSimulatorData());
        } 
    }
    catch (err) {
        console.log("refreshContacts: " + err.message)
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
    try {
        for (var i = 0; i < contacts.length; i++) {
            var familyName = contacts[i].name.familyName;
            if (familyName == null)
                familyName = contacts[i].name.formatted;
            
            localContacts[i] = {letter:familyName.trim().substr(0, 1).toUpperCase(), id: contacts[i].id, showIcon: "none", name2: contacts[i].name.formatted, contact: contacts[i]};
            if (contacts[i].phoneNumbers != null) {
                for (var j = 0; j < contacts[i].phoneNumbers.length; j++) {
                    if (contacts[i].phoneNumbers[j].value.indexOf("#rwmid#") == 0) {
                        localContacts[i].showIcon = "display";
                        addToKnownRiders(contacts[i].phoneNumbers[j].value.substr(7)) // add this riderID to the KnownRiders lookup
                    }
                }
            }
        }
        
        // Sort the array
        localContacts.sort( function(current,next) {
            return current.letter == next.letter ? (current.name2 > next.name2 ? 1: -1) : (current.letter > next.letter ? 1: -1);
        });
        return;
    }
    catch (err) {
        var txt = "onRefreshContactSuccess: " + err.message;
        txt = txt + "\nfamilyName: " + familyName + "\n" + JSON.stringify(contacts[i]);
        console.log(txt);
    }
}

function refreshContactList(){
    var listview = $("#selContacts").data("kendoMobileListView");
    if (listview) {
        app.showLoading();
        listview.dataSource.read();
        listview.refresh();
        app.hideLoading();
    }
    else { 
        initContactsList();
    }
}

function initContactsList() {
    console.log('initContactsList');
    app.showLoading();
    $("#selContacts").kendoMobileListView({
        filterable:{field: "name2", operator:"contains"},
        //sort: {field: "name2"},
        type: "group",
        dataSource: kendo.data.DataSource.create(
            {
                data: localContacts, 
                group: "letter",
                serverSorting: true
            }
        ),
        endlessScroll: false, 
        template: $("#contactsTemplate").html(),
        click: function(item) {
            if (item && item.dataItem) {
                showContactDetails(item.dataItem);
            }
        }
    });
    app.hideLoading();
}

function showContactDetailsClickMarker(riderID) {
    // Find the contact based upon the rider id
    var localContact;
    contactRiderId = riderID;
    
    for (var i=0, len=localContacts.length;i<len;i++) {
        if (localContacts[i].contact.phoneNumbers != null) {
            var pn = localContacts[i].contact.phoneNumbers;
            for( var j=0, pLen=pn.length; j< pLen; j++) {
                if (pn[j].value.indexOf("#rwmid#") == 0 && pn[j].value.indexOf(riderID) >= 0) {
                    // found them
                    localContact = localContacts[i];
                    break;
                }
            }
        }
    }
    
    // Show contact details
    showContactDetails(localContact, true);
}

function showContactDetails(localContact, hideDone) {
    if (localContact == undefined) return;
    if (!hideDone) hideDone = false;
    
    // Populate the View Contact tab
    $("#contactName").html(localContact.name2);
    if (localContact.showIcon == "none")
        $("#unlinkContacts").hide();
    else
        $("#unlinkContacts").show();
    
    if (hideDone)
        $("#saveLinkContacts").hide();
    else
        $("#saveLinkContacts").show();
    
    var phoneNumberList = "";
    if (localContact.contact.phoneNumbers) {
        phoneNumberList = '<table>';
        for (var i=0, len= localContact.contact.phoneNumbers.length; i<len;i++) {
            if (localContact.contact.phoneNumbers[i].value.indexOf("#rwmid#") < 0) {
                phoneNumberList += '<tr><td><span style="text-align: left">' + localContact.contact.phoneNumbers[i].type + '</span></td>'
                                 + '<td><span style="text-align: right; margin-left: 20px">' 
                                 + '<a href="tel:' + localContact.contact.phoneNumbers[i].value +'">' + localContact.contact.phoneNumbers[i].value + '</a></span></td></tr>';
            }
        }
     }
    $("#phoneNumbers").html(phoneNumberList);
    currentContact = localContact.contact;
                
    // Show the tab
    location.href = "#contactView";
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
    pn.push(new ContactField('other', '#rwmid#' + contactRiderId, false));
    currentContact.phoneNumbers = pn;
    try {
        if (!isSimulator())
            currentContact.save(onSaveSuccess, onSaveError);
        else {
            onSaveSuccess(currentContact);
        }
    }
    catch (err) {
        console.log("saveLinkContacts: " + err.message)
    }
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
            removeFromKnownRiders(pn[len].value.substr(7));
            pn.splice(len, 1);
        }
    }
    currentContact.phoneNumbers = pn;
    if (!isSimulator())
        currentContact.save(onUnlinkSuccess, onSaveError);
    else
        onUnlinkSuccess(currentContact);
}

function onUnlinkSuccess(contact) {
    updateKnowStateOfContactRiderID(contact,false);
	showMapAfterContact();
}

function onSaveSuccess(contact) {
	addToKnownRiders(contactRiderId);
    updateKnowStateOfContactRiderID(contact,true);
    //reshowLastInfoWindow();
	showMapAfterContact();
}

function updateKnowStateOfContactRiderID(contact, isKnown) {
    for (var i=0, len=localContacts.length; i<len;i++) {
        if (localContacts[i].id == contact.id) {
            localContacts[i].showIcon = isKnown ? "display" : "none";
            localContacts[i].contact = contact;
            break;
        }
    }
}

function onSaveError(contactError) {
	console.log("SaveContact Error = " + contactError.code);
	showMapAfterContact();
}

function showMapAfterContact() {
    HideInfoWindow();
	currentContact = null;
    contactRiderId = null;
	location.href = "#tabstrip-map";
	RenderRiders();
}
