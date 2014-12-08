function ZilStory() {
}

ZilStory.schedule_intro = function() {
    ZilCal.schedule("intro", 500, function () {
        ZIL_UTIL.seen_intro = true;
        ZIL_UTIL.save_config();
        ZIL.say(ZIL.player, "What... <b>is...</b> <i>happening?...</i>", function () {
            ZIL.say(ZIL.player, "I've seen this land before...<br>It's <b>Grove</b>, the world I built!", function () {
                ZIL.say(ZIL.player, "Trapped in my own game?!<br>How is this possible?", function () {
                    ZIL.say(ZIL.player, "I must find a <b>way back into reality.</b>", function () {
                        Mobile.hide_convos();
                        // return true means: unpause game
                        return true;
                    });
                });
            });
        });
    });
};

ZilStory.STORY_LOCATIONS = {
    "maps.ante": {
        "76,42,2": {
            on_mouseover: function() {
                ZIL.say(ZIL.player, "A tree.", function () {
                    Mobile.hide_convos();
                    // return true means: unpause game
                    return true;
                });
            },
            on_mouseclick: function() {

            }
        }
    }
};
ZilStory.SELECTED_SHAPE = null;

ZilStory.clear_location = function() {
    if(ZilStory.SELECTED_SHAPE) {
        ZilStory.SELECTED_SHAPE = null;
        return true;
    }
    return false;
};

ZilStory.mouseover_location = function(map_category, map_name, shape_name, pos) {
    var pos_key = pos.join(",");
    console.log(map_category + "." + map_name + " shape=" + shape_name, pos_key);
    var m = ZilStory.STORY_LOCATIONS[map_category + "." + map_name];
    if(m && m[pos_key]) {
        console.log("\tAAA ZilStory.SELECTED_SHAPE=" + ZilStory.SELECTED_SHAPE);
        if(pos_key != ZilStory.SELECTED_SHAPE) {
            console.log("\tBBB!");
            ZilStory.SELECTED_SHAPE = pos_key;
            m[pos_key].on_mouseover();
        }
        return true;
    }
    return false;
};
