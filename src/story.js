function ZilStory() {
}

ZilStory.USE_DEFAULT_HANDLER = "___use_default___";

ZilStory.QUESTS = {
    "gav": {
        name: "Find the seer Gav",
        level: 1,
        on_complete: function() {
        }
    },
    "sewers": {
        name: "Kill the beast in the Skrit sewers",
        level: 1,
        on_complete: function() {
            ZIL_UTIL.game_state["opened_skrit_gate"] = true;
            ZIL_UTIL.save_config();
        }
    },
    "keepers": {
        name: "Find two keepers in the Temple of the Mountain Lord",
        level: 2,
        on_complete: function() {
        }
    },
    "endiminium": {
        name: "Bring a sample of Endiminium to Trader Daz",
        level: 3,
        on_complete: function() {
            ZIL.player.mobile.add_spell(Spell.BREAK_BARRIER);
            ZIL.player.save_stats();
        }
    }
};

ZilStory.MAPS = {
    "maps.ante": {
        events: {
            on_load: function() {
                if(!ZIL_UTIL.game_state["seen_intro"]) {
                    setTimeout(function() {
                        ZIL_UTIL.game_state["seen_intro"] = true;
                        ZIL_UTIL.save_config();
                        ZIL.say(ZIL.player, "What... <b>is...</b> <i>happening?...</i>", function () {
                            ZIL.say(ZIL.player, "I've seen this land before...<br>It's <b>Grove</b>, the world I built!", function () {
                                ZIL.say(ZIL.player, "Trapped in my own game?!<br>How is this possible?", function () {
                                    ZIL.say(ZIL.player, "I must find a <b>way back into reality.</b>");
                                });
                            });
                        });
                    }, 500);
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
                    ZIL.show_sign("Welcome, O Traveler to the holy temple of the <i>Mountain Lord.</i><br><br>" +
                        "May you leave your worldly cares outside our gates and rest safely in our robust granite halls " +
                        "in peace and...<br><br>" +
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
            },
            "137,420,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    if(ZIL.player.mobile.has_spell(Spell.HEAL)) {
                        ZIL.say(ZIL.player, "I found a <b>magic scroll</b> but looks like I already have this one.");
                    } else {
                        ZIL.player.mobile.add_spell(Spell.HEAL);
                        ZIL.player.save_stats();
                        ZIL.say(ZIL.player, "I found a new <b>magic scroll!</b> It reads: " + Spell.HEAL.name);
                    }
                }
            },
            "695,744,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.load_shape("maps", "abandoned_temple_3", 38, 40);
                }
            }
        }
    },
    "maps.abandoned_temple_3": {
        events: {
            on_load: function() {
                if (!ZIL_UTIL.game_state["encounter_exygor"]) {
                    ZIL.for_creatures_in_area(22, 148, 92, 238, function(creature) {
                        if(creature != ZIL.player) {
                            creature.mobile.make_neutral();
                        }
                    });
                }
            },
            on_creature_near: function(creature) {
                if(creature.mobile.monster == MONSTERS.demon && !ZIL_UTIL.game_state["encounter_exygor"]) {
                    ZIL.center_screen_at(creature.mobile.x, creature.mobile.y);
                    ZIL.say(creature, "All hope is <b>lost</b> to you human. " +
                        "Your feeble exploration of the mountain ends now.<br><br>" +
                        "Eimorden will be pleased by this easy victory.<br><br>" +
                        "<i>Attack my minions! Feed on his soul!</i>", function () {
                            ZIL_UTIL.game_state["encounter_exygor"] = true;
                            ZIL_UTIL.save_config();
                            ZIL.for_creatures_in_area(22, 148, 92, 238, function(creature) {
                                if(creature != ZIL.player) {
                                    creature.mobile.make_evil();
                                }
                            });
                            Mobile.hide_convos();
                            return true;
                        }
                    );
                }
            }
        },
        locations: {
            "29,29,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.load_shape("maps", "abandoned_temple_2", 695, 740);
                }
            },
            "25,290,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.teleport(235, 379);
                }
            },
            "233,377,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.teleport(27, 292);
                }
            },
            "394,378,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.teleport(365, 209);
                }
            },
            "363,207,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.teleport(396, 380);
                }
            },
            "363,195,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.teleport(296, 157);
                }
            },
            "292,153,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.teleport(365, 197);
                }
            },
            "204,179,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.teleport(143, 192);
                }
            },
            "141,190,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.teleport(206, 181);
                }
            },
            "27,116,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.teleport(119, 298);
                }
            },
            "117,296,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.teleport(29, 118);
                }
            },
            "272,64,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.show_sign("Danger: Spiders have been spotted in this area.<br><br>" +
                        "Always walk in pairs and if attacked, protect the books first then fight back.<br><br>" +
                        "<i>(No fire-based spells are allowed.)</i>");
                }
            },
            "261,271,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.show_sign("This area is under development.<br><br>" +
                        "In the near future it will house the Karwadian wing of the library, due to a generous grant from C. Karwadian.<br><br>" +
                        "<i>Also: watch for spiders in this area</i>");
                }
            },
            "90,35,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.show_sign("Praise the <i>Mountain Lord</i> in his granit halls.<br><br>" +
                        "You may peruse the library of all worldly knowledge assembled here by the toils of many.<br><br>" +
                        "Ponder and respect this during your visit.");
                }
            },
            "128,295,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.load_shape("maps", "oram-gates", 357, 187);
                }
            }
        }
    },
    "maps.oram-gates": {
        events: {
            on_load: function () {
            }
        },
        locations: {
            "357,174,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.load_shape("maps", "abandoned_temple_3", 132, 304);
                }
            },
            "179,52,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.say(ZIL.player, "The city gates are locked and guarded for some reason.");
                }
            },
            "158,74,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.show_sign("Infectious disease danger: city gates locked due to <i>viral outbreak</i>, by order of the Mayor.<br><br>" +
                        "May the Mountain Lord show mercy on our worthless souls.");
                }
            },
            "210,75,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.show_sign("Infectious disease danger: city gates locked due to <i>viral outbreak</i>, by order of the Mayor.<br><br>" +
                        "May the Mountain Lord show mercy on our worthless souls.");
                }
            },
            "95,68,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.show_sign("Endiminium Gas Mine, Bore #74: <i>Breathing Mask</i> or <i>Protective Spell</i> recommended before entry.<br><br>Trespassers assume all risk.<br><br><small>Oram Gasworks Inc.</small>");
                }
            },
            "373,192,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.show_sign("Temple of the <i>Mountain Lord</i>, Library Entrance.<br><br>Fines or late fees on all <i>magical texts</i> are doubled.");
                }
            },
            "80,70,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.load_shape("maps", "gasmine1", 46, 48);
                }
            }
        }
    },
    "maps.gasmine1": {
        events: {
            on_load: function() {
                if (!ZIL_UTIL.game_state["encounter_eldgrawm"]) {
                    ZIL.for_creatures_in_area(508, 140, 624, 228, function(creature) {
                        if(creature != ZIL.player) {
                            creature.mobile.make_neutral();
                        }
                    });
                }
                ZIL.add_creature_listener(function(map_cat, map_name, creature) {
                    if(creature.mobile.monster == MONSTERS.aberration2) {
                        ZIL.say(ZIL.player, "The disgusting floating head slumps over and with a terrible gurgling noise, disgorges copious amounts of slime.<br><br>" +
                            "I better avoid touching the foul liquid - it's probably full of the germs responsible for the <b>plague</b>!");
                    }
                });
            },
            on_creature_near: function(creature) {
                if(creature.mobile.monster == MONSTERS.aberration2 && !ZIL_UTIL.game_state["encounter_eldgrawm"]) {
                    ZIL.player.mobile.cancel_pending_move();
                    ZIL.center_screen_at(creature.mobile.x, creature.mobile.y);
                    ZIL.say(creature, "...Graun-Brizzymh, Frowhe...<b>No business here</b> human... Leave us... Graun-Brizzhm... <b>Gaurhh!</b>", function () {
                            ZIL_UTIL.game_state["encounter_eldgrawm"] = true;
                            ZIL_UTIL.save_config();
                            ZIL.for_creatures_in_area(508, 140, 624, 228, function(creature) {
                                if(creature != ZIL.player) {
                                    creature.mobile.make_evil();
                                }
                            });
                            Mobile.hide_convos();
                            return true;
                        }
                    );
                }
            }
        },
        locations: {
            "43,38,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.load_shape("maps", "oram-gates", 91, 77);
                }
            },
            "600,157,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.load_shape("maps", "gasmine2", 143, 170);
                }
            }
        }
    },
    "maps.gasmine2": {
        events: {
            on_load: function() {
            }
        },
        locations: {
            "136,164,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.load_shape("maps", "gasmine1", 601, 173);
                }
            },
            "301,166,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    if(ZIL_UTIL.game_state["found_breathing_mask"]) {
                        if (!ZIL_UTIL.game_state["found_breathing_mask_2"]) {
                            ZIL_UTIL.game_state["found_breathing_mask_2"] = true;
                            ZIL_UTIL.save_config();
                            ZIL.say(ZIL.player, "With the breathing mask securely attached, " +
                                "I will proceed into the <b>Endiminium</b> filled chamber.");
                        }
                        return ZilStory.USE_DEFAULT_HANDLER; // just open the door
                    } else {
                        ZIL.say(ZIL.player, "Hmm, I smell the <b>Endiminium</b> gas from behind that door.<br><br>" +
                            "That must be where the extra samples are kept.<br><br>" +
                            "I better find a breathing apparatus beforing going in there.");
                        return true;
                    }
                }
            },
            "22,321,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    if(ZIL_UTIL.game_state["found_breathing_mask"]) {
                        ZIL.say(ZIL.player, "This is where I found the breathing mask I will use when <b>Endiminium</b> is nearby.");
                    } else {
                        ZIL.say(ZIL.player, "What's this? Tucked behind some dusty manuals on gas mining, is a used <b>breathing mask!</b><br><br>" +
                            "It seems to be functional enough for entering areas with <b>Endiminium</b> contamination.", function() {
                            Mobile.hide_convos();
                            ZIL_UTIL.game_state["found_breathing_mask"] = true;
                            ZIL_UTIL.save_config();
                            return true;
                        });
                    }
                }
            },
            "88,113,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.show_sign("Foreman Zorn's quarters this way.");
                }
            },
            "26,257,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.show_sign("Foreman Zorn's quarters: a half-day's wages will be charged for all lost equipment (including canaries)");
                }
            },
            "290,147,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    ZIL.show_sign("<b>Endiminium Gas Warning:</b> Safety equipment must be worn beyond this point.<br><br>" +
                        "Contact with the gas must be reported immediately to the foreman.");
                }
            },
            "279,293,1": {
                on_mouseover: function () {
                },
                on_mouseclick: function () {
                    if(ZIL_UTIL.game_state["has_endiminium"]) {
                        ZIL.say(ZIL.player, "I don't need any more <b>Endiminium</b> samples.");
                    } else {
                        ZIL.say(ZIL.player, "Huge barrels of liquid <b>Endiminium</b> gas. " +
                            "I will just fill up a small bottle with the stuff and take it back to <b>Trader Daz</b>.<br><br>" +
                            "Hopefully he will keep his end of the bargain and teach me the song that removes the <b>barriers</b> beyond this room.", function() {
                            Mobile.hide_convos();
                            ZIL_UTIL.game_state["has_endiminium"] = true;
                            ZIL_UTIL.save_config();
                            return true;
                        });
                    }
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

                            $("#map").show();

                            return true;
                        });
                    }
                }
            }
        }
    }
};

ZilStory.on_creature_near = function(map_category_name, map_shape_name, creature) {
    var m = ZilStory.MAPS[map_category_name + "." + map_shape_name];
    if(m && m.events && m.events.on_creature_near) {
        m.events.on_creature_near(creature);
    }
};

ZilStory.OUTDOOR_MAP_NAMES = [ "ante" ];

ZilStory.set_is_indoors = function(map_category_name, map_shape_name) {
    if(window["ZIL_BUILD"]) {
        ZIL_UTIL.is_indoors = false;
    } else if(map_category_name == "maps") {
        ZIL_UTIL.is_indoors= ZilStory.OUTDOOR_MAP_NAMES.indexOf(map_shape_name) == -1;
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
        var r = m.locations[pos_key][fx]();
        if(r == ZilStory.USE_DEFAULT_HANDLER) return false;
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
            "gav": function() {
                if(!ZIL.has_quest("gav")) ZIL.add_quest("gav");
                return "The seer Gav has made his home under these <a>peaks</a>.<br>You will need the <a>password</a> to enter.";
            },
            "password": function() {
                ZIL_UTIL.game_state["has_password"] = true;
                ZIL_UTIL.save_config();
                return "To open the gates, speak the phrase:<br>\"Wind under Silver Stars\"";
            },
            "peaks": "But, beware of depths child... There are things<br>in the darkness that aren't what they <a>seem</a>.",
            "seem": "Use your wits and might if you can.<br>The seer <a>Gav</a> only helps those who walk the right path."
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
            "upper": "This town is a peaceful <a>nexus</a> but the rest of the <a>mountain</a> is a warren of ruined passages. There are additional levels above and below us. If you'd like you can borrow my map of the mountain from my <a>library</a>."
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
    },
    "maps.abandoned_temple_2": {
        "common": {
            "keepers": "We are former acolytes of the <a w='mlord'>Mountain Lord</a>.<br><br>For our lifetime of service and devotion, our deity granted us eternal existance - which we spend here in his halls, tending to the remains of the <a>temple</a>.<br><br>Though the service is worthwhile, at times I can't bear the <a>boredom</a>.",
            "mlord": "May his granite roots be our haven and life energy!<br><br>We of <a>Mihyr</a> worship the Mountain Lord, the creator of the universe, who is all around us.<br><br>His benevolent breath is what you breathe, and the strength of the <a>mountain</a> rocks encircle and protect us from the wanton chaos of the <a>Helhyr</a>.",
            "temple": "All about you is what remains of one of the great temples of the <a w='mlord'>Mountain Lord</a>. Time and human reconing are a cruel pairing, yet we <a>keepers</a> never forget.<br><br>The Mountain Lord is <a>embodied</a> by the mountain for they are one and the same.<br><br>Robust and undieing they stand as sentinels, marking the passage of eons.<br><br>Although, once grand this place has fallen to ruin and most of the halls are now home to creatures of darkness.",
            "embodied": "One of the codes of the <a w='mlord'>Mountain Lord's</a> parables is the <a>mountain</a>.<br><br> Is it a place only in our imagination?<br><br>Only those studying its deepest <a>mysteries</a> can know for sure.",
            "mountain": "Home of the <a w='mlord'>Mountain Lord</a> and center of our universe.<br><br>There is more to the mountain than the pile of rock it seems to be.<br>To learn more find the Seer <a>Gav</a>.",
            "mysteries": "You seek <a>Gav</a> the Seer, I can tell. To reach him, you must travel through the <a>temple</a> and up into the higher levels of the <a>mountain</a>.<br><br>But beware traveler! Few are the safe spaces of this <a>temple</a>.",
            "gav": "The seer Gav makes his home in the <a>Observatory</a>, high in the crown of the <a>mountain</a>.<br>No one knows where he came from or how long he's lived here.<br>He is a mystic and an oracle who only appears to those he finds worthy.",
            "observatory": "The Observatory is an ancient citadel built by the <a>Fehrr</a> on a remote outcropping near the top of the <a>mountain</a>.<br>It is here that <a>Gav</a> meditates and studies the heavens.<br>To reach him, you must travel through this <a>temple</a> and then up towards the peaks.",
            "fehrr": "The Fehrr are an ancient race, now extinct. Little is known of them, other than that they inhabited the <a>mountain</a> before humankind.<br><br>If books still exist about them in our <a>library</a>, you may find them on the third level of this <a>temple</a>.",
            "mihyr": "Mihyr is another name for the upper levels of the <a>mountain</a>. The <a w='mlord'>Mountain Lord</a> is worshipped here.",
            "helhyr": "The lower part of the <a>mountain</a> is named Helhyr. It is a land of shadows, despair and grim doom. Little is known of the dark powers worshipped there, but visit our <a>library</a> on the third level and you may find more information.",
            "library": "The third level of the <a>temple</a> is carved from the living rock of the <a w='mlord'>Mountain Lord</a>.<br><br>As one of our most sacred places, it housed a collection of tomes detailing all human knowledge of the workings of the world.<br><br>Like the rest of the <a>temple</a>, it has also fallen to ruin but if you search it you may find a few books of interest.<br><br>This is also the level which connects to the rest of the upper levels of <a>Mihyr</a>.",
            "boredom": "If only there were <a>another</a> soul to converse with! I would love that."
        },
        "548,116,1": {
            "_name_": "Father Theo",
            "": function() {
                if(!ZIL_UTIL.game_state["met_father_theo"]) {
                    ZIL_UTIL.game_state["met_father_theo"] = true;
                    ZIL_UTIL.save_config();
                }
                return "Welcome seeker, I am Father Theo. I am one of the <a>keepers</a> of <a>temple</a> of the <a w='mlord'>Mountain Lord</a>.";
            },
            "another": function() {
                if(ZIL_UTIL.game_state["met_father_fran"]) {
                    if(!ZIL.completed_quest("keepers")) ZIL.quest_completed("keepers");
                    return "What an astonishing revelation! After these years of being in the service of <a w='mlord'>Mountain Lord</a> I'm given a boon.<br><br>Thank you traveler!";
                } else {
                    ZIL.add_quest("keepers");
                    return "Yes, well I realize my position in the grand scheme of life is rather unique. I expect there would not be another <a>keeper</a> around.<br><br>Still, if you should come across one... let me know, would you?";
                }
            }
        },
        "170,426,1": {
            "_name_": "Father Fran",
            "": function() {
                if(!ZIL_UTIL.game_state["met_father_fran"]) {
                    ZIL_UTIL.game_state["met_father_fran"] = true;
                    ZIL_UTIL.save_config();
                }
                return "Welcome traveler, I am Father Fran. I am one of the <a>keepers</a> of <a>temple</a> of the <a w='mlord'>Mountain Lord</a>.";
            },
            "another": function() {
                if(ZIL_UTIL.game_state["met_father_theo"]) {
                    if(!ZIL.completed_quest("keepers")) ZIL.quest_completed("keepers");
                    return "I cannot believe another <a w='keepers'>keeper</a> exists! Who would have thought, after all these years?<br><br>Thank you traveler!";
                } else {
                    ZIL.add_quest("keepers");
                    return "I'm sure the other <a>keepers</a> have already turned to dust if they ever even existed to begin with.<br><br>Should you meet one, though, please let me know!";
                }
            }
        }
    },
    "maps.oram-gates": {
        "common": {
            "oram": "Are ye daft or just hard-o hearin'? Ye be standing at her very gates!<br><br>Admire the gates, or a swift beatin' is all that's offered: ye can't <a w='business'>come in</a>.",
            "business": "Just passing through, eh?<br><br>Looking for someone named Gav?<br><br>Well that's too bad, 'cause no ones goes <b>in or out</b>, by order of the <a>mayor</a>.",
            "mayor": "Since ye are already wasting me time, I might as well mention that an 'orrible <a>plague</a> has cursed this town.<br><br>The mayor ordered the gates shut and guarded to ensure that filthy vermin like ye don't further spread this <a w='plague'>disease</a>.",
            "plague": "A raging madness comes about all who come near the afflicted.<br><br>They wander the streets in mobs, looking to spread their germs...'tis 'orrible!<br><br>If ye be wanting to find this Gav, better find <i>another way</i> up the mountain."
        },
        "192,66,1": {
            "_name_": "Guard Ron",
            "": "Come to gawk at the unhinged, ye worthless scab?<br><br>State yer <a>business</a> in <a>Oram</a> or sod off!"
        },
        "174,65,1": {
            "_name_": "Guard Bram",
            "": "What are you looking at ye filthy sod?<br><br>What <a>business</a> have ye in <a>Oram</a>?"
        },
        "99,88,1": {
            "_name_": "Trader Daz",
            "": function() {
                if(ZIL_UTIL.game_state["has_endiminium"]) {
                    if(ZIL.completed_quest("endiminium")) {
                        return "Thanks again for procuring a sample of <b>Endiminium</b> gas for me.<br><br>" +
                            "Now go forth and use the song of <b>Barrier Removal</b> to enter the city of Oram from the mines.";
                    } else {
                        ZIL.quest_completed("endiminium");
                        return "Ah yes, good work, that's exactly what I need...<br><br>" +
                            "I'll take the Endiminium sample and in return, here is the song of <b>Barrier Removal</b>.<br><br>" +
                            "May it serve you well in your travels to Oram and beyond.";
                    }
                } else {
                    return "Wanting to travel up the mountain, friend? Maybe we can come to a mutually beneficial <a>arrangement</a>...";
                }
            },
            "arrangement": "The nearby gas <a>mine</a> contains an air-vent that connects to the Oram city sewers. You <a>could</a> use it to travel into the diseased city.",
            "mine": "Before the <a>outbreak</a>, a local mining company mined Endiminium gas here. This chemical has lots of uses from curing meat to being a vital component in certain enchantments... The <a w='could'>latter</a> is what interests me.",
            "could": "Like I said, travel to the city is possible. The way in is currently blocked by a magical barrier and I know the arcane song to remove it.<br><br>All I require in return is for you to bring me a canister of Endiminium <a w='mine'>gas</a> from the mine.<br><br>A fair trade, now <a>what</a> do you say?",
            "what": function() {
                if(!ZIL.has_quest("endiminium")) ZIL.add_quest("endiminium");
                return "Good, good, I knew you could be reasonable.<br><br>Oh, I forgot to mention: the disease that plagues the city also appears in the mine, so you may encounter some... abberrations...<br><br>I'm confident you will have no trouble. Remember, bring me a single <a w='could'>canister</a> of the gas, and I will teach you the song of unblocking.<br><br>Good luck!"
            }
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
