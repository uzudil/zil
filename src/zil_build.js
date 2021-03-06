var ZIL_BUILD = {

	scene: null,
	camera: null,
	renderer: null,
	last_time: 0,
	move: [0, 0, 0],
	cursor: [0, 0, 0],
	move_timer: 0,
	MOVE_SPEED: 25,
	global_pos: [0, 0, 0],
	include_shape: null,
	include_shape_obj: null,
    include_monster: null,
	dragging: false,
	last_mouse_x: null,
	last_mouse_y: null,
	zoom: 1,
	mouse_dir_lock: false,
	last_point: { x: 0, y: 0 },
	editing: false,
	fps_counter: 0,
	fps_start: Date.now(),
    shortcut_shape: [ null, null, null, null, null, null, null, null, null, null ],
    rotation: 0,
    rocks: null,
    rocks_obj: null,
    rocks_w: null,
    rocks_h: null,
    rocks_d: null,
    box: null,
    box_shape: null,
    sphere: null,
    sphere_obj: null,
    FLOOR_TILE_MODE: false,
    DRAW_MODE: false,
    DRAW_MODE_PEN_DOWN: true,

	mouse_zoom: function(event) {
		if(event.originalEvent.wheelDelta /120 > 0) {
			ZIL_BUILD.zoom /= 1.1;
		} else {
			if(ZIL_BUILD.zoom < 1) {
				ZIL_BUILD.zoom *= 1.1;
			} else {
				ZIL_BUILD.zoom = 1;
			}
		}

		ZIL_BUILD.camera.left = -ZIL_UTIL.VIEW_WIDTH / ZIL_UTIL.CAM_ZOOM * ZIL_BUILD.zoom;
		ZIL_BUILD.camera.right = ZIL_UTIL.VIEW_WIDTH / ZIL_UTIL.CAM_ZOOM * ZIL_BUILD.zoom;
		ZIL_BUILD.camera.top = ZIL_UTIL.VIEW_HEIGHT / ZIL_UTIL.CAM_ZOOM * ZIL_BUILD.zoom;
		ZIL_BUILD.camera.bottom = -ZIL_UTIL.VIEW_HEIGHT / ZIL_UTIL.CAM_ZOOM * ZIL_BUILD.zoom;
		ZIL_BUILD.camera.updateProjectionMatrix();

		if(ZIL_BUILD.zoom < 1) {
			ZIL_BUILD.camera.position.set(
				ZIL_UTIL.VIEW_WIDTH + ZIL_BUILD.cursor[0], 
				ZIL_UTIL.VIEW_HEIGHT + ZIL_BUILD.cursor[1], 
				Math.max(ZIL_UTIL.VIEW_WIDTH + ZIL_BUILD.cursor[0] * ZIL_BUILD.zoom, 
					ZIL_UTIL.VIEW_HEIGHT + ZIL_BUILD.cursor[1] * ZIL_BUILD.zoom));
		} else {
			ZIL_BUILD.camera.position.set(
				ZIL_UTIL.VIEW_WIDTH, 
				ZIL_UTIL.VIEW_HEIGHT, 
				Math.max(ZIL_UTIL.VIEW_WIDTH, ZIL_UTIL.VIEW_HEIGHT));
		}

	},

	XY_PLANE: new THREE.Plane(new THREE.Vector3(0, 0, 1), 1),

	mouse_move: function(event) {
        if(ZIL_BUILD.DRAW_MODE) return false;

		if(ZIL_BUILD.dragging) {
            // rotating the view
			if(ZIL_BUILD.last_mouse_x == null) {
				ZIL_BUILD.last_mouse_x = event.offsetX;
				ZIL_BUILD.last_mouse_y = event.offsetY;
			}
			var dx = event.offsetX - ZIL_BUILD.last_mouse_x;
//			var dy = event.offsetY - ZIL_BUILD.last_mouse_y;
			
			ZIL_BUILD.world.rotation.z += dx / 100.0;

			ZIL_BUILD.last_mouse_x = event.offsetX;
			ZIL_BUILD.last_mouse_y = event.offsetY;
		} else {
            // regular mouse movement
			var point = ZIL_BUILD.mouse_to_world(event);
			if(point) { 
				if(event.ctrlKey) {
					if(!ZIL_BUILD.mouse_dir_lock && ZIL_BUILD.last_point.x != 0 && ZIL_BUILD.last_point.y != 0) {
						var dx = Math.abs(ZIL_BUILD.last_point.x - point.x);
						var dy = Math.abs(ZIL_BUILD.last_point.y - point.y);
						if(dx > 0.25)  ZIL_BUILD.mouse_dir_lock = "x";
						else if(dy > 0.25)  ZIL_BUILD.mouse_dir_lock = "y";
					}
				} else {
					if(ZIL_BUILD.mouse_dir_lock) {
						ZIL_BUILD.mouse_dir_lock = false;
					}
				}
				if(ZIL_BUILD.mouse_dir_lock != "y") ZIL_BUILD.cursor[0] = Math.round(point.x);
				if(ZIL_BUILD.mouse_dir_lock != "x") ZIL_BUILD.cursor[1] = Math.round(point.y);

                if(ZIL_BUILD.rocks || ZIL_BUILD.sphere || ZIL_BUILD.box) {
                    ZIL_BUILD.cursor[2] = 0;
                } else if(ZIL_BUILD.FLOOR_TILE_MODE) {
                    if(ZIL_BUILD.include_shape && ZIL_BUILD.include_shape.depth == 1) {
                        ZIL_BUILD.cursor[0] = ((ZIL_BUILD.cursor[0] / ZIL_UTIL.CHUNK_SIZE) | 0) * ZIL_UTIL.CHUNK_SIZE;
                        ZIL_BUILD.cursor[1] = ((ZIL_BUILD.cursor[1] / ZIL_UTIL.CHUNK_SIZE) | 0) * ZIL_UTIL.CHUNK_SIZE;
                        ZIL_BUILD.cursor[2] = 0;
                    } else {
                        ZIL_BUILD.cursor[2] = 1;
                    }
                } else {
                    // find the highest location here
                    ZIL_BUILD.cursor[2] = ZIL_BUILD.shape.get_highest_empty_space(
                            ZIL_BUILD.global_pos[0] + ZIL_BUILD.cursor[0],
                            ZIL_BUILD.global_pos[1] + ZIL_BUILD.cursor[1],
                        ZIL_BUILD.include_shape);
                }

				ZIL_BUILD.last_point.x = event.ctrlKey ? point.x : 0;
				ZIL_BUILD.last_point.y = event.ctrlKey ? point.y : 0;

				ZIL_BUILD.position_cursor();

				ZIL_BUILD.check_mouse(event);
			}
		}
	},

	mouse_to_world: function(event) {
		var mousex = (( (event.offsetX - ZIL_BUILD.offset_x) / ZIL_BUILD.canvas_size ) * 2 - 1);
		var mousey = (-( (event.offsetY - ZIL_BUILD.offset_y) / ZIL_BUILD.canvas_size ) * 2 + 1);
		// console.log("" + mousex + "," + mousey);
		var vector = new THREE.Vector3( mousex, mousey, 1 );
		var ray_caster = ZIL_BUILD.projector.pickingRay(vector, ZIL_BUILD.camera);
		var intersection = ray_caster.ray.intersectPlane(ZIL_BUILD.XY_PLANE);
		if(intersection) { 
			if(intersection.x < 0) intersection.x = 0;
			if(intersection.x >= ZIL_UTIL.VIEW_WIDTH) intersection.x = ZIL_UTIL.VIEW_WIDTH - 1;
			if(intersection.y < 0) intersection.y = 0;
			if(intersection.y >= ZIL_UTIL.VIEW_HEIGHT) intersection.y = ZIL_UTIL.VIEW_HEIGHT - 1;
		}
		return intersection;
	},

	cursor_moved: function() {
		if(ZIL_BUILD.last_cursor == null) {
			ZIL_BUILD.last_cursor = [0, 0, 0];
		}
		if(ZIL_BUILD.last_cursor[0] != ZIL_BUILD.cursor[0] || ZIL_BUILD.last_cursor[1] != ZIL_BUILD.cursor[1] || ZIL_BUILD.last_cursor[2] != ZIL_BUILD.cursor[2]) {
			ZIL_BUILD.last_cursor[0] = ZIL_BUILD.cursor[0];
			ZIL_BUILD.last_cursor[1] = ZIL_BUILD.cursor[1];
			ZIL_BUILD.last_cursor[2] = ZIL_BUILD.cursor[2];
			return true;
		} else {
			return false;
		}
	},

	check_mouse: function(event) {
		if(event.which == 1) {
			if(ZIL_BUILD.cursor_moved()) ZIL_BUILD.set_position(1);
		} else if(event.which == 3) {
			if(ZIL_BUILD.cursor_moved()) ZIL_BUILD.set_position(0);
		}
	},

	mouse_down: function(event) {
        if(ZIL_BUILD.DRAW_MODE) return false;

		if(!ZIL_BUILD.editing) {
			ZIL_BUILD.editing = true;
			ZIL_BUILD.shape.set_undo_shape();
		}
		if(event.which == 2) {
			ZIL_BUILD.dragging = true;
		} else {
			ZIL_BUILD.check_mouse(event);
		}
	},

	mouse_up: function(event) {
        if(ZIL_BUILD.DRAW_MODE) return false;

		ZIL_BUILD.dragging = false;
		ZIL_BUILD.world.rotation.x = ZIL_BUILD.world.rotation.y = ZIL_BUILD.world.rotation.z = 0;
		ZIL_BUILD.last_mouse_x = ZIL_BUILD.last_mouse_y = null;
		ZIL_BUILD.editing = false;
	},

	key_down: function(event) {
//		console.log(event.which);
		if(event.target != document.body) return true;
		if(ZIL_BUILD.move_timer == 0 && !event.ctrlKey) {

			// move the cursor
			if(event.which == 37) { // W
                if(ZIL_BUILD.DRAW_MODE) {
                    if (ZIL_BUILD.cursor[0] < ZIL_UTIL.VIEW_WIDTH - 1) {
                        ZIL_BUILD.cursor[0]++;
                        if(ZIL_BUILD.DRAW_MODE_PEN_DOWN) ZIL_BUILD.set_position(1);
                        ZIL_BUILD.position_cursor();
                        ZIL_BUILD.redraw_shape();
                    }
                } else if(ZIL_BUILD.rocks) {
                    ZIL_BUILD.rocks_w = ++ZIL_BUILD.rocks.width;
                    ZIL_BUILD.rocks.regen();
                    ZIL_BUILD.attach_rocks();
                } else if(ZIL_BUILD.box) {
                    ZIL_BUILD.rocks_w = ++ZIL_BUILD.box.width;
                    ZIL_BUILD.box.regen();
                    ZIL_BUILD.attach_box();
                } else {
                    if (ZIL_BUILD.global_pos[0] < ZIL_UTIL.WIDTH - ZIL_UTIL.VIEW_WIDTH - ZIL_UTIL.CHUNK_SIZE) {
                        ZIL_BUILD.global_pos[0] += ZIL_UTIL.CHUNK_SIZE;
                        ZIL_BUILD.redraw_shape();
                    }
                }
			} else if(event.which == 39) { // E
                if(ZIL_BUILD.DRAW_MODE) {
                    if (ZIL_BUILD.cursor[0] > 0) {
                        ZIL_BUILD.cursor[0]--;
                        if(ZIL_BUILD.DRAW_MODE_PEN_DOWN) ZIL_BUILD.set_position(1);
                        ZIL_BUILD.position_cursor();
                        ZIL_BUILD.redraw_shape();
                    }
                } else if(ZIL_BUILD.rocks) {
                    if(ZIL_BUILD.rocks.width > 1) {
                        ZIL_BUILD.rocks_w = --ZIL_BUILD.rocks.width;
                        ZIL_BUILD.rocks.regen();
                        ZIL_BUILD.attach_rocks();
                    }
                } else if(ZIL_BUILD.box) {
                    if(ZIL_BUILD.box.width > 1) {
                        ZIL_BUILD.rocks_w = --ZIL_BUILD.box.width;
                        ZIL_BUILD.box.regen();
                        ZIL_BUILD.attach_box();
                    }
                } else {
                    if (ZIL_BUILD.global_pos[0] > 0) {
                        ZIL_BUILD.global_pos[0] -= ZIL_UTIL.CHUNK_SIZE;
                        ZIL_BUILD.redraw_shape();
                    }
                }
			} else if(event.which == 38) { // N
                if(ZIL_BUILD.DRAW_MODE) {
                    if (ZIL_BUILD.cursor[1] > 0) {
                        ZIL_BUILD.cursor[1]--;
                        if(ZIL_BUILD.DRAW_MODE_PEN_DOWN) ZIL_BUILD.set_position(1);
                        ZIL_BUILD.position_cursor();
                        ZIL_BUILD.redraw_shape();
                    }
                } else if(ZIL_BUILD.rocks) {
                    if(ZIL_BUILD.rocks.height > 1) {
                        ZIL_BUILD.rocks_h = --ZIL_BUILD.rocks.height;
                        ZIL_BUILD.rocks.regen();
                        ZIL_BUILD.attach_rocks();
                    }
                } else if(ZIL_BUILD.box) {
                    if(ZIL_BUILD.box.height > 1) {
                        ZIL_BUILD.rocks_h = --ZIL_BUILD.box.height;
                        ZIL_BUILD.box.regen();
                        ZIL_BUILD.attach_box();
                    }
                } else {
                    if(ZIL_BUILD.global_pos[1] > 0) {
                        ZIL_BUILD.global_pos[1] -= ZIL_UTIL.CHUNK_SIZE;
                        ZIL_BUILD.redraw_shape();
                    }
				}
			} else if(event.which == 40) { // S
                if(ZIL_BUILD.DRAW_MODE) {
                    if (ZIL_BUILD.cursor[1] < ZIL_UTIL.VIEW_HEIGHT - 1) {
                        ZIL_BUILD.cursor[1]++;
                        if(ZIL_BUILD.DRAW_MODE_PEN_DOWN) ZIL_BUILD.set_position(1);
                        ZIL_BUILD.position_cursor();
                        ZIL_BUILD.redraw_shape();
                    }
                } else if(ZIL_BUILD.rocks) {
                    ZIL_BUILD.rocks_h = ++ZIL_BUILD.rocks.height;
                    ZIL_BUILD.rocks.regen();
                    ZIL_BUILD.attach_rocks();
                } else if(ZIL_BUILD.box) {
                    ZIL_BUILD.rocks_h = ++ZIL_BUILD.box.height;
                    ZIL_BUILD.box.regen();
                    ZIL_BUILD.attach_box();
                } else {
                    if(ZIL_BUILD.global_pos[1] < ZIL_UTIL.HEIGHT - ZIL_UTIL.VIEW_HEIGHT) {
                        ZIL_BUILD.global_pos[1] += ZIL_UTIL.CHUNK_SIZE;
                        ZIL_BUILD.redraw_shape();
                    }
				}
			} else if(event.which == 88) { // <,
                if(ZIL_BUILD.rocks) {
                    if (ZIL_BUILD.rocks.depth > 1) {
                        ZIL_BUILD.rocks_d = --ZIL_BUILD.rocks.depth;
                        ZIL_BUILD.rocks.regen();
                        ZIL_BUILD.attach_rocks();
                    }
                } else if(ZIL_BUILD.sphere) {
                    if(ZIL_BUILD.sphere.depth > 1) {
                        ZIL_BUILD.rocks_d = --ZIL_BUILD.sphere.depth;
                        ZIL_BUILD.sphere.regen();
                        ZIL_BUILD.attach_sphere();
                    }
                } else if(ZIL_BUILD.box) {
                    if(ZIL_BUILD.box.depth > 1) {
                        ZIL_BUILD.rocks_d = --ZIL_BUILD.box.depth;
                        ZIL_BUILD.box.regen();
                        ZIL_BUILD.attach_box();
                    }
                } else if(ZIL_BUILD.cursor[2] > 0) {
				    ZIL_BUILD.move_timer = Date.now();
				    ZIL_BUILD.move = [0, 0, -1];
                }
			} else if(event.which == 90) { // >.
                if(ZIL_BUILD.rocks) {
                    ZIL_BUILD.rocks_d = ++ZIL_BUILD.rocks.depth;
                    ZIL_BUILD.rocks.regen();
                    ZIL_BUILD.attach_rocks();
                } else if(ZIL_BUILD.sphere) {
                    if(ZIL_BUILD.sphere.depth < ZIL_UTIL.DEPTH) {
                        ZIL_BUILD.rocks_d = ++ZIL_BUILD.sphere.depth;
                        ZIL_BUILD.sphere.regen();
                        ZIL_BUILD.attach_sphere();
                    }
                } else if(ZIL_BUILD.box) {
                    if(ZIL_BUILD.box.depth < ZIL_UTIL.DEPTH) {
                        ZIL_BUILD.rocks_d = ++ZIL_BUILD.box.depth;
                        ZIL_BUILD.box.regen();
                        ZIL_BUILD.attach_box();
                    }
                } else if(ZIL_BUILD.cursor[2] < ZIL_UTIL.VIEW_DEPTH - 1) {
                    ZIL_BUILD.move_timer = Date.now();
                    ZIL_BUILD.move = [0, 0, 1];
                }
            }
		}

		if(event.which == 32) {
            if(ZIL_BUILD.DRAW_MODE) {
                ZIL_BUILD.DRAW_MODE_PEN_DOWN = !ZIL_BUILD.DRAW_MODE_PEN_DOWN;
                if(ZIL_BUILD.DRAW_MODE_PEN_DOWN) {
                    ZIL_BUILD.set_position(1);
                    ZIL_BUILD.position_cursor();
                    ZIL_BUILD.redraw_shape();
                }
            } else {
                ZIL_BUILD.set_position();
            }
		} else if(event.which == 82) {
            $("#rocks_message").fadeIn();
            ZIL_BUILD.draw_rocks();
		} else if(event.which == 83) {
            $("#sphere_message").fadeIn();
            ZIL_BUILD.draw_sphere();
		} else if(event.which == 66) {
            $("#box_message").fadeIn();
            ZIL_BUILD.draw_box();
		} else if(event.which == 90 && event.ctrlKey) {
			ZIL_BUILD.undo();
		} else if(event.which == 70) {
			ZIL_BUILD.flood_fill();
		} else if(event.which == 27) {
            if(ZIL_BUILD.rocks) {
                ZIL_BUILD.end_rocks_mode();
            } else if(ZIL_BUILD.sphere) {
                ZIL_BUILD.end_sphere_mode();
            } else if(ZIL_BUILD.box) {
                ZIL_BUILD.end_box_mode();
            } else if(ZIL_BUILD.include_shape) {
				// detach from cursor
				ZIL_BUILD.obj.remove(ZIL_BUILD.include_shape_obj);
				ZIL_BUILD.include_shape_obj = null;
				ZIL_BUILD.include_shape = null;
                ZIL_BUILD.include_monster = null;
                ZIL_BUILD.rotation = 0;
				$("#include_message").fadeOut();
			} else if(ZIL_BUILD.FLOOR_TILE_MODE) {
                ZIL_BUILD.FLOOR_TILE_MODE = false;
                $("#floor_message").fadeOut();
            } else if(ZIL_BUILD.DRAW_MODE) {
                ZIL_BUILD.DRAW_MODE = false;
                $("#draw_message").fadeOut();
            }
		} else if(event.which == 36) {
			ZIL_BUILD.global_pos[0] = ZIL_BUILD.global_pos[1] = 0;
			ZIL_BUILD.redraw_shape();
		} else if(event.which == 35) {
			ZIL_BUILD.global_pos[0] = ZIL_UTIL.WIDTH - ZIL_UTIL.VIEW_WIDTH;
			ZIL_BUILD.global_pos[1] = ZIL_UTIL.HEIGHT - ZIL_UTIL.VIEW_HEIGHT;
			ZIL_BUILD.redraw_shape();
		} else if(event.which >= 0x30 && event.which <= 0x39) {
            var index = event.which - 0x30;
            var el = $("#shape_chooser .group").eq(index);
            var category = $(".category_selector", el).val();
            var shape_name = $(".shape_selector", el).val();
            if(shape_name) {
                ZIL_BUILD._include_shape(category, shape_name);
            }
        } else if(event.which == 219) {
            ZIL_BUILD.rotate_include_shape(1);
        } else if(event.which == 221) {
            ZIL_BUILD.rotate_include_shape(-1);
        } else if(event.which == 68) {
            ZIL_BUILD.set_position(0);
        } else if(event.which == 69) {
            ZIL_BUILD.clear_chunk();
        } else if(event.which == 71) {
            $("#floor_message").fadeIn();
            ZIL_BUILD.FLOOR_TILE_MODE = true;
        } else if(event.which == 72 && confirm("Clear all rocks?")) {
            ZIL_BUILD.clear_rocks();
        } else if(event.which == 73) {
            ZIL_BUILD.DRAW_MODE = ZIL_BUILD.DRAW_MODE_PEN_DOWN = true;
            $("#draw_message").fadeIn();
            ZIL_BUILD.set_position(1);
            ZIL_BUILD.redraw_shape();
        }

		$("#global_pos").empty().html(ZIL_BUILD.global_pos.join(",") + "-" + [
			ZIL_BUILD.global_pos[0] + ZIL_UTIL.VIEW_WIDTH, 
			ZIL_BUILD.global_pos[1] + ZIL_UTIL.VIEW_HEIGHT, 
			ZIL_BUILD.global_pos[2] + ZIL_UTIL.VIEW_DEPTH].join(","));
		ZIL_BUILD.show_cursor_pos();
		return true;
	},

    end_rocks_mode: function() {
        $("#rocks_message").fadeOut();
        ZIL_BUILD.obj.remove(ZIL_BUILD.rocks_obj);
        ZIL_BUILD.rocks_w = ZIL_BUILD.rocks.width;
        ZIL_BUILD.rocks_h = ZIL_BUILD.rocks.height;
        ZIL_BUILD.rocks_d = ZIL_BUILD.rocks.depth;
        ZIL_BUILD.rocks_obj = null;
        ZIL_BUILD.rocks = null;
    },

    draw_rocks: function() {
        var color1 = $("#color option:selected").index() || ZIL_BUILD.add_color(0x888888);
        var c = ZIL_UTIL.palette[color1];
        var c2 = ZIL_UTIL.shade_color(c, 0.9);
        var color2 = ZIL_BUILD.add_color(c2);
        ZIL_BUILD.rocks = new Rocks(color1, color2, ZIL_BUILD.rocks_w, ZIL_BUILD.rocks_h, ZIL_BUILD.rocks_d);
        ZIL_BUILD.attach_rocks();
    },

    attach_rocks: function() {
        if(ZIL_BUILD.rocks_obj) ZIL_BUILD.obj.remove(ZIL_BUILD.rocks_obj);

        ZIL_BUILD.rocks_obj = ZIL_BUILD.rocks.shape_obj.render_shape();
        ZIL_BUILD.obj.add(ZIL_BUILD.rocks_obj);
    },

    end_sphere_mode: function() {
        $("#sphere_message").fadeOut();
        ZIL_BUILD.obj.remove(ZIL_BUILD.sphere_obj);
        ZIL_BUILD.rocks_d = ZIL_BUILD.sphere.depth;
        ZIL_BUILD.sphere_obj = null;
        ZIL_BUILD.sphere = null;
    },

    draw_sphere: function() {
        var color1 = $("#color option:selected").index();
        if(color1 == null) color1 = ZIL_BUILD.add_color(0x888888);
        var c = ZIL_UTIL.palette[color1];
        var c2 = ZIL_UTIL.shade_color(c, 0.9);
        var color2 = ZIL_BUILD.add_color(c2);
        ZIL_BUILD.sphere = new Sphere(color1, color2, ZIL_BUILD.rocks_d);
        ZIL_BUILD.attach_sphere();
    },

    attach_sphere: function() {
        if(ZIL_BUILD.sphere_obj) ZIL_BUILD.obj.remove(ZIL_BUILD.sphere_obj);

        ZIL_BUILD.sphere_obj = ZIL_BUILD.sphere.shape_obj.render_shape();
        ZIL_BUILD.obj.add(ZIL_BUILD.sphere_obj);
    },

    end_box_mode: function() {
        $("#box_message").fadeOut();
        ZIL_BUILD.obj.remove(ZIL_BUILD.box_obj);
        ZIL_BUILD.rocks_w = ZIL_BUILD.box.width;
        ZIL_BUILD.rocks_h = ZIL_BUILD.box.height;
        ZIL_BUILD.rocks_d = ZIL_BUILD.box.depth;
        ZIL_BUILD.box_obj = null;
        ZIL_BUILD.box = null;
    },

    draw_box: function() {
        var color1 = $("#color option:selected").index();
        if(color1 == null) color1 = ZIL_BUILD.add_color(0x888888);
        var c = ZIL_UTIL.palette[color1];
        var c2 = ZIL_UTIL.shade_color(c, 0.9);
        var color2 = ZIL_BUILD.add_color(c2);
        ZIL_BUILD.box = new Box(color1, color2, ZIL_BUILD.rocks_w, ZIL_BUILD.rocks_h, ZIL_BUILD.rocks_d);
        ZIL_BUILD.attach_box();
    },

    attach_box: function() {
        if(ZIL_BUILD.box_obj) ZIL_BUILD.obj.remove(ZIL_BUILD.box_obj);

        ZIL_BUILD.box_obj = ZIL_BUILD.box.shape_obj.render_shape();
        ZIL_BUILD.obj.add(ZIL_BUILD.box_obj);
    },

    add_color: function(color_hex) {
        var c = (typeof color_hex == "string") ? parseInt(color_hex, 16) : color_hex;
        var s = c.toString(16);
        var n = ZIL_UTIL.palette.indexOf(c);
        if(n < 0) {
            s = "#" + s;
            $("#color").append("<option value='" + c + "'>" + s + "</option>");
            ZIL_UTIL.palette.push(c);
            $("#color option[value='" + c + "']").css("color", s);
            $("#color option[value='" + c + "']:checked").css("color", s);
            ZIL_UTIL.save_config();
            n = ZIL_UTIL.palette.indexOf(c);
        }
        return n;
    },

    position_cursor: function() {
        ZIL_BUILD.obj.position.set(ZIL_BUILD.cursor[0], ZIL_BUILD.cursor[1], ZIL_BUILD.cursor[2]);
        ZIL_BUILD.xy.position.z = -ZIL_BUILD.obj.position.z - 0.5;
        ZIL_BUILD.yz.position.x = -ZIL_BUILD.obj.position.x - 0.5;
        ZIL_BUILD.xz.position.y = -ZIL_BUILD.obj.position.y - 0.5;
        ZIL_BUILD.show_cursor_pos();
    },

	show_cursor_pos: function() {
        var cx = ZIL_BUILD.cursor[0] + ZIL_BUILD.global_pos[0];
        var cy = ZIL_BUILD.cursor[1] + ZIL_BUILD.global_pos[1];
        var cz = ZIL_BUILD.cursor[2] + ZIL_BUILD.global_pos[2];
        $("#cursor_pos").empty().html([cx, cy, cz].join(","));

        var name_and_pos = ZIL_BUILD.shape.get_shape_at(cx, cy, cz - 1);
        $("#shape_under_cursor").empty();
        if(name_and_pos) {
            $("#shape_under_cursor").append(name_and_pos[0] + "-" + name_and_pos[1] + "," + name_and_pos[2] + "," + name_and_pos[3])
        }
	},

	move_cursor: function(now) {
		if(ZIL_BUILD.move_timer > 0) {
			var md = now - ZIL_BUILD.move_timer;
			if(md >= ZIL_BUILD.MOVE_SPEED) {
				ZIL_BUILD.move_timer = 0;
				ZIL_BUILD.cursor[0] += ZIL_BUILD.move[0];	
				ZIL_BUILD.cursor[1] += ZIL_BUILD.move[1];	
				ZIL_BUILD.cursor[2] += ZIL_BUILD.move[2];	
				ZIL_BUILD.move = [0, 0, 0];
				ZIL_BUILD.obj.position.set(ZIL_BUILD.cursor[0], ZIL_BUILD.cursor[1], ZIL_BUILD.cursor[2]);
				ZIL_BUILD.show_cursor_pos();
			} else {
				ZIL_BUILD.obj.position.set(
					ZIL_BUILD.cursor[0] + ZIL_BUILD.move[0] * (md / ZIL_BUILD.MOVE_SPEED), 
					ZIL_BUILD.cursor[1] + ZIL_BUILD.move[1] * (md / ZIL_BUILD.MOVE_SPEED), 
					ZIL_BUILD.cursor[2] + ZIL_BUILD.move[2] * (md / ZIL_BUILD.MOVE_SPEED));
			}
			ZIL_BUILD.xy.position.z = -ZIL_BUILD.obj.position.z - 0.5;
			ZIL_BUILD.yz.position.x = -ZIL_BUILD.obj.position.x - 0.5;
			ZIL_BUILD.xz.position.y = -ZIL_BUILD.obj.position.y - 0.5;
		}
	},

	undo: function() {
		ZIL_BUILD.shape.undo();
		ZIL_BUILD.save_shape();
		ZIL_BUILD.redraw_shape();
	},

	flood_fill: function() {
		ZIL_BUILD.shape.set_undo_shape();
		var x = ZIL_BUILD.global_pos[0] + ZIL_BUILD.cursor[0];
		var y = ZIL_BUILD.global_pos[1] + ZIL_BUILD.cursor[1];
		var z = ZIL_BUILD.global_pos[2] + ZIL_BUILD.cursor[2];
		ZIL_BUILD._flood_fill(x, y, z);
		ZIL_BUILD.save_shape();
		ZIL_BUILD.redraw_shape();
	},

	_flood_fill: function(x, y, z) {
		ZIL_BUILD.shape.set_position(x, y, z, $("#color option:selected").index());
		if(x < ZIL_UTIL.WIDTH && ZIL_BUILD.shape.get_position(x + 1, y, z) == null) {
			ZIL_BUILD._flood_fill(x + 1, y, z);
		}
		if(y < ZIL_UTIL.HEIGHT && ZIL_BUILD.shape.get_position(x, y + 1, z) == null) {
			ZIL_BUILD._flood_fill(x, y + 1, z);
		}
		if(x > 0 && ZIL_BUILD.shape.get_position(x - 1, y, z) == null) {
			ZIL_BUILD._flood_fill(x - 1, y, z);
		}
		if(y > 0 && ZIL_BUILD.shape.get_position(x, y - 1, z) == null) {
			ZIL_BUILD._flood_fill(x, y - 1, z);
		}
	},

    clear_chunk: function() {
        var cx = ((ZIL_BUILD.global_pos[0] + ZIL_BUILD.cursor[0]) / ZIL_UTIL.CHUNK_SIZE)|0;
		var cy = ((ZIL_BUILD.global_pos[1] + ZIL_BUILD.cursor[1]) / ZIL_UTIL.CHUNK_SIZE)|0;
		for(var x = 0; x < ZIL_UTIL.CHUNK_SIZE; x++) {
            for(var y = 0; y < ZIL_UTIL.CHUNK_SIZE; y++) {
                for(var z = 0; z < ZIL_UTIL.DEPTH; z++) {
                    ZIL_BUILD.shape.del_position(cx * ZIL_UTIL.CHUNK_SIZE + x, cy * ZIL_UTIL.CHUNK_SIZE + y, z);
                }
            }
        }
        ZIL_BUILD.save_shape();
		ZIL_BUILD.redraw_shape();
    },

    clear_rocks: function() {
        // keep only linked shapes
		for(var x = 0; x < ZIL_UTIL.WIDTH; x++) {
            for(var y = 0; y < ZIL_UTIL.HEIGHT; y++) {
                for(var z = 0; z < ZIL_UTIL.DEPTH; z++) {
                    var shape_name_and_pos = ZIL_BUILD.shape.get_shape_at(x, y, z);
                    if(!shape_name_and_pos) {
                        ZIL_BUILD.shape.del_position(x, y, z);
                    }
                }
            }
        }
        ZIL_BUILD.save_shape();
		ZIL_BUILD.redraw_shape();
    },

	set_position: function(force) {
		// console.log("force=" + force + " include=" + ZIL_BUILD.include_shape);
		var x = ZIL_BUILD.global_pos[0] + ZIL_BUILD.cursor[0];
		var y = ZIL_BUILD.global_pos[1] + ZIL_BUILD.cursor[1];
		var z = ZIL_BUILD.global_pos[2] + ZIL_BUILD.cursor[2];
        if(ZIL_BUILD.rocks) {
            ZIL_BUILD.shape.include_shape(x, y, z, ZIL_BUILD.rocks.shape_obj);
        } else if(ZIL_BUILD.sphere) {
            ZIL_BUILD.shape.include_shape(x, y, z, ZIL_BUILD.sphere.shape_obj);
        } else if(ZIL_BUILD.box) {
            ZIL_BUILD.shape.include_shape(x, y, z, ZIL_BUILD.box.shape_obj);
        } else if(ZIL_BUILD.include_shape) {
			ZIL_BUILD.shape.set_shape(x, y, z, ZIL_BUILD.include_shape, {
                monster: ZIL_BUILD.include_monster ? ZIL_BUILD.include_monster.key : null
            });
		} else {
			if(force == null) {
				if(ZIL_BUILD.shape.get_position(x, y, z) != null) {
					ZIL_BUILD.shape.del_position(x, y, z);
				} else {
					ZIL_BUILD.shape.set_position(x, y, z, $("#color option:selected").index());
				}
			} else if(force == 1) {
				ZIL_BUILD.shape.set_position(x, y, z, $("#color option:selected").index());
			} else if(force == 0) {
				ZIL_BUILD.shape.del_position(x, y, Math.max(z - 1, 0));
			}
		}
		ZIL_BUILD.save_shape();
		ZIL_BUILD.redraw_shape();
	},

	redraw_shape: function() {
		ZIL_BUILD.shape.render_shape(ZIL_BUILD.rendered_shape, ZIL_BUILD.global_pos, true);
		$("#chunks_info").html("scr: " + Object.keys(ZIL_BUILD.shape.chunks_on_screen).length +
			" mem: " + Object.keys(ZIL_BUILD.shape.chunks_in_memory).length);
	},

	start_builder: function() {
        // do this first
        ZIL_UTIL.load_config(640, 480);

		ZIL_BUILD.scene = new THREE.Scene();
		ZIL_BUILD.renderer = new THREE.WebGLRenderer({ canvas: $("#view")[0] });
		ZIL_BUILD.init_camera();

		var size = Math.min(window.innerWidth - $("#shape_chooser").width() - $("#palette").width() - 30, window.innerHeight);
		ZIL_BUILD.renderer.setSize( size, size );
		ZIL_BUILD.canvas_size = size;
		document.body.appendChild( ZIL_BUILD.renderer.domElement );
		ZIL_BUILD.offset_x = 0;
		ZIL_BUILD.offset_y = 0;

		ZIL_BUILD.init_dom();

		ZIL_BUILD.world = new THREE.Object3D();
		ZIL_BUILD.world.position.set(ZIL_UTIL.VIEW_WIDTH / 2, ZIL_UTIL.VIEW_HEIGHT / 2, 0);
		ZIL_BUILD.world.scale.z = 2;	
		ZIL_BUILD.scene.add( ZIL_BUILD.world );

		ZIL_BUILD.inner = new THREE.Object3D();
		ZIL_BUILD.inner.position.x = -ZIL_UTIL.VIEW_WIDTH / 2;
		ZIL_BUILD.inner.position.y = -ZIL_UTIL.VIEW_HEIGHT / 2;
		ZIL_BUILD.world.add( ZIL_BUILD.inner );

		ZIL_BUILD.coord = new THREE.Object3D();
		ZIL_BUILD.inner.add( ZIL_BUILD.coord );
		ZIL_BUILD.init_coords();		

		ZIL_BUILD.rendered_shape = new THREE.Object3D();
		ZIL_BUILD.inner.add( ZIL_BUILD.rendered_shape );

		ZIL_BUILD.obj = new THREE.Object3D();
		ZIL_BUILD.inner.add( ZIL_BUILD.obj );
		ZIL_BUILD.init_cursor();

		ZIL_BUILD.init_light();

        ZIL_BUILD.load_last_shape();
	},

	init_light: function() {
		var light = new THREE.HemisphereLight( 0xffffff, 0x000000, 0.5 );
		ZIL_BUILD.scene.add( light );
		var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
		directionalLight.position.set( -1, 1, 1 );
		ZIL_BUILD.scene.add( directionalLight );
	},

	init_cursor: function() {
		// the cursor box
		var geometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
		var material = new THREE.MeshLambertMaterial( {color: 0x2233ff, side: THREE.DoubleSide } );
		var cube = new THREE.Mesh( geometry, material );
		ZIL_BUILD.obj.add(cube);

		material = new THREE.MeshLambertMaterial( {color: 0xff33ff, side: THREE.DoubleSide } );
		var xy_geom = new THREE.BoxGeometry(1, 1, 0);
		ZIL_BUILD.xy = new THREE.Mesh( xy_geom, material );
		ZIL_BUILD.obj.add(ZIL_BUILD.xy);
		
		var yz_geom = new THREE.BoxGeometry(0, 1, 1);
		ZIL_BUILD.yz = new THREE.Mesh( yz_geom, material );
		ZIL_BUILD.obj.add(ZIL_BUILD.yz);
		
		var xz_geom = new THREE.BoxGeometry(1, 0, 1);
		ZIL_BUILD.xz = new THREE.Mesh( xz_geom, material );
		ZIL_BUILD.obj.add(ZIL_BUILD.xz);
	},

	init_camera: function() {
		ZIL_BUILD.camera = new THREE.OrthographicCamera( 
			-ZIL_UTIL.VIEW_WIDTH / ZIL_UTIL.CAM_ZOOM, ZIL_UTIL.VIEW_WIDTH / ZIL_UTIL.CAM_ZOOM, 
			ZIL_UTIL.VIEW_HEIGHT / ZIL_UTIL.CAM_ZOOM, -ZIL_UTIL.VIEW_HEIGHT / ZIL_UTIL.CAM_ZOOM, 
			-1000, 1000 );
		ZIL_BUILD.camera.position.set(
			ZIL_UTIL.VIEW_WIDTH, 
			ZIL_UTIL.VIEW_HEIGHT, 
			Math.max(ZIL_UTIL.VIEW_WIDTH, ZIL_UTIL.VIEW_HEIGHT));
		ZIL_BUILD.camera.up = new THREE.Vector3(0,0,1);
		ZIL_BUILD.camera.lookAt(new THREE.Vector3(ZIL_UTIL.VIEW_WIDTH / 4, ZIL_UTIL.VIEW_HEIGHT / 4, 0));
		ZIL_BUILD.projector = new THREE.Projector();
	},

	init_coords: function() {
		ZIL_UTIL.clear_node(ZIL_BUILD.coord);

		// add the x plane
		var geometry = new THREE.PlaneGeometry( ZIL_UTIL.VIEW_WIDTH, ZIL_UTIL.VIEW_DEPTH, ZIL_UTIL.VIEW_WIDTH, ZIL_UTIL.VIEW_DEPTH );
		var material = new THREE.MeshLambertMaterial( {color: 0x808080, side: THREE.DoubleSide, wireframe: true, transparent: true, opacity: 0.25 } );
		var plane = new THREE.Mesh( geometry, material );
		plane.rotation.x = PI / -2;
		plane.position.y = -0.5;
		plane.position.z = -ZIL_UTIL.VIEW_DEPTH / -2 - 0.5;
		plane.position.x = -ZIL_UTIL.VIEW_WIDTH / -2 - 0.5;
		ZIL_BUILD.coord.add( plane );

		// add the y plane
		var geometry = new THREE.PlaneGeometry( ZIL_UTIL.VIEW_WIDTH, ZIL_UTIL.VIEW_HEIGHT, ZIL_UTIL.VIEW_WIDTH, ZIL_UTIL.VIEW_HEIGHT );
		var material = new THREE.MeshLambertMaterial( {color: 0x80cc80, side: THREE.DoubleSide, wireframe: true, transparent: true, opacity: 0.25 } );
		var plane = new THREE.Mesh( geometry, material );
		plane.position.z = -0.5
		plane.position.x = -ZIL_UTIL.VIEW_WIDTH / -2 - 0.5;
		plane.position.y = -ZIL_UTIL.VIEW_HEIGHT / -2 - 0.5;
		ZIL_BUILD.coord.add( plane );

		// add the z plane
		var geometry = new THREE.PlaneGeometry( ZIL_UTIL.VIEW_DEPTH, ZIL_UTIL.VIEW_HEIGHT, ZIL_UTIL.VIEW_DEPTH, ZIL_UTIL.VIEW_HEIGHT );
		var material = new THREE.MeshLambertMaterial( {color: 0x8080cc, side: THREE.DoubleSide, wireframe: true, transparent: true, opacity: 0.25 } );
		var plane = new THREE.Mesh( geometry, material );
		plane.rotation.y = PI / -2;
		plane.position.x = -0.5;
		plane.position.z = ZIL_UTIL.VIEW_DEPTH/2 -0.5;
		plane.position.y = ZIL_UTIL.VIEW_HEIGHT/2 -0.5;
		ZIL_BUILD.coord.add( plane );
	},

	init_dom: function() {
        $("#generate_map").click(function(event) {
            $("#generate_map_dialog").fadeIn();
            return false;
        });
        $("#gen_go").click(function(event) {
            $("#generate_map_dialog").fadeOut();

            var builder = MapBuilder.create(
                parseInt($("#gen_w").val(), 10),
                parseInt($("#gen_h").val(), 10),
                $("#gen_type").val());

            ZIL_BUILD.shape.clear_shape(ZIL_BUILD.rendered_shape);
            ZilShape.reset_cache();
            builder.build(ZIL_BUILD.shape, function() {
                ZIL_BUILD.redraw_shape();
                ZIL_BUILD.render();
            });

            return false;
        });
        $("#help").click(function(event) {
            $("#help_info").fadeIn();
            return false;
        });

        var colors = ZIL_UTIL.palette;
		for(var i = 0; i < colors.length; i++) {
			var s = "#" + colors[i].toString(16);
			$("#color").append("<option value='" + colors[i] + "'>" + s + "</option>");
			$("#color option[value='" + colors[i] + "']").css("color", s);
			$("#color option[value='" + colors[i] + "']:checked").css("color", s);
		}
		$("#color").change(function(event) {
			var palette_index = $("#color option:selected").index();
			var s = $("#color option:selected").text();
			$("#sample").css("background", s);
			$("#color").blur();
			return true;
		});
		$("#color option").eq(0).attr("selected", "selected").change();

        $("#add_color").click(function(e) {
            var s = $(".color", $(e.target).parent()).val();
            ZIL_BUILD.add_color(s);
        });

        $("#monsters").empty();
        for(var key in MONSTERS) {
            $("#monsters").append("<option value=\"" + key + "\">" + MONSTERS[key].name + ":L" + MONSTERS[key].level + "</option>");
        }
        $("#load_monster").click(function(event) {
            var key = $("#monsters").val();
            if(key) ZIL_BUILD._include_monster(key);
            $("#load_monster").blur();
            return false;
        });

		// the shape name
		$("#name").keyup(function (e) {
    		if (e.keyCode == 13) {
    			ZIL_BUILD.save_shape();
    			$("#name").blur();
        		return false;	
    		}    		
    		return true;
    	});
		
		// load the cateogry names
		var cat_names = ZIL_UTIL.get_categories();
		for(var i = 0; i < cat_names.length; i++) {
			ZIL_BUILD.add_category(cat_names[i]);
		}
		$("#category_names").change(function(e) {
			var category_name = $("#category_names").val();
			ZIL_BUILD.load_shape_names(category_name);
		});
		$("#shape_chooser .group .category_selector").change(function(e) {
			var t = $(e.target);
			var category_name = t.val();
			ZIL_BUILD.load_shape_names(category_name, $(".shape_selector", t.closest(".group")));
            t.blur();
		});
        $("#shape_chooser .group .shape_selector").change(function(e) {
            var t = $(e.target);
            var values = $.map($("#shape_chooser .group"), function(x) {
                return $(".category_selector", $(x)).val() + "." + $(".shape_selector", $(x)).val();
            });
            ZIL_UTIL.shortcuts = values;
            ZIL_UTIL.save_config();
            t.blur();
        });

		// event handlers
		$("#load_shape").click(function(event) {
            ZIL_BUILD.shape.clear_shape(ZIL_BUILD.rendered_shape);
            var category_name = $("#category_names").val();
            var shape_name = $("#shape_names").val();
			ZIL_BUILD.load_shape(category_name, shape_name);
			$("#shape_names").blur();
            // update the last edited shape name
            ZIL_UTIL.last_shape_name = category_name + "." + shape_name;
            ZIL_UTIL.save_config();
			return false;
		});
		$("#clear").click(function(event) {
			if(confirm("Are you sure?")) {
				ZIL_BUILD.shape.clear_shape(ZIL_BUILD.rendered_shape);
				ZIL_BUILD.redraw_shape();
				ZIL_BUILD.save_shape();
				$("#clear").blur();
			}
			return false;
		});
		$("#compress").click(function(event) {
			if(confirm("Are you sure?")) {
				ZIL_BUILD.shape.remove_unseen();
				ZIL_BUILD.redraw_shape();
				ZIL_BUILD.save_shape();
				$("#compress").blur();
			}
			return false;
		});
		$("#delete").click(function(event) {
			var n = $("#shape_names option:selected").index();
			var name = $("#shape_names option").eq(n).text() ? n >= 0 : "";
			if(n >= 0 && confirm("Delete shape \"" + name + "\"?")) {
				$("#shape_names option").eq(n).remove();
				// todo: remove from choosers
                ZIL_UTIL.delete_shape(name);
				$("#delete").blur();
			}
			return false;
		});
		$("canvas").
			bind("mousemove", ZIL_BUILD.mouse_move).
			bind("mousedown", ZIL_BUILD.mouse_down).
			bind("mouseup", ZIL_BUILD.mouse_up).
			bind('mousewheel', ZIL_BUILD.mouse_zoom);
		document.body.oncontextmenu = function() { return false; };
		document.body.onkeydown = ZIL_BUILD.key_down;
	},

    rotate_include_shape: function(dir) {
        if(ZIL_BUILD.include_shape) {

            ZIL_BUILD.rotation += dir;
            if (ZIL_BUILD.rotation >= 4) ZIL_BUILD.rotation -= 4;
            if (ZIL_BUILD.rotation < 0) ZIL_BUILD.rotation += 4;

            ZIL_BUILD._include_shape(ZIL_BUILD.include_shape.category, ZIL_BUILD.include_shape.name, ZIL_BUILD.rotation);

        }
    },

    _include_monster: function(monster_key) {
        console.log("Including monster: " + MONSTERS[monster_key].name);
        ZIL_BUILD.include_monster = MONSTERS[monster_key];
        ZIL_BUILD._include_shape(ZIL_BUILD.include_monster.category, ZIL_BUILD.include_monster.shape, 0);
    },

    _include_shape: function(category, shape_name, rotation) {
        // make sure it's not the current shape
        if(!(category == $("#category").val() && shape_name == $("#name").val())) {
            // remove the old cursor shape
            if(ZIL_BUILD.include_shape_obj != null) {
                ZIL_BUILD.obj.remove(ZIL_BUILD.include_shape_obj);
            }

            // load this shape and add it to the cursor
            ZIL_BUILD.include_shape = ZilShape.load_shape(category, shape_name, rotation);
//                console.log("Including shape: ", ZIL_BUILD.include_shape);
            ZIL_BUILD.include_shape_obj = ZIL_BUILD.include_shape.render_shape();
            ZIL_BUILD.obj.add(ZIL_BUILD.include_shape_obj);
            $("#include_message").fadeIn();
        }
    },

	add_category: function(cat_name) {
		var option = "<option>" + cat_name + "</option>";
		$("#category_names").append(option);
		$("#shape_chooser .group .category_selector").append(option);
	},

	load_last_shape: function() {
		// load the current shape name
		var name = ZIL_UTIL.last_shape_name;
		var s = name.split(".");
		var category_name = s[0];
		var shape_name = s[1];
		ZIL_BUILD.load_shape(category_name, shape_name);

        var shortcuts = ZIL_UTIL.shortcuts;
        if(shortcuts) {
            for (var i = 0; shortcuts && i < shortcuts.length; i++) {
                var s = shortcuts[i].split(".");
                if (s[1] && s[1] != "null") {
                    var el = $("#shape_chooser .group").eq(i);
                    ZIL_BUILD.shortcut_shape[i] = s[1];
                    $(".category_selector", el).val(s[0]); // this will select the shape
                    ZIL_BUILD.load_shape_names(s[0], $(".shape_selector", el));
                }
            }
        }
	},

	load_shape_names: function(category_name, el) {
		// load the shape names
		var shape_names = ZIL_UTIL.get_shapes(category_name);
		if(el == null) el = $("#shape_names");
		el.empty();
		for(var i = 0; i < shape_names.length; i++) {
			el.append("<option>" + shape_names[i] + "</option>")
		}

		// select the one being edited
        if(el.attr("id") == "shape_names") {
            $("option:contains('" + $("#name").val() + "')", el).attr("selected", "selected");
        } else {
            var index = el.closest(".group").index();
            if (ZIL_BUILD.shortcut_shape[index]) {
                $("option:contains('" + ZIL_BUILD.shortcut_shape[index] + "')", el).attr("selected", "selected");
                ZIL_BUILD.shortcut_shape[index] = null;
            }
        }
    },

	save_shape: function() {
		var category_name = $("#category").val();
		var shape_name = $("#name").val();

		// save the shape
		ZIL_BUILD.shape.category = category_name;
		ZIL_BUILD.shape.name = shape_name;
		ZIL_BUILD.shape.save_shape();

		// add/select the category
		if($("#category_names option:contains('" + category_name + "')").length == 0) {
			ZIL_BUILD.add_category(category_name);
		}

		// select the category (this will also select the shape)
		$("#category_names option:contains('" + category_name + "')").eq(0).attr("selected", "selected");
		ZIL_BUILD.load_shape_names(category_name);

		// update the last edited shape name
        ZIL_UTIL.last_shape_name = category_name + "." + shape_name;
        ZIL_UTIL.save_config();
	},

	load_shape: function(category_name, shape_name) {
		$("#category").val(category_name);
		$("#name").val(shape_name);
        $("#category_names option:contains('" + category_name + "')").attr("selected", "selected");
        ZIL_BUILD.load_shape_names(category_name);

        ZilShape.reset_cache();
		ZIL_BUILD.shape = ZilShape.load_shape(category_name, shape_name);
        ZIL_BUILD.redraw_shape();
        ZIL_BUILD.render();
	},

	render: function() {
		var now = Date.now();
		var dx = now - ZIL_BUILD.last_time;
		ZIL_BUILD.last_time = now;

		ZIL_BUILD.move_cursor(now);

		ZIL_BUILD.renderer.render(ZIL_BUILD.scene, ZIL_BUILD.camera);

        // draw fps
		ZIL_BUILD.fps_counter++;
		if(ZIL_BUILD.fps_counter >= 25) {
			var fps = ZIL_BUILD.fps_counter / (now - ZIL_BUILD.fps_start) * 1000;
			$("#fps").html(fps.toFixed(2));
			ZIL_BUILD.fps_counter = 0;
			ZIL_BUILD.fps_start = now;
		}
//		requestAnimationFrame(ZIL_BUILD.render);
		setTimeout(ZIL_BUILD.render, 50); // reduce fan noise
	}	
}