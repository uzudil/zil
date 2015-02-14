function MapWindow() {

}

MapWindow.init_ui = function() {
    var ui = $("#map_ui");
    ui.hide();

    $("#map").unbind("click").click(function() {
        $(".ui_window:not(#map_ui)").hide();
        ui.toggle();
    });
    $("#close_map").unbind("click").click(function() {
        $(".ui_window:not(#map_ui)").hide();
        ui.toggle();
    });
};
