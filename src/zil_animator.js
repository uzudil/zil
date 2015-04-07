function AnimatedModel(category, name, model, animations) {
    this.initialize = ZIL_UTIL.bind(this, function() {
        this.shape_objs = {};
        this.angles = {};
        this.width = this.height = this.depth = 0;
        this.shape_obj = new THREE.Object3D();
        this.model = model;
        AnimatedModel.visit_parts(model, null, ZIL_UTIL.bind(this, function(part, parent_part) {

            var current_shape = parent_part == null ? this.shape_obj : this.shape_objs[parent_part.name];

            var o;
            if(part["parts"]) {
                o = new THREE.Object3D();
            } else {
                var width = part.end[0] - part.start[0] + 1;
                var height = part.end[1] - part.start[1] + 1;
                var depth = part.end[2] - part.start[2] + 1;
                var points = {};
                for(var x = part.start[0]; x <= part.end[0]; x++) {
                    if(x > this.width) this.width = x;
                    for(var y = part.start[1]; y <= part.end[1]; y++) {
                        if(y > this.height) this.height = y;
                        for (var z = part.start[2]; z <= part.end[2]; z++) {
                            if(z > this.depth) this.depth = z;
                            points[x + "," + y + "," + z] = part.color;
                        }
                    }
                }
                var s = new ZilShape(category, name + ".part." + part.name,
                    points,
                    width, height, depth, 0, null, true, null, null);
                o = s.render_shape();

                // set rotational centers
                if("center" in part) {
                    var geo = o.children[0].geometry;
                    geo.applyMatrix(new THREE.Matrix4().makeTranslation(part.center[0], part.center[1], part.center[2]));
                    o.position.set(part.start[0] - part.center[0], part.start[1] - part.center[1], part.start[2] - part.center[2]);
                } else {
                    o.position.set(part.start[0], part.start[1], part.start[2]);
                }

            }
            this.shape_objs[part.name] = o;
            current_shape.add(o);
        }));

        this.animations = animations;
        this.animation_name = null;
        this.animation_index = 0;
        this.animation_time = 0;

        this.paused = false;

        // square base
        var size = Math.max(this.width, this.height);
        this.width = this.height = size;
        console.log(name + " size=" + this.width + "," + this.height + "," + this.depth);

        return this;
    });
}

AnimatedModel.ANIMATION_TIME = 200;

AnimatedModel.prototype.set_animation_name = function(name) {
    this.animation_name = name;
    this.animation_index = 0;
    this.animation_time = 0;
    AnimatedModel.visit_parts(this.model, null, ZIL_UTIL.bind(this, function(part) {
        this.shape_objs[part.name].rotation.set(0, 0, 0);
    }));
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

AnimatedModel.create_model = function(name, model, colors) {
    // copy the parts so we don't modify the original
    var parts = $.extend(true, {}, model[0]);
    AnimatedModel.visit_parts(parts, null, function(part) {
        var new_color = colors[part.name];
        if(new_color != null) part.color = new_color;
    });
    return new AnimatedModel("creatures", name, parts, model[1]);
};

AnimatedModel.visit_parts = function(part, parent_part, on_visit) {
    if(part) {
        on_visit(part, parent_part);
        if(part["parts"]) {
            for(var i = 0; i < part.parts.length; i++) {
                AnimatedModel.visit_parts(part.parts[i], part, on_visit);
            }
        }
    }
};

AnimatedModel.HUMAN_MODEL = [
    {
        name: "body",
        parts: [
            {
                name: "upper",
                parts: [
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
                        center: [0, 0, -1],
                        color: 5
                    },
                    {
                        name: "right_arm",
                        start: [0, 1, 2],
                        end: [0, 1, 3],
                        center: [0, 0, -1],
                        color: 6
                    }
                ]
            },
            {
                name: "lower",
                parts: [
                    {
                        name: "right_leg",
                        start: [3, 1, 0],
                        end: [3, 1, 1],
                        center: [0, 0, -1],
                        color: 1
                    },
                    {
                        name: "left_leg",
                        start: [1, 1, 0],
                        end: [1, 1, 1],
                        center: [0, 0, -1],
                        color: 2
                    }
                ]
            }
        ]
    },
    {
        walk: [
            { "upper": { z: 0 }, "head": { z: 0 }, "left_arm": { x: 0 }, "right_arm": { x: 0 }, "left_leg": { x: 0 }, "right_leg": { x: 0 } },
            { "upper": { z: 5 }, "head": { z: -10 }, "left_arm": { x: -45 }, "right_arm": { x: 45 }, "left_leg": { x: -45 }, "right_leg": { x: 45 } },
            { "upper": { z: 0 }, "head": { z: 0 }, "left_arm": { x: 0 }, "right_arm": { x: 0 }, "left_leg": { x: 0 }, "right_leg": { x: 0 } },
            { "upper": { z: -5 }, "head": { z: 10 }, "left_arm": { x: 45 }, "right_arm": { x: -45 }, "left_leg": { x: 45 }, "right_leg": { x: -45 } }
        ],
        attack: [
            { "upper": { x: 0 }, "right_arm": { x: 0 } },
            { "upper": { x: -20 }, "right_arm": { x: 180 } },
            { "upper": { x: -10 }, "right_arm": { x: 90 } }
        ],
        pain: [
            { "upper": { x: 0 }, "right_arm": { x: 0 }, "left_arm": { x: 0 }, "right_leg": { x: 0 } },
            { "upper": { x: 40 }, "right_arm": { x: 90 }, "left_arm": { x: 110 }, "right_leg": { x: 40 }  },
            { "upper": { x: 20 }, "right_arm": { x: 45 }, "left_arm": { x: 50 }, "right_leg": { x: 20 }   }
        ],
        bored: [
            { "upper": { y: 0 }, "right_arm": { y: 0 }, "left_arm": { y: 0 } },
            { "upper": { y: 5 }, "right_arm": { y: 40 }, "left_arm": { y: -10 } },
            { "upper": { y: 0 }, "right_arm": { y: 0 }, "left_arm": { y: 0 } },
            { "upper": { y: -5 }, "right_arm": { y: 10 }, "left_arm": { y: -40 } },
            { "upper": { y: 0 }, "right_arm": { y: 0 }, "left_arm": { y: 0 } },
            { "upper": { y: 0 }, "right_arm": { y: 0 }, "left_arm": { y: 0 } },
            { "right_leg": { x: 20 }, "left_leg": { x: 0 } },
            { "right_leg": { x: 0 }, "left_leg": { x: 0 } },
            { "right_leg": { x: 0 }, "left_leg": { x: 20 } },
            { "right_leg": { x: 0 }, "left_leg": { x: 0 } },
            { "upper": { z: 0 }, "right_arm": { x: 0 }, "left_arm": { x: 0 } },
            { "upper": { z: 30 }, "right_arm": { x: 40 }, "left_arm": { x: -40 } },
            { "upper": { z: 0 }, "right_arm": { x: 0 }, "left_arm": { x: 0 } },
            { "upper": { z: -30 }, "right_arm": { x: -40 }, "left_arm": { x: 40 } },
            { "upper": { z: 0 }, "right_arm": { x: 0 }, "left_arm": { x: 0 } },
            { "upper": { z: 0 }, "right_arm": { x: 0 }, "left_arm": { x: 0 } },
            { "upper": { z: 0 }, "right_arm": { x: 0 }, "left_arm": { x: 0 } },
            { "upper": { z: 0 }, "right_arm": { x: 0 }, "left_arm": { x: 0 } },
            { "upper": { z: 0 }, "right_arm": { x: 0 }, "left_arm": { x: 0 } }
        ],
        cast: [
            { "right_arm": { x: 0 }, "left_arm": { x: 0 } },
            { "right_arm": { x: 70 }, "left_arm": { x: 70 } },
            { "right_arm": { x: 70, y: -40 }, "left_arm": { x: 70, y: 40 } },
            { "right_arm": { x: 70, y: -40 }, "left_arm": { x: 70, y: 40 } },
            { "right_arm": { x: 70, y: 0 }, "left_arm": { x: 70, y: 0 } },
            { "right_arm": { x: 180, y: 40 }, "left_arm": { x: 180, y: -40 }, "upper": { x: 20 } },
            { "right_arm": { x: 180, y: 40 }, "left_arm": { x: 180, y: -40 }, "upper": { x: 20 } },
            { "right_arm": { x: 180, y: 40 }, "left_arm": { x: 180, y: -40 }, "upper": { x: 20 } },
            { "right_arm": { x: 70, y: 0 }, "left_arm": { x: 70, y: 0 }, "upper": { x: 0 } },
            { "right_arm": { x: 0 }, "left_arm": { x: 0 } }
        ],
        death: [
            { "body": { x: 0 }, "right_arm": { x: 180, y: 40 }, "left_arm": { x: 180, y: -40 }, "upper": { x: 20 } },
            { "body": { x: 30 } },
            { "body": { x: 60 } },
            { "body": { x: 90 } }
        ]
    }
];

AnimatedModel.HUMAN = AnimatedModel.create_model("human",
    AnimatedModel.HUMAN_MODEL, {
        head: 2,
        left_leg: 1,
        right_leg: 1,
        left_arm: 3,
        right_arm: 3,
        torso: 3
    });

AnimatedModel.GUARD = AnimatedModel.create_model("guard",
    AnimatedModel.HUMAN_MODEL, {
        head: 19,
        left_leg: 20,
        right_leg: 20,
        left_arm: 19,
        right_arm: 19,
        torso: 19
    });







// Test animations
var Zil_Animator = {

	fps_counter: 0,
	fps_start: Date.now(),
    last_time: 0,
    Z_SCALE: 2,


    start_animator: function() {
        // do this first
        ZIL_UTIL.load_config(640, 480);
        console.log("palette:");
        for(var i = 0; i < ZIL_UTIL.palette.length; i++) {
            console.log(i + ":" + ZIL_UTIL.palette[i].toString(16));
        }

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
        $("#animation").change(function(event) {
            Zil_Animator.model.set_animation_name($("#animation").val());
            Zil_Animator.model.paused = false;
            event.stopPropagation();
            return true;
        });

        Zil_Animator.model = AnimatedModel.HUMAN.initialize();
        Zil_Animator.scene.add( Zil_Animator.model.shape_obj );
        Zil_Animator.model.shape_obj.position.x += Zil_Animator.model.width / 2;
        Zil_Animator.model.shape_obj.position.y += Zil_Animator.model.height / 2;
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

//        if(Zil_Animator.revolve) Zil_Animator.model.shape_obj.rotation.z += 0.1;

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
