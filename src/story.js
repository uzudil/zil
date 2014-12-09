function ZilStory() {
}

ZilStory.schedule_intro = function() {
    ZilCal.schedule("intro", 500, function () {
        ZIL_UTIL.seen_intro = true;
        ZIL_UTIL.save_config();
        ZIL.say(ZIL.player, "What... <b>is...</b> <i>happening?...</i>", function () {
            ZIL.say(ZIL.player, "I've seen this land before...<br>It's <b>Grove</b>, the world I built!", function () {
                ZIL.say(ZIL.player, "Trapped in my own game?!<br>How is this possible?", function () {
                    ZIL.say(ZIL.player, "I must find a <b>way back into reality.</b>");
                });
            });
        });
    });
};

ZilStory.STORY_LOCATIONS = {
    "maps.ante": {
        "76,42,2": {
            on_mouseover: function() {
                ZIL.say(ZIL.player, "A tree.");
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
//    console.log(map_category + "." + map_name + " shape=" + shape_name, pos_key);
    var m = ZilStory.STORY_LOCATIONS[map_category + "." + map_name];
    if(m && m[pos_key]) {
        if(pos_key != ZilStory.SELECTED_SHAPE) {
            ZilStory.SELECTED_SHAPE = pos_key;
            m[pos_key].on_mouseover();
        }
        return true;
    }
    return false;
};

ZilStory.CONVO = {
    "maps.ante": {
        "136,209,4": {
            "": "You look <a>confused</a> child...<br>Have you come to be <a>shriven</a>?",
            "confused": "From a far-away land you say?<br>If you seek answers, visit Lyrnx in the <a>cave</a>.",
            "shriven": "All are but dust to the <a>divinity</a>.<br>We move like moths around the divine <a>flame</a>.",
            "cave": ""
        }
    }
};
ZilStory.CONVO_KEY = null;

ZilStory.on_convo_render = function(el) {
    console.log("on_convo_render=", el);
    var as = $("a", el);
    for(var i = 0; i < as.length; i++) {
        var a = as.eq(i);
        a.addClass("convo_link").click(function (event) {
            var a = $(event.currentTarget);
            var key = a.attr("w") || a.text().trim().toLowerCase();
            console.log("convo key=" + key + " click=", a);
            var convo_tree = ZilStory.CONVO[ZilStory.CONVO_KEY[0]][ZilStory.CONVO_KEY[1]];
            if(!convo_tree[key]) key = "";
            var text = convo_tree[key];
            ZIL.say(ZilStory.CONVO_KEY[2], text, null, ZilStory.on_convo_render);
            return false;
        });
    }
};

ZilStory.start_conversation = function(map_category, map_name, creature) {
    var pos_key = [creature.mobile.origin_x, creature.mobile.origin_y, creature.mobile.origin_z].join(",");
    var m = ZilStory.CONVO[map_category + "." + map_name];
    console.log(map_category + "." + map_name + " pos=", pos_key);
    if(m && m[pos_key]) {
        // show the default/intro convo
        ZilStory.CONVO_KEY = [map_category + "." + map_name, pos_key, creature];
        ZIL.say(creature, m[pos_key][""], null, ZilStory.on_convo_render);
    }
};
