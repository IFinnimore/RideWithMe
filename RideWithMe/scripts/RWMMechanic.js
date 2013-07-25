function startStopTrouble(){
    model.hasTrouble = !model.hasTrouble;
    if (model.hasTrouble){
        $(".mechanic").attr("src", "images/WrenchButtonOn.png");
    }
    else{
        $(".mechanic").attr("src", "images/WrenchButtonNeutral.png");
    }
}