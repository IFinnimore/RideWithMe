/* User settings */



function getRiderType(rType) {
	rType = rType.toString().substring(0, 1);
	return rType == '1' ? model.dictionary.mountainBike : rType == '2' ? model.dictionary.road : rType == '3' ? model.dictionary.tour : model.dictionary.trouble;
}

function getRiderStyle(rStyle) {
	rStyle = rStyle.toString().substring(1);
	return rStyle == '1' ? model.dictionary.competition : rStyle == '2' ? model.dictionary.recreation : model.dictionary.leisure;
}

function newBike() {
	var bid = getBikeId();
	$("#txtBikeId").val(bid);

	if (model.bikersArray == undefined || model.bikersArray.length == 0) {
        $("#txtRiderId").val('Loading');
		getNewId();
	}
	else {
		$("#txtRiderId").val(model.bikersArray[0].RiderId);
	}

    var desc = model.dictionary.myBike;
	if (model.bikersArray != undefined || model.bikersArray.length > 0) {
		desc += " " + (model.bikersArray.length + 1).toString();
	}
	$("#txtDescription").val(desc);
	location.href = "#tabstrip-bikes";
	applyDictionary();
}

function editBike(bikeID) {
	for (var i = 0; i < model.bikersArray.length; i++) {
		var bike = model.bikersArray[i];
		if (bike.ID == bikeID) {
			$("#txtDescription").val(bike.Description);
			$("#txtBikeId").val(bike.ID);
			$("#txtRiderId").val(bike.RiderId);
			var bikeType = 'sel0' + bike.Type.toString().substring(0, 1);
			var bikeStyle = 'sel1' + bike.Style.toString().substring(0, 1);
            document.getElementById(bikeType).checked = true;
            document.getElementById(bikeStyle).checked = true;
			break;   
		}
	}
}

function saveBike() {
    var riderId = $("#txtRiderId").val()
    if (riderId == "Loading") {
        return false;    
    }
    else {
        var id = $("#txtBikeId").val();
        if (id == "") {
            id = getBikeId();
            $("#txtBikeId").val(id);
        }
        var t = $("#sel01")[0].checked ? 1 : -1;
        if (t == -1)
            t = $("#sel02")[0].checked ? 2 : -1;
        if (t == -1)
            t = $("#sel03")[0].checked ? 3 : -1;
    
        var s = $("#sel11")[0].checked ? 1 : -1;
        if (s == -1)
            s = $("#sel12")[0].checked ? 2 : -1;
        if (s == -1)
            s = $("#sel13")[0].checked ? 3 : -1;

        var bike = {ID: id, RiderId: riderId, Description: $("#txtDescription").val(), Type: t, Style: s};
        syncListOfBikes(bike);
        return true;
    }
}

function saveBikeAndFocusList() {
    if (saveBike()) {
        if (!model.addFirstBike)
            focusBikeList();
        else {
            model.addFirstBike = false;
            model.current = model.bikersArray[0];
            location.href = "#tabstrip-map";
            afterShowMapTab();
            // Start the UpdateRWM timer by updating RWM in 2 seconds (allows time for initial GPS location)
            model.timerUpdateRWM = window.setTimeout(function() {
                updateRWM();
            }, 2000);
        }
    } else {
      // we didnt save
      focusBikeList();
    }
}

function focusBikeList() {
    if (model.addFirstBike) {
        stopRide();
        model.addFirstBike = false;
    }
	location.href = "#tabstrip-bikeslist";
	applyDictionary();
	showAllBikesInList();
}

function getBikeId() {
	return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}

function syncListOfBikes(bike) {
	if (model.bikersArray == undefined) {
		model.bikersArray = [];
    }

    var first = (model.bikersArray.length == 0 ? true : false);
    
    var bikeNumber = model.bikersArray.length;
	for (var i = 0; i < model.bikersArray.length; i++) {
		if (model.bikersArray[i].ID == bike.ID) {
			bikeNumber = i;
			break;
		}
	}
	model.bikersArray[bikeNumber] = bike;
	localStorage.setItem("Bikes", JSON.stringify(model.bikersArray));
    
    if (first)
        initBikeListView();
}

function loadListOfBikes() {
	var bikes = localStorage.getItem("Bikes");
	if (bikes != undefined) {
		model.bikersArray = JSON.parse(bikes);
		showAllBikesInList();
		showAllBikesInBikeSelection();
	}
	else
		model.bikersArray = [];
}

function showAllBikesInBikeSelection() {
	var byx = $("#selBikes").data("kendoMobileListView");
	if (byx != undefined) {
		byx.dataSource.read();
        byx.refresh();
		return;
	} else {
        initBikeSelectView();
    }
}

function initBikeSelectView() {
    $("#selBikes").kendoMobileListView({
		dataSource: kendo.data.DataSource.create({data: model.bikersArray}),
		template: $("#choosebikeTemplate").html(),
		click: function(bItem) {
			//model.current = bItem.dataItem; // undefined ?
			var bikeDummy = bItem.item[0].innerText.replace("\r", "").replace("\n", "");
			for (var i = 0; i < model.bikersArray.length; i++) {
				if (model.bikersArray[i].Description == bikeDummy) {
					model.current = model.bikersArray[i];
				}
			}
            model.timerUpdateRWM = window.setTimeout( function() { updateRWM(); }, 2000);
			location.href = "#tabstrip-map";
		}
	});    
}

var IDToDel = "";
function initBikeListView() {
	$("#lstBikes").kendoMobileListView({
		dataSource: kendo.data.DataSource.create({data: model.bikersArray}),
		template: $("#bikeEditTemplate").html(),
		click: function(bItem) {
		    if (model.bikeListEditMode) {
		        // we are editing
				// final delete button lookup
                var bCtx = bItem.item.context.children;
                var dButn;
                for (var i=0; i< bCtx.length; i++) {
                    if (bCtx[i].id=="btnDelete") {
                        dButn = bCtx[i];
                        break;
                    }
                }
                
                // Check if the button is already visible.  If so, hide it, otherwise prepare for delete
                if (dButn.style.display=="") {
                    // Hide this button
                    dButn.style.display="none";
                }
                else {
                    // Show this button after hiding all others
                    $(".btnFinalDelete").fadeOut(0);
                    dButn.style.display="";
                    if (bItem && bItem.dataItem)
                        IDToDel = bItem.dataItem.ID;
                    else
                        IDToDel = bItem.item[0].ID;
                }
		    } else {
                // We are not in list edit mode
                if (bItem && bItem.dataItem)
                    editBike(bItem.dataItem.ID);
                else
                    editBike(bItem.item[0].ID);
                location.href = "#tabstrip-bikes";
                applyDictionary();
                return;
		    }
		}
	});
}
function showAllBikesInList() {
	var byx = $("#lstBikes").data("kendoMobileListView");
	if (byx != undefined) {
		byx.refresh();
		byx.dataSource.read();
		return;
	}
    initBikeListView();
}

function deleteBike() {
    if (IDToDel == "") return;
    
     for (var i = 0; i < model.bikersArray.length; i++) {
    	if (model.bikersArray[i].ID == IDToDel) {
    		model.bikersArray.splice(i, 1);
    		localStorage.setItem("Bikes", JSON.stringify(model.bikersArray));
    		showAllBikesInBikeSelection();
    		btnEditBike();
    		focusBikeList();
    		return;
    	}
    }
}

function btnEditBike() {
    if (!model.bikersArray.length) {
        model.bikeListEditMode = false;
    } else {
	model.bikeListEditMode = !model.bikeListEditMode;
        }
	if (model.bikeListEditMode) {
		editBikeList();
	}
	else {
		editBikeListEnd();
	}
}

function editBikeList() {
	$("#btnEditBikeList .km-text").html(model.dictionary.done);
	$(".btnEditDelBikeInList").fadeIn(300);
}

function editBikeListEnd() {
	$("#btnEditBikeList .km-text").html(model.dictionary.edit);
	$(".btnEditDelBikeInList").fadeOut(100);
    $(".btnFinalDelete").fadeOut(100);
}

function AfterTabstripBikes() {
    // Apply Dictionary
    applyDictionary();
    
    // Make sure we are not in edit mode
    if (model.bikeListEditMode) btnEditBike();
}

/* Developer settings */

function updateFrequency() {
	localStorage.setItem("locFrequency", $("#txtUpdateFrequency").val());
}

function clearLocalData() {
	localStorage.clear();
}