function startStopTrouble(){
    
    // Close the infobox if open
    model.infoBox.close();
    
    // Toggle trouble
    model.hasTrouble = !model.hasTrouble;
    if (!model.isStarted)
    {
        // We were not riding, and they pressed that they had trouble.  Automatically start
        startRide();
    }
    
    // Toggle the icon
    if (model.hasTrouble){
        $(".mechanic").attr("src", "images/WrenchButtonOn.png");
    }
    else{
        $(".mechanic").attr("src", "images/WrenchButtonNeutral.png");
    }
    

    // Update position, and transmit
    refreshMap();
}