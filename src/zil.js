var ZIL = {

	scene: null,
	camera: null,
	renderer: null,
	move: [0, 0, 0],
	cursor: [0, 0, 0],
	global_pos: [0, 0, 0],
	fps_counter: 0,
	fps_start: Date.now(),
	XY_PLANE: new THREE.Plane(new THREE.Vector3(0, 0, 1), 1),
    show_grid: false,
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
            for(var i = 0; i < intersections.length; i++) {
                var intersection = intersections[i];

                // not sure why this is necessary...
                intersection.point.z = (intersection.point.z + 0.5) / ZIL.Z_SCALE;
                var point = intersection.point;

                if(i == 0) {
                    ZIL.cursor[0] = Math.round(point.x);
                    ZIL.cursor[1] = Math.round(point.y);
                    ZIL.cursor[2] = Math.round(point.z);

                    ZIL.obj.position.set(ZIL.cursor[0], ZIL.cursor[1], ZIL.cursor[2]);
                    ZIL.show_cursor_pos();
                }

                // a creature?
                if (intersection.object && intersection.object.userData) {
                    var target_creature = intersection.object.userData.creature;
                    if (target_creature && target_creature != ZIL.player && target_creature.mobile.is_alive() && ZIL.is_waiting_for_player()) {
                        target_creature.mobile.set_selected(true);
                        ZIL.selected_creature = target_creature;

                        // tooltip
                        target_creature.mobile.show_above(target_creature.mobile.get_name(), "creature_description");
                        $("body").css("cursor", "pointer");
                        break;
                    }
                }

                var tx = Math.round(point.x) + ZIL.global_pos[0];
                var ty = Math.round(point.y) + ZIL.global_pos[1];
                var tz = Math.round(point.z) + ZIL.global_pos[2];
                ZIL.shape_name_and_location = ZIL.shape.get_shape_at(tx, ty, tz);
                if (ZIL.shape_name_and_location) {
                    var pos = ZIL.shape_name_and_location.slice(1, 4);
                    if(ZilStory.mouseover_location(ZIL.shape.category, ZIL.shape.name, ZIL.shape_name_and_location[0], pos)) {
                        $("body").css("cursor", "pointer");
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

                        var message;
                        if(in_range || ZIL.player.mobile.is_target_in_range_on_path()) {
                            message = "Attack! AP: 0"
                        } else {
                            var ap = ZIL.player.mobile.ap - ZIL.player.mobile.move_path.length;
                            message = "AP: <span class='" + (ap >= 0 ? "ap_cost_ok" : "ap_cost_error") + "'>" + ap + "/" + ZIL.player.mobile.max_ap + "</span>";
                        }
                        ZIL.player.mobile.show_above(message, "player_plan");
                    } else {
                        // can't move there
                        ZIL.show_forbidden();
                        ZIL.player.mobile.remove_divs("player_plan");
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
            if(ZIL.selected_creature) {
                if (ZIL.selected_creature.mobile.alignment == ZIL.player.mobile.alignment) {
                    ZIL.start_convo();
                } else {
                    ZIL.start_combat();
                }
            } else if(ZIL.shape_name_and_location) {
                var pos = ZIL.shape_name_and_location.slice(1, 4);
                ZilStory.mouseclick_location(ZIL.shape.category, ZIL.shape.name, ZIL.shape_name_and_location[0], pos);
            } else {
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

    start_convo: function() {
        if(ZIL.selected_creature) {
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
        if(ZIL.combat_selected_creature) {
            xp += (w/2)|0;
            yp += (h/2)|0;
        }

        var geometry = new THREE.PlaneGeometry(w, h);
        ZIL.ground_marker = new THREE.Mesh(geometry, ZIL.target_texture);
        ZIL.ground_marker.position.set(xp, yp,
                ZIL.shape.get_highest_empty_space(xp + ZIL.global_pos[0], yp + ZIL.global_pos[1]) + 0.1);
        ZIL.rendered_shape.add(ZIL.ground_marker);
    },

	mouse_to_world: function(event) {
		var mousex = (( (event.offsetX - ZIL.offset_x) / window.innerWidth ) * 2 - 1);
		var mousey = (-( (event.offsetY - ZIL.offset_y) / window.innerHeight ) * 2 + 1);
		// console.log("" + mousex + "," + mousey);
		var vector = new THREE.Vector3( mousex, mousey, 1 );
		var ray_caster = ZIL.projector.pickingRay(vector, ZIL.camera);
        return ray_caster.intersectObjects(ZIL.rendered_shape.children, true);
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

	key_down: function(event) {
        if(ZIL.LOADING) return;

//		console.log(event.which);
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
        if(event.which == 65) {
            ZIL.player.mobile.start_attack();
        } else if(event.which == 32) {
            ZIL.show_grid = ZIL.show_grid ? false : true;
            if(ZIL.show_grid) {
                ZIL.inner.add( ZIL.coord );
                ZIL.inner.add( ZIL.obj );
            } else {
                ZIL.inner.remove( ZIL.coord );
                ZIL.inner.remove( ZIL.obj );
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
                ZIL.rendered_shape.remove(ZIL.creatures_map[creature_id].mobile.shape_obj);
                ZIL.creatures_map[creature_id].mobile.remove_divs();
                remove_ids.push(creature_id);
            }
        }
        for(var i = 0; i < remove_ids.length; i++) delete ZIL.shown_creatures[remove_ids[i]];
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
        ZIL.show_cursor();

        if (ZIL.in_combat) {
            ZIL.combat_step(delta_time);
        } else {
            if (ZIL.player.mobile.is_attacking()) {
                // debug attack animation
                ZIL.player.mobile.attack(delta_time);
            } else {
                if (ZIL.player.mobile.move_step(ZIL.shape, ZIL.global_pos[0], ZIL.global_pos[1], ZIL.global_pos[2], delta_time)) {
                    ZIL.recenter_screen();
                    ZIL.move_visible_creatures(delta_time);
                    if(!ZIL.player.mobile.is_moving() || ZIL.player.mobile.move_path_index >= 8) {
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
        if(!ZIL.is_waiting_for_player()) {
            if(ZIL.selected_creature) {
                ZIL.selected_creature.mobile.set_selected(false);
                $(".creature_description").remove();
                ZIL.selected_creature = null;
            }
            $("body").css("cursor", "progress");
        } else {
            if($("body").css("cursor") == "progress") {
                $("body").css("cursor", "default");
                ZIL.mouse_position_event(); // reselect creature under mouse
            }
        }

        // init combat or select next creature
        if(ZIL.combat_creature == null) {
            ZIL.init_combat_turn();
        } else if(ZIL.combat_creature.mobile.is_target_dying()) {
            // the target is dying: wait
            ZIL.combat_creature.mobile.target.mobile.move_step(ZIL.shape, ZIL.global_pos[0], ZIL.global_pos[1], ZIL.global_pos[2], delta_time);
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
            ZIL.player.mobile.remove_divs("player_plan");
            $("body").css("cursor", "default");
            ZIL.mouse_position_event(); // reselect creature under mouse
            return;
        }

        // combat move
        if(ZIL.combat_creature.mobile.ap > 0 && (ZIL.combat_creature != ZIL.player || ZIL.combat_action_click_count > 1)) {

            ZIL.player.mobile.remove_divs("player_plan");

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
                if (ZIL.combat_creature.mobile.move_step(ZIL.shape, ZIL.global_pos[0], ZIL.global_pos[1], ZIL.global_pos[2], delta_time)) {
                    // a step taken
                    ZIL.combat_ap_dec(1);
                    if(!ZIL.player.mobile.is_moving()) {
                        ZIL.clear_ground_target();
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
        if(ZIL.combat_creatures.length > 0) {
            ZIL.combat_creatures.sort(function(a, b) {
                return a.mobile.initiative - b.mobile.initiative;
            });
        }
        ZIL.init_combat_creature();
    },

    next_combat_creature: function() {
        // select next live combatant
        while(ZIL.combat_creatures.length > 1) {
            ZIL.combat_creature_index++;
            if(ZIL.combat_creature_index >= ZIL.combat_creatures.length) {
                ZIL.combat_creature_index = 0;
            }
            if(ZIL.combat_creatures[ZIL.combat_creature_index].mobile.remove_me) {
                // remove dead creature
                ZIL.combat_creatures.splice(ZIL.combat_creature_index, 1);
                ZIL.combat_creature_index--;
            } else {
                break;
            }
        }
        ZIL.init_combat_creature();
    },

    init_combat_creature: function() {
        if(ZIL.combat_creatures.length > 1) {
            ZIL.combat_creature = ZIL.combat_creatures[ZIL.combat_creature_index];
            ZIL.combat_creature.mobile.ap = ZIL.combat_creature.mobile.max_ap;
            if(!ZIL.combat_creature.mobile.ai_move) {
                ZIL.combat_creature.mobile.reset_move();
                ZIL.combat_action_click_count = 0;
            }
            $("#combatant").html(ZIL.combat_creature.mobile.to_string());
            ZIL.recenter_screen(ZIL.combat_creature.mobile.x, ZIL.combat_creature.mobile.y);
        } else {
            ZIL.combat_creature = null;
            $("#combatant").empty();
        }
        ZIL.clear_ground_target();
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
        ZIL.global_pos[0] = x - ZIL_UTIL.VIEW_WIDTH / 2;
        ZIL.global_pos[1] = y - ZIL_UTIL.VIEW_HEIGHT / 2;
        ZIL.screen_pos_map = {};
        ZIL.clear_ground_target();
        ZIL.redraw_shape();
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
        return screen_pos.x < ZIL.canvas_edge_percent_x || screen_pos.y < ZIL.canvas_edge_percent_y || screen_pos.x >= window.innerWidth - ZIL.canvas_edge_percent_x || screen_pos.y >= window.innerHeight - ZIL.canvas_edge_percent_y;
    },

    world_to_screen: function(x, y, z) {
        // converts 3D position to screen coords
        var pos = new THREE.Vector3(x, y, z);
        projScreenMat = new THREE.Matrix4();
        projScreenMat.multiplyMatrices( ZIL.camera.projectionMatrix, ZIL.camera.matrixWorldInverse);
        pos.applyMatrix4(projScreenMat);
        return {
            x: (pos.x+1) * window.innerWidth/2 + ZIL.canvas_offset.left,
            y: (-pos.y+1) * window.innerHeight/2 +ZIL.canvas_offset.top
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
        // do this first
        ZIL_UTIL.load_config(320, 240);

        $("canvas").hide();
        $("#debug").hide();
        ZIL.init_dom();

        if (!ZIL_UTIL.game_state["seen_intro"]) {
            ZIL.play_intro();
        } else {
            ZIL.load_game();
        }
    },

    init: function() {
        ZIL_UTIL.VIEW_WIDTH *= 3;
        ZIL_UTIL.VIEW_HEIGHT *= 3;
        ZIL_UTIL.CAM_ZOOM *= 2.25;

        ZIL.scene = new THREE.Scene();
        ZIL.renderer = new THREE.WebGLRenderer({ canvas: $("#view")[0] });
        ZIL.init_camera();

        ZIL.renderer.setSize(window.innerWidth, window.innerHeight);
        ZIL.canvas_edge_percent_x = window.innerWidth * 0.1;
        ZIL.canvas_edge_percent_y = window.innerHeight * 0.1;
        ZIL.canvas_offset = $("canvas").offset();
        document.body.appendChild(ZIL.renderer.domElement);
        ZIL.offset_x = 0;
        ZIL.offset_y = 0;

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

        ZIL.init_light();
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

	init_light: function() {
        // credit: https://github.com/jeromeetienne/threex.basiclighting/blob/master/threex.basiclighting.js
        var object3d	= new THREE.AmbientLight(0x101010);
        object3d.name	= 'Ambient light';
        ZIL.scene.add(object3d);

        var object3d	= new THREE.DirectionalLight('white', 0.5);
//        object3d.position.set(2.6,1,3);
        object3d.position.set(0,3,3);
        object3d.name	= 'Back light';
        ZIL.scene.add(object3d);

        var object3d	= new THREE.DirectionalLight('white', 0.1);
        object3d.position.set(3, 3, 0);
        object3d.name 	= 'Key light';
        ZIL.scene.add(object3d);

        var object3d	= new THREE.DirectionalLight('white', 0.7);
        object3d.position.set(3, 0, 3);
        object3d.name	= 'Fill light';
        ZIL.scene.add(object3d);
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
		ZIL.projector = new THREE.Projector();
	},

    init_coords: function() {
		ZIL_UTIL.clear_node(ZIL.coord);

		// add the x plane
		var geometry = new THREE.PlaneGeometry( ZIL_UTIL.VIEW_WIDTH, ZIL_UTIL.VIEW_DEPTH, ZIL_UTIL.VIEW_WIDTH, ZIL_UTIL.VIEW_DEPTH );
		var material = new THREE.MeshLambertMaterial( {color: 0x808080, side: THREE.DoubleSide, wireframe: true, transparent: true, opacity: 0.25 } );
		var plane = new THREE.Mesh( geometry, material );
		plane.rotation.x = PI / -2;
		plane.position.y = -0.5;
		plane.position.z = -ZIL_UTIL.VIEW_DEPTH / -2 - 0.5;
		plane.position.x = -ZIL_UTIL.VIEW_WIDTH / -2 - 0.5;
		ZIL.coord.add( plane );

		// add the y plane
		var geometry = new THREE.PlaneGeometry( ZIL_UTIL.VIEW_WIDTH, ZIL_UTIL.VIEW_HEIGHT, ZIL_UTIL.VIEW_WIDTH, ZIL_UTIL.VIEW_HEIGHT );
		var material = new THREE.MeshLambertMaterial( {color: 0x80cc80, side: THREE.DoubleSide, wireframe: true, transparent: true, opacity: 0.25 } );
		var plane = new THREE.Mesh( geometry, material );
		plane.position.z = -0.5
		plane.position.x = -ZIL_UTIL.VIEW_WIDTH / -2 - 0.5;
		plane.position.y = -ZIL_UTIL.VIEW_HEIGHT / -2 - 0.5;
		ZIL.coord.add( plane );

		// add the z plane
		var geometry = new THREE.PlaneGeometry( ZIL_UTIL.VIEW_DEPTH, ZIL_UTIL.VIEW_HEIGHT, ZIL_UTIL.VIEW_DEPTH, ZIL_UTIL.VIEW_HEIGHT );
		var material = new THREE.MeshLambertMaterial( {color: 0x8080cc, side: THREE.DoubleSide, wireframe: true, transparent: true, opacity: 0.25 } );
		var plane = new THREE.Mesh( geometry, material );
		plane.rotation.y = PI / -2;
		plane.position.x = -0.5;
		plane.position.z = ZIL_UTIL.VIEW_DEPTH/2 -0.5;
		plane.position.y = ZIL_UTIL.VIEW_HEIGHT/2 -0.5;
		ZIL.coord.add( plane );
	},

	init_dom: function() {
		$("canvas").
			bind("mousemove", ZIL.mouse_move).
			bind("mouseup", ZIL.mouse_up);
		document.body.oncontextmenu = function() { return false; };
		document.body.onkeydown = ZIL.key_down;
	},

    load_game: function() {
        ZIL.init();
//        ZIL.load_shape("maps", "arrival", 56, 56);
//        ZIL.load_shape("maps", "arrival2", 47, 63);
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

            $("canvas").show();
            $("#debug").show();

            if(!ZIL_UTIL.game_state["seen_intro"]) {
                ZilStory.schedule_intro();
            }
        });
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

        ZIL_UTIL.game_state["player_start"] = [category_name, shape_name, start_x, start_y];
        ZIL_UTIL.save_config();

        $("body").css("cursor", "progress");
        setTimeout(ZIL_UTIL.bind(this, function() {
            ZIL.shape = ZilShape.load_shape(category_name, shape_name, 0, this);
            ZIL.shape.build_shape(ZIL_UTIL.update_progress, function() {

                if(on_load) on_load();

                ZIL.global_pos = [ start_x - ZIL_UTIL.VIEW_WIDTH / 2, start_y - ZIL_UTIL.VIEW_HEIGHT / 2, 0 ];

                ZIL.player.mobile.x = start_x;
                ZIL.player.mobile.y = start_y;
                ZIL.player.mobile.z = ZIL.shape.get_highest_empty_space(start_x, start_y, ZIL.player.mobile.shape);
                ZIL.rendered_shape.add(ZIL.player.mobile.shape_obj);
                ZIL.player.mobile.move(ZIL.global_pos[0], ZIL.global_pos[1], ZIL.global_pos[2]);

                ZIL.move_visible_creatures(1000);

                ZIL.redraw_shape();
                ZIL.render();

                ZIL.LOADING = false;
            });
        }), 500);
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

		ZIL.renderer.render(ZIL.scene, ZIL.camera);

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
};
