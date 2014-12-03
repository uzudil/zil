// a thing that can move
function Mobile(x, y, z, category, shape, parent) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.move_time = 0;
    this.move_path_index = 0;
    this.move_path = null;
    this.sleep_turns = null;
    this.parent = parent;

    this.ai_move = false;
    this.speed = 20;
    this.alignment = "good";
    this.initiative = 1;
    this.ap = 0;
    this.max_ap = 10;
    this.hp = 25;
    this.target = null;
    this.target_action = null;
    this.selected = false;
    this.attack_angle = 0;
    this.attack_dir = null;
    this.attack_phase = null;
    this.level = 1;
    this.exp = 0;
    this.remove_me = false;

    this.shapes = [];
    this.shape_objects = [];
    this.outline_objects = [];
    for(var i = 0; i < 4; i++) {
        var s = ZilShape.load_shape(category, shape, i, null, true);
        s.build_shape_inline();
        this.shapes.push(s);
        var obj3d = s.render_shape();
        this.outline_objects.push(this.make_glow(obj3d));
        this.shape_objects.push(obj3d);

        // store the creature ref. in the userdata (used for mouseover lookup)
        obj3d.userData.creature = this.parent;
        for(var t = 0; t < obj3d.children.length; t++) {
            obj3d.children[t].userData.creature = this.parent;
        }
    }
    this.last_x = x;
    this.last_y = y;
    this.last_z = z;
    this.shape_index = 2;
    this.shape = this.shapes[this.shape_index];
    this.shape_obj = this.shape_objects[this.shape_index];
    this.outline_obj = this.outline_objects[this.shape_index];
    this._set_chunk_pos(true);
}

Mobile.prototype.make_glow = function(obj3d) {
    var outline_obj = null;
    for(var i = 0; i < obj3d.children.length; i++) {
        var mesh = obj3d.children[i];
        if(mesh.geometry.faces.length > 0) {
            var glowMesh = new THREEx.GeometricGlowMesh(mesh);
//	        mesh.add(glowMesh.object3d);
            outline_obj = glowMesh.object3d;

            var insideUniforms	= glowMesh.insideMesh.material.uniforms;
            insideUniforms.glowColor.value.set('hotpink');
            insideUniforms.coeficient.value = 1.1;
            insideUniforms.power.value = 1.4;

            var outsideUniforms	= glowMesh.outsideMesh.material.uniforms;
            outsideUniforms.glowColor.value.set('hotpink');
            outsideUniforms.coeficient.value = 0.1;
            outsideUniforms.power.value = 1.2;
        }
    }
    return outline_obj;
};

Mobile.prototype.contains_point = function(x, y, z, buffer) {
    if(buffer == null) buffer = 0;
    var size = Math.max(this.shape.width, this.shape.height);
    return ZIL_UTIL.contains(x, this.x - buffer, this.x + size + buffer) &&
        ZIL_UTIL.contains(y, this.y - buffer, this.y + size + buffer) &&
        ZIL_UTIL.contains(z, this.z - buffer, this.z + this.shape.depth + buffer);
};

Mobile.CHUNK_MAP = {};

Mobile.prototype._set_chunk_pos = function(force) {
    // remove the previous pos
    var last_key = "" + ((this.last_x / ZIL_UTIL.CHUNK_SIZE) | 0) + "," + ((this.last_y / ZIL_UTIL.CHUNK_SIZE) | 0);
    var key = "" + ((this.x / ZIL_UTIL.CHUNK_SIZE) | 0) + "," + ((this.y / ZIL_UTIL.CHUNK_SIZE) | 0);

    if (force || last_key != key) {
        if (Mobile.CHUNK_MAP[last_key]) {
            var idx = Mobile.CHUNK_MAP[last_key].indexOf(this.parent);
            if (idx >= 0) Mobile.CHUNK_MAP[last_key].splice(idx, 1);
        }

        // add new pos
        if (Mobile.CHUNK_MAP[key] == null) {
            Mobile.CHUNK_MAP[key] = [];
        }
        Mobile.CHUNK_MAP[key].push(this.parent);
    }
};

Mobile.EMPTY_LIST = [];
Mobile.get_for_chunk = function(chunk_x, chunk_y) {
    return Mobile.CHUNK_MAP["" + chunk_x + "," + chunk_y] || Mobile.EMPTY_LIST;
};

Mobile.prototype.creature_blocked_at = function(x, y, z) {
    if (this.contains_point(x, y, z)) return null; // self won't block

    var cx = (x/ZIL_UTIL.CHUNK_SIZE)|0;
    var cy = (y/ZIL_UTIL.CHUNK_SIZE)|0;
    var c = Mobile.get_for_chunk(cx, cy);
    for(var i = 0; i < c.length; i++) {
        // not blocked by self or target
        if(c[i].mobile.contains_point(x, y, z) && c[i] != this.parent && c[i] != this.target) return c[i];
    }
    return null;
};

Mobile.prototype.creature_blocked = function(nx, ny, nz) {
    var size = Math.max(this.shape.width, this.shape.height);
    for(var x = 0; x < size; x++) {
        for (var y = 0; y < size; y++) {
            for (var z = 0; z < this.shape.depth; z++) {
                var c = this.creature_blocked_at(nx + x, ny + y, nz + 1 + z);
                if (c) return c;
            }
        }
    }
    return null;
};

Mobile.prototype.move_to = function(nx, ny, nz, gx, gy, gz) {
    this.x = nx;
    this.y = ny;
    this.z = nz;
    this._set_chunk_pos();

    // todo: add smooth rotation here...
    if(this.x > this.last_x) this.set_shape(ZIL_UTIL.W);
    else if(this.x < this.last_x) this.set_shape(ZIL_UTIL.E);
    else if(this.y > this.last_y) this.set_shape(ZIL_UTIL.N);
    else if(this.y < this.last_y) this.set_shape(ZIL_UTIL.S);
    this.move(gx, gy, gz);
    this.last_x = this.x;
    this.last_y = this.y;
    this.last_z = this.z;

    this.reposition_divs();
};

Mobile.prototype.set_selected = function(selected) {
    this.selected = selected;
    this.set_shape(this.shape_index);
};

Mobile.prototype.set_shape = function(index) {
    this.shape_index = index;
    this.shape = this.shapes[this.shape_index];

    var parent = this.shape_obj.parent;
    if(parent) parent.remove(this.shape_obj);
    this.shape_obj = this.shape_objects[this.shape_index];
    if(parent) parent.add(this.shape_obj);

    this.shape_obj.remove(this.outline_obj);
    this.outline_obj = this.outline_objects[this.shape_index];
    if(this.selected) {
        this.shape_obj.add(this.outline_obj);
    }
};

Mobile.prototype.move = function(gx, gy, gz) {
    this.shape_obj.position.set(this.x - gx, this.y - gy, this.z - gz);
};

Mobile.prototype.creature_move_plan = function(map_shape) {
    if(this.move_path == null && this.sleep_turns == null) {

        if(this.target) {
            this.plan_move_to(map_shape, this.target.mobile.x, this.target.mobile.y, this.target.mobile.z - 1);
//            console.log(">>> creature " + this.get_name() + " planned move to " + this.target.mobile.get_name() + " success?:", this.is_moving());
            if(!this.is_moving()) {
//                console.log("\tcan't move there... abandoning target.");
                // can't move there, forget the target
                this.target = null;
                this.target_action = null;
            }
        } else {
            var dir = (Math.random() * 5) | 0;
            var dx = this.x;
            var dy = this.y;
            var dz = this.z;
            var dist = (Math.random() * 48) | 0;

            if (dir > ZIL_UTIL.W) {
                this.move_path = null;
                this.move_path_index = 0;
                this.sleep_turns = dist;
            } else {
                this.move_path = [];
                this.move_path_index = 0;
                this.sleep_turns = null;
                for (var i = 0; i < dist; i++) {
                    switch (dir) {
                        case ZIL_UTIL.N:
                            dy--;
                            break;
                        case ZIL_UTIL.E:
                            dx++;
                            break;
                        case ZIL_UTIL.S:
                            dy++;
                            break;
                        case ZIL_UTIL.W:
                            dx--;
                            break;
                    }
                    var pz = dz;
                    dz = map_shape.get_highest_empty_space(dx, dy, this.shape) - 1;
                    var node = map_shape.get_node(dx, dy, dz);
                    if (node == null || Math.abs(dz - pz) > 1) break;
                    this.move_path.push(node);
                }
                if (this.move_path.length == 0) this.move_path = null;
            }
        }
//        console.log(">>> creature " + this.parent.id + " sleep_turns=" + this.sleep_turns  + " move_path=", this.move_path);
    }
};

Mobile.prototype.plan_move_to = function(map_shape, x, y, z) {
    var start_point = [this.x, this.y, this.z - 1];
    if(z == null) z = map_shape.get_highest_empty_space(x, y, this.shape) - 1;
    var end_point = [x, y, z];

    var p = map_shape.astar_search(start_point, end_point, this.parent);

    if(p && p.length) {
        this.move_path_index = 0;
        this.move_path = p;
        this.sleep_turns = null;
    }
};

/**
 * Move this mobile one step on the path.
 * @param map_shape the map
 * @param gx global x
 * @param gy global y
 * @param gz global z
 * @param delta_time time since last frame (millis)
 * @returns {boolean}
 */
Mobile.prototype.move_step = function(map_shape, gx, gy, gz, delta_time) {

    if(this.ai_move && this.is_alive()) {
        this.creature_move_plan(map_shape);
    }

    this.move_time += delta_time;
    if(this.move_time >  (ZIL.in_combat ? 50 : this.speed)) {
        this.move_time = 0;

        if(!this.is_alive()) {
            if(this.shape_obj.children[0].rotation.y < PI / 2) {
                this.shape_obj.children[0].rotation.y += delta_time * 0.01;
            } else if(this.shape_obj.children[0].position.z > -1) {
                this.shape_obj.children[0].position.z -= delta_time * 0.05;
            } else {
                this.remove_me = true;
            }
            return true;
        }

        // look for enemies
        if(this.ai_move && this.is_alive()) {
            this.look_for_target();
        }

        // sleep
        if(this.sleep_turns != null) {
            this.move_to(this.x, this.y, this.z, gx, gy, gz);
            if(this.sleep_turns-- <= 0) this.sleep_turns = null;
            return true;
        }

        if(this.move_path) {
            var node = this.move_path[this.move_path_index];

            // blocked by another creature? Just wait (this won't happen during combat)
            var c = this.creature_blocked(node.x, node.y, node.z);
            if (c) {
//                console.log("waiting in move: " + this.get_name() + " vs " + c.mobile.get_name());
                // end move
                this.move_path_index = 0;
                this.move_path = null;
                return true;
            }

            this.move_to(node.x, node.y, node.z + 1, gx, gy, gz);

            this.move_path_index++;
            if(this.move_path_index >= this.move_path.length) {
                this.move_path_index = 0;
                this.move_path = null;
            }
            return true;
        }
    }
    return false;
};

Mobile.prototype.is_alive = function() {
    return this.hp > 0;
};

Mobile.prototype.is_moving = function() {
    return this.move_path != null &&
        this.move_path.length > 0;
};

Mobile.prototype.is_attacking = function() {
    return this.attack_phase != null;
};

Mobile.prototype.start_attack = function() {
    this.attack_angle = 0;
    this.attack_dir = 1;
    this.attack_phase = 0;
};

Mobile.prototype.attack = function(delta_time) {
    if(this.is_attacking() && this.is_alive()) {

        // face the enemy
        if(this.target) {
            var x2 = this.target.mobile.x;
            var y2 = this.target.mobile.y;
            var zrot = Math.atan2(y2 - this.y, x2 - this.x);
            this.shape_obj.rotation.z = zrot - this.shape.get_rotation() - PI/2;
        }

        if(this.attack_dir) {
            this.attack_angle += delta_time * 0.4 * this.attack_dir;
            if (this.attack_dir == 1) {
                if (this.attack_angle >= 45) {
                    this.attack_dir = -1;
                }
            } else if (this.attack_dir == -1) {
                if (this.attack_angle <= 0) {
                    this.attack_angle = 0;
                    // end of attack animation
                    this.attack_dir = null;
                }
            }
            this.shape_obj.children[0].rotation.y = ZIL_UTIL.angle_to_radians(this.attack_angle);
        } else {
            // last part: wait some time, run encounter and end attack
            this.attack_phase += delta_time;
            if(this.attack_phase >= 500) {
                this.attack_roll();

                // end of attack
                this.attack_phase = null;
                this.shape_obj.rotation.z = 0;
            }
        }
    }
    return !this.is_attacking();
};

Mobile.prototype.is_target_dying = function() {
    return this.target && !this.target.mobile.is_alive() && !this.target.mobile.remove_me;
};

Mobile.prototype.is_target_in_range = function(x, y) {
    return this.target && ZIL_UTIL.get_shape_distance(this.parent, this.target, x, y) <= this.parent.get_range();
};

Mobile.prototype.is_target_in_range_on_path = function() {
    var current_ap = this.ap;
    for(var i = 0; current_ap > 0 && i < this.move_path.length; i++, current_ap--) {
        var node = this.move_path[i];
        if(this.is_target_in_range(node.x, node.y)) {
            return true;
        }
    }
    return false;
};

Mobile.prototype.show_above = function(content, css_class) {
    $("body").append("<div class='mobile_div " + css_class + "' data-creature_id='" + this.parent.id + "'>" + content + "</div>");
    var el = $("div:last");
    this.position_above(el);
};

Mobile.reposition_all_divs = function() {
    var divs = $(".mobile_div");
    for(var i = 0; i < divs.length; i++) {
        var div = divs.eq(i);
        var creature_id = div.data("creature_id");
        var creature = ZIL.creatures_map[creature_id];
        if(creature && creature.mobile) {
            creature.mobile.position_above(div);
        } else {
            // creature died? This might be a bug.
            Mobile.remove_divs(creature_id);
        }
    }
};

Mobile.prototype.reposition_divs = function() {
    var divs = $(".mobile_div[data-creature_id='" + this.parent.id + "']");
    for(var i = 0; divs && i < divs.length; i++) {
        this.position_above(divs.eq(i));
    }
};

Mobile.prototype.remove_divs = function(css_class) {
    Mobile.remove_divs(this.parent.id, css_class);
};

Mobile.remove_divs = function(creature_id, css_class) {
    var divs = $(".mobile_div[data-creature_id='" + creature_id + "']");
    for(var i = 0; divs && i < divs.length; i++) {
        var div = divs.eq(i);
        if(css_class == null || div.hasClass(css_class)) div.remove();
    }
};

Mobile.prototype.position_above = function(div) {
    var position = THREEx.ObjCoord.cssPosition(this.shape_obj, ZIL.camera, ZIL.renderer);
    position.y -= this.shape.depth * 10;
    div.css({
        left: (position.x - div[0].offsetWidth /2)+'px',
        top: (position.y - div[0].offsetHeight/2)+'px'
    });
};

Mobile.move_damage_divs = function(delta_time) {
    var now = Date.now();
    var divs = $(".mobile_div.damage");
    for(var i = 0; i < divs.length; i++) {
        var div = divs.eq(i);
        var start = div.attr("start_time");
        if(start) {
            start = parseInt(start, 10);
        } else {
            start = now;
            div.attr("start_time", start);
        }

        var life = now - start;
        if(life > ZIL_UTIL.DAMAGE_LIFE) {
            div.remove();
        } else {
            var y = parseInt(div.css("marginTop").replace(/[^-\d\.]/g, ''), 10);
            y -= delta_time / ZIL_UTIL.DAMAGE_SPEED;
            div.css({
                "marginTop": y + "px",
                "opacity":  (ZIL_UTIL.DAMAGE_LIFE - life) / ZIL_UTIL.DAMAGE_LIFE
            });
        }
    }
};

Mobile.prototype.attack_roll = function() {
    // run the encounter
    var a = this.parent.get_atk();
    var d = this.target.get_def();
    var damage = Math.max(a - d, 0);

    this.target.mobile.hp -= damage;
    console.log("+++ " + this.target.mobile.get_name() + " takes " + damage + "(a:" + a + "/d:" + d + ") points of damage. (remaining hp=" + this.target.mobile.hp +  ")");

    if(damage > 0) {
        // animate damage
        this.target.mobile.show_above(damage, "damage");

        // target dead?
        if (!this.target.mobile.is_alive()) {

            // experience gain
            if(!this.ai_move) {
                var old_level = this.level;
                this.exp += Math.max(this.target.mobile.level - this.level, 1) * 50;
                this.parent.set_level_from_exp();
                if(this.level > old_level) {
                    $("#level_up").show();
                    setTimeout(function() {
                        $("#level_up").hide();
                    }, 2000);
                }
            }

            // won't need this anymore
            this.shape_obj.remove(this.outline_obj);

            // target death
            if(this.target.mobile.ai_move) {
                console.log(this.target.mobile.get_name() + " dies.");
            } else {
                // player death
                alert("Player dies.");
            }
        }
    }
};

Mobile.prototype.look_for_target = function() {
    if (this.target_action) return;
    if (this.parent.is_peaceful()) return;

    this.find_target();
    if (this.target_action == null) return;

    if(this.target_action == "attack") {
        ZIL.start_combat();
    }
};

Mobile.prototype.find_target = function() {
    var cx = (this.x / ZIL_UTIL.CHUNK_SIZE)|0;
    var cy = (this.y / ZIL_UTIL.CHUNK_SIZE)|0;
    for(var dx = -2; dx <= 2; dx++) {
        for(var dy = -2; dy <= 2; dy++) {
            var creatures = Mobile.get_for_chunk(cx + dx, cy + dy);
            for(var i = 0; i < creatures.length; i++) {
                var c = creatures[i];

                // help friends if needed/can (this can be self)

                // attack foes
                if(c.mobile.alignment != this.alignment) {
                    if(50 < Math.random() * 100) {
                        this.set_target(c);
                        return;
                    }
                }
            }
        }
    }
};

Mobile.prototype.reset_move = function() {
    this.move_path = null;
    this.move_path_index = 0;
    this.sleep_turns = null;
    this.target = null;
    this.target_action = null;
};

Mobile.prototype.set_target = function(target_creature) {
    if(target_creature) {
        this.target = target_creature;
        this.target_action = "attack";
//        console.log(this.get_name() + " targets " + target_creature.mobile.get_name() + " for " + this.target_action + ".");
    } else {
        this.target = null;
        this.target_action = null;
//        console.log(this.get_name() + " clears target.");
    }
};

Mobile.prototype.get_name = function() {
    return this.monster ? this.monster.name + "-" + this.parent.id : "player";
};

Mobile.prototype.to_string = function() {
    return this.get_name() + " ap=" + this.ap + " hp=" + this.hp;
};
