function english(){
    this.runStop = "Start/Stop";
    this.runTxt = "Start";
    this.stopTxt = "Stop";
    this.map = "Map";
    this.bikes = "Bikes";
    this.showAllRiders = "Show all riders";
    this.onlyMyType = "Only my type";
    this.all = "All";
    this.type = "Type";
    this.cancel = "Cancel";
    this.done = "Done";
    this.description = "Description";
    this.getNew = "Get New";
    this.edit = "Edit";
    this.style = "Style";
    this.mountainBike = "Mountain Bike";
    this.road = "Road";
    this.tour = "Tour";
    this.competition = "Competition";
    this.recreation = "Recreation";
    this.leisure = "Leisure";
    this.createAddToContact = "Create/Add to contact";
    this.waitingForGeolocationInformation = "Waiting for geolocation information";
    this.saveIDToContact = 'Save ID #{0} to "{1}"?';
    this.riderIDSaved = 'Rider ID saved to "{0}".';
    this.chooseBike = "Choose Bike";
    this.add="Add";
    this.breakdown="Breakdown"
    this.myBike="My bike";
    this.view = "View";
	this.dataConnection="NO DATA CONNECTION";
    this.lowPower="BATTERY TOO LOW";
    this.trouble="Trouble";
}

function deutsch(){
    this.runStop = "Start/Stop";
    this.runTxt = "Start";
    this.stopTxt = "Stop";
    this.map = "Karte";
    this.bikes = "Räder";
    this.showAllRiders = "Zeige alle";
    this.onlyMyType = "Nur meine Art";
    this.all = "Alle";
    this.type = "Art";
    this.cancel = "Abbrechen";
    this.done = "Fertig";
    this.description = "Beschreibung";
    this.getNew = "Neue ID";
    this.edit = "Bearbeiten";
    this.style = "Stil";
    this.mountainBike = "Mountain Bike";
    this.road = "Straßenfahrrad";
    this.tour = "Tour-Fahrrad";
    this.competition = "Wettbewerb";
    this.recreation = "Erholung";
    this.leisure = "Freizeit";
    this.createAddToContact = "Zu Kontakten hinzufügen/erstellen";
    this.waitingForGeolocationInformation = "Warte auf GPS-Daten";
    this.saveIDToContact = 'ID #{0} zu "{1}" speichern?';
    this.riderIDSaved = 'ID zu "{0}" gespeichert.';
    this.breakdown="Beschädigt";
    this.chooseBike = "Rad auswählen";
    this.add="Hinzufügen";
    this.myBike="Mein Fahrrad";
    this.view = "Anzeigen";
	this.dataConnection="Keine Datenverbindung";
    this.lowPower="Batterie zu niedrig";
    this.trouble="Probleme";
}

function applyDictionary(){
    var md = model.dictionary;
    if (md == undefined) return;
    $("#lblShowAllRiders").html(md.showAllRiders);
    $("#lblOnlyMyType").html(md.onlyMyType);
    $("#showAllRiders .km-switch-label-off").html(md.all);
    $("#showAllRiders .km-switch-label-on").html(md.type);
    $("#lblRunStop .km-text").html(md.runStop);
    $("#theMap .km-text").html(md.map);
    $("#lblBikes .km-text").html(md.bikes);
    $("#lblChooseBikeTitle").html(md.chooseBike);
    $("#lblBikesTitle").html(md.bikes);
    $("#lblBikesTitle2").html(md.bikes);
    $("#lblAdd .km-text").html(md.add)
    $("#btnEditBikeList .km-text").html(md.edit);
    $("#lblCancel .km-text").html(md.cancel);
    $("#lblDone .km-text").html(md.done);
    $("#lblMountainBike").html(md.mountainBike);
    $("#lblGetNew").html(md.getNew);
    $("#lblDescription").html(md.description);
    $("#lblRoad").html(md.road);
    $("#lblTour").html(md.tour);
    $("#lblCompetition").html(md.competition);
    $("#lblRecreation").html(md.recreation);
    $("#lblLeisure").html(md.leisure);
	$(".dataConnection").html(md.dataConnection);
    $("#lblRunStop").html(md.runTxt);
    $("#lblTrouble").html(md.trouble);
    $(".lowBattery").html(md.lowPower);
}


