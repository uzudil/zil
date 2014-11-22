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

	mouse_move: function(event) {
        if(ZIL.selected_creature) {
            ZIL.selected_creature.mobile.set_selected(false);
            ZIL.selected_creature = null;
        }

        var point = ZIL.mouse_to_world(event);
        if(point) {
            ZIL.cursor[0] = Math.round(point.x);
            ZIL.cursor[1] = Math.round(point.y);

            // find the highest location here
            ZIL.cursor[2] = ZIL.shape.get_highest_empty_space(
                    ZIL.global_pos[0] + ZIL.cursor[0],
                    ZIL.global_pos[1] + ZIL.cursor[1]);

            ZIL.obj.position.set(ZIL.cursor[0], ZIL.cursor[1], ZIL.cursor[2]);
            ZIL.show_cursor_pos();

            // a creature?
            var x = ZIL.global_pos[0] + ZIL.cursor[0];
            var y = ZIL.global_pos[1] + ZIL.cursor[1];
            var z = ZIL.cursor[2];
            var target_creature = ZIL.get_creature_at(x, y, z);
            if (target_creature) {
                target_creature.mobile.set_selected(true);
                ZIL.selected_creature = target_creature;
            }
        }
	},

    mouse_up: function(event) {
        var x = ZIL.global_pos[0] + ZIL.cursor[0];
        var y = ZIL.global_pos[1] + ZIL.cursor[1];
        var z = ZIL.cursor[2];

        if(ZIL.in_combat) {
            ZIL.combat_selected_creature = ZIL.get_creature_at(x, y, z);
            console.log("click=" + ZIL.combat_action_click_count +
                " selected=" + (ZIL.combat_selected_creature ? ZIL.combat_selected_creature.mobile.get_name() : "") +
                " target=" + (ZIL.player.mobile.target ? ZIL.player.mobile.target.mobile.get_name() : "") +
                " pos=" + x + "," + y + "," + z +
                " changed=" + ZIL.combat_selection_changed(x, y, z));

            if(ZIL.combat_action_click_count == 0 || ZIL.combat_selection_changed(x, y, z)) {
                console.log(">>> A");
                ZIL.combat_action_selection();
            } else {
                console.log(">>> B");
                ZIL.player.mobile.plan_move_to(ZIL.shape, x, y, z - 1);
                ZIL.combat_selected_creature = null;
            }
            ZIL.combat_action_click_count++;
            ZIL.combat_plan_x = x;
            ZIL.combat_plan_y = y;
            ZIL.combat_plan_z = z;
        } else {
            // mark location and move
            ZIL.player.mobile.plan_move_to(ZIL.shape, x, y, z - 1);
        }
    },

    combat_selection_changed: function(x, y, z) {
        return ZIL.combat_plan_x != x ||
            ZIL.combat_plan_y != y ||
            ZIL.combat_plan_z != z ||
            ZIL.combat_selected_creature != ZIL.player.mobile.target;
    },

    combat_action_selection: function() {
        ZIL.combat_action_click_count = 0;
        ZIL.player.mobile.set_target(ZIL.combat_selected_creature);
        // mark target location on ground
    },

    get_creature_at: function(x, y, z) {
        var cx = (x / ZIL_UTIL.CHUNK_SIZE)|0;
        var cy = (y / ZIL_UTIL.CHUNK_SIZE)|0;
        var creatures = Mobile.get_for_chunk(cx, cy);
        for(var i = 0; i < creatures.length; i++) {
            if(creatures[i].mobile.contains_point(x, y, z, 4)) return creatures[i];
        }
        return null;
    },

	mouse_to_world: function(event) {
		var mousex = (( (event.offsetX - ZIL.offset_x) / ZIL.canvas_size ) * 2 - 1);
		var mousey = (-( (event.offsetY - ZIL.offset_y) / ZIL.canvas_size ) * 2 + 1);
		// console.log("" + mousex + "," + mousey);
		var vector = new THREE.Vector3( mousex, mousey, 1 );
		var ray_caster = ZIL.projector.pickingRay(vector, ZIL.camera);
        var intersection = ray_caster.intersectObjects(ZIL.rendered_shape.children);
        if(intersection.length > 0) {
            return intersection[0].point;
        }
		return null;
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
//		console.log(event.which);
		if(event.target != document.body) return true;

        // move the cursor
        if(event.which == 32) {
            ZIL.show_grid = ZIL.show_grid ? false : true;
            if(ZIL.show_grid) {
                ZIL.inner.add( ZIL.coord );
            } else {
                ZIL.inner.remove( ZIL.coord );
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
                        if(c.mobile.ai_move) {

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

        if(ZIL.in_combat) {
            ZIL.combat_step(delta_time);
        } else {
            if (ZIL.player.mobile.move_step(ZIL.shape, ZIL.global_pos[0], ZIL.global_pos[1], ZIL.global_pos[2], delta_time)) {
                ZIL.recenter_screen();
                ZIL.move_visible_creatures(delta_time);
            }
        }
	},

    combat_step: function(delta_time) {
        // init combat or select next creature
        if(ZIL.combat_creature == null) {
            ZIL.init_combat_turn();
        } else if(ZIL.combat_creature.mobile.ap <= 0) {
            ZIL.next_combat_creature();
        }

        // combat is over
        if(ZIL.combat_creature == null) {
            console.log(">>> combat DONE.");
            ZIL.in_combat = false;
            ZIL.center_screen_at(ZIL.player.mobile.x, ZIL.player.mobile.y);
            return;
        }

        // combat move
        if(ZIL.combat_creature.mobile.ap > 0) {
            if(ZIL.combat_creature.mobile.move_step(ZIL.shape, ZIL.global_pos[0], ZIL.global_pos[1], ZIL.global_pos[2], delta_time)) {
                ZIL.combat_creature.mobile.ap--;
                if(!ZIL.combat_creature.mobile.ai_move) {
                    ZIL.recenter_screen();
                }
            }

            $("#combatant").html(ZIL.combat_creature.mobile.to_string());
        }
    },

    init_combat_turn: function() {
        // sort by initiative
        ZIL.combat_creature_index = 0;
        ZIL.combat_creatures = $.map(Object.keys(ZIL.shown_creatures), function(id) {
            return ZIL.creatures_map[id];
        });
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
        while(true) {
            ZIL.combat_creature_index++;
            if(ZIL.combat_creature_index >= ZIL.combat_creatures.length) {
                ZIL.combat_creature_index = 0;
            }
            if(ZIL.combat_creatures[ZIL.combat_creature_index].mobile.hp == 0) {
                if(!ZIL.combat_creatures[ZIL.combat_creature_index].mobile.ai_move) {
                    // game over: player killed
                    ZIL.combat_creatures = [];
                    ZIL.combat_creature_index = 0;
                    break;
                } else {
                    ZIL.combat_creatures.splice(ZIL.combat_creature_index, 1);
                    ZIL.combat_creature_index--;
                }
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
            ZIL.center_screen_at(ZIL.combat_creature.mobile.x, ZIL.combat_creature.mobile.y);
        } else {
            ZIL.combat_creature = null;
            $("#combatant").empty();
        }
    },

    recenter_screen: function() {
        // re-center screen if near the edge
        if (ZIL.is_near_edge_of_screen()) {
            ZIL.center_screen_at(ZIL.player.mobile.x, ZIL.player.mobile.y);
        }
    },

    center_screen_at: function(x, y) {
        ZIL.global_pos[0] = x - ZIL_UTIL.VIEW_WIDTH / 2;
        ZIL.global_pos[1] = y - ZIL_UTIL.VIEW_HEIGHT / 2;
        ZIL.screen_pos_map = {};
        ZIL.redraw_shape();
    },

    is_near_edge_of_screen: function() {
        var px = (((ZIL.player.mobile.x - ZIL.global_pos[0]) / 8)|0) * 8;
        var py = (((ZIL.player.mobile.y - ZIL.global_pos[1]) / 8)|0) * 8;
        var key = "" + px + "," + py;
        var screen_pos = ZIL.screen_pos_map[key];
        if(screen_pos == null) {
            screen_pos = ZIL.world_to_screen(px, py, 0);
            ZIL.screen_pos_map[key] = screen_pos;
        }
        return screen_pos.x < 40 || screen_pos.y < 40 || screen_pos.x >= ZIL.canvas_size - 40 || screen_pos.y >= ZIL.canvas_size - 40;
    },

    world_to_screen: function(x, y, z) {
        // converts 3D position to screen coords
        var pos = new THREE.Vector3(x, y, z);
        projScreenMat = new THREE.Matrix4();
        projScreenMat.multiplyMatrices( ZIL.camera.projectionMatrix, ZIL.camera.matrixWorldInverse);
        pos.applyMatrix4(projScreenMat);
        return {
            x: (pos.x+1) * ZIL.canvas_size/2 + ZIL.canvas_offset.left,
            y: (-pos.y+1) * ZIL.canvas_size/2 +ZIL.canvas_offset.top
        };
    },

	redraw_shape: function() {
		ZIL.shape.render_shape(ZIL.rendered_shape, ZIL.global_pos);
        ZIL.player.mobile.move(ZIL.global_pos[0], ZIL.global_pos[1], ZIL.global_pos[2]);
        for(var creature_id in ZIL.shown_creatures) {
            ZIL.creatures_map[creature_id].mobile.move(ZIL.global_pos[0], ZIL.global_pos[1], ZIL.global_pos[2]);
        }
	},

	start_game: function() {
        ZIL_UTIL.VIEW_WIDTH *= 3;
        ZIL_UTIL.VIEW_HEIGHT *= 3;
        ZIL_UTIL.CAM_ZOOM *= 2.55;

		ZIL.scene = new THREE.Scene();
		ZIL.renderer = new THREE.WebGLRenderer({ canvas: $("#view")[0] });
		ZIL.init_camera();

		var size = Math.min(window.innerWidth, window.innerHeight);
		ZIL.renderer.setSize( size, size );
		ZIL.canvas_size = size;
        ZIL.canvas_offset = $("canvas").offset();
		document.body.appendChild( ZIL.renderer.domElement );
		ZIL.offset_x = 0;
		ZIL.offset_y = 0;

		ZIL.init_dom();

		ZIL.world = new THREE.Object3D();
		ZIL.world.position.set(ZIL_UTIL.VIEW_WIDTH / 2, ZIL_UTIL.VIEW_HEIGHT / 2, 0);
		ZIL.world.scale.z = 2;
		ZIL.scene.add( ZIL.world );

		ZIL.inner = new THREE.Object3D();
		ZIL.inner.position.x = -ZIL_UTIL.VIEW_WIDTH / 2;
		ZIL.inner.position.y = -ZIL_UTIL.VIEW_HEIGHT / 2;
		ZIL.world.add( ZIL.inner );

        ZIL.coord = new THREE.Object3D();
//		ZIL.inner.add( ZIL.coord );
		ZIL.init_coords();

		ZIL.rendered_shape = new THREE.Object3D();
		ZIL.inner.add( ZIL.rendered_shape );

		ZIL.obj = new THREE.Object3D();
		ZIL.inner.add( ZIL.obj );
		ZIL.init_cursor();

		ZIL.init_light();

        ZIL.load_shape("maps", "battle");
	},

	init_light: function() {
		var light = new THREE.HemisphereLight( 0xffffff, 0x000000, 0.5 );
		ZIL.scene.add( light );
		var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
		directionalLight.position.set( -1, 1, 1 );
		ZIL.scene.add( directionalLight );
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
		ZIL.camera.position.set(p * 1.7, p * 1.7, p * 2);
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
		// colors
        var colors = window.localStorage["colors"];
        if(colors == null) colors = ZIL_UTIL.palette;
        else colors = JSON.parse(colors);

        // set the global palette (todo: this should not be hidden here)
        ZIL_UTIL.palette = colors;

		$("canvas").
			bind("mousemove", ZIL.mouse_move).
			bind("mouseup", ZIL.mouse_up);
		document.body.oncontextmenu = function() { return false; };
		document.body.onkeydown = ZIL.key_down;
	},

	load_shape: function(category_name, shape_name) {
        ZilShape.reset_cache();
        Mobile.CHUNK_MAP = {};
        ZIL.creatures = [];
		ZIL.shape = ZilShape.load_shape(category_name, shape_name, 0, this);
        ZIL.shape.build_shape(ZIL_UTIL.update_progress, function() {

            var start_x = 56;
            var start_y = 56;
            ZIL.global_pos = [ start_x - ZIL_UTIL.VIEW_WIDTH / 2, start_y - ZIL_UTIL.VIEW_HEIGHT / 2, 0 ];

            ZIL.player = new Player(start_x, start_y);
            ZIL.player.mobile.z = ZIL.shape.get_highest_empty_space(start_x, start_y, ZIL.player.mobile.shape);
            ZIL.rendered_shape.add(ZIL.player.mobile.shape_obj);
            ZIL.player.mobile.move(ZIL.global_pos[0], ZIL.global_pos[1], ZIL.global_pos[2]);

            ZIL.move_visible_creatures(1000);

            ZIL.redraw_shape();
		    ZIL.render();
        });
	},

    load_monster: function(monster_key, pos) {
        var creature = new Creature(MONSTERS[monster_key], pos, Object.keys(ZIL.creatures_map).length);
        ZIL.creatures_map[creature.id] = creature;
        return null;
    },

    start_combat: function() {
        if(!ZIL.in_combat) console.log(">>> COMBAT start");
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
	}
};
