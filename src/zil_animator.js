function AnimatedModel(category, name, parts, animations) {
    this.shapes = {};
    this.shape_objs = {};
    this.angles = {};
    this.shape_obj = new THREE.Object3D();
    for(var i = 0; i < parts.length; i++) {
        var width = parts[i].end[0] - parts[i].start[0] + 1;
        var height = parts[i].end[1] - parts[i].start[1] + 1;
        var depth = parts[i].end[2] - parts[i].start[2] + 1;
        var points = {};
        for(var x = parts[i].start[0]; x <= parts[i].end[0]; x++) {
            for(var y = parts[i].start[1]; y <= parts[i].end[1]; y++) {
                for (var z = parts[i].start[2]; z <= parts[i].end[2]; z++) {
                    points[x + "," + y + "," + z] = parts[i].color;
                }
            }
        }
        var s = new ZilShape(category, name + ".part." + parts[i].name,
            points,
            width, height, depth, 0, null, true, null, null);
        var o = s.render_shape();

        // set rotational centers
        if("center" in parts[i]) {
            var geo = o.children[0].geometry;
            geo.applyMatrix(new THREE.Matrix4().makeTranslation(parts[i].center[0], parts[i].center[1], parts[i].center[2]));
            o.position.set(parts[i].start[0] - parts[i].center[0], parts[i].start[1] - parts[i].center[1], parts[i].start[2] - parts[i].center[2]);
        } else {
            o.position.set(parts[i].start[0], parts[i].start[1], parts[i].start[2]);
        }

        this.shapes[parts[i].name] = s;
        this.shape_objs[parts[i].name] = o;
        this.shape_obj.add(o);
    }
    this.animations = animations;
    this.animation_name = null;
    this.animation_index = 0;
    this.animation_time = 0;

    this.paused = false;
}

AnimatedModel.ANIMATION_TIME = 200;

AnimatedModel.prototype.set_animation_name = function(name) {
    this.animation_name = name;
    this.animation_index = 0;
    this.animation_time = 0;
};

AnimatedModel.prototype.render = function(delta_time) {
    if(!this.animation_name || this.paused) return;

    var a = this.animations[this.animation_name][this.animation_index];

    this.animation_time += delta_time;
    if(this.animation_time > AnimatedModel.ANIMATION_TIME) {
        // setup start angles
        for(var shape_name in a) {
            this.angles[shape_name] = {
                "x": ZIL_UTIL.angle_to_radians(a[shape_name]["x"]) || 0,
                "y": ZIL_UTIL.angle_to_radians(a[shape_name]["y"]) || 0,
                "z": ZIL_UTIL.angle_to_radians(a[shape_name]["z"]) || 0
            };
        }

        // advance animation
        this.animation_time = 0;
        this.animation_index++;
        if(this.animation_index >= this.animations[this.animation_name].length) {
            this.animation_index = 0;
        }
        a = this.animations[this.animation_name][this.animation_index];
    }

    // animate
    for(var shape_name in a) {
        if(this.angles[shape_name] == null) this.angles[shape_name] = { x: 0, y: 0, z: 0 };
        var angle, target_angle, start_angle;

        target_angle = ZIL_UTIL.angle_to_radians(a[shape_name]["x"] || 0);
        start_angle = this.angles[shape_name]["x"];
        if(start_angle == null) {
            start_angle = this.shape_objs[shape_name].rotation.x;
            this.angles[shape_name]["x"] = start_angle;
        }

        if(start_angle < target_angle) {
            angle = (target_angle - start_angle) * (this.animation_time / AnimatedModel.ANIMATION_TIME) + start_angle;
            $("#debug .x").text("+++ " + ZIL_UTIL.radians_to_angle(angle).toFixed(2) + " index=" + this.animation_index);
        } else {
            angle = target_angle + (start_angle - target_angle) * (1 - (this.animation_time / AnimatedModel.ANIMATION_TIME));
            $("#debug .x").text("--- " + ZIL_UTIL.radians_to_angle(angle).toFixed(2) + " index=" + this.animation_index);
        }

        this.shape_objs[shape_name].rotation.x = angle;


        target_angle = ZIL_UTIL.angle_to_radians(a[shape_name]["y"] || 0);
        start_angle = this.angles[shape_name]["y"];
        if (start_angle == null) {
            start_angle = this.shape_objs[shape_name].rotation.y;
            this.angles[shape_name]["y"] = start_angle;
        }

        if (start_angle < target_angle) {
            angle = (target_angle - start_angle) * (this.animation_time / AnimatedModel.ANIMATION_TIME) + start_angle;
            $("#debug .y").text("+++ " + ZIL_UTIL.radians_to_angle(angle).toFixed(2) + " index=" + this.animation_index);
        } else {
            angle = target_angle + (start_angle - target_angle) * (1 - (this.animation_time / AnimatedModel.ANIMATION_TIME));
            $("#debug .y").text("--- " + ZIL_UTIL.radians_to_angle(angle).toFixed(2) + " index=" + this.animation_index);
        }

        this.shape_objs[shape_name].rotation.y = angle;


            target_angle = ZIL_UTIL.angle_to_radians(a[shape_name]["z"] || 0);
            start_angle = this.angles[shape_name]["z"];
            if (start_angle == null) {
                start_angle = this.shape_objs[shape_name].rotation.y;
                this.angles[shape_name]["z"] = start_angle;
            }

            if (start_angle < target_angle) {
                angle = (target_angle - start_angle) * (this.animation_time / AnimatedModel.ANIMATION_TIME) + start_angle;
                $("#debug .z").text("+++ " + ZIL_UTIL.radians_to_angle(angle).toFixed(2) + " index=" + this.animation_index);
            } else {
                angle = target_angle + (start_angle - target_angle) * (1 - (this.animation_time / AnimatedModel.ANIMATION_TIME));
                $("#debug .z").text("--- " + ZIL_UTIL.radians_to_angle(angle).toFixed(2) + " index=" + this.animation_index);
            }

            this.shape_objs[shape_name].rotation.z = angle;
    }
};

var Zil_Animator = {

	fps_counter: 0,
	fps_start: Date.now(),
    last_time: 0,
    Z_SCALE: 2,


    start_animator: function() {
        // do this first
        ZIL_UTIL.load_config(640, 480);

        ZIL_UTIL.VIEW_WIDTH = 2 * ZIL_UTIL.CHUNK_SIZE;
        ZIL_UTIL.VIEW_HEIGHT = 2 * ZIL_UTIL.CHUNK_SIZE;

        Zil_Animator.scene = new THREE.Scene();
        Zil_Animator.scene.scale.z = Zil_Animator.Z_SCALE;
        Zil_Animator.renderer = new THREE.WebGLRenderer({ canvas: $("#view")[0] });
        Zil_Animator.init_camera();

        var size = Math.min(window.innerWidth, window.innerHeight);
        Zil_Animator.renderer.setSize(size, size);
        Zil_Animator.canvas_size = size;
        document.body.appendChild(Zil_Animator.renderer.domElement);
        Zil_Animator.offset_x = 0;
        Zil_Animator.offset_y = 0;

        Zil_Animator.init_light();

        Zil_Animator.revolve = true;
        $("body").mousedown(function(event) {
            if(event.which > 1) {
                Zil_Animator.revolve = !Zil_Animator.revolve;
            } else {
                Zil_Animator.model.paused = !Zil_Animator.model.paused;
            }
        });


        Zil_Animator.model = new AnimatedModel("creatures", "player2", [
            {
                name: "right_leg",
                start: [3,1,0],
                end: [3,1,1],
                center: [0,0,-1],
                color: 1
            },
            {
                name: "left_leg",
                start: [1,1,0],
                end: [1,1,1],
                center: [0,0,-1],
                color: 2
            },
            {
                name: "torso",
                start: [1, 1, 2],
                end: [3, 2, 3],
                color: 3
            },
            {
                name: "head",
                start: [2, 1, 4],
                end: [2, 1, 4],
                color: 4
            },
            {
                name: "left_arm",
                start: [4, 1, 2],
                end: [4, 1, 3],
                center: [0,0,-1],
                color: 5
            },
            {
                name: "right_arm",
                start: [0, 1, 2],
                end: [0, 1, 3],
                center: [0,0,-1],
                color: 6
            }
        ],
            {
                walk: [
                    { "head": { z: 0 }, "left_arm": { x: 0 }, "right_arm": { x: 0 }, "left_leg": { x: 0 }, "right_leg": { x: 0 } },
                    { "head": { z: -10 }, "left_arm": { x: -45 }, "right_arm": { x: 45 }, "left_leg": { x: -45 }, "right_leg": { x: 45 } },
                    { "head": { z: 0 }, "left_arm": { x: 0 }, "right_arm": { x: 0 }, "left_leg": { x: 0 }, "right_leg": { x: 0 } },
                    { "head": { z: 10 }, "left_arm": { x: 45 }, "right_arm": { x: -45 }, "left_leg": { x: 45 }, "right_leg": { x: -45 } }
                ]
            });
        Zil_Animator.scene.add( Zil_Animator.model.shape_obj );
        Zil_Animator.model.shape_obj.position.x += 2;
        Zil_Animator.model.shape_obj.position.y += 2;
        Zil_Animator.model.set_animation_name("walk");

        Zil_Animator.render();
    },

    init_light: function() {
        var light = new THREE.HemisphereLight(0xffffff, 0x000000, 0.5);
        Zil_Animator.scene.add(light);
        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(-1, 1, 1);
        Zil_Animator.scene.add(directionalLight);
    },

    init_camera: function() {
        Zil_Animator.camera = new THREE.OrthographicCamera(
                -ZIL_UTIL.VIEW_WIDTH / ZIL_UTIL.CAM_ZOOM, ZIL_UTIL.VIEW_WIDTH / ZIL_UTIL.CAM_ZOOM,
                ZIL_UTIL.VIEW_HEIGHT / ZIL_UTIL.CAM_ZOOM, -ZIL_UTIL.VIEW_HEIGHT / ZIL_UTIL.CAM_ZOOM,
            -1000, 1000);
        Zil_Animator.camera.position.set(
            ZIL_UTIL.VIEW_WIDTH * 3,
            ZIL_UTIL.VIEW_HEIGHT * 3,
            ZIL_UTIL.VIEW_HEIGHT * 3);
        Zil_Animator.camera.up = new THREE.Vector3(0, 0, 1);
        Zil_Animator.camera.lookAt(new THREE.Vector3(0, 0, 0));
    },

    render: function() {
		var now = Date.now();
		var dx = now - Zil_Animator.last_time;
		Zil_Animator.last_time = now;

        Zil_Animator.model.render(dx);

        if(Zil_Animator.revolve) Zil_Animator.model.shape_obj.rotation.z += 0.1;

		Zil_Animator.renderer.render(Zil_Animator.scene, Zil_Animator.camera);

        // draw fps
		Zil_Animator.fps_counter++;
		if(Zil_Animator.fps_counter >= 25) {
			var fps = Zil_Animator.fps_counter / (now - Zil_Animator.fps_start) * 1000;
			ZIL_UTIL.show_fps(fps.toFixed(2));
			Zil_Animator.fps_counter = 0;
			Zil_Animator.fps_start = now;
		}
//		requestAnimationFrame(Zil_Animator.render);
		setTimeout(Zil_Animator.render, 50); // reduce fan noise
	}
}
