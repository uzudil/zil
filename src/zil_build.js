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
	dragging: false,
	last_mouse_x: null,
	last_mouse_y: null,
	zoom: 1,
	mouse_dir_lock: false,
	last_point: { x: 0, y: 0 },

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

		ZIL_BUILD.camera.left = -ZIL_UTIL.VIEW_WIDTH * ZIL_BUILD.zoom;
		ZIL_BUILD.camera.right = ZIL_UTIL.VIEW_WIDTH * ZIL_BUILD.zoom;
		ZIL_BUILD.camera.top = ZIL_UTIL.VIEW_HEIGHT * ZIL_BUILD.zoom;
		ZIL_BUILD.camera.bottom = -ZIL_UTIL.VIEW_HEIGHT * ZIL_BUILD.zoom;
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
			ZIL_BUILD.last_point.x = event.ctrlKey ? point.x : 0;
			ZIL_BUILD.last_point.y = event.ctrlKey ? point.y : 0;

			ZIL_BUILD.obj.position.set(ZIL_BUILD.cursor[0], ZIL_BUILD.cursor[1], ZIL_BUILD.cursor[2]);
			ZIL_BUILD.xy.position.z = -ZIL_BUILD.obj.position.z - 0.5;
			ZIL_BUILD.yz.position.x = -ZIL_BUILD.obj.position.x - 0.5;
			ZIL_BUILD.xz.position.y = -ZIL_BUILD.obj.position.y - 0.5;
			ZIL_BUILD.show_cursor_pos();

			ZIL_BUILD.check_mouse(event);
		}
	},

	mouse_to_world: function(event) {
		var mousex = (( (event.clientX - ZIL_BUILD.offset_x) / ZIL_BUILD.canvas_size ) * 2 - 1);
		var mousey = (-( (event.clientY - ZIL_BUILD.offset_y) / ZIL_BUILD.canvas_size ) * 2 + 1);
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

	mouse_drag: function(event) {
		if(event.currentTarget == document.body && ZIL_BUILD.dragging) {
			if(ZIL_BUILD.last_mouse_x == null) {
				ZIL_BUILD.last_mouse_x = event.x;
				ZIL_BUILD.last_mouse_y = event.y;
			}
			var dx = event.x - ZIL_BUILD.last_mouse_x;
			var dy = event.y - ZIL_BUILD.last_mouse_y;
			
			ZIL_BUILD.world.rotation.z += dx / 100.0;

			ZIL_BUILD.last_mouse_x = event.x;
			ZIL_BUILD.last_mouse_y = event.y;
		}
		return true;
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
		if(event.which == 2 && event.currentTarget == document.body) {
			ZIL_BUILD.dragging = true;
		} else {
			ZIL_BUILD.check_mouse(event);
		}
	},

	mouse_up: function(event) {
		if(event.currentTarget == document.body) {
			ZIL_BUILD.dragging = false;
			ZIL_BUILD.world.rotation.x = ZIL_BUILD.world.rotation.y = ZIL_BUILD.world.rotation.z = 0;
			ZIL_BUILD.last_mouse_x = ZIL_BUILD.last_mouse_y = null;
		}
	},

	key_down: function(event) {
		// console.log(event.which);

		if(ZIL_BUILD.move_timer == 0) {

			// move the cursor
			if(event.which == 37) { // W
				if(ZIL_BUILD.global_pos[0] < ZIL_UTIL.WIDTH - ZIL_UTIL.VIEW_WIDTH) {
					ZIL_BUILD.global_pos[0]++;
					ZIL_BUILD.redraw_shape();
				}
			} else if(event.which == 39) { // E
				if(ZIL_BUILD.global_pos[0] > 0) { 
					ZIL_BUILD.global_pos[0]--;
					ZIL_BUILD.redraw_shape();
				}
				
			} else if(event.which == 38) { // N
				if(ZIL_BUILD.global_pos[1] > 0) { 
					ZIL_BUILD.global_pos[1]--;
					ZIL_BUILD.redraw_shape();
				}
			} else if(event.which == 40) { // S
				if(ZIL_BUILD.global_pos[1] < ZIL_UTIL.HEIGHT - ZIL_UTIL.VIEW_HEIGHT) {
					ZIL_BUILD.global_pos[1]++;
					ZIL_BUILD.redraw_shape();
				}
			} else if(event.which == 88 && ZIL_BUILD.cursor[2] > 0) { // <,
				ZIL_BUILD.move_timer = Date.now();
				ZIL_BUILD.move = [0, 0, -1];
			} else if(event.which == 90 && ZIL_BUILD.cursor[2] < ZIL_UTIL.VIEW_DEPTH - 1) { // >.
				ZIL_BUILD.move_timer = Date.now();
				ZIL_BUILD.move = [0, 0, 1];
			}
		}

		if(event.which == 32) {
			ZIL_BUILD.set_position();
		} else if(event.which == 27) {
			if(ZIL_BUILD.include_shape) {
				// detach from cursor
				ZIL_BUILD.obj.remove(ZIL_BUILD.include_shape_obj);
				ZIL_BUILD.include_shape_obj = null;
				ZIL_BUILD.include_shape = null;
				$("#include_message").fadeOut();
			}
		} else if(event.which == 36) {
			ZIL_BUILD.global_pos[0] = ZIL_BUILD.global_pos[1] = 0;
			ZIL_BUILD.redraw_shape();
		} else if(event.which == 35) {
			ZIL_BUILD.global_pos[0] = ZIL_UTIL.WIDTH - ZIL_UTIL.VIEW_WIDTH;
			ZIL_BUILD.global_pos[1] = ZIL_UTIL.HEIGHT - ZIL_UTIL.VIEW_HEIGHT;
			ZIL_BUILD.redraw_shape();
		}

		$("#global_pos").empty().html(ZIL_BUILD.global_pos.join(",") + "-" + [
			ZIL_BUILD.global_pos[0] + ZIL_UTIL.VIEW_WIDTH, 
			ZIL_BUILD.global_pos[1] + ZIL_UTIL.VIEW_HEIGHT, 
			ZIL_BUILD.global_pos[2] + ZIL_UTIL.VIEW_DEPTH].join(","));
		ZIL_BUILD.show_cursor_pos();
		return true;
	},

	show_cursor_pos: function() {
		$("#cursor_pos").empty().html([
			ZIL_BUILD.cursor[0] + ZIL_BUILD.global_pos[0], 
			ZIL_BUILD.cursor[1] + ZIL_BUILD.global_pos[1], 
			ZIL_BUILD.cursor[2] + ZIL_BUILD.global_pos[2]].join(","));
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

	set_position: function(force) {
		console.log("force=" + force + " include=" + ZIL_BUILD.include_shape);
		var x = ZIL_BUILD.global_pos[0] + ZIL_BUILD.cursor[0];
		var y = ZIL_BUILD.global_pos[1] + ZIL_BUILD.cursor[1];
		var z = ZIL_BUILD.global_pos[2] + ZIL_BUILD.cursor[2];
		if(ZIL_BUILD.include_shape) {
			ZIL_BUILD.shape.set_shape(x, y, z, ZIL_BUILD.include_shape);
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
				ZIL_BUILD.shape.del_position(x, y, z);
			}
		}
		ZIL_BUILD.save_shape();
		ZIL_BUILD.redraw_shape();
	},

	redraw_shape: function() {
		ZIL_BUILD.shape.render_shape(ZIL_BUILD.rendered_shape, ZIL_BUILD.global_pos);
	},

	start_builder: function() {
		ZIL_BUILD.scene = new THREE.Scene();
		ZIL_BUILD.renderer = new THREE.WebGLRenderer();
		ZIL_BUILD.init_camera();

		var size = Math.min(window.innerWidth, window.innerHeight);
		ZIL_BUILD.renderer.setSize( size, size );
		ZIL_BUILD.canvas_size = size;
		document.body.appendChild( ZIL_BUILD.renderer.domElement );
		ZIL_BUILD.offset_x = ($("body").width() - size) / 2;
		ZIL_BUILD.offset_y = ($("body").height() - size) / 2;

		ZIL_BUILD.init_dom();
		ZIL_BUILD.load_last_shape();		

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
		
		ZIL_BUILD.redraw_shape();
		
		ZIL_BUILD.render();
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
			-ZIL_UTIL.VIEW_WIDTH, ZIL_UTIL.VIEW_WIDTH, 
			ZIL_UTIL.VIEW_HEIGHT, -ZIL_UTIL.VIEW_HEIGHT, 
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
		// colors
		for(var i = 0; i < ZIL_UTIL.palette.length; i++) {
			var s = "#" + ZIL_UTIL.palette[i].toString(16);
			$("#color").append("<option value='" + ZIL_UTIL.palette[i] + "'>" + s + "</option>");
			$("#color option[value='" + ZIL_UTIL.palette[i] + "']").css("color", s);
			$("#color option[value='" + ZIL_UTIL.palette[i] + "']:checked").css("color", s);
		}
		$("#color").change(function(event) {
			var palette_index = $("#color option:selected").index();
			var s = $("#color option:selected").text();
			$("#sample").css("background", s);
			$("#color").blur();
			return true;
		});
		$("#color option").eq(0).attr("selected", "selected").change();

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
		var cat_names = JSON.parse(window.localStorage["cat_names"] || "[\"default\"]");
		for(var i = 0; i < cat_names.length; i++) {
			$("#category_names").append("<option>" + cat_names[i] + "</option>");
		}
		$("#category_names").change(function(e) {
			var category_name = $("#category_names").val();
			ZIL_BUILD.load_shape_names(category_name);
		});

		// event handlers
		$("#load_shape").click(function(event) {
			var category_name = $("#category_names").val();
			var shape_name = $("#shape_names").val();
			ZIL_BUILD.load_shape(category_name, shape_name);
			$("#shape_names").blur();
			return false;
		});
		$("#clear").click(function(event) {
			if(confirm("Are you sure?")) {
				ZIL_BUILD.shape.clear_shape();
				ZIL_BUILD.redraw_shape();
				ZIL_BUILD.save_shape();
				$("#clear").blur();
			}
			return false;
		});
		$("#delete").click(function(event) {
			var n = $("#shape_names option:selected").index();
			var name = $("#shape_names option").eq(n).text() ? n >= 0 : "";
			if(n >= 0 && confirm("Delete shape \"" + name + "\"?")) {
				$("#shape_names option").eq(n).remove();
				var names = $.map($("#shape_names option"), function(e) { return $(e).text(); });
				window.localStorage["shape_names"] = JSON.stringify(names);
				delete window.localStorage[name];
				$("#delete").blur();
			}
			return false;
		});
		$("#include").click(function(event) {
			var category = $("#category_names").val();
			var shape_name = $("#shape_names").val();
			// make sure it's not the current shape 
			if(!(category == $("#category").val() && shape_name == $("#name").val())) {
				// remove the old cursor shape
				if(ZIL_BUILD.include_shape_obj != null) {
					ZIL_BUILD.obj.remove(ZIL_BUILD.include_shape_obj);
				}

				// load this shape and add it to the cursor
				ZIL_BUILD.include_shape = ZilShape.load_shape(category, shape_name);
				ZIL_BUILD.include_shape_obj = ZIL_BUILD.include_shape.render_shape();
				ZIL_BUILD.obj.add(ZIL_BUILD.include_shape_obj);

				// reset the ui
				$("#category_names").val($("#category").val());
				$("#shape_names").val($("#name").val());
				$("#include").blur();
				$("#include_message").fadeIn();
			}
			return false;
		});

		$("#width,#height,#depth").keyup(function (e) {
			if (e.keyCode == 13) {
				ZIL_UTIL.WIDTH = parseInt($("#width").val(), 10);
				ZIL_UTIL.HEIGHT = parseInt($("#height").val(), 10);
				ZIL_UTIL.DEPTH = parseInt($("#depth").val(), 10);
				ZIL_BUILD.save_shape();
				
				ZIL_BUILD.init_coords();
				ZIL_BUILD.init_camera();

				return false;	
			}
			return true;
		});
		document.body.onkeydown = ZIL_BUILD.key_down;
		$("canvas").mousemove(ZIL_BUILD.mouse_move);
		document.body.onmousemove = ZIL_BUILD.mouse_drag;
		document.body.onmousedown = ZIL_BUILD.mouse_down;
		document.body.onmouseup = ZIL_BUILD.mouse_up;
		document.body.oncontextmenu = function() { return false; };
		$('canvas').bind('mousewheel', ZIL_BUILD.mouse_zoom);
	},

	load_last_shape: function() {
		// load the current shape name
		var name = JSON.parse(window.localStorage["shape_name"] || "\"default.default\"");
		var s = name.split(".");
		var category_name = s[0];
		var shape_name = s[1];
		ZIL_BUILD.load_shape(category_name, shape_name);
	},

	load_shape_names: function(category_name) {
		// load the shape names
		var shape_names = JSON.parse(window.localStorage[category_name + "_shape_names"] || "[\"default\"]");
		$("#shape_names").empty();
		for(var i = 0; i < shape_names.length; i++) {
			$("#shape_names").append("<option>" + shape_names[i] + "</option>");
		}

		// select the one being edited
		$("#shape_names option:contains('" + $("#name").val() + "')").attr("selected", "selected");
	},

	save_shape: function() {
		var category_name = $("#category").val();
		var shape_name = $("#name").val();

		// save the shape
		ZIL_BUILD.shape.category = category_name;
		ZIL_BUILD.shape.name = shape_name;
		ZIL_BUILD.shape.save_shape();

		// save the shape's name into the category
		var category_shape_names = JSON.parse(window.localStorage[category_name + "_shape_names"] || "[\"default\"]");
		if(category_shape_names.indexOf(shape_name) < 0) {
			category_shape_names.push(shape_name);
			window.localStorage[category_name + "_shape_names"] = JSON.stringify(category_shape_names);
		}

		// add/select the category
		if($("#category_names option:contains('" + category_name + "')").length == 0) {
			$("#category_names").append("<option>" + category_name + "</option>");
			var names = $.map($("#category_names option"), function(e) { return $(e).text(); });
			window.localStorage["cat_names"] = JSON.stringify(names);
		}

		// select the category (this will also select the shape)
		$("#category_names option:contains('" + category_name + "')").eq(0).attr("selected", "selected");
		ZIL_BUILD.load_shape_names(category_name);

		// update the last edited shape name
		window.localStorage["shape_name"] = JSON.stringify(category_name + "." + shape_name);
	},

	load_shape: function(category_name, shape_name) {
		$("#category").val(category_name);
		$("#name").val(shape_name);
		ZIL_BUILD.shape = ZilShape.load_shape(category_name, shape_name, true);

		ZIL_UTIL.WIDTH = ZIL_BUILD.shape.width;
		ZIL_UTIL.HEIGHT = ZIL_BUILD.shape.height;
		ZIL_UTIL.DEPTH = ZIL_BUILD.shape.depth;
		$("#width").val(ZIL_UTIL.WIDTH);
		$("#height").val(ZIL_UTIL.HEIGHT);
		$("#depth").val(ZIL_UTIL.DEPTH);

		$("#category_names option:contains('" + category_name + "')").attr("selected", "selected");
		ZIL_BUILD.load_shape_names(category_name);

		if(ZIL_BUILD.rendered_shape) {
			ZIL_BUILD.init_coords();
			ZIL_BUILD.init_camera();
			ZIL_BUILD.redraw_shape();		
		}
	},

	render: function() {
		var now = Date.now();
		var dx = now - ZIL_BUILD.last_time;
		if(dx > 50) { // reduce fan noise
			ZIL_BUILD.last_time = now;

			ZIL_BUILD.move_cursor(now);

			ZIL_BUILD.renderer.render(ZIL_BUILD.scene, ZIL_BUILD.camera);
		}
		requestAnimationFrame(ZIL_BUILD.render); 
	}	
}