function ZilStory() {
}

ZilStory.QUESTS = {
    "sewers": {
        name: "Kill the beast in the Skrit sewers",
        level: 1,
        on_complete: function() {
            ZIL_UTIL.game_state["opened_skrit_gate"] = true;
            ZIL_UTIL.save_config();
        }
    }
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
                    ZIL.force_replace_shape(74, 22, 2, "doors", "gate-open");
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
                                    ZIL.force_replace_shape(74, 22, 2, "doors", "gate-open");
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

                                        ZIL.say(ZIL.player, "This must be the where<br><b>Gav the Seer</b>lives.");

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
            on_load: function() {
                if (ZIL_UTIL.game_state["opened_skrit_gate"]) {
                    ZIL.force_replace_shape(19, 195, 8, "doors", "gate-open", 3);
                }
            }
        },
        locations: {
            "134,332,2": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.load_shape("maps", "hallway", 18, 16);
                }
            },
            "39,264,3": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.load_shape("maps", "skrit-library", 127, 108);
                }
            },
            "254,83,2": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.load_shape("maps", "skrit_sewers", 14, 14);
                }
            },
            "19,195,8": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    if(ZIL_UTIL.game_state["opened_skrit_gate"]) {
                        ZIL.load_shape("maps", "abandoned_temple_1", 580, 570);
                    } else {
                        ZIL.say(ZIL.player, "Looks like the gate to an <b>old ruin</b>. However, the gates are <b>locked</b> and I can't get in.");
                    }
                }
            }
        }
    },
    "maps.abandoned_temple_1": {
        events: {

        },
        locations: {
            "605,568,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.load_shape("maps", "skrit", 27, 195);
                }
            },
            "162,36,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.load_shape("maps", "abandoned_temple_2", 528, 108);
                }
            },
            "228,40,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.load_shape("maps", "abandoned_temple_2", 108, 424);
                }
            },
            "539,582,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.show_sign("Welcome, O Traveler to the holy temple of <i>Srag the Adjudicator.</i><br><br>" +
                        "May you leave your worldly cares outside our gates and rest safely in the celestial sanctuary " +
                        "of undisturbed peace and...<br><br>" +
                        "<i>(Here the text becomes illegible. The wood looks to have been destroyed by claw marks.)</i>");
                }
            },
            "248,38,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.show_sign("Down to the monks' quarters.");
                }
            },
            "154,36,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.show_sign("Down to the beast handler's quarters.");
                }
            }
        }
    },
    "maps.abandoned_temple_2": {
        events: {

        },
        locations: {
            "100,426,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.load_shape("maps", "abandoned_temple_1", 248,44);
                }
            },
            "528,101,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.load_shape("maps", "abandoned_temple_1", 154,42);
                }
            }
        }
    },
    "maps.westvein": {
        events: {
            on_load: function() {
                ZIL.add_creature_listener(function(map_cat, map_name, creature) {
                    if(creature.mobile.get_name() == "Fire Imp") {
                        if(ZIL_UTIL.game_state["lift_operator_saved"] == null) {
                            ZIL_UTIL.game_state["lift_operator_saved"] = 0;
                        } else {
                            ZIL_UTIL.game_state["lift_operator_saved"] = ZIL_UTIL.game_state["lift_operator_saved"] + 1;
                        }
                        ZIL_UTIL.save_config();
                    }
                });
            }
        },
        locations: {
            "333,81,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.load_shape("maps", "skrit", 27, 195);
                }
            },
            "281,81,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.show_sign("Welcome, O Traveler to the holy temple of <i>Srag the Adjudicator.</i><br><br>" +
                        "If you seek other lands, see <i>the lift operator to the east.</i><br><br>" +
                        "May you leave your wordly cares outside our gates and rest safely in the celestial sanctuary " +
                        "of undisturbed peace and...<br><br>" +
                        "<i>(Here the text becomes illegible. The wood looks to have been destroyed by claw marks.)</i>");
                }
            },
            "154,78,2": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.show_sign("This way to the lift operator.<br><br>" +
                        "Lift costs:<br>" +
                        "&nbsp;&nbsp;&nbsp;5CP up to Mihyr and beyond.<br>" +
                        "&nbsp;&nbsp;&nbsp;10CP to the Dahrhyr and lower realms.<br>" +
                        "<br>" +
                        "<i>(You can barely make out the hastily added note at the bottom:<br>Save me!)</i>");
                }
            }
        }
    },
    "maps.skrit_sewers": {
        events: {
            on_load: function() {
                ZIL.add_creature_listener(function(map_cat, map_name, creature) {
                    if(creature.mobile.origin_x == 280 && creature.mobile.origin_y == 313 && creature.mobile.origin_z == 1) {
                        ZIL.quest_completed("sewers");
                    }
                });
            }
        },
        locations: {
            "6,4,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.load_shape("maps", "skrit", 245, 90);
                }
            }
        }
    },
   "maps.skrit-library": {
        events: {

        },
        locations: {
            "116,112,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.load_shape("maps", "skrit", 51, 283);
                }
            },
            "58,4,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    if (ZIL_UTIL.game_state["has_map"]) {
                        ZIL.say(ZIL.player, "I will return the <b>map of the mountain</b> when I don't need it anymore.");
                    } else {
                        ZIL.say(ZIL.player, "What's this now? A <b>map of the mountain</b>?<br>I think I'll borrow this for a bit.", function () {
                            Mobile.hide_convos();

                            ZIL_UTIL.game_state["has_map"] = true;
                            ZIL_UTIL.save_config();

                            // todo: show world map button in ui

                            return true;
                        });
                    }
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
            "_name_": "Monk",
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
    },
    "maps.westvein": {
        "common": {

        },
        "11,45,2": {
            "_name_": "Lift Operator",
            "": function() {
                var n = ZIL_UTIL.game_state["lift_operator_saved"];
                if(n == null) {
                    return "Oh good you're here! The <a>imps</a> have been terrorizing me for far too long. Please be as kind as to <a>dispatch</a> them!";
                } else if(n < 4) {
                    return "You're doing a great job, but be sure to kill all four <a>imps</a>. That's the only way they will ever learn.";
                } else {
                    return "Thank you so much for getting rid of those pesky <a>imps</a>. They have been a source of pain for far too long.";
                }
            },
            "imps": function() {
                var n = ZIL_UTIL.game_state["lift_operator_saved"];
                if(n && n == 4) {
                    return "I'm not sure how they got here... They just appeared one day, probably from <a>Dahrhyr</a>. It's not a good omen, that I can tell you!";
                } else {
                    return "The little red gremlins outside my house. Kill them for me!";
                }
            },
            "dahrhyr": ""
        }
    },
    "maps.skrit": {
        "common": {
            "wondering": "Yes it is confusing at first, I know. <a>Many</a> like you come through here.",
            "many": "The town of <a>Skrit</a> is the first <a>nexus</a> in the <a>mountain</a>.<br>All <a>travelers</a> arrive here first.",
            "travelers": "Travelers like you, on their way to see <a>Gav</a> at the <a>Observatory</a>.",
            "skrit": "The bustling town you see before you. It's one of the biggest in the <a>mountain</a>.<br>Skrit is also a gateway town to the rest of the <a>mountain</a> though the entrance is currently <a>sealed</a>.",
            "nexus": "Most of the <a>mountain</a> is made up of the ruins of the ages past.<br>The few places of relative peace are the settlements.<br>We call these nexuses.",
            "mountain": "There is more to the mountain than the pile of rock it seems to be.<br>To learn more find the Seer <a>Gav</a>.",
            "gav": "The seer Gav makes his home in the <a>Observatory</a>, high in the crown of the <a>mountain</a>.<br>No one knows where he came from or how long he's lived here.<br>He is a mystic and an oracle who only appears to those he finds worthy.",
            "observatory": "The Observatory is an ancient citadel built by the <a>Fehrr</a> on a remote outcropping near the top of the <a>mountain</a>.<br>It is here that <a>Gav</a> meditates and studies the heavens.<br>To reach him, you must open a <a>sealed</a> passage and use it to travel into the <a>upper</a> levels.",
            "upper": "This town is a peaceful <a>nexus</a> but the rest of the <a>mountain</a> is a warren of ruined passages. There are additional levels above and below us.",
            "sealed": "Mayor <a>Zef</a> had it sealed for our protection. Although the <a>nexus</a> shields us, the rest of the <a>mountain</a> is a place of darkness and ruin.<br>Evil <a>things</a> lurk in unused spaces...",
            "things": "Goblins and such. Never seen one myself, though rumor has it there are undead and demons on the lower levels.",
            "fehrr": "The Fehrr are an ancient race, now extinct. Little is known of them, other than that they inhabited the <a>mountain</a> before humankind.",
            "zef": "He is our mayor. You can usually find him at <a>Anita</a>'s inn.",
            "anita": "She is the local innkeeper."
        },
        "83,286,3": {
            "_name_": "Nezz",
            "": "I am Nezz, the town <a>sage</a>. You must be <a>wondering</a> where you are.",
            "sage": "It is my job to <a w='wondering'>divine</a> the fate of all here.",
            "library": "Take the stairs down to my basement and feel free to browse my tomes. It may teach you a little of the history of our world.",
            "things": "Goblins and other monsters. You may consult my <a>library</a> downstairs if you wish to learn more about the local fauna.",
            "upper": "This town is a peaceful <a>nexus</a> but the rest of the <a>mountain</a> is a warren of ruined passages. There are additional levels above and below us. If you'd like you can borrow my map of the mountain from my <a>library</a>.",
        },
        "170,43,3": {
            "_name_": "Zef",
            "": "Speak quickly <a w='travelers'>traveler</a>, for the work of <a>mayor</a> never ceases.",
            "mayor": "My name is Zef, I'm the mayor of the town of <a>Skrit</a>. Mainly, I oversee the <a>safety</a> of our citizens.",
            "safety": "As I'm sure you <a w='nexus'>know</a>, the <a>mountain</a> is a dangerous place. Towns like <a>Skrit</a> are but beacons of safety in its darkness.<br>For this reason, I've had the gateway to the outside <a>sealed</a>.",
            "sealed": function() {
                if(ZIL.has_quest("sewers")) {
                    return "The gateway out of Skrit will remain closed until you've helped me by getting rid of the beast in the <a>sewers</a>.";
                } else if(ZIL.completed_quest("sewers")) {
                    return "Thank you for ensuring the safetry of our citizens! As promised, I've had the gateway is to the rest of the <a>mountain</a> opened.";
                } else if(ZIL_UTIL.game_state["opened_skrit_gate"]) {
                    return "In response to reports of fewer monsters in the area, I've decided to open the gateway to the rest of the <a>mountain</a>.";
                } else {
                    ZIL.add_quest("sewers");
                    return "You want to venture into the outer darkness of the <a>mountain</a>? To do that, first you must do a <a>favor</a> for me."
                }
            },
            "favor": "I've heard rumors of some kind of monster living in the town <a>sewers</a>. I want you to get rid of it for me before someone gets hurt.",
            "sewers": "Like all old construction in the <a>mountain</a>, the sewers were also built by the <a>Fehrr</a>. You can find the entrance in the west part of town."
        },
        "159,59,3": {
            "_name_": "Anita",
            "": "Are you thirsty, dear? We have the finest ales in all of <a w='many'>Skrit</a>."
        },
        "242,49,1": {
            "_name_": "Geoff",
            "": "Welcome to <a w='many'>Skrit</a>, traveler. How can a simple cow-hand be of assistance?"
        },
        "107,48,3": {
            "_name_": "Han",
            "": "I was once a <a w='travelers'>traveler</a> like yourself."
        },
        "47,114,3": {
            "_name_": "Sten",
            "": "I am a simple mushroom farmer here in <a w='many'>Skrit</a>."
        },
        "43,62,3": {
            "_name_": "Mur",
            "": "<a>Geoff</a> is a bloody thief, is what he is!"
        },
        "252,207,2": {
            "_name_": "Narg",
            "": "Begone lout, before you <a>break</a> something."
        }
    }
};
ZilStory.CONVO_KEY = null;

ZilStory.get_creature_name = function(map_category, map_name, creature) {
    var pos_key = [creature.mobile.origin_x, creature.mobile.origin_y, creature.mobile.origin_z].join(",");
    var m = ZilStory.CONVO[map_category + "." + map_name];
    if(ZIL.DEBUG_MODE) console.log(map_category + "." + map_name + " pos=", pos_key);
    if(m && m[pos_key] && m[pos_key]["_name_"]) {
        return m[pos_key]["_name_"];
    } else {
        return creature.mobile.get_name();
    }
};

ZilStory.on_convo_render = function(el) {
    var as = $("a", el);
    for(var i = 0; i < as.length; i++) {
        var a = as.eq(i);
        a.addClass("convo_link").click(function (event) {
            var a = $(event.currentTarget);
            var key = a.attr("w") || a.text().trim().toLowerCase();
//            console.log("convo key=" + key + " click=", a);
            var convo_tree = ZilStory.CONVO[ZilStory.CONVO_KEY[0]][ZilStory.CONVO_KEY[1]];
            var common_tree = ZilStory.CONVO[ZilStory.CONVO_KEY[0]]["common"];
            var text = convo_tree[key] || (common_tree && common_tree[key]) || convo_tree[""];
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
        var text = m[pos_key][""];
        if(typeof text == "function") text = text();
        ZIL.say(creature, text, null, ZilStory.on_convo_render);
    }
};
