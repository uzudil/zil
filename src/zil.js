var ZIL = {

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
	editing: false,
	fps_counter: 0,
	fps_start: Date.now(),
    shortcut_shape: [ null, null, null, null, null, null, null, null, null, null ],
    rotation: 0,
	XY_PLANE: new THREE.Plane(new THREE.Vector3(0, 0, 1), 1),

	mouse_move: function(event) {
        // regular mouse movement
        var point = ZIL.mouse_to_world(event);
        if(point) {
            ZIL.cursor[0] = Math.round(point.x);
            ZIL.cursor[1] = Math.round(point.y);

            // find the highest location here
            ZIL.cursor[2] = ZIL.shape.get_highest_empty_space(
                    ZIL.global_pos[0] + ZIL.cursor[0],
                    ZIL.global_pos[1] + ZIL.cursor[1],
                    ZIL.include_shape);

            ZIL.last_point.x = event.ctrlKey ? point.x : 0;
            ZIL.last_point.y = event.ctrlKey ? point.y : 0;

            ZIL.obj.position.set(ZIL.cursor[0], ZIL.cursor[1], ZIL.cursor[2]);
            ZIL.show_cursor_pos();
        }
	},

	mouse_to_world: function(event) {
		var mousex = (( (event.offsetX - ZIL.offset_x) / ZIL.canvas_size ) * 2 - 1);
		var mousey = (-( (event.offsetY - ZIL.offset_y) / ZIL.canvas_size ) * 2 + 1);
		// console.log("" + mousex + "," + mousey);
		var vector = new THREE.Vector3( mousex, mousey, 1 );
		var ray_caster = ZIL.projector.pickingRay(vector, ZIL.camera);
		var intersection = ray_caster.ray.intersectPlane(ZIL.XY_PLANE);
		if(intersection) {
			if(intersection.x < 0) intersection.x = 0;
			if(intersection.x >= ZIL_UTIL.VIEW_WIDTH) intersection.x = ZIL_UTIL.VIEW_WIDTH - 1;
			if(intersection.y < 0) intersection.y = 0;
			if(intersection.y >= ZIL_UTIL.VIEW_HEIGHT) intersection.y = ZIL_UTIL.VIEW_HEIGHT - 1;
		}
		return intersection;
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
		if(ZIL.move_timer == 0 && !event.ctrlKey) {

			// move the cursor
			if(event.which == 37) { // W
				if(ZIL.global_pos[0] < ZIL_UTIL.WIDTH - ZIL_UTIL.VIEW_WIDTH - 1) {
					ZIL.global_pos[0] += 1;
					ZIL.redraw_shape();
				}
			} else if(event.which == 39) { // E
				if(ZIL.global_pos[0] > 0) {
					ZIL.global_pos[0] -= 1;
					ZIL.redraw_shape();
				}

			} else if(event.which == 38) { // N
				if(ZIL.global_pos[1] > 0) {
					ZIL.global_pos[1] -= 1;
					ZIL.redraw_shape();
				}
			} else if(event.which == 40) { // S
				if(ZIL.global_pos[1] < ZIL_UTIL.HEIGHT - 1) {
					ZIL.global_pos[1] += 1;
					ZIL.redraw_shape();
				}
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

	move_cursor: function(now) {
		if(ZIL.move_timer > 0) {
			var md = now - ZIL.move_timer;
			if(md >= ZIL.MOVE_SPEED) {
				ZIL.move_timer = 0;
				ZIL.cursor[0] += ZIL.move[0];
				ZIL.cursor[1] += ZIL.move[1];
				ZIL.cursor[2] += ZIL.move[2];
				ZIL.move = [0, 0, 0];
				ZIL.obj.position.set(ZIL.cursor[0], ZIL.cursor[1], ZIL.cursor[2]);
				ZIL.show_cursor_pos();
			} else {
				ZIL.obj.position.set(
					ZIL.cursor[0] + ZIL.move[0] * (md / ZIL.MOVE_SPEED),
					ZIL.cursor[1] + ZIL.move[1] * (md / ZIL.MOVE_SPEED),
					ZIL.cursor[2] + ZIL.move[2] * (md / ZIL.MOVE_SPEED));
			}
			ZIL.xy.position.z = -ZIL.obj.position.z - 0.5;
			ZIL.yz.position.x = -ZIL.obj.position.x - 0.5;
			ZIL.xz.position.y = -ZIL.obj.position.y - 0.5;
		}
	},

	redraw_shape: function() {
		ZIL.shape.render_shape(ZIL.rendered_shape, ZIL.global_pos);
		$("#chunks_info").html("shown: " + Object.keys(ZIL.shape.chunks_on_screen).length +
			" in memory: " + Object.keys(ZIL.shape.chunks_in_memory).length);
	},

	start_game: function() {
		ZIL.scene = new THREE.Scene();
		ZIL.renderer = new THREE.WebGLRenderer({ canvas: $("#view")[0] });
		ZIL.init_camera();

		var size = Math.min(window.innerWidth, window.innerHeight);
		ZIL.renderer.setSize( size, size );
		ZIL.canvas_size = size;
		document.body.appendChild( ZIL.renderer.domElement );
		ZIL.offset_x = 0;
		ZIL.offset_y = 0;

		ZIL.init_dom();
		ZIL.load_shape("maps", "first");

		ZIL.world = new THREE.Object3D();
		ZIL.world.position.set(ZIL_UTIL.VIEW_WIDTH / 2, ZIL_UTIL.VIEW_HEIGHT / 2, 0);
		ZIL.world.scale.z = 2;
		ZIL.scene.add( ZIL.world );

		ZIL.inner = new THREE.Object3D();
		ZIL.inner.position.x = -ZIL_UTIL.VIEW_WIDTH / 2;
		ZIL.inner.position.y = -ZIL_UTIL.VIEW_HEIGHT / 2;
		ZIL.world.add( ZIL.inner );

		ZIL.rendered_shape = new THREE.Object3D();
		ZIL.inner.add( ZIL.rendered_shape );

		ZIL.obj = new THREE.Object3D();
		ZIL.inner.add( ZIL.obj );
		ZIL.init_cursor();

		ZIL.init_light();

		ZIL.redraw_shape();

		ZIL.render();
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
		ZIL.camera.position.set(
			ZIL_UTIL.VIEW_WIDTH,
			ZIL_UTIL.VIEW_HEIGHT,
			Math.max(ZIL_UTIL.VIEW_WIDTH, ZIL_UTIL.VIEW_HEIGHT));
		ZIL.camera.up = new THREE.Vector3(0,0,1);
		ZIL.camera.lookAt(new THREE.Vector3(ZIL_UTIL.VIEW_WIDTH / 4, ZIL_UTIL.VIEW_HEIGHT / 4, 0));
		ZIL.projector = new THREE.Projector();
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
			bind("mousedown", ZIL.mouse_down).
			bind("mouseup", ZIL.mouse_up).
			bind('mousewheel', ZIL.mouse_zoom);
		document.body.oncontextmenu = function() { return false; };
		document.body.onkeydown = ZIL.key_down;
	},

	load_shape: function(category_name, shape_name) {
        ZilShape.reset_cache();
		ZIL.shape = ZilShape.load_shape(category_name, shape_name);
		if(ZIL.rendered_shape) ZIL.redraw_shape();
	},

	render: function() {
		var now = Date.now();
		var dx = now - ZIL.last_time;
		ZIL.last_time = now;

		ZIL.move_cursor(now);

		ZIL.renderer.render(ZIL.scene, ZIL.camera);

        // draw fps
		ZIL.fps_counter++;
		if(ZIL.fps_counter >= 25) {
			var fps = ZIL.fps_counter / (now - ZIL.fps_start) * 1000;
			$("#fps").html(fps.toFixed(2));
			ZIL.fps_counter = 0;
			ZIL.fps_start = now;
		}
		requestAnimationFrame(ZIL.render);
//		setTimeout(ZIL.render, 50); // reduce fan noise
	}
};
