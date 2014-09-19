var ZIL_BUILD = {

	scene: null,
	camera: null,
	renderer: null,
	M: 1.3,
	DIR: 0.005,
	cubes: [],
	WIDTH: 20,
	HEIGHT: 20,
	DEPTH: 20,
	PI: 3.14159,
	rotate_dir: 0,
	last_time: 0,
	move: [0, 0, 0],
	cursor: [0, 0, 0],
	move_timer: 0,
	MOVE_SPEED: 25,
	global_pos: [0, 0, 0],
	// colors from: http://timtrott.co.uk/web-20-color-palette/
	palette: [
		0xB02B2C, 
		0xD15600, 
		0xC79810, 
		0x73880A, 
		0x6BBA70, 
		0x3F4C6B, 
		0x356AA0, 
		0xD01F3C
	],
	include_shape: null,
	include_shape_obj: null,

	key_down: function(event) {
		 // console.log(event.which);
		// if(event.which == 83) {
		// 	ZIL_BUILD.rotate_dir = 1;
		// 	ZIL_BUILD.rotate_angle = Math.round(ZIL_BUILD.obj.rotation.y / (ZIL_BUILD.PI / 2) + 1) * (ZIL_BUILD.PI / 2);
		// } else if(event.which == 65) {
		// 	ZIL_BUILD.rotate_dir = -1;
		// 	ZIL_BUILD.rotate_angle = Math.round(ZIL_BUILD.obj.rotation.y / (ZIL_BUILD.PI / 2) - 1) * (ZIL_BUILD.PI / 2);
		// }
		if(ZIL_BUILD.move_timer == 0) {
			if(event.which == 37) { // W
				ZIL_BUILD.move_timer = Date.now();
				ZIL_BUILD.move = [1, 0, 0];
			} else if(event.which == 39 && ZIL_BUILD.cursor[0] > 0) { // E
				ZIL_BUILD.move_timer = Date.now();
				ZIL_BUILD.move = [-1, 0, 0];
			} else if(event.which == 38 && ZIL_BUILD.cursor[1] > 0) { // N
				ZIL_BUILD.move_timer = Date.now();
				ZIL_BUILD.move = [0, -1, 0];
			} else if(event.which == 40) { // S
				ZIL_BUILD.move_timer = Date.now();
				ZIL_BUILD.move = [0, 1, 0];
			} else if(event.which == 88 && ZIL_BUILD.cursor[2] > 0) { // <,
				ZIL_BUILD.move_timer = Date.now();
				ZIL_BUILD.move = [0, 0, -1];
			} else if(event.which == 90) { // >.
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
		}
		return true;
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
				// console.log(ZIL_BUILD.cursor);
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

	set_position: function() {
		
		if(ZIL_BUILD.include_shape) {
			// include embedded shapes
			for(var pos in ZIL_BUILD.include_shape.shape) {
				var s = pos.split(",");
				var x = parseInt(s[0], 10);
				var y = parseInt(s[1], 10);
				var z = parseInt(s[2], 10);
				var key = [ZIL_BUILD.cursor[0] + x, ZIL_BUILD.cursor[1] + y, ZIL_BUILD.cursor[2] + z].join(",");
				ZIL_BUILD.shape[key] = ZIL_BUILD.include_shape.shape[pos];
			}
		} else {
			var key = ZIL_BUILD.cursor.join(",");
			if(ZIL_BUILD.shape[key] != null) {
				delete ZIL_BUILD.shape[key];
			} else {
				ZIL_BUILD.shape[key] = $("#color option:selected").index();
			}
		}
		ZIL_BUILD.save_shape();
		ZIL_BUILD.redraw_shape();
	},

	clear_node: function(node) {
		while(node.children.length != 0) {
			node.remove(node.children[0]);
		}
	},

	redraw_shape: function() {
		ZIL_BUILD.render_shape(
			ZIL_BUILD.shape,
			ZIL_BUILD.WIDTH, ZIL_BUILD.HEIGHT, ZIL_BUILD.DEPTH,
			ZIL_BUILD.rendered_shape, 			
			ZIL_BUILD.global_pos
		);
	},

	render_shape: function(shape, w, h, d, parent_shape, position_offset) {
		if(position_offset == null) position_offset = [0, 0, 0];
		if(parent_shape == null) parent_shape = new THREE.Object3D();
		ZIL_BUILD.clear_node(parent_shape);
		var geometry = new THREE.BoxGeometry(1, 1, 1);
		for(var x = -w; x < w; x++) {
			for(var y = -h; y < h; y++) {
				for(var z = -d; z < d; z++) {
					var global_position = [position_offset[0] + x, position_offset[1] + y, position_offset[2] + z];
					var key = global_position.join(",");
					if(shape[key] != null) {
						var value = shape[key];
						var material = new THREE.MeshLambertMaterial( {color: ZIL_BUILD.palette[value], side: THREE.DoubleSide } );
						var child_shape = new THREE.Mesh( geometry, material );

						// append to parent
						child_shape.position.x = x;
						child_shape.position.y = y;
						child_shape.position.z = z;
						parent_shape.add(child_shape);
					}
				}
			}
		}
		return parent_shape;
	},

	start_builder: function() {
		ZIL_BUILD.init_dom();

		ZIL_BUILD.scene = new THREE.Scene();
		ZIL_BUILD.renderer = new THREE.WebGLRenderer();
		ZIL_BUILD.init_camera();

		ZIL_BUILD.renderer.setSize( window.innerWidth, window.innerHeight );
		document.body.appendChild( ZIL_BUILD.renderer.domElement );

		document.body.onkeydown = ZIL_BUILD.key_down;

		ZIL_BUILD.coord = new THREE.Object3D();
		ZIL_BUILD.scene.add( ZIL_BUILD.coord );
		ZIL_BUILD.init_coords();		

		ZIL_BUILD.rendered_shape = new THREE.Object3D();
		ZIL_BUILD.scene.add( ZIL_BUILD.rendered_shape );

		ZIL_BUILD.obj = new THREE.Object3D();
		ZIL_BUILD.scene.add( ZIL_BUILD.obj );
		
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
		
		var light = new THREE.HemisphereLight( 0xffffff, 0x000000, 0.5 );
		ZIL_BUILD.scene.add( light );
		var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
		directionalLight.position.set( -1, 1, 1 );
		ZIL_BUILD.scene.add( directionalLight );

		ZIL_BUILD.redraw_shape();
		
		ZIL_BUILD.render();
	},

	init_camera: function() {
		ZIL_BUILD.camera = new THREE.OrthographicCamera( 
			-ZIL_BUILD.WIDTH*0.75, ZIL_BUILD.WIDTH*0.75, 
			ZIL_BUILD.HEIGHT*0.5, -ZIL_BUILD.HEIGHT*0.5, 
			-1000, 1000 );
		ZIL_BUILD.camera.position.set(ZIL_BUILD.WIDTH, ZIL_BUILD.HEIGHT * 1.4, ZIL_BUILD.DEPTH * 1.2);
		ZIL_BUILD.camera.up = new THREE.Vector3(0,0,1);
		ZIL_BUILD.camera.lookAt(new THREE.Vector3(0,0,0));
	},

	init_coords: function() {
		ZIL_BUILD.clear_node(ZIL_BUILD.coord);

		// add the x plane
		var geometry = new THREE.PlaneGeometry( ZIL_BUILD.WIDTH, ZIL_BUILD.DEPTH, ZIL_BUILD.WIDTH, ZIL_BUILD.DEPTH );
		var material = new THREE.MeshLambertMaterial( {color: 0x808080, side: THREE.DoubleSide, wireframe: true } );
		var plane = new THREE.Mesh( geometry, material );
		plane.rotation.x = ZIL_BUILD.PI / -2;
		plane.position.y = -0.5;
		plane.position.z = -ZIL_BUILD.DEPTH / -2 - 0.5;
		plane.position.x = -ZIL_BUILD.WIDTH / -2 - 0.5;
		ZIL_BUILD.coord.add( plane );

		// add the y plane
		var geometry = new THREE.PlaneGeometry( ZIL_BUILD.WIDTH, ZIL_BUILD.HEIGHT, ZIL_BUILD.WIDTH, ZIL_BUILD.HEIGHT );
		var material = new THREE.MeshLambertMaterial( {color: 0x80cc80, side: THREE.DoubleSide, wireframe: true } );
		var plane = new THREE.Mesh( geometry, material );
		plane.position.z = -0.5
		plane.position.x = -ZIL_BUILD.WIDTH / -2 - 0.5;
		plane.position.y = -ZIL_BUILD.HEIGHT / -2 - 0.5;
		ZIL_BUILD.coord.add( plane );

		// add the z plane
		var geometry = new THREE.PlaneGeometry( ZIL_BUILD.DEPTH, ZIL_BUILD.HEIGHT, ZIL_BUILD.DEPTH, ZIL_BUILD.HEIGHT );
		var material = new THREE.MeshLambertMaterial( {color: 0x8080cc, side: THREE.DoubleSide, wireframe: true } );
		var plane = new THREE.Mesh( geometry, material );
		plane.rotation.y = ZIL_BUILD.PI / -2;
		plane.position.x = -0.5;
		plane.position.z = ZIL_BUILD.DEPTH/2 -0.5;
		plane.position.y = ZIL_BUILD.HEIGHT/2 -0.5;
		ZIL_BUILD.coord.add( plane );
	},

	init_dom: function() {
		// colors
		for(var i = 0; i < ZIL_BUILD.palette.length; i++) {
			var s = "#" + ZIL_BUILD.palette[i].toString(16);
			$("#color").append("<option value='" + ZIL_BUILD.palette[i] + "'>" + s + "</option>");
			$("#color option[value='" + ZIL_BUILD.palette[i] + "']").css("color", s);
			$("#color option[value='" + ZIL_BUILD.palette[i] + "']:checked").css("color", s);
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
				ZIL_BUILD.shape = {};
				ZIL_BUILD.redraw_shape();
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
				ZIL_BUILD.include_shape = ZIL_BUILD._load_shape_only(category_name, shape_name);
				ZIL_BUILD.include_shape_obj = ZIL_BUILD.render_shape(
					ZIL_BUILD.include_shape.shape, 
					ZIL_BUILD.include_shape.bounds.w, ZIL_BUILD.include_shape.bounds.h, ZIL_BUILD.include_shape.bounds.d);
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
				ZIL_BUILD.WIDTH = parseInt($("#width").val(), 10);
				ZIL_BUILD.HEIGHT = parseInt($("#height").val(), 10);
				ZIL_BUILD.DEPTH = parseInt($("#depth").val(), 10);
				ZIL_BUILD.save_shape();
				
				ZIL_BUILD.init_coords();
				ZIL_BUILD.init_camera();

				return false;	
			}
			return true;
		});

		// load the current shape name
		var name = JSON.parse(window.localStorage["shape_name"] || "\"default.default\"");
		var s = name.split(".");
		var category_name = s[0];
		var shape_name = s[1];
		ZIL_BUILD.load_shape(category_name, shape_name);

	},

	calculate_bounds: function(shape) {
		// find the bounds
		var min_x = null, max_x = null, min_y = null, max_y = null, min_z = null, max_z = null;
		for(var pos in shape.shape) {
			var s = pos.split(",");
			var x = parseInt(s[0], 10);
			var y = parseInt(s[1], 10);
			var z = parseInt(s[2], 10);
			if(min_x == null || x < min_x) min_x = x;
			if(min_y == null || y < min_y) min_y = y;
			if(min_z == null || z < min_z) min_z = z;
			if(max_x == null || x > max_x) max_x = x;
			if(max_y == null || y > max_y) max_y = y;
			if(max_z == null || z > max_z) max_z = z;
		}
		shape.bounds = {
			w: max_x - min_x + 1,
			h: max_y - min_y + 1,
			d: max_z - min_z + 1
		};

		// reposition the shape to the origin
		var new_shape = {};
		for(var pos in shape.shape) {
			var s = pos.split(",");
			var x = parseInt(s[0], 10);
			var y = parseInt(s[1], 10);
			var z = parseInt(s[2], 10);
			new_shape[[x - min_x, y - min_y, z - min_z].join(",")] = shape.shape[pos];
		}
		shape.shape = new_shape;
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
		var obj = {
			width: ZIL_BUILD.WIDTH,
			height: ZIL_BUILD.HEIGHT,
			depth: ZIL_BUILD.DEPTH,
			shape: ZIL_BUILD.shape
		}
		window.localStorage[category_name + "." + shape_name] = JSON.stringify(obj);

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

	_load_shape_only: function(category_name, shape_name, skip_bounds) {
		var name = category_name + "." + shape_name;
		console.log("* Loading shape: " + name);
		var js = window.localStorage[name];
		var shape = js ? JSON.parse(js) : { width: ZIL_BUILD.WIDTH, height: ZIL_BUILD.HEIGHT, depth: ZIL_BUILD.DEPTH, shape: {} };
		shape.name = name;
		if(!skip_bounds) {
			ZIL_BUILD.calculate_bounds(shape);
		}
		return shape;
	},

	load_shape: function(category_name, shape_name) {
		$("#category").val(category_name);
		$("#name").val(shape_name);
		var obj = ZIL_BUILD._load_shape_only(category_name, shape_name, true);
		
		ZIL_BUILD.shape = obj.shape;
		ZIL_BUILD.WIDTH = obj.width;
		ZIL_BUILD.HEIGHT = obj.height;
		ZIL_BUILD.DEPTH = obj.depth;
		$("#width").val(ZIL_BUILD.WIDTH);
		$("#height").val(ZIL_BUILD.HEIGHT);
		$("#depth").val(ZIL_BUILD.DEPTH);

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
		ZIL_BUILD.last_time = now;

		// if(ZIL_BUILD.rotate_dir != 0) {
		// 	if((ZIL_BUILD.rotate_dir == 1 && ZIL_BUILD.obj.rotation.y < ZIL_BUILD.rotate_angle) || 
		// 		(ZIL_BUILD.rotate_dir == -1 && ZIL_BUILD.obj.rotation.y > ZIL_BUILD.rotate_angle)) {
		// 		ZIL_BUILD.obj.rotation.y += ZIL_BUILD.rotate_dir * (dx / 200);
		// 	} else {
		// 		ZIL_BUILD.obj.rotation.y = ZIL_BUILD.rotate_angle;
		// 		ZIL_BUILD.rotate_dir = 0;
		// 	}
		// }
		ZIL_BUILD.move_cursor(now);

		// requestAnimationFrame(ZIL_BUILD.render); // smooth, more fan noise
		setTimeout(ZIL_BUILD.render, 50); // less fan noise
		ZIL_BUILD.renderer.render(ZIL_BUILD.scene, ZIL_BUILD.camera);
	}	
}