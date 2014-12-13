function ZilStory() {
}

ZilStory.replace_ante_door = function() {
    // remove the closed door
    ZIL.shape.del_position(74, 22, 2);

    // add open door
    var s = ZilShape.load_shape("doors", "gate-open");
    s.build_shape_inline();
    ZIL.shape.set_shape(74, 22, 2, s);
    ZIL.redraw_shape();
};

ZilStory.MAPS = {
    "maps.ante": {
        events: {
            on_load: function() {
                if(!ZIL_UTIL.game_state["seen_intro"]) {
                    ZilCal.schedule("intro", 500, function () {
                        ZIL_UTIL.game_state["seen_intro"] = true;
                        ZIL_UTIL.save_config();
                        ZIL.say(ZIL.player, "What... <b>is...</b> <i>happening?...</i>", function () {
                            ZIL.say(ZIL.player, "I've seen this land before...<br>It's <b>Grove</b>, the world I built!", function () {
                                ZIL.say(ZIL.player, "Trapped in my own game?!<br>How is this possible?", function () {
                                    ZIL.say(ZIL.player, "I must find a <b>way back into reality.</b>");
                                });
                            });
                        });
                    });
                }

                if(ZIL_UTIL.game_state["opened_ante_gate"]) {
                    ZilStory.replace_ante_door();
                }
            }
        },
        locations: {
            "74,22,2": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    if (ZIL_UTIL.game_state["has_password"]) {
                        var shape_name_and_location = ZIL.shape.get_shape_at(74, 22, 2);
                        if (shape_name_and_location['0'] == "doors.gate-open") {
                            ZIL.load_shape("maps", "hallway", 94, 372, function () {
                                ZIL.say(ZIL.player, "This seems to be the way into the mountain.<br>" +
                                    "It's cold and damp down here and smells like wet fur.", function () {
                                    ZIL.say(ZIL.player, "Something is moving in the darkness... I better stay alert.");
                                });
                            });
                        } else {
                            ZIL.say(ZIL.player, "Here goes nothing...<br>WIND UNDER SILVER STARS", function () {
                                ZIL.say(ZIL.player, "I'm sure this is complete nonsense.<br>I'll never open these... what?!", function () {
                                    Mobile.hide_convos();
                                    ZIL.quake();
                                    ZilStory.replace_ante_door();
                                    ZIL_UTIL.game_state["opened_ante_gate"] = true;
                                    ZIL_UTIL.save_config();
                                    return true;
                                });
                            });
                        }
                    } else {
                        ZIL.say(ZIL.player, "Great. These doors are jammed. I can't open them.");
                    }
                }
            }
        }
    },
    "maps.hallway": {
        events: {

        },
        locations: {
            "81,397,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.load_shape("maps", "ante", 90, 49);
                }
            },
            "12,1,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    if (ZIL_UTIL.game_state["skrit_intro"]) {
                        ZIL.load_shape("maps", "skrit", 136, 310);
                    } else {
                        ZIL.say(ZIL.player, "It sounds like the <b>din of a town</b> behind that door.", function () {
                            ZIL.say(ZIL.player, "But how could there be a town<br>...inside the mountain?", function () {
                                ZIL.say(ZIL.player, "There is only one way to find out, I guess!", function () {
                                    Mobile.hide_convos();
                                    ZIL.load_shape("maps", "skrit", 136, 310, function () {

                                        ZIL.say(ZIL.player, "I smell food... todo todo todo...");

                                        ZIL_UTIL.game_state["skrit_intro"] = true;
                                        ZIL_UTIL.save_config();
                                    });
                                });
                            });
                        });
                    }
                }
            }
        }
    },
    "maps.skrit": {
        events: {

        },
        locations: {
            "134,332,2": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.load_shape("maps", "hallway", 18, 16);
                }
            }
        }
    }
};

ZilStory.on_map_load = function(map_category_name, map_shape_name) {
    var m = ZilStory.MAPS[map_category_name + "." + map_shape_name];
    if(m && m.events && m.events.on_load) {
        m.events.on_load();
    }
};

ZilStory.mouseclick_location = function(map_category, map_name, shape_name, pos) {
    return ZilStory._mouse_location(map_category, map_name, shape_name, pos, "on_mouseclick");
};

ZilStory.mouseover_location = function(map_category, map_name, shape_name, pos) {
    return ZilStory._mouse_location(map_category, map_name, shape_name, pos, "on_mouseover");
};

ZilStory._mouse_location = function(map_category, map_name, shape_name, pos, fx) {
    var pos_key = pos.join(",");
//    console.log(map_category + "." + map_name + " shape=" + shape_name, pos_key);
    var m = ZilStory.MAPS[map_category + "." + map_name];
    if(m && m.locations && m.locations[pos_key]) {
        m.locations[pos_key][fx]();
        return true;
    }
    return false;
};

ZilStory.CONVO = {
    "maps.ante": {
        "136,209,4": {
            "": "You look <a>confused</a> child...<br>Have you come to be <a>shriven</a>?",
            "confused": "Fell from a far-away land, you say?<br>Well, if you seek answers, visit <a>Gav</a> in the <a w='gav'>mountain</a>.",
            "shriven": "All are but dust to the <a>divinity</a>.<br>We move like moths around the divine <a>flame</a>.",
            "gav": "The seer Gav has made his home under these <a>peaks</a>.<br>You will need the <a>password</a> to enter.",
            "password": function() {
                ZIL_UTIL.game_state["has_password"] = true;
                ZIL_UTIL.save_config();
                return "To open the gates, speak the phrase:<br>\"Wind under Silver Stars\"";
            },
            "peaks": "But, beware of depths child... There are things<br>in the darkness that aren't what they <a>seem</a>.",
            "seem": "Use your wits and might if you can.<br>The seer <a>Gav</a> only helps those who walk the right path."
        }
    }
};
ZilStory.CONVO_KEY = null;

ZilStory.on_convo_render = function(el) {
    var as = $("a", el);
    for(var i = 0; i < as.length; i++) {
        var a = as.eq(i);
        a.addClass("convo_link").click(function (event) {
            var a = $(event.currentTarget);
            var key = a.attr("w") || a.text().trim().toLowerCase();
//            console.log("convo key=" + key + " click=", a);
            var convo_tree = ZilStory.CONVO[ZilStory.CONVO_KEY[0]][ZilStory.CONVO_KEY[1]];
            if(!convo_tree[key]) key = "";
            var text = convo_tree[key];
            if(typeof text == "function") text = text();
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
