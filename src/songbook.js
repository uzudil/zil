function Songbook() {
}

Songbook.init_ui = function() {
    var ui = $("#songbook_ui");
    ui.hide();

    $("#songbook_pages").empty();
    for(var i = 0; i < Spell.SPELLS_BY_PAGE.length; i++) {
        $("#songbook_pages").append(_.template($("#tmpl-songbook_page").html())({
            page: i,
            spells: Spell.SPELLS_BY_PAGE[i]
        }));
    }
    Songbook.show_page(0);

    $("#songbook").unbind("click").click(function() {
        $(".ui_window:not(#songbook_ui)").hide();
        ui.toggle();
    });
    $("#close_songbook").unbind("click").click(function() {
        $(".ui_window:not(#songbook_ui)").hide();
        ui.toggle();
    });
    $("#next_page").unbind("click").click(Songbook.next_page);
    $("#prev_page").unbind("click").click(Songbook.prev_page);
};

Songbook.next_page = function() {
    var page = parseInt($("#songbook_page_label").attr("data-page"), 10);
    if(page < Spell.SPELLS_BY_PAGE.length - 1) Songbook.show_page(page + 1);
    return false;
};

Songbook.prev_page = function() {
    var page = parseInt($("#songbook_page_label").attr("data-page"), 10);
    if(page > 0) Songbook.show_page(page - 1);
    return false;
};

Songbook.show_page = function(page) {
    // re-toggle spells in case the player gained a new one
    for(var name in Spell.SPELLS_BY_NAME) {
        var spell = Spell.SPELLS_BY_NAME[name];
        $("#" + name).toggleClass("disabled_spell", !ZIL.player.mobile.has_spell(spell));
    }
    $(".songbook_spell:not(.disabled_spell)").unbind("click").click(Songbook.cast_spell);

    $(".songbook_page").hide();
    $("#page_" + page).show();
    $("#songbook_page_label").text("Songs for page " + (page + 1)).attr("data-page", page);
};

Songbook.cast_spell = function(event) {
    $("#songbook_ui").hide();
    ZIL.player.mobile.cast_spell_by_name($(event.currentTarget).attr("id"));
    return false;
};
