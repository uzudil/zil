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
    move_to_index: 0,
    move_to: null,
    last_time: 0,
    player_move_time: 0,

	mouse_move: function(event) {
        // regular mouse movement
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
        }
	},

    mouse_up: function(event) {
        var point = ZIL.mouse_to_world(event);
        if(point) {
            ZIL.move_to_index = 0;
            var start_point = [ZIL.player.x, ZIL.player.y, ZIL.player.z - 1];

            var ex = Math.round(ZIL.global_pos[0] + point.x);
            var ey = Math.round(ZIL.global_pos[1] + point.y);
            var end_point = [ex, ey, ZIL.shape.get_highest_empty_space(ex, ey, ZIL.player.shape) - 1];
//            console.log("* will move to: ", end_point);
            var t = Date.now();
            ZIL.move_to = ZIL.shape.astar_search(start_point, end_point);
//            console.log("\tpath: ", ZIL.move_to);
//            console.log("\ttime:" + (Date.now() - t));
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

        // move the cursor
        if(event.which == 37) { // W
            ZIL.global_pos[0] += 1;
            ZIL.redraw_shape();
        } else if(event.which == 39) { // E
            ZIL.global_pos[0] -= 1;
            ZIL.redraw_shape();
        } else if(event.which == 38) { // N
            ZIL.global_pos[1] -= 1;
            ZIL.redraw_shape();
        } else if(event.which == 40) { // S
            ZIL.global_pos[1] += 1;
            ZIL.redraw_shape();
        } else if(event.which == 32) {
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

    // dx: millis since last render
	game_step: function(dx) {
        // cursor move
        ZIL.cursor[0] += ZIL.move[0];
        ZIL.cursor[1] += ZIL.move[1];
        ZIL.cursor[2] += ZIL.move[2];
        ZIL.move = [0, 0, 0];
        ZIL.obj.position.set(ZIL.cursor[0], ZIL.cursor[1], ZIL.cursor[2]);
        ZIL.show_cursor_pos();

        if(ZIL.move_to) {
            ZIL.player_move_time += dx;
            if(ZIL.player_move_time > 100) {
                ZIL.player_move_time = 0;

                var node = ZIL.move_to[ZIL.move_to_index];
//                console.log("Step " + ZIL.move_to_index + "/" + ZIL.move_to.length + ": " + node);
                ZIL.player.move_to(ZIL.shape, node.x, node.y, node.z + 1);
                ZIL.redraw_shape();

                ZIL.move_to_index++;
                if(ZIL.move_to_index >= ZIL.move_to.length) {
                    ZIL.move_to_index = 0;
                    ZIL.move_to = null;
                }
            }
        }
	},

	redraw_shape: function() {
		ZIL.shape.render_shape(ZIL.rendered_shape, ZIL.global_pos);
		$("#chunks_info").html("shown: " + Object.keys(ZIL.shape.chunks_on_screen).length +
			" in memory: " + Object.keys(ZIL.shape.chunks_in_memory).length);
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

        ZIL.load_shape("maps", "first");
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
		ZIL.shape = ZilShape.load_shape(category_name, shape_name);
        ZIL.shape.build_shape(ZIL_UTIL.update_progress, function() {

            var start_x = 14;
            var start_y = 54;
            ZIL.global_pos = [ start_x - ZIL_UTIL.VIEW_WIDTH / 2, start_y - ZIL_UTIL.VIEW_HEIGHT / 2, 0 ];

            ZIL.player = new Player(start_x, start_y);
            ZIL.player.move(ZIL.shape);

            ZIL.redraw_shape();
		    ZIL.render();
        });
	},

	render: function() {
		var now = Date.now();
        var dx = now - ZIL.last_time;
        ZIL.last_time = now;

		ZIL.game_step(dx);

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
