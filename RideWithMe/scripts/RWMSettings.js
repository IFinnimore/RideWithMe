/* User settings */

function getNewId() {
	if (!(navigator.connection.type == Connection.NONE)) {
		$.ajax({
			type: "GET",
			url: urls.getRiderIdUrl,
			contentType: "application/json; charset=utf-8",
			crossDomain: true,
			dataType: "json",
			timeout: 15000,
			success: function (data) {
                $("#devToolsReplies").html("GetID: " + data);
				$("#txtRiderId").val(data);
			},
			fail: function () {
				$("#devToolsReplies").html("Error retrieving string");
			},
			error: function (xhr, status, error) {
				$("#devToolsReplies").html("GetId error: [" + error + "]");
			}
		});
	}
}

function getId() {
	if (!(navigator.connection.type == Connection.NONE)) {
		$.ajax({
			type: "GET",
			url: urls.getRiderIdUrl,
			contentType: "application/json; charset=utf-8",
			crossDomain: true,
			dataType: "json",
			timeout: 15000,
			success: function (data) {
				$("#txtRiderId").val(data);
                // why save here?
				//saveBike();
			},
			fail: function () {
				$("#devToolsReplies").html("Error retrieving string");
			},
			error: function (xhr, status, error) {
				$("#devToolsReplies").html("GetId: " + error);
			}

		});
	}
} 

function getRiderType(rType) {
	rType = rType.toString().substring(0, 1);
	return rType == '1' ? model.dictionary.mountainBike : rType == '2' ? model.dictionary.road : rType == '3' ? model.dictionary.tour : model.dictionary.breakdown;
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
		getId();
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
	var bike = {ID: id, RiderId: $("#txtRiderId").val(), Description: $("#txtDescription").val(), Type: t, Style: s};
	syncListOfBikes(bike);
}

function saveBikeAndFocusList() {
	saveBike();
	if (!model.addFirstBike)
		focusBikeList();
	else {
		model.addFirstBike = false;
		model.current = model.bikersArray[0];
		location.href = "#tabstrip-map";
		afterShowMapTab();
	}
}

function focusBikeList() {
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
		byx.refresh();
		byx.dataSource.read();
		return;
	}
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
                    IDToDel = bItem.dataItem.ID;
                }
		    } else {
		        // We are not in list edit mode
		        editBike(bItem.dataItem.ID);
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
	model.bikeListEditMode = !model.bikeListEditMode;
	if (model.bikeListEditMode) {
		editBikeList();
	}
	else {
		editBikeListEnd();
	}
}

function editBikeList() {
	$("#btnEditBikeList .km-text").html("Done");
	$(".btnEditDelBikeInList").fadeIn(300);
}

function editBikeListEnd() {
	$("#btnEditBikeList .km-text").html("Edit");
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