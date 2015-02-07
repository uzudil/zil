jQuery.fn.redraw = function() {
    return this.hide(0, function() {
        $(this).show();
    });
};

var ZIL = {

	scene: null,
	scene2: null,
	camera: null,
	renderer: null,
	move: [0, 0, 0],
	cursor: [0, 0, 0],
	global_pos: [0, 0, 0],
	fps_counter: 0,
	fps_start: Date.now(),
	XY_PLANE: new THREE.Plane(new THREE.Vector3(0, 0, 1), 1),
    last_time: 0,
    screen_pos_map: {},
    creatures_map: {},
    shown_creatures: {},
    in_combat: false,
    combat_creature: null,
    combat_creatures: null,
    combat_creature_index: 0,
    selected_creature: null,
    combat_selected_creature: null,
    combat_action_click_count: 0,
    combat_plan_x: 0,
    combat_plan_y: 0,
    combat_plan_z: 0,
    ground_marker: null,
    last_mouse_event: null,
    INTRO_ID: null,
    INTRO_TIMEOUT: null,
    GAME_PAUSED: false,
    on_unpause: null,
    Z_SCALE: 4,
    shape_name_and_location: null,
    LOADING: false,
    quake_start: null,
    quake_step_start: null,
    DEBUG_MODE: false,
    creature_listeners: [],
    node_debug: null,
    combat_range: null,
    command_enter_mode: false,
    missile: null,

	mouse_move: function(event) {
        ZIL.mouse_position_event(event);
    },

    mouse_position_event: function(event) {
        if(ZIL.GAME_PAUSED || ZIL.LOADING) return;
        if(event == null) event = ZIL.last_mouse_event;
        if(event == null) return;

        ZIL.last_mouse_event = event;

        if (ZIL.selected_creature) {
            ZIL.selected_creature.mobile.set_selected(false);
            ZIL.selected_creature = null;
        }

        ZIL.shape_name_and_location = null;

        $(".creature_description").remove();

        var intersections = ZIL.mouse_to_world(event);
        if(intersections && intersections.length > 0) {
            var position_handled = false;
            for(var i = 0; i < intersections.length; i++) {
                var intersection = intersections[i];

                // adjust for scale
                intersection.point.z = (intersection.point.z + 0.5) / ZIL.Z_SCALE;
                // -0.5 seems to make picking more reliable...
                intersection.point.x -= 0.5;
                intersection.point.y -= 0.5;
                intersection.point.x = Math.round(intersection.point.x);
                intersection.point.y = Math.round(intersection.point.y);
                intersection.point.z = Math.round(intersection.point.z);
                var point = intersection.point;

                // a creature?
                if (intersection.object && intersection.object.userData) {
                    var target_creature = intersection.object.userData.creature;
                    if (target_creature && target_creature != ZIL.player && target_creature.mobile.is_alive() && ZIL.is_waiting_for_player()) {
                        target_creature.mobile.set_selected(true);
                        ZIL.selected_creature = target_creature;

                        // tooltip
                        target_creature.mobile.show_above(ZilStory.get_creature_name(ZIL.shape.category, ZIL.shape.name, target_creature), "creature_description");
                        $("body").css("cursor", "pointer");
                        position_handled = true;
                        break;
                    }
                }

                var tx = point.x + ZIL.global_pos[0];
                var ty = point.y + ZIL.global_pos[1];
                var tz = point.z + ZIL.global_pos[2];
                ZIL.shape_name_and_location = ZIL.shape.get_shape_at(tx, ty, tz);
                if (ZIL.shape_name_and_location) {
                    if(ZIL.DEBUG_MODE) console.log(">>> ZIL.shape_name_and_location=", ZIL.shape_name_and_location);
                    var pos = ZIL.shape_name_and_location.slice(1, 4);
                    if(ZilStory.mouseover_location(ZIL.shape.category, ZIL.shape.name, ZIL.shape_name_and_location[0], pos)) {
                        $("body").css("cursor", "pointer");
                        position_handled = true;
                        break;
                    } else if(ZIL.shape_hover(ZIL.shape_name_and_location[0], pos)) {
                        $("body").css("cursor", "pointer");
                        position_handled = true;
                        break;
                    }
                }
            }

            if(!position_handled) {
//                console.log("Checking:");
                for(var i = 0; i < intersections.length; i++) {
                    var intersection = intersections[i];

                    var tx = intersection.point.x + ZIL.global_pos[0];
                    var ty = intersection.point.y + ZIL.global_pos[1];
                    var tz = intersection.point.z + ZIL.global_pos[2];

                    if(!ZIL.shape.nodes[(tx / ZilShape.PATH_RES)|0]) continue;
                    var node = ZIL.shape.nodes[(tx / ZilShape.PATH_RES)|0][(ty / ZilShape.PATH_RES)|0];
//                    console.log("---" + tx + "," + ty + "," + tz + " node=", node);
                    if(node && !node.is_empty) {
                        ZIL.cursor[0] = node.x - ZIL.global_pos[0];
                        ZIL.cursor[1] = node.y - ZIL.global_pos[1];
                        ZIL.cursor[2] = node.z - ZIL.global_pos[2];

                        ZIL.obj.position.set(ZIL.cursor[0], ZIL.cursor[1], ZIL.cursor[2]);
                        ZIL.show_cursor_pos();
                        break;
                    }
                }
            }
        }

        // reset cursor
        if($("body").css("cursor") == "pointer" && !ZIL.selected_creature && !ZIL.shape_name_and_location) {
            $("body").css("cursor", "default");
        }
	},

    is_waiting_for_player: function() {
        return !ZIL.in_combat || (ZIL.combat_creature == ZIL.player && ZIL.combat_action_click_count < 2);
    },

    mouse_up: function(event) {
        if(ZIL.LOADING) return;
        if(ZIL.GAME_PAUSED) {
            // unpause
            ZIL.set_paused(false);
            return;
        }

        var x = ZIL.global_pos[0] + ZIL.cursor[0];
        var y = ZIL.global_pos[1] + ZIL.cursor[1];
        var z = ZIL.cursor[2];

        if(ZIL.in_combat) {
            if(ZIL.combat_creature == ZIL.player) {

                // open doors, use ladders, etc
                if(ZIL.shape_name_and_location) {
                    var pos = ZIL.shape_name_and_location.slice(1, 4);
                    click_handled = ZilStory.mouseclick_location(ZIL.shape.category, ZIL.shape.name, ZIL.shape_name_and_location[0], pos);
                    if(!click_handled) {
                        click_handled = ZIL.shape_clicked(ZIL.shape_name_and_location[0], pos);
                    }
                }
                if(click_handled) return;

                ZIL.combat_selected_creature = ZIL.selected_creature;
                if(ZIL.combat_selected_creature) {
                    x = ZIL.combat_selected_creature.mobile.x;
                    y = ZIL.combat_selected_creature.mobile.y;
                    z = ZIL.combat_selected_creature.mobile.z;
                }
//                console.log("click=" + ZIL.combat_action_click_count +
//                    " selected=" + (ZIL.combat_selected_creature ? ZIL.combat_selected_creature.mobile.get_name() : "") +
//                    " target=" + (ZIL.player.mobile.target ? ZIL.player.mobile.target.mobile.get_name() : "") +
//                    " pos=" + x + "," + y + "," + z +
//                    " changed=" + ZIL.combat_selection_changed(x, y, z));

                if (ZIL.combat_action_click_count == 0 || ZIL.combat_selection_changed(x, y, z)) {
                    // plan the move
                    ZIL.combat_action_click_count = 0;
                    ZIL.player.mobile.set_target(ZIL.combat_selected_creature);
                    if(ZIL.combat_selected_creature) {
                        x = ZIL.combat_selected_creature.mobile.x;
                        y = ZIL.combat_selected_creature.mobile.y;
                    }
                    ZIL.player.mobile.plan_move_to(ZIL.shape, x, y, z - 1);
                    var in_range = ZIL.player.mobile.is_target_in_range();
                    if(ZIL.player.mobile.is_moving() || in_range) {
                        ZIL.show_ground_target(x, y);

                        ZIL.toggle_player_combat_indicators(true);

                    } else {
                        // can't move there
                        ZIL.show_forbidden();
                        ZIL.toggle_player_combat_indicators(false);
                        ZIL.combat_action_click_count = -1;
                    }
                } else {
                    ZIL.combat_selected_creature = null;
                }
                ZIL.combat_action_click_count++;
                ZIL.combat_plan_x = x;
                ZIL.combat_plan_y = y;
                ZIL.combat_plan_z = z;
            }
        } else {
            var click_handled = false;
            if(ZIL.selected_creature) {
                if (ZIL.selected_creature.mobile.alignment == ZIL.player.mobile.alignment) {
                    ZIL.start_convo();
                } else {
                    ZIL.player.mobile.set_target(ZIL.selected_creature);
                    ZIL.start_combat();
                }
                click_handled = true;
            } else if(ZIL.shape_name_and_location) {
                var pos = ZIL.shape_name_and_location.slice(1, 4);
                click_handled = ZilStory.mouseclick_location(ZIL.shape.category, ZIL.shape.name, ZIL.shape_name_and_location[0], pos);
                if(!click_handled) {
                    click_handled = ZIL.shape_clicked(ZIL.shape_name_and_location[0], pos);
                }
            }

            if(!click_handled) {
                // mark location and move
                ZIL.show_ground_target(x, y);
                ZIL.player.mobile.plan_move_to(ZIL.shape, x, y, z - 1);
                if (ZIL.player.mobile.move_path == null || ZIL.player.mobile.move_path.length == 0) {
                    ZIL.show_forbidden();
                }
            }
        }
        return false;
    },

    toggle_player_combat_indicators: function(enabled) {
        if(enabled) {
            var message;
            if(ZIL.player.mobile.is_target_in_range() || ZIL.player.mobile.is_target_in_range_on_path()) {
                message = "Attack! AP: 0"
            } else {
                var ap = ZIL.player.mobile.ap - ((ZIL.player.mobile.move_path ? ZIL.player.mobile.move_path.length : 0) / ZilShape.PATH_RES)|0;
                message = "AP: <span class='" + (ap >= 0 ? "ap_cost_ok" : "ap_cost_error") + "'>" + ap + "/" + ZIL.player.mobile.max_ap + "</span>";
            }
            ZIL.player.mobile.show_above(message, "player_plan");

            // show range tiles on floor
            ZIL.show_combat_range(ZIL.player);
        } else {
            ZIL.player.mobile.remove_divs("player_plan");
            if(ZIL.combat_range) ZIL.inner.remove(ZIL.combat_range);
        }
    },

    force_replace_shape: function(x, y, z, cat, name, rot, nx, ny, nz) {
        return ZIL.replace_shape(x, y, z, cat, name, rot, nx, ny, nz, true);
    },

    replace_shape: function(x, y, z, cat, name, rot, nx, ny, nz, skip_check) {
        // remove the current shape
        var old_shape = ZIL.shape.del_position(x, y, z);

        // add new shape
        var s = ZilShape.load_shape(cat, name, rot);
        if(nx == null) {
            nx = x;
            ny = y;
            nz = z;
        }
        if(!skip_check && !ZIL.shape.check_shape_fits(nx, ny, nz, s, function(x, y, z) {
            var cx = (x / ZIL_UTIL.CHUNK_SIZE)|0;
            var cy = (y / ZIL_UTIL.CHUNK_SIZE)|0;
            var creatures = Mobile.get_for_chunk(cx, cy);
            for(var i = 0; i < creatures.length; i++) {
                if(creatures[i].mobile.contains_point(x, y, z)) return true;
            }
            return false;
        })) {
            // reset the old shape
            ZIL.shape.set_shape(x, y, z, old_shape);
            ZIL.redraw_shape();
            return false;
        }

        ZIL.shape.set_shape(nx, ny, nz, s);

        ZIL.redraw_shape();

        return true;
    },

    shape_hover: function(shape_name, pos) {
        return shape_name.indexOf("doors.") == 0 || shape_name.indexOf("objects.mlord_banner") == 0;
    },

    shape_clicked: function(shape_name, pos) {
        var split_name = shape_name.split(".");
        console.log("+++ " + shape_name);
        if(shape_name.indexOf("objects.mlord_banner") == 0) {
            ZIL.show_sign("You see the banner of the <i>Mountain Lord</i> - the deity worshipped on the upper levels of the mountain.");
            return true;
        } else if(shape_name.indexOf("doors.") == 0) {
            var shape = ZIL.shape.get_shape(pos[0], pos[1], pos[2]);
            var fits;
            if(shape.rot == 1 || shape.rot == 3) {
                fits = ZIL.replace_shape(pos[0], pos[1], pos[2], split_name[0], split_name[1], 0);
            } else {
                fits = ZIL.replace_shape(pos[0], pos[1], pos[2], split_name[0], split_name[1], 1);
            }

            // is there something in the way?
            if(!fits) {
                ZIL.show_forbidden();
                return false;
            }

            // rebuild the nodes
            ZIL.shape.build_nodes(ZIL.player.mobile.x, ZIL.player.mobile.y, ZIL.player.mobile.z);
            ZIL.init_node_debug();

            // repaint
            ZIL.set_global_pos(ZIL.global_pos[0], ZIL.global_pos[1], ZIL.global_pos[2]);
            ZIL.screen_pos_map = {};
            ZIL.clear_ground_target();
            ZIL.redraw_shape();

            return true;
        }
        return false;
    },

    start_convo: function() {
        if(ZIL.selected_creature) {
            ZIL.center_screen_at(ZIL.selected_creature.mobile.x, ZIL.selected_creature.mobile.y);
            ZilStory.start_conversation(ZIL.shape.category, ZIL.shape.name, ZIL.selected_creature);
        }
    },

    show_forbidden: function() {
//        console.log("Can't move there.");
        ZIL.combat_action_click_count = 0;
        ZIL.clear_ground_target();
        $("body").css("cursor", "not-allowed");
        setTimeout(function() {
            $("body").css("cursor", "default");
        }, 1000);
    },

    combat_selection_changed: function(x, y, z) {
        return ZIL.combat_plan_x != x ||
            ZIL.combat_plan_y != y ||
            ZIL.combat_plan_z != z ||
            ZIL.combat_selected_creature != ZIL.player.mobile.target;
    },

    clear_ground_target: function() {
        if(ZIL.ground_marker) ZIL.rendered_shape.remove(ZIL.ground_marker);
    },

    show_ground_target: function(x, y) {
        if(ZIL.ground_marker) ZIL.rendered_shape.remove(ZIL.ground_marker);

        var w, h;
        if(ZIL.combat_selected_creature) {
            w = ZIL.combat_selected_creature.mobile.shape.width + 2;
            h = ZIL.combat_selected_creature.mobile.shape.height + 2;
        } else {
            w = ZIL.player.mobile.shape.width + 4;
            h = ZIL.player.mobile.shape.height + 4;
        }
        // make is square
        w = h = Math.max(w, h);

        var xp = x - ZIL.global_pos[0];
        var yp = y - ZIL.global_pos[1];

        var geometry = new THREE.PlaneBufferGeometry(w, h);
        ZIL.ground_marker = new THREE.Mesh(geometry, ZIL.target_texture);
        ZIL.ground_marker.position.set(xp, yp,
                ZIL.shape.get_highest_empty_space(xp + ZIL.global_pos[0], yp + ZIL.global_pos[1]) + 0.1);
        ZIL.rendered_shape.add(ZIL.ground_marker);
    },

	mouse_to_world: function(event) {
        // http://stackoverflow.com/questions/26822587/using-raycaster-with-an-orthographic-camera
		var mousex = (( (event.offsetX - ZIL.offset_x) / ZIL.canvas_width ) * 2 - 1);
		var mousey = (-( (event.offsetY - ZIL.offset_y) / ZIL.canvas_height ) * 2 + 1);
        var vector = new THREE.Vector3( mousex, mousey, -1 ).unproject( ZIL.camera );
        ZIL.dir_vector.set( 0, 0, -1 ).transformDirection( ZIL.camera.matrixWorld );
        ZIL.raycaster.set( vector, ZIL.dir_vector );
        return ZIL.raycaster.intersectObjects( ZIL.rendered_shape.children, true );
	},

	cursor_moved: function() {
		if(ZIL.last_cursor == null) {
			ZIL.last_cursor = [0, 0, 0];
		}
		if(ZIL.last_cursor[0] != ZIL.cursor[0] || ZIL.last_cursor[1] != ZIL.cursor[1] || ZIL.last_cursor[2] != ZIL.cursor[2]) {
			ZIL.last_cursor[0] = ZIL.cursor[0];
			ZIL.last_cursor[1] = ZIL.cursor[1];
			ZIL.last_cursor[2] = ZIL.cursor[2];
			return true;
		} else {
			return false;
		}
	},

    stop_command_mode: function() {
        ZIL.command_enter_mode = false;
    },

	key_up: function(event) {
        if(ZIL.command_enter_mode) {
            Commands.special_key(event);
            return false;
        }
        return true;
    },

	key_press: function(event) {
        if(ZIL.command_enter_mode) {
            Commands.typed_key(event);
            return false;
        }
        return true;
    },

	key_down: function(event) {
        if(ZIL.LOADING || ZIL.command_enter_mode) return;

        if(event.which == 9 && !ZIL.command_enter_mode) {
            ZIL.command_enter_mode = true;
            Commands.start();
            return false;
        }

		if(event.target != document.body) return true;
        if(ZIL.GAME_PAUSED) return;

        if(ZIL.INTRO_ID != null) {
            if(ZIL.INTRO_TIMEOUT) {
                clearTimeout(ZIL.INTRO_TIMEOUT);
                ZIL.INTRO_TIMEOUT = null;
                $(".intro").hide();
                ZIL.INTRO_ID++;
                ZIL.play_intro_sequence();
            }
            return true;
        }

        // move the cursor
        if(event.which == 32) {
            ZIL.DEBUG_MODE = !ZIL.DEBUG_MODE;
            if(ZIL.DEBUG_MODE) {
                ZIL.inner.add( ZIL.node_debug );
//                ZIL.inner.add( ZIL.coord );
                ZIL.inner.add( ZIL.obj );
                $("#debug").show();
            } else {
                ZIL.inner.remove( ZIL.node_debug );
//                ZIL.inner.remove( ZIL.coord );
                ZIL.inner.remove( ZIL.obj );
                $("#debug").hide();
            }
        }

		$("#global_pos").empty().html(ZIL.global_pos.join(",") + "-" + [
			ZIL.global_pos[0] + ZIL_UTIL.VIEW_WIDTH,
			ZIL.global_pos[1] + ZIL_UTIL.VIEW_HEIGHT,
			ZIL.global_pos[2] + ZIL_UTIL.VIEW_DEPTH].join(","));
		ZIL.show_cursor_pos();
		return true;
	},

	show_cursor_pos: function() {
		$("#cursor_pos").empty().html([
			ZIL.cursor[0] + ZIL.global_pos[0],
			ZIL.cursor[1] + ZIL.global_pos[1],
			ZIL.cursor[2] + ZIL.global_pos[2]].join(","));
	},

    move_visible_creatures: function(delta_time) {
        var drawn_creatures = {};
        for(var x = 0; x < ZIL_UTIL.VIEW_WIDTH; x+=ZIL_UTIL.CHUNK_SIZE) {
            for(var y = 0; y < ZIL_UTIL.VIEW_WIDTH; y+=ZIL_UTIL.CHUNK_SIZE) {
                var cx = ((ZIL.global_pos[0] + x)/ZIL_UTIL.CHUNK_SIZE)|0;
                var cy = ((ZIL.global_pos[1] + y)/ZIL_UTIL.CHUNK_SIZE)|0;
                var creatures = Mobile.get_for_chunk(cx, cy);
                if(creatures.length > 0) {
                    for (var idx = 0; idx < creatures.length; idx++) {
                        var c = creatures[idx];
                        if(c.mobile.ai_move && !c.mobile.remove_me) {

                            // if not yet added, add creature
                            if (ZIL.shown_creatures[c.id] == null) {
                                ZIL.rendered_shape.add(c.mobile.shape_obj);
                                ZIL.rendered_shape2.add(c.mobile.shape_obj_copy);
                                ZIL.shown_creatures[c.id] = true;
                            }

                            drawn_creatures[c.id] = true;
                            c.mobile.move_step(ZIL.shape, ZIL.global_pos[0], ZIL.global_pos[1], ZIL.global_pos[2], delta_time);
                        }
                    }
                }
            }
        }

        // remove not-shown creatures
        var remove_ids = [];
        for(var creature_id in ZIL.shown_creatures) {
            if(drawn_creatures[creature_id] == null) {
                remove_ids.push(creature_id);
            }
        }
        ZIL.remove_creatures(remove_ids);
    },

    remove_creatures: function(creature_ids) {
        for(var i = 0;  i < creature_ids.length; i++) {
            var creature_id = creature_ids[i];
            var creature = ZIL.creatures_map[creature_id];
            if(creature.mobile.shape_obj && creature.mobile.shape_obj.parent) ZIL.rendered_shape.remove(creature.mobile.shape_obj);
            if(creature.mobile.shape_obj_copy && creature.mobile.shape_obj_copy.parent) ZIL.rendered_shape2.remove(creature.mobile.shape_obj_copy);
            creature.mobile.remove_divs();

            // don't show again
            if(creature.mobile.remove_me) creature.mobile.remove_creature();

            delete ZIL.shown_creatures[creature_id];
            console.log("Removed id " + creature_id + " remaining: ", Object.keys(ZIL.shown_creatures));
        }
    },

    show_cursor: function() {
        // cursor move
        ZIL.cursor[0] += ZIL.move[0];
        ZIL.cursor[1] += ZIL.move[1];
        ZIL.cursor[2] += ZIL.move[2];
        ZIL.move = [0, 0, 0];
        ZIL.obj.position.set(ZIL.cursor[0], ZIL.cursor[1], ZIL.cursor[2]);
        ZIL.show_cursor_pos();
    },

    // delta_time: millis since last render
	game_step: function(delta_time) {
        ZIL.quake_step();

        ZIL.show_cursor();

        if(ZIL.missile) {
            if(!ZIL.missile.step(delta_time, ZIL.global_pos[0], ZIL.global_pos[1], ZIL.global_pos[2])) {
                ZIL.missile = null;
            }
        } else if (ZIL.in_combat) {
            ZIL.combat_step(delta_time);
        } else {
            if (ZIL.player.mobile.is_attacking()) {
                // debug attack animation
                ZIL.player.mobile.attack(delta_time);
            } else {
                if (ZIL.player.mobile.move_step(ZIL.shape, ZIL.global_pos[0], ZIL.global_pos[1], ZIL.global_pos[2], delta_time)) {
                    ZIL.recenter_screen();
                    ZIL.move_visible_creatures(delta_time);
                    if (!ZIL.player.mobile.is_moving() || ZIL.player.mobile.move_path_index >= 8) {
                        ZIL.clear_ground_target();
                    }
                }
            }
        }

        // hack: the first render settles any css anomalies, so skip it
        if(ZIL_UTIL.first_render == null) {
            ZIL_UTIL.first_render = true;
            return;
        }

        Mobile.move_damage_divs(delta_time);

        ZilCal.run(delta_time);
	},

    combat_step: function(delta_time) {

        // hide creature selection
        if(ZIL.is_waiting_for_player()) {
            if($("body").css("cursor") == "progress") {
                $("body").css("cursor", "default");
                ZIL.mouse_position_event(); // reselect creature under mouse
            }
        } else {
            if(ZIL.selected_creature) {
                ZIL.selected_creature.mobile.set_selected(false);
                $(".creature_description").remove();
                ZIL.selected_creature = null;
            }
            $("body").css("cursor", "progress");
        }

        // init combat or select next creature
        if(ZIL.combat_creature == null) {
            ZIL.init_combat_turn();
        } else if(ZIL.combat_creature.mobile.is_target_dying()) {
            // the target is dying: wait
            ZIL.combat_creature.mobile.target.mobile.move_step(ZIL.shape, ZIL.global_pos[0], ZIL.global_pos[1], ZIL.global_pos[2], delta_time);
            return;
        } else if(ZIL.combat_creature.mobile.is_casting_spell()) {
            // casting a spell: wait
            // todo: tie this in with rest of combat: center screen, ap, enable ui, etc.
            ZIL.combat_creature.mobile.move_step(ZIL.shape, ZIL.global_pos[0], ZIL.global_pos[1], ZIL.global_pos[2], delta_time);
            return;
        } else if(ZIL.combat_creature.mobile.ap <= 0) {
            ZIL.next_combat_creature();
        }

        // combat is over
        if(ZIL.combat_creature == null) {
//            console.log(">>> combat DONE.");
            ZIL.in_combat = false;
            ZIL.center_screen_at(ZIL.player.mobile.x, ZIL.player.mobile.y);
            ZIL.clear_ground_target();
            ZIL.toggle_player_combat_indicators(false);
            $("body").css("cursor", "default");
            ZIL.mouse_position_event(); // reselect creature under mouse
            return;
        }

        // combat move
        if(ZIL.combat_creature.mobile.ap > 0 && (ZIL.combat_creature != ZIL.player || ZIL.combat_action_click_count > 1)) {

            ZIL.toggle_player_combat_indicators(false);

            // make sure the combat is visible
            ZIL.recenter_screen(ZIL.combat_creature.mobile.x, ZIL.combat_creature.mobile.y);

            // start combat
            if(!ZIL.combat_creature.mobile.is_attacking() && ZIL.combat_creature.mobile.is_target_in_range()) {
                ZIL.combat_creature.mobile.start_attack();
            }

            if(ZIL.combat_creature.mobile.is_attacking()) {
                // attack animation
                if(ZIL.combat_creature.mobile.attack(delta_time)) {
                    // attack done: turn is up
                    ZIL.combat_ap_dec(ZIL.combat_creature.mobile.ap);
                }
            } else {
                // take a step
                var cx = (ZIL.combat_creature.mobile.x / ZilShape.PATH_RES)|0;
                var cy = (ZIL.combat_creature.mobile.y / ZilShape.PATH_RES)|0;
//                console.log("0 id=" + ZIL.combat_creature.id + " ap=" + ZIL.combat_creature.mobile.ap + " path=", ZIL.combat_creature.mobile.move_path);
                var old_index = ZIL.combat_creature.mobile.move_path_index;
                if (ZIL.combat_creature.mobile.move_step(ZIL.shape, ZIL.global_pos[0], ZIL.global_pos[1], ZIL.global_pos[2], delta_time)) {
                    // a step taken
                    var nx = (ZIL.combat_creature.mobile.x / ZilShape.PATH_RES)|0;
                    var ny = (ZIL.combat_creature.mobile.y / ZilShape.PATH_RES)|0;
                    if(Math.abs(nx - cx) >= 1 || Math.abs(ny - cy) >= 1) {
                        ZIL.combat_ap_dec(1);
                    }

                    // monster couldn't move (blocked by creature?)
                    if(ZIL.combat_creature.id != ZIL.player.id && old_index == ZIL.combat_creature.mobile.move_path_index) {
                        // end turn
                        ZIL.combat_creature.mobile.ap = 0;
                    }

//                    console.log("A ap=" + ZIL.combat_creature.mobile.ap);
                    if(!ZIL.player.mobile.is_moving()) {
                        ZIL.clear_ground_target();

                        // done moving, but the player still has ap
//                        console.log("B");
                        if(ZIL.combat_creature.id == ZIL.player.id && ZIL.player.mobile.ap > 0) {
//                            console.log("C");
                            ZIL.combat_action_click_count = 0;
                            $("body").css("cursor", "default");
                            ZIL.toggle_player_combat_indicators(true);
                        }
                    }
                }
            }

            // show whose turn it is
            $("#combatant").html(ZIL.combat_creature.mobile.to_string());
        }
    },

    combat_ap_dec: function(ap_delta) {
        ZIL.combat_creature.mobile.ap -= ap_delta;
        if (!ZIL.combat_creature.mobile.ai_move) {
            ZIL.recenter_screen();
        }
    },

    init_combat_turn: function() {
        // sort by initiative
        ZIL.combat_creature_index = 0;
        ZIL.combat_creatures = _.filter($.map(Object.keys(ZIL.shown_creatures), function(id) {
            return ZIL.creatures_map[id];
        }), function(c) { return c.mobile.is_alive(); });
        ZIL.combat_creatures.push(ZIL.player);
        if(ZIL.combatants_exists()) {
            ZIL.combat_creatures.sort(function(a, b) {
                return a.mobile.initiative - b.mobile.initiative;
            });
        }
        ZIL.init_combat_creature();
    },

    next_combat_creature: function() {
        // select next live combatant
        while(ZIL.combatants_exists()) {
            ZIL.combat_creature_index++;
            if(ZIL.combat_creature_index >= ZIL.combat_creatures.length) {
//                ZIL.combat_creature_index = 0;
                ZIL.init_combat_turn();
            }
            if(ZIL.combat_creatures[ZIL.combat_creature_index].mobile.remove_me) {
                // remove dead creature
                console.log("--- remove " + ZIL.combat_creatures[ZIL.combat_creature_index].id);
                ZIL.remove_creatures([ZIL.combat_creatures[ZIL.combat_creature_index].id]);
                ZIL.combat_creatures.splice(ZIL.combat_creature_index, 1);
                ZIL.combat_creature_index--;
            } else {
                break;
            }
        }
        ZIL.init_combat_creature();
    },

    init_combat_creature: function() {
        if(ZIL.combatants_exists()) {
            ZIL.combat_creature = ZIL.combat_creatures[ZIL.combat_creature_index];
            ZIL.combat_creature.mobile.ap = ZIL.combat_creature.mobile.max_ap;
            if(!ZIL.combat_creature.mobile.ai_move) {
                ZIL.combat_creature.mobile.reset_move();
                ZIL.combat_action_click_count = 0;
                ZIL.toggle_player_combat_indicators(true);
            }
            $("#combatant").html(ZIL.combat_creature.mobile.to_string());
            ZIL.recenter_screen(ZIL.combat_creature.mobile.x, ZIL.combat_creature.mobile.y);
        } else {
            ZIL.combat_creature = null;
            $("#combatant").empty();
        }
        ZIL.clear_ground_target();
    },

    // Anybody still fighting?
    combatants_exists: function() {
        return _.any(ZIL.combat_creatures, function(c) {
            return c.mobile.is_alive() && c.mobile.target != null && c.mobile.target.mobile.is_alive();
        });
    },

    recenter_screen: function(x, y) {
        // re-center screen if near the edge
        if (ZIL.is_near_edge_of_screen(x, y)) {
            ZIL.center_screen_at(x, y);
        }
    },

    center_screen_at: function(x, y) {
        if(x == null) {
            x = ZIL.player.mobile.x;
            y = ZIL.player.mobile.y;
        }
        ZIL.set_global_pos(x - ZIL_UTIL.VIEW_WIDTH / 2, y - ZIL_UTIL.VIEW_HEIGHT / 2, ZIL.global_pos[2]);
        ZIL.screen_pos_map = {};
        ZIL.clear_ground_target();
        ZIL.redraw_shape();
    },

    set_global_pos: function(x, y, z) {
        ZIL.global_pos = [ x, y, z ];
        if(ZIL.node_debug) ZIL.node_debug.position.set(-x, -y, -z + 1);
    },

    is_near_edge_of_screen: function(x, y) {
        if(x == null) {
            x = ZIL.player.mobile.x;
            y = ZIL.player.mobile.y;
        }
        var px = (((x - ZIL.global_pos[0]) / 8)|0) * 8;
        var py = (((y - ZIL.global_pos[1]) / 8)|0) * 8;
        var key = "" + px + "," + py;
        var screen_pos = ZIL.screen_pos_map[key];
        if(screen_pos == null) {
            screen_pos = ZIL.world_to_screen(px, py, 0);
            ZIL.screen_pos_map[key] = screen_pos;
        }
        return screen_pos.x < ZIL.canvas_edge_percent_x || screen_pos.y < ZIL.canvas_edge_percent_y || screen_pos.x >= ZIL.canvas_right - ZIL.canvas_edge_percent_x || screen_pos.y >= ZIL.canvas_bottom - ZIL.canvas_edge_percent_y;
    },

    world_to_screen: function(x, y, z) {
        // converts 3D position to screen coords
        var pos = new THREE.Vector3(x, y, z);
        projScreenMat = new THREE.Matrix4();
        projScreenMat.multiplyMatrices( ZIL.camera.projectionMatrix, ZIL.camera.matrixWorldInverse);
        pos.applyMatrix4(projScreenMat);
        return {
            x: (pos.x+1) * ZIL.canvas_width/2 + ZIL.canvas_offset.left,
            y: (-pos.y+1) * ZIL.canvas_height/2 +ZIL.canvas_offset.top
        };
    },

	redraw_shape: function() {
		ZIL.shape.render_shape(ZIL.rendered_shape, ZIL.global_pos);
        ZIL.player.mobile.move(ZIL.global_pos[0], ZIL.global_pos[1], ZIL.global_pos[2]);
        for(var creature_id in ZIL.shown_creatures) {
            ZIL.creatures_map[creature_id].mobile.move(ZIL.global_pos[0], ZIL.global_pos[1], ZIL.global_pos[2]);
        }
	},

    get_shown_creatures: function(include_player) {
        var c = $.map(Object.keys(ZIL.shown_creatures), function(id) { return ZIL.creatures_map[id]; });
        if(include_player) c.push(ZIL.player);
        return c;
    },

	start_game: function() {
        // skip menu when in mini mode
        if(ZIL_UTIL.is_mini_mode()) {
            $("#menu").hide();
            ZIL.continue_game();
        }

        $("#menu a").click(function(event) {
            var id = $(event.target).attr("id");
            if(id == "new_game" && !confirm("Erase saved game?")) {
                return false;
            }
            $("#menu").hide();
            ZIL[id]();
            return false;
        });
    },

    new_game: function() {
        ZIL.run_game(true);
    },

    continue_game: function() {
        ZIL.run_game();
    },

    quit_game: function() {
        ZIL_UTIL.exit();
    },

    run_game: function(force_new) {
        // do this first
        ZIL_UTIL.load_config(320, 240);
        if(force_new) {
            ZIL_UTIL.new_game();
        }

        $("canvas#view").hide();
        $("#debug").hide();
        ZIL.init_dom();

        if (!ZIL_UTIL.game_state["seen_intro"]) {
            ZIL.play_intro();
        } else {
            ZIL.load_game();
        }
    },

    init: function() {

        // ---------------------
        // scene
        ZIL.scene = new THREE.Scene();
        ZIL.renderer = new THREE.WebGLRenderer({ canvas: $("#view")[0] });
        ZIL.renderer.autoClear = false;
        ZIL.init_camera();

        ZIL.renderer.setSize(window.innerWidth, window.innerHeight);
        ZIL.canvas_width = window.innerWidth;
        ZIL.canvas_height = window.innerHeight;
        ZIL.canvas_edge_percent_x = window.innerWidth * 0.1;
        ZIL.canvas_edge_percent_y = window.innerHeight * 0.1;
        ZIL.canvas_offset = $("canvas#view").offset();
        ZIL.offset_x = 0;
        ZIL.offset_y = 0;
        ZIL.canvas_right = window.innerWidth;
        ZIL.canvas_bottom = window.innerHeight;

        ZIL.world = new THREE.Object3D();
        ZIL.world.position.set(ZIL_UTIL.VIEW_WIDTH / 2, ZIL_UTIL.VIEW_HEIGHT / 2, 0);
        ZIL.world.scale.z = ZIL.Z_SCALE;
        ZIL.scene.add(ZIL.world);

        ZIL.inner = new THREE.Object3D();
        ZIL.inner.position.x = -ZIL_UTIL.VIEW_WIDTH / 2;
        ZIL.inner.position.y = -ZIL_UTIL.VIEW_HEIGHT / 2;
        ZIL.world.add(ZIL.inner);

        ZIL.coord = new THREE.Object3D();
//		ZIL.inner.add( ZIL.coord );
        ZIL.init_coords();

        ZIL.rendered_shape = new THREE.Object3D();
        ZIL.inner.add(ZIL.rendered_shape);

        ZIL.obj = new THREE.Object3D();
//		ZIL.inner.add( ZIL.obj );
        ZIL.init_cursor();

        ZIL.init_light(ZIL.scene);

        // ---------------------
        // scene2
        ZIL.scene2 = new THREE.Scene();
        ZIL.world2 = new THREE.Object3D();
        ZIL.world2.position.set(ZIL_UTIL.VIEW_WIDTH / 2, ZIL_UTIL.VIEW_HEIGHT / 2, 0);
        ZIL.world2.scale.z = ZIL.Z_SCALE;
        ZIL.scene2.add(ZIL.world2);

        ZIL.inner2 = new THREE.Object3D();
        ZIL.inner2.position.x = -ZIL_UTIL.VIEW_WIDTH / 2;
        ZIL.inner2.position.y = -ZIL_UTIL.VIEW_HEIGHT / 2;
        ZIL.world2.add(ZIL.inner2);

        ZIL.rendered_shape2 = new THREE.Object3D();
        ZIL.inner2.add(ZIL.rendered_shape2);
        ZIL.init_light(ZIL.scene2);

        // ---------------------
        // composer


        // render just the mobile shapes
        var render_mobile = new THREE.RenderPass( ZIL.scene2, ZIL.camera );

        var rt_parameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: true };
        var target = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, rt_parameters )

        var overlay_composer = new THREE.EffectComposer( ZIL.renderer, target );
        overlay_composer.addPass( render_mobile );
        overlay_composer.addPass( new THREE.ShaderPass( THREE.CopyShader ) );

        // blend the mobiles on top of the scene
        var render_mask = new THREE.MaskPass( ZIL.scene2, ZIL.camera );
        render_mask.inverse = true;
        var clear_mask = new THREE.ClearMaskPass();

        var effect_blend = new THREE.ShaderPass( THREE.BlendShader, "tDiffuse1" );
        effect_blend.uniforms[ 'tDiffuse2' ].value = overlay_composer.renderTarget2;
        effect_blend.uniforms[ 'opacity' ].value = 1;
        effect_blend.uniforms[ 'mixRatio' ].value = 0.25; // how much of the mobile to show

        var final_effect = new THREE.ShaderPass( THREE.CopyShader );
        final_effect.renderToScreen = true;

        ZIL.composer = new THREE.EffectComposer( ZIL.renderer, target );
        ZIL.composer.addPass( new THREE.RenderPass( ZIL.scene, ZIL.camera ) );
        ZIL.composer.addPass( render_mask );
        ZIL.composer.addPass( effect_blend );
        ZIL.composer.addPass( clear_mask );
        ZIL.composer.addPass( final_effect );
    },

    play_intro: function() {
        ZIL.INTRO_ID = 1;
        ZIL_UTIL.game_state["seen_intro"] = false;
        ZIL.play_intro_sequence();
    },

    play_intro_sequence: function() {
        if(ZIL.INTRO_ID >= 7) {
            ZIL.intro_over();
        }

        $("#intro_" + ZIL.INTRO_ID).fadeIn(1000, function() {
            ZIL.INTRO_TIMEOUT = setTimeout(function() {
                $(".intro").hide();
                ZIL.INTRO_ID++;
                ZIL.play_intro_sequence();
            }, 10000);
        });
    },

    intro_over: function() {
        ZIL.INTRO_TIMEOUT = null;
        ZIL.INTRO_ID = null;
        ZIL_UTIL.save_config();
        ZIL.load_game();
    },

	init_light: function(scene) {
        // credit: https://github.com/jeromeetienne/threex.basiclighting/blob/master/threex.basiclighting.js
        var object3d	= new THREE.AmbientLight(0x101010);
        object3d.name	= 'Ambient light';
        scene.add(object3d);

        var object3d	= new THREE.DirectionalLight('white', 0.5);
//        object3d.position.set(2.6,1,3);
        object3d.position.set(0,3,3);
        object3d.name	= 'Back light';
        scene.add(object3d);

        var object3d	= new THREE.DirectionalLight('white', 0.1);
        object3d.position.set(3, 3, 0);
        object3d.name 	= 'Key light';
        scene.add(object3d);

        var object3d	= new THREE.DirectionalLight('white', 0.7);
        object3d.position.set(3, 0, 3);
        object3d.name	= 'Fill light';
        scene.add(object3d);
	},

	init_cursor: function() {
		// the cursor box
		var geometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
		var material = new THREE.MeshLambertMaterial( {color: 0x2233ff, side: THREE.DoubleSide } );
		var cube = new THREE.Mesh( geometry, material );
		ZIL.obj.add(cube);
	},

	init_camera: function() {
		ZIL.camera = new THREE.OrthographicCamera(
			-ZIL_UTIL.VIEW_WIDTH / ZIL_UTIL.CAM_ZOOM, ZIL_UTIL.VIEW_WIDTH / ZIL_UTIL.CAM_ZOOM,
			ZIL_UTIL.VIEW_HEIGHT / ZIL_UTIL.CAM_ZOOM, -ZIL_UTIL.VIEW_HEIGHT / ZIL_UTIL.CAM_ZOOM,
			-1000, 1000 );
        var p = Math.max(ZIL_UTIL.VIEW_WIDTH, ZIL_UTIL.VIEW_HEIGHT);
		ZIL.camera.position.set(p * 1.2, p * 1.2, p * 2);
		ZIL.camera.up = new THREE.Vector3(0,0,1);
		ZIL.camera.lookAt(new THREE.Vector3(p * 0.45, p * 0.45, 0));
        ZIL.raycaster = new THREE.Raycaster();
        ZIL.dir_vector = new THREE.Vector3();
	},

    init_coords: function() {
		ZIL_UTIL.clear_node(ZIL.coord);

		// add the x plane
		var geometry = new THREE.PlaneBufferGeometry( ZIL_UTIL.VIEW_WIDTH, ZIL_UTIL.VIEW_DEPTH, ZIL_UTIL.VIEW_WIDTH, ZIL_UTIL.VIEW_DEPTH );
		var material = new THREE.MeshLambertMaterial( {color: 0x808080, side: THREE.DoubleSide, wireframe: true, transparent: true, opacity: 0.25 } );
		var plane = new THREE.Mesh( geometry, material );
		plane.rotation.x = PI / -2;
		plane.position.y = -0.5;
		plane.position.z = -ZIL_UTIL.VIEW_DEPTH / -2 - 0.5;
		plane.position.x = -ZIL_UTIL.VIEW_WIDTH / -2 - 0.5;
		ZIL.coord.add( plane );

		// add the y plane
		var geometry = new THREE.PlaneBufferGeometry( ZIL_UTIL.VIEW_WIDTH, ZIL_UTIL.VIEW_HEIGHT, ZIL_UTIL.VIEW_WIDTH, ZIL_UTIL.VIEW_HEIGHT );
		var material = new THREE.MeshLambertMaterial( {color: 0x80cc80, side: THREE.DoubleSide, wireframe: true, transparent: true, opacity: 0.25 } );
		var plane = new THREE.Mesh( geometry, material );
		plane.position.z = -0.5
		plane.position.x = -ZIL_UTIL.VIEW_WIDTH / -2 - 0.5;
		plane.position.y = -ZIL_UTIL.VIEW_HEIGHT / -2 - 0.5;
		ZIL.coord.add( plane );

		// add the z plane
		var geometry = new THREE.PlaneBufferGeometry( ZIL_UTIL.VIEW_DEPTH, ZIL_UTIL.VIEW_HEIGHT, ZIL_UTIL.VIEW_DEPTH, ZIL_UTIL.VIEW_HEIGHT );
		var material = new THREE.MeshLambertMaterial( {color: 0x8080cc, side: THREE.DoubleSide, wireframe: true, transparent: true, opacity: 0.25 } );
		var plane = new THREE.Mesh( geometry, material );
		plane.rotation.y = PI / -2;
		plane.position.x = -0.5;
		plane.position.z = ZIL_UTIL.VIEW_DEPTH/2 -0.5;
		plane.position.y = ZIL_UTIL.VIEW_HEIGHT/2 -0.5;
		ZIL.coord.add( plane );
	},

	init_dom: function() {
		$("canvas#view").
			bind("mousemove", ZIL.mouse_move).
			bind("mouseup", ZIL.mouse_up);
		document.body.oncontextmenu = function() { return false; };
		document.body.onkeydown = ZIL.key_down;
		document.body.onkeyup = ZIL.key_up;
		$(document.body).keypress(ZIL.key_press);
	},

    load_game: function() {
        ZIL.init();
        var player_start = ZIL_UTIL.game_state["player_start"];
        if(player_start == null) {
            player_start = ["maps", "ante", 70, 70];
        }
        ZIL.load_shape(player_start[0], player_start[1], player_start[2], player_start[3], function() {
            ZIL.target_texture = new THREE.MeshBasicMaterial({
                map: THREE.ImageUtils.loadTexture( '../../img/marker.png', new THREE.UVMapping() ),
                transparent: true,
                opacity: 0.5,
                color: 0xFFFFFF
            });
            ZIL.player = new Player();
            ZIL.player.set_stats(ZIL_UTIL.player_stats);

            $("canvas#view").show();
//            $("#debug").show();
        });
	},

    init_node_debug: function() {
        var old_parent = null;
        if(ZIL.node_debug) {
            old_parent = ZIL.node_debug.parent;
            if(old_parent) old_parent.remove(ZIL.node_debug);
            while(ZIL.node_debug.children.length > 0) ZIL.node_debug.remove(ZIL.node_debug.children[0])
        }

        var geo = new THREE.Geometry();
        for(var x = 0; x < ZIL.shape.nodes.length; x++) {
            for(var y = 0; y < ZIL.shape.nodes[0].length; y++) {
                var node = ZIL.shape.nodes[x][y];
                if(!node.is_empty) {
                    var sq = ZIL_UTIL.make_square_face(ZilShape.PATH_RES);
                    var child = new THREE.Mesh(sq, null);
                    child.position.set(node.x + ZilShape.PATH_RES/2, node.y + ZilShape.PATH_RES/2, node.z);
                    child.updateMatrix();
                    geo.merge(child.geometry, child.matrix, x % 2 == y % 2 ? 0 : 1);
                }
            }
        }
        var materials = new THREE.MeshFaceMaterial([
            new THREE.MeshLambertMaterial( {color: 0xff0000, side: THREE.DoubleSide, wireframe: false, transparent: true, opacity: 0.35 } ),
            new THREE.MeshLambertMaterial( {color: 0x0000ff, side: THREE.DoubleSide, wireframe: false, transparent: true, opacity: 0.35 } )
        ]);
        ZIL.node_debug = new THREE.Mesh(geo, materials);

        if(old_parent) {
            old_parent.add(ZIL.node_debug);
        }
    },

	load_shape: function(category_name, shape_name, start_x, start_y, on_load) {
        ZIL.LOADING = true;

        if(ZIL.shape) {
            ZIL.shape.clear_shape(ZIL.rendered_shape);
        }
        // remove whatever else
        while(ZIL.rendered_shape.children.length > 0) {
            ZIL.rendered_shape.remove(ZIL.rendered_shape.children[0])
        }

        ZilShape.reset_cache();
        Mobile.clear_chunk_map();
        ZIL.creatures = [];

        $("body").css("cursor", "progress");
        ZIL.hide_ui();
        setTimeout(ZIL_UTIL.bind(this, function() {
            ZilShape.load_shape_async(category_name, shape_name, 0, this, false, ZIL_UTIL.update_progress, function(shape) {
                ZIL.shape = shape;

                if(on_load) on_load();

                ZIL.teleport(start_x, start_y);

                ZIL.LOADING = false;

                ZilStory.on_map_load(category_name, shape_name);

                ZIL_UTIL.game_state["player_start"] = [category_name, shape_name, start_x, start_y];
                ZIL_UTIL.save_config();
                $("body").css("cursor", "default");
                ZIL.show_ui();
                ZIL.log("Entered map: " + shape_name, "console_special");
            });
        }), 500);
	},

    hide_ui: function() {
        $(".ui_panel").hide();
    },

    show_ui: function() {
        $(".ui_panel").show();

        $(".ui_bottom,.ui_top").css("width", window.innerWidth + "px");

        Songbook.init_ui();

        var panels = $(".ui_panel");
        var top = 0;
        var left = 0;
        var right = window.innerWidth;
        var bottom = window.innerHeight;
        for(var i = 0; i < panels.length; i++) {
            var panel = panels.eq(i);
            if(panel.hasClass("ui_bottom")) {
                var v = window.innerHeight - panel.height();
                if(v < bottom) bottom = v;
            }
            if(panel.hasClass("ui_right")) {
                var v = window.innerWidth - panel.width();
                if(v < right) right = v;
            }
            if(panel.hasClass("ui_top")) {
                var v = panel.height();
                if(v > top) top = v;
            }
            if(panel.hasClass("ui_left")) {
                var v = panel.width();
                if(v > left) left = v;
            }
        }
        var w = right - left;
        var h = bottom - top;

        $("canvas#view").css({
            top: top + "px",
            left: left + "px",
            width: w + "px",
            height: h + "px"
        });

        ZIL.renderer.setSize(w, h);
        ZIL.canvas_width = w;
        ZIL.canvas_height = h;
        ZIL.canvas_edge_percent_x = w * 0.1;
        ZIL.canvas_edge_percent_y = h * 0.1;
        ZIL.canvas_offset = $("canvas#view").offset();
        ZIL.offset_x = left;
        ZIL.offset_y = top;
        ZIL.canvas_right = right;
        ZIL.canvas_bottom = bottom;
    },

    log: function(text, console_class) {
        var html = "<div class='console_text" + (console_class ? " " + console_class : "") + "'>" + text + "</div>";
        $("#ui_console").append(html);
        var count = $("#ui_console .console_text").length;
        if(count > 200) $("#ui_console .console_text").slice(0, count - 200).remove();
        $('#ui_console').scrollTop($('#ui_console')[0].scrollHeight);
    },

    teleport: function(x, y) {
        var z = ZIL.shape.get_highest_empty_space(x, y, ZIL.player.mobile.shape);
        ZIL.shape.build_nodes(x, y, z);

        ZIL.init_node_debug();

        ZIL.set_global_pos(x - ZIL_UTIL.VIEW_WIDTH / 2, y - ZIL_UTIL.VIEW_HEIGHT / 2, 0);

        ZIL.player.mobile.x = x;
        ZIL.player.mobile.y = y;
        ZIL.player.mobile.z = z;
        if(ZIL.player.mobile.shape_obj.parent != ZIL.rendered_shape) {
            ZIL.rendered_shape.add(ZIL.player.mobile.shape_obj);
            ZIL.rendered_shape2.add(ZIL.player.mobile.shape_obj_copy);
        }
        ZIL.player.mobile.move(ZIL.global_pos[0], ZIL.global_pos[1], ZIL.global_pos[2]);

        ZIL.move_visible_creatures(1000);

        ZIL.redraw_shape();
        ZIL.render();
    },

    default_convo_complete: function() {
        Mobile.hide_convos();
        // return true means: unpause game
        return true;
    },

    say: function(creature, message, on_complete, on_render) {
        Mobile.hide_convos();
        creature.mobile.say(message, on_render);
        if(on_complete == null) {
            on_complete = ZIL.default_convo_complete;
        }
        ZIL.on_unpause = on_complete;
        ZIL.set_paused(true);
    },

    set_paused: function(b) {
        if(!b && ZIL.on_unpause) {
            if(!ZIL.on_unpause()) {
                // by default, stay paused
                return;
            }
        }
        if(b) {
            $("#game_paused").fadeIn(function() {
                $("#game_paused button").focus();
            });
        } else {
            $("#game_paused").fadeOut();
            if($("#message").is(":visible")) $("#message").fadeOut();
        }
        ZIL.GAME_PAUSED = b;

    },

    load_monster: function(monster_key, pos) {
        var creature = new Creature(MONSTERS[monster_key], pos, Object.keys(ZIL.creatures_map).length);
        ZIL.creatures_map[creature.id] = creature;
        return null;
    },

    start_combat: function() {
//        if(!ZIL.in_combat) console.log(">>> COMBAT start");
        ZIL.in_combat = true;
    },

	render: function() {
		var now = Date.now();
        var delta_time = now - ZIL.last_time;
        ZIL.last_time = now;

		ZIL.game_step(delta_time);

        ZIL.renderer.clear();
        ZIL.composer.render();

        // draw fps
		ZIL.fps_counter++;
		if(ZIL.fps_counter >= 25) {
			var fps = ZIL.fps_counter / (now - ZIL.fps_start) * 1000;
			$("#fps").html(fps.toFixed(2));
			ZIL.fps_counter = 0;
			ZIL.fps_start = now;
		}
//		requestAnimationFrame(ZIL.render);
		setTimeout(ZIL.render, 50); // reduce fan noise
	},

    quake: function() {
        ZIL.quake_start = ZIL.quake_step_start = Date.now();
    },

    quake_step: function() {
        if(ZIL.quake_start) {
            var now = Date.now();
            if (now - ZIL.quake_start > 3000) {
                ZIL.inner.position.x = -ZIL_UTIL.VIEW_WIDTH / 2;
                ZIL.inner.position.y = -ZIL_UTIL.VIEW_HEIGHT / 2;
                ZIL.quake_start = null;
            } else {
                if(now - ZIL.quake_step_start > 25) {
                    ZIL.quake_step_start = now;
                    ZIL.inner.position.x = -ZIL_UTIL.VIEW_WIDTH / 2 + (Math.random() * 6 - 3);
                    ZIL.inner.position.y = -ZIL_UTIL.VIEW_HEIGHT / 2 + (Math.random() * 6 - 3);
                }
            }
        }
    },

    add_quest: function(quest_key) {
        if(!ZIL_UTIL.game_state["quests"]) ZIL_UTIL.game_state["quests"] = [];
        ZIL_UTIL.game_state["quests"].push(quest_key);
        ZIL_UTIL.save_config();

        var quest = ZilStory.QUESTS[quest_key];
        console.log("Quest added " + quest.name);
        ZIL.log("Quest added \"" + quest.name + "\".", "console_special");
    },

    quest_completed: function(quest_key) {
        var quest = ZilStory.QUESTS[quest_key];
        if(quest.on_complete) quest.on_complete(quest);

        var x = ZIL_UTIL.game_state["quests"].indexOf(quest_key);
        if(x >= 0) {
            $("#quest_complete").show();
            setTimeout(function() {
                $("#quest_complete").hide();
            }, 2000);

            // if we didn't receive this quest, it's still completed, but we don't score it
            ZIL.player.mobile.receive_exp(Math.max(quest.level - this.level, 1) * 50);

            ZIL_UTIL.game_state["quests"].splice(x, 1);

            if (!ZIL_UTIL.game_state["completed_quests"]) ZIL_UTIL.game_state["completed_quests"] = [];
            ZIL_UTIL.game_state["completed_quests"].push(quest_key);

            ZIL_UTIL.save_config();
        }

        console.log("Quest completed " + quest.name);
        ZIL.log("Quest completed \"" + quest.name + "\".", "console_special");
    },

    has_quest: function(quest_key) {
        return ZIL_UTIL.game_state["quests"] && ZIL_UTIL.game_state["quests"].indexOf(quest_key) >= 0;
    },

    completed_quest: function(quest_key) {
        return ZIL_UTIL.game_state["completed_quests"] && ZIL_UTIL.game_state["completed_quests"].indexOf(quest_key) >= 0;
    },

    add_creature_listener: function(creature_listener) {
        ZIL.creature_listeners.push(creature_listener);
    },

    creature_dead: function(creature) {
        console.log("+++ Creature died: " + creature.mobile.origin_x + "," + creature.mobile.origin_y + "," + creature.mobile.origin_z);
        if(creature.mobile.ai_move) {
            console.log(creature.mobile.get_name() + " dies.");
            ZIL.log(creature.mobile.get_name() + " dies.", "console_combat");
            for(var i = 0; i < ZIL.creature_listeners.length; i++) {
                ZIL.creature_listeners[i](ZIL.shape.category, ZIL.shape.name, creature);
            }
        } else {
            // player death
            alert("Player dies.");
            // game over
        }
    },

    show_combat_range: function(creature) {

        // find the nodes
        var nodes = [];
        var cx = (creature.mobile.x / ZilShape.PATH_RES)|0;
        var cy = (creature.mobile.y / ZilShape.PATH_RES)|0;
        var start = ZIL.shape.nodes[cx][cy];
        var range = creature.mobile.ap;
        for(var x = -range; x < range; x++) {
            for(var y = -range; y < range; y++) {
                if((x == 0 && y == 0) || !ZIL.shape.nodes[cx + x] || ZIL_UTIL.get_distance(0, 0, x, y) > range) continue;
                var end = ZIL.shape.nodes[cx + x][cy + y];
                if(end && !end.is_empty && ZIL.shape.can_reach(range, start, end, creature, true)) {
                    nodes.push(end);
                }
            }
        }
//        console.log("nodes=", $.map(nodes, function(n) { return [(n.x/ZilShape.PATH_RES)|0, (n.y/ZilShape.PATH_RES)|0]; }));

        // draw
        var old_parent = null;
        if(ZIL.combat_range) {
            old_parent = ZIL.combat_range.parent;
            if(old_parent) old_parent.remove(ZIL.combat_range);
            while(ZIL.combat_range.children.length > 0) ZIL.combat_range.remove(ZIL.combat_range.children[0])
        }

        var geo = new THREE.Geometry();
        for(var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if(!node.is_empty) {
                var sq = ZIL_UTIL.make_square_face(ZilShape.PATH_RES - 0.1);
                var child = new THREE.Mesh(sq, null);
                child.position.set(node.x + ZilShape.PATH_RES/2, node.y + ZilShape.PATH_RES/2, node.z);
                child.updateMatrix();
                geo.merge(child.geometry, child.matrix, 0);
            }
        }
        var materials = new THREE.MeshFaceMaterial([
            new THREE.MeshLambertMaterial( {color: 0xffffff, side: THREE.DoubleSide, wireframe: false, transparent: true, opacity: 0.75 } )
        ]);
        ZIL.combat_range = new THREE.Mesh(geo, materials);
        ZIL.combat_range.position.set(-ZIL.global_pos[0], -ZIL.global_pos[1], -ZIL.global_pos[2] + 1);

        ZIL.inner.add(ZIL.combat_range);
    },

    show_message: function(title, text) {
        $("#message .title").html(title);
        $("#message .body").html(text);
        $("#message").fadeIn();
        ZIL.set_paused(true);
    },

    show_sign: function(text) {
        ZIL.show_message("The sign reads:", text);
    },

    launch_missile: function(source, target, options, on_hit) {
        ZIL.missile = new Missile(source.mobile.x, source.mobile.y, source.mobile.z,
            target.mobile.x, target.mobile.y, target.mobile.z,
            options, on_hit, ZIL.rendered_shape,
            ZIL.global_pos[0], ZIL.global_pos[1], ZIL.global_pos[2],
            options["spell"] ? options["spell"].color : null);
    }
};
