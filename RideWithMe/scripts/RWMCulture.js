function setupLanguage() {
    model.culture = navigator.language.substr(0, 2);
    
    if (model.dictionary== undefined) {
        $.ajax({
          url: 'text.json',
          dataType: 'json',
          async: false,
          success: function(data) {
            loadedLangData(data);
          }
        });
    } else {
        // We already have a dictionary
        applyDictionary();
    }
}

function loadedLangData(data) {
    
    var index = data.langCodeIndex.indexOf(model.culture)
    if (index < 0) index = data.defaultLangIndex; // Default to text.json default language
    var lang = new allLang();
    applyLang(lang, data, index);
    model.dictionary = lang;
    applyDictionary();
}

function applyLang(allLang, newLang, index) {
    allLang.runTxt = newLang.runTxt[index];
    allLang.stopTxt = newLang.stopTxt[index];
    allLang.map = newLang.map[index];
    allLang.bikes = newLang.bikes[index];
    allLang.showAllRiders = newLang.showAllRiders[index];
    allLang.onlyMyType = newLang.onlyMyType[index];
    allLang.all = newLang.all[index];
    allLang.type = newLang.type[index];
    allLang.cancel = newLang.cancel[index];
    allLang.done = newLang.done[index];
    allLang.description = newLang.description[index];
    allLang.getNew = newLang.getNew[index];
    allLang.edit = newLang.edit[index];
    allLang.style = newLang.style[index];
    allLang.mountainBike = newLang.mountainBike[index];
    allLang.road = newLang.road[index];
    allLang.tour = newLang.tour[index];
    allLang.competition = newLang.competition[index];
    allLang.recreation = newLang.recreation[index];
    allLang.leisure = newLang.leisure[index];
    allLang.createAddToContact = newLang.createAddToContact[index];
    allLang.waitingForGeolocationInformation = newLang.waitingForGeolocationInformation[index];
    allLang.saveIDToContact = newLang.saveIDToContact[index];
    allLang.riderIDSaved = newLang.riderIDSaved[index];
    allLang.chooseBike = newLang.chooseBike[index];
    allLang.add = newLang.add[index];
    allLang.myBike = newLang.myBike[index];
	allLang.dataConnection = newLang.dataConnection[index];
    allLang.lowPower = newLang.lowPower[index];
    allLang.trouble = newLang.trouble[index];
    allLang.cannotGetLocation = newLang.cannotGetLocation[index];
    allLang.pushOpen = newLang.pushOpen[index];
    allLang.distance = newLang.distance[index];
    allLang.showRider = newLang.showRider[index];
}

function allLang(){
    this.runStop = "";
    this.runTxt= "";
    this.stopTxt= "";
    this.map= "";
    this.bikes = "";
    this.showAllRiders= "";
    this.onlyMyType= "";
    this.all= "";
    this.type= "";
    this.cancel = "";
    this.done = "";
    this.description = "";
    this.getNew = "";
    this.edit = "";
    this.style = "";
    this.mountainBike = "";
    this.road = "";
    this.tour = "";
    this.competition = "";
    this.recreation = "";
    this.leisure = "";
    this.createAddToContact = "";
    this.waitingForGeolocationInformation = "";
    this.saveIDToContact = "";
    this.riderIDSaved = "";
    this.chooseBike = "";
    this.add= "";
    this.myBike= "";
	this.dataConnection= "";
    this.lowPower= "";
    this.trouble= "";
    this.cannotGetLocation= "";
    this.pushOpen= "";
    this.distance="";
    this.showRider="";
}

function applyDictionary(){
    var md = model.dictionary;
    if (md == undefined) return;
    $("#lblShowAllRiders").html(md.showAllRiders);
    $("#lblOnlyMyType").html(md.onlyMyType);
    $("#showAllRiders .km-switch-label-off").html(md.all);
    $("#showAllRiders .km-switch-label-on").html(md.type);
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
    $("#pushOpen").prop("value",md.pushOpen);
}


