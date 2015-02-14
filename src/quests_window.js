function QuestWindow() {

}

QuestWindow.init_ui = function() {
    var ui = $("#quests_ui");
    ui.hide();

    $(".quest_selector").unbind("click").click(function(event) {
        $(".quest_list").hide();
        $(".quest_selector").removeClass("active");
        $(event.currentTarget).addClass("active");
        $("#" + $(event.currentTarget).data("sel")).show();
        return false;
    });
    $("#quests").unbind("click").click(function() {
        QuestWindow.update_quests();
        $(".ui_window:not(#quests_ui)").hide();
        ui.toggle();
        return false;
    });
    $("#close_quests").unbind("click").click(function() {
        QuestWindow.update_quests();
        $(".ui_window:not(#quests_ui)").hide();
        ui.toggle();
        return false;
    });
};

QuestWindow._add_quests = function(el, quest_keys) {
    var q = quest_keys || [];
    el.empty();
    for(var i = 0; i < q.length; i++) {
        el.append(_.template($("#tmpl-quest_list").html())({
            quest: ZilStory.QUESTS[q[i]]
        }))
    }
};

QuestWindow.update_quests = function() {
    QuestWindow._add_quests($("#current_quests"), ZIL_UTIL.game_state["quests"]);
    QuestWindow._add_quests($("#completed_quests"), ZIL_UTIL.game_state["completed_quests"]);
};
