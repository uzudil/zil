// a thing that can move
function Mobile(x, y, z, category, shape, parent, is_transparent, animated_model) {
    this.x = x;
    this.y = y;
    this.z = z;

    this.origin_x = x;
    this.origin_y = y;
    this.origin_z = z;

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
    this.max_hp = this.hp;
    this.target = null;
    this.target_action = null;
    this.selected = false;
    this.attack_angle = 0;
    this.attack_dir = null;
    this.attack_phase = null;
    this.level = 1;
    this.exp = 0;
    this.remove_me = false;
    this.spells = [];
    this.cooldowns = {};
    this.casting_spell = null;
    this.casting_spell_move = 0;
    this.cast_z = 0;
    this.cast_particles = null;
    this.status = {};

    this.shape = ZilShape.load_shape(category, shape, 0, null, true);
    this.shape.is_transparent = is_transparent;

    this.animated_model = animated_model ? animated_model().initialize() : null;
    if(this.animated_model) {
        this.shape_obj = this.animated_model.shape_obj;
        this.shape_obj_copy = this.animated_model.shape_obj_copy;
        this.animated_model.set_animation_name(null);
    } else {
        this.shape_obj = this.shape.render_shape();
        this.shape_obj_copy = this.shape_obj.clone();

        // center the shape's geometry (so rotation works correctly)
        for(var i = 0; i < this.shape_obj.children.length; i++) {
            var mesh = this.shape_obj.children[i];
            mesh.geometry.applyMatrix( new THREE.Matrix4().makeTranslation( -this.shape.width/2, -this.shape.height/2, 0 ) );
        }
    }

    // store the creature ref. in the userdata (used for mouseover lookup)
    ZIL_UTIL.visit_objects(this.shape_obj, ZIL_UTIL.bind(this, function(mesh) {
        mesh.userData.creature = this.parent;
    }));
    this.dir = ZIL_UTIL.N;

    this.last_x = x;
    this.last_y = y;
    this.last_z = z;

    this.size = Math.max(this.shape.width, this.shape.height);
    this._set_chunk_pos(true);
}

Mobile.prototype.render = function(delta_time) {
    if(this.animated_model) {
        this.animated_model.render(delta_time);
    }
};

// add this mobile's shapes to the 3d world
Mobile.prototype.add_shape = function(world_obj, world_obj_pass2) {
    world_obj.add(this.shape_obj);
    world_obj_pass2.add(this.shape_obj_copy);
};

// remove this mobile's shapes from the 3d world
Mobile.prototype.remove_shape = function() {
    if(this.shape_obj && this.shape_obj.parent) this.shape_obj.parent.remove(this.shape_obj);
    if(this.shape_obj_copy && this.shape_obj_copy.parent) this.shape_obj_copy.parent.remove(this.shape_obj_copy);
};

// the bad
Mobile.STATUS_HASTED = "hasted";
Mobile.STATUS_SLOWED = "slowed";
Mobile.STATUS_HELD = "held";
Mobile.STATUS_POISONED = "poisoned";
Mobile.STATUS_DISEASED = "diseased";
Mobile.STATUS_CONFUSED = "confused";
Mobile.STATUS_POSSESSED = "possessed";

// the good
Mobile.STATUS_BLESSED = "blessed";
Mobile.STATUS_ARMORED = "armored";
Mobile.STATUS_BLOCKED = "blocked";
Mobile.STATUS_ENRAGED = "enraged";
Mobile.STATUS_PROTECTED = "protected";

// neutral
Mobile.STATUS_DEAD = "dead";

Mobile.prototype.is_ethereal = function() {
    return this.monster && this.monster.ethereal
};

Mobile.prototype.has_status = function(status) {
    return status in this.status;
};

Mobile.prototype.remove_status = function(status, turns_count) {
    delete this.status[status];
    ZilCal.unschedule("remove_status_" + status);
};

Mobile.prototype.set_status = function(status, turns_count) {
    if(this.has_status(status)) this.remove_status(status);
    this.status[status] = true;

    ZilCal.schedule("remove_status_" + status, 10, ZIL_UTIL.bind(this, function() {
        this.remove_status(status);
    }));
};

Mobile.prototype.contains_point = function(x, y, z, buffer) {
    if(buffer == null) buffer = 0;
    return ZIL_UTIL.contains_box([x, y, z],
        [this.x-buffer, this.y-buffer, this.z-buffer],
        [this.size + buffer, this.size + buffer, this.shape.depth + buffer]);
};

Mobile.CHUNK_MAP = {};

Mobile.clear_chunk_map = function() {
    Mobile.CHUNK_MAP = {};
};

Mobile.prototype.remove_creature = function() {
    var key = "" + ((this.x / ZIL_UTIL.CHUNK_SIZE) | 0) + "," + ((this.y / ZIL_UTIL.CHUNK_SIZE) | 0);

    if (Mobile.CHUNK_MAP[key]) {
        var idx = Mobile.CHUNK_MAP[key].indexOf(this.parent);
        if (idx >= 0) Mobile.CHUNK_MAP[key].splice(idx, 1);
    }
};

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
    // should also check points at z = nz + 1 + this.shape.depth - 1
    return this.creature_blocked_at(nx, ny, nz + 1) ||
        this.creature_blocked_at(nx + this.size - 1, ny, nz + 1) ||
        this.creature_blocked_at(nx + this.size - 1, ny + this.size - 1, nz + 1) ||
        this.creature_blocked_at(nx, ny + this.size - 1, nz + 1);
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
    this.set_shape(this.dir);
};

Mobile.prototype.set_shape = function(dir) {
    this.dir = dir;

    this.shape_obj.rotation.set(0, 0, PI/2 * dir);
    this.shape_obj_copy.rotation.set(0, 0, PI/2 * dir);
};

Mobile.prototype.move = function(gx, gy, gz) {
    var zz = this.z - gz + this.cast_z;
    if(this.is_ethereal()) zz = 1; // hack!
    this.shape_obj.position.set(this.x - gx, this.y - gy, zz);
    this.shape_obj_copy.position.set(this.x - gx, this.y - gy, zz);
    this.reposition_divs();
};

Mobile.prototype.creature_move_to_target_plan = function(map_shape) {
    this.plan_move_to(map_shape, this.target.mobile.x, this.target.mobile.y, this.target.mobile.z - 1);
//    console.log(">>> creature " + this.get_name() + " planned move to " + this.target.mobile.get_name() + " success?:", this.is_moving());

    // did the plan work? Check that it includes the target.
    var moving = false;
    if(this.is_moving()) {
        for(var i = this.move_path.length - 1; i >= Math.max(this.move_path.length - 8, 0); i--) {
            var last_node = this.move_path[i];
            var p = this.target.mobile;
//            console.log("Checking " + i + "th node " + last_node[0] + "," + last_node[1] + "," + last_node[2] + " vs target at " + p.x + "," + p.y + "," + p.z + " size=" + p.size + " depth=" + p.shape.depth);
            moving = this.target.mobile.contains_point(last_node[0], last_node[1], last_node[2], this.size);
            if(moving) break;
        }
    }

    // if not, reset
    if(!moving) {
//                console.log("\tcan't move there... abandoning target.");
        // can't move there, forget the target
        this.target = null;
        this.target_action = null;
    }

    return moving;
};

// random movement plan
Mobile.prototype.creature_loiter_plan = function(map_shape) {
    var dir = (Math.random() * 4) | 0;
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
            dz = map_shape.get_highest_empty_space_at_point(dx, dy);
            if (dz == 0 || Math.abs(dz - pz) > 1) {
                break;
            }
            var node = map_shape.find_color_at(dx, dy, dz - 1);
            if(node == null) {
                break;
            }
            if(this.monster.loiter_radius && ZIL_UTIL.get_distance(this.origin_x, this.origin_y, dx, dy) >= this.monster.loiter_radius) {
                break;
            }
            if(this.creature_blocked(dx, dy, dz - 1)) {
                break;
            }
            this.move_path.push([dx, dy, dz - 1]);
        }
        if (this.move_path.length == 0) this.move_path = null;
    }
};

Mobile.prototype.make_neutral = function() {
    this.alignment = "neutral";
};

Mobile.prototype.make_evil = function() {
    this.alignment = "evil";
    this.move_path = null;
    this.move_path_index = 0;
    this.sleep_turns = null;
};


Mobile.prototype.creature_move_plan = function(map_shape) {
    if(this.move_path == null && this.sleep_turns == null) {

        // move to target plan; if this fails the target is null-ed
        if(this.target) this.creature_move_to_target_plan(map_shape);

        // if we can't get to or there is no target
        if(!this.target) this.creature_loiter_plan(map_shape);
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

Mobile.prototype.set_animation = function(animation_name) {
    if(this.animated_model) this.animated_model.set_animation_name(animation_name);
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

    if(this.is_casting_spell()) {
        this.cast_animation(map_shape, gx, gy, gz, delta_time);
        return !this.is_casting_spell();
    }

    // if we can no longer get to the target, forget it
    if(this.ai_move && this.target && !this.can_reach_creature(this.target)) {
        this.reset_move();
    }

    if(this.ai_move && this.is_alive() && this.alignment != "neutral") {
        this.creature_move_plan(map_shape);
    }

    this.move_time += delta_time;
    if(this.move_time >  (ZIL.in_combat ? 50 : this.speed)) {
        this.move_time = 0;

        if(!this.is_alive()) {
            if(this.shape_obj.children[0].rotation.y < PI / 2) {
                this.shape_obj.children[0].rotation.y += delta_time * 0.01;
                this.shape_obj_copy.children[0].rotation.y += delta_time * 0.01;
            } else if(this.shape_obj.children[0].position.z > -1) {
                this.shape_obj.children[0].position.z -= delta_time * 0.05;
                this.shape_obj_copy.children[0].position.z -= delta_time * 0.05;
            } else {
                if(this.shape_obj.parent) {
                    this.shape_obj.parent.remove(this.shape_obj);
                    this.shape_obj_copy.parent.remove(this.shape_obj_copy);
                }
                this.remove_me = true;
            }
            return true;
        }

        // look for enemies
        if(this.ai_move && this.is_alive() && !ZIL_UTIL.god_mode && this.alignment != "neutral") {
            this.look_for_target();
        }

        // sleep
        if(this.sleep_turns != null) {
            this.move_to(this.x, this.y, this.z, gx, gy, gz);
            if(this.sleep_turns-- <= 0) this.sleep_turns = null;
            return true;
        }

//        if (ZIL.in_combat) console.log("*** step move start!");
        var retry_count = 0;
        do {
            if (this.move_path) {
                var node = this.move_path[this.move_path_index];

                // blocked by another creature? Just wait (this won't happen during combat)
                var c = this.creature_blocked(node[0], node[1], node[2]);
                if (c) {
//                    console.log("waiting in move: " + this.get_name() + " vs " + c.mobile.get_name() +
//                        " at " + node.x + "," + node.y + "," + node.z);
                    if (ZIL.in_combat) {
                        // re-plan now
                        if(this.ai_move && this.target && retry_count < 3 && this.creature_move_to_target_plan(map_shape)) {
                            retry_count++;
                            // success
//                            console.log("*** replanning success: retry_count=" + retry_count);
                            continue;
                        } else {
                            // can't get there; give up
//                            console.log("*** replanning failed; giving up");
                            return true;
                        }
                    } else {
                        // end move
                        this.move_path_index = 0;
                        this.move_path = null;
                        return true;
                    }
                }

                this.move_to(node[0], node[1], node[2] + 1, gx, gy, gz);

                this.move_path_index++;
                if (this.move_path_index >= this.move_path.length) {
                    this.move_path_index = 0;
                    this.move_path = null;
                }
                return true;
            }
        } while(retry_count > 0);
    }
    return false;
};

Mobile.prototype.cast_animation = function(map_shape, gx, gy, gz, delta_time) {

    // expand the particles
    for(var i = 0; i < 4000; i++) {
        var d = delta_time * 0.007;
        var delta = (Math.random() * d/2 + d/2);
        var vertex = this.cast_geometry.vertices[i];
        ZIL_UTIL.grow_vector(vertex, delta);
    }
    this.cast_material.opacity = (this.cast_z / 4.0) / 10.0;
    this.cast_geometry.colorsNeedUpdate = true;
    this.cast_geometry.verticesNeedUpdate = true;
    this.cast_particles.position.z = -this.cast_z;

    // move the creature
    if(this.casting_spell_move == 0) {
        this.face_target();
        if(this.cast_z < 2) {
            this.cast_z += delta_time * 0.00125 / Spell.SPEED;
            this.shape_obj.children[0].rotation.x = ZIL_UTIL.angle_to_radians(this.cast_z * 7);
            this.shape_obj_copy.children[0].rotation.x = ZIL_UTIL.angle_to_radians(this.cast_z * 7);
            this.move(gx, gy, gz);
        } else {
            this.casting_spell_move = 1;
        }
    } else if(this.casting_spell_move == 1) {
        if(this.cast_z > 0) {
            this.cast_z -= delta_time * 0.00125 / Spell.SPEED;
            this.shape_obj.children[0].rotation.x = ZIL_UTIL.angle_to_radians(this.cast_z * 7);
            this.shape_obj_copy.children[0].rotation.x = ZIL_UTIL.angle_to_radians(this.cast_z * 7);
            this.move(gx, gy, gz);
        } else {
            this.casting_spell_move = 2;
        }
    } else {
        this.cast_z = 0;
        this.shape_obj.children[0].rotation.x = 0;
        this.shape_obj_copy.children[0].rotation.x = 0;
        this.casting_spell = null;
        this.shape_obj.remove(this.cast_particles);
        this.move(gx, gy, gz);

        this.cancel_face_target();
    }
};

Mobile.prototype.is_casting_spell = function() {
    return this.casting_spell != null;
};

Mobile.prototype.heal = function(points) {
    var p = this.hp;
    this.hp += points;
    if(this.hp > this.max_hp) this.hp = this.max_hp;
    ZIL.log(this.get_name() + " heals " + (this.hp - p)  + " points.");
};

Mobile.prototype.is_alive = function() {
    return this.hp > 0;
};

Mobile.prototype.cancel_pending_move = function() {
    if(this.is_moving()) {
        this.move_path = null;
        this.move_path_index = 0;
    }
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

Mobile.prototype.cancel_face_target = function(delta_time) {
    this.shape_obj.rotation.z = 0;
    this.shape_obj_copy.rotation.z = 0;
};

Mobile.prototype.face_target = function(delta_time) {
    // face the enemy
    if(this.target) {
        var x2 = this.target.mobile.x;
        var y2 = this.target.mobile.y;
        var zrot = Math.atan2(y2 - this.y, x2 - this.x);
        this.shape_obj.rotation.z = zrot - this.shape.get_rotation() - PI/2;
        this.shape_obj_copy.rotation.z = zrot - this.shape.get_rotation() - PI/2;
    }
};

Mobile.prototype.attack = function(delta_time) {
    if(this.is_attacking() && this.is_alive()) {

        this.face_target();

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
            this.shape_obj.children[0].rotation.x = -ZIL_UTIL.angle_to_radians(this.attack_angle);
            this.shape_obj_copy.children[0].rotation.x = -ZIL_UTIL.angle_to_radians(this.attack_angle);
        } else {
            // last part: wait some time, run encounter and end attack
            this.attack_phase += delta_time;
            if(this.attack_phase >= 500) {
                this.attack_roll();

                // end of attack
                this.attack_phase = null;
                this.cancel_face_target();
            }
        }
    }
    return !this.is_attacking();
};

Mobile.prototype.is_target_dying = function() {
    return this.target && !this.target.mobile.is_alive() && !this.target.mobile.remove_me;
};

Mobile.prototype.is_dying = function() {
    return !this.is_alive() && !this.remove_me;
};

Mobile.prototype.is_target_in_range = function(x, y) {
    return this.target && ZIL_UTIL.get_shape_distance(this.parent, this.target, x, y) <= this.parent.get_range();
};

Mobile.prototype.is_target_in_range_on_path = function() {
    var current_ap = this.ap;
    for(var i = 0; this.move_path && current_ap > 0 && i < this.move_path.length; i++, current_ap--) {
        var node = this.move_path[i];
        if(this.is_target_in_range(node[0], node[1])) {
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
    position.y -= this.shape.depth * 15;
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
    console.log("+++ " + this.target.mobile.get_name() + " takes " + damage + "(a:" + a + "/d:" + d + ") points of damage.");
    this.target.mobile.cause_damage(damage);
};

Mobile.prototype.cause_damage = function(damage) {
    this.hp -= damage;
    console.log("+++ (remaining hp=" + this.hp +  ")");
    if(damage > 0)
        ZIL.log(this.get_name() + " takes " + damage + " point" + (damage == 1 ? "" : "s") + " of damage.", this == ZIL.player ? "console_alert" : null);

    if(damage > 0) {
        // animate damage
        this.show_above(damage, "damage");

        // dead?
        if (!this.is_alive()) {

            // experience gain
            if(!this.ai_move) {
                this.receive_exp(Math.max(this.level - this.level, 1) * 50);
            }

            // target death
            ZIL.creature_dead(this.parent);
        }
    }
};

Mobile.prototype.receive_exp = function(exp) {
    var old_level = this.level;
    this.exp += exp;
    this.parent.set_level_from_exp();
    if(this.level > old_level) {
        $("#level_up").show();
        setTimeout(function() {
            $("#level_up").hide();
        }, 2000);
    }
    ZIL.player.save_stats();
};

Mobile.prototype.look_for_target = function() {
    if (this.target_action) return;
    if (this.parent.is_peaceful()) return;

    var c = this.find_target();
    if(c) this.set_target(c);

    if (this.target_action == null) return;

    if(this.target_action == "attack") {
        ZIL.start_combat();
    }
};

Mobile.prototype.can_reach_creature = function(creature) {

    var cx = (this.x / ZilShape.PATH_RES)|0;
    var cy = (this.y / ZilShape.PATH_RES)|0;
    var start = ZIL.shape.nodes[cx][cy];

    cx = (creature.mobile.x / ZilShape.PATH_RES)|0;
    cy = (creature.mobile.y / ZilShape.PATH_RES)|0;
    var end = ZIL.shape.nodes[cx][cy];

    return ZIL.shape.can_reach(10000, start, end, this.parent, true);
};

Mobile.prototype.find_target = function(force_action) {
    var cx = (this.x / ZIL_UTIL.CHUNK_SIZE)|0;
    var cy = (this.y / ZIL_UTIL.CHUNK_SIZE)|0;
    for(var dx = -8; dx <= 8; dx++) {
        for(var dy = -8; dy <= 8; dy++) {
            var creatures = Mobile.get_for_chunk(cx + dx, cy + dy);
            for(var i = 0; i < creatures.length; i++) {
                var c = creatures[i];

                // help friends if needed/can (this can be self)

                // attack foes
                if(c.mobile.alignment != this.alignment) {
                    if(ZIL.in_combat || force_action || 50 < Math.random() * 100) {
                        // expensive check so only run if needed
                        if(!this.can_reach_creature(c)) continue;
                        return c;
                    }
                }
            }
        }
    }
    return null;
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
//    return this.monster ? this.monster.name + "-" + this.parent.id : "player";
    return this.monster ? this.monster.name : "player";
};

Mobile.prototype.to_string = function() {
    return this.get_name() + " ap=" + this.ap + " hp=" + this.hp;
};

Mobile.prototype.say = function(message, on_render) {
    this.show_above(message, "convo_bubble");
    if(on_render) on_render($(".convo_bubble"));
};

Mobile.hide_convos = function() {
    $(".convo_bubble").remove();
};

Mobile.prototype.has_spell = function(spell) {
    return this.spells.indexOf(spell) > -1;
};

Mobile.prototype.add_spell = function(spell) {
    this.spells.push(spell);
    ZIL.log(this.get_name() + " finds a scroll. It tingles with power.");
};

Mobile.prototype.cast_spell_by_name = function(name) {
    var spell = Spell.SPELLS_BY_NAME[name];
    if(!spell) {
        ZIL.log("There is no spell named " + name);
    } else if(this.has_spell(spell)) {
        this.cast_spell(spell);
    } else {
        ZIL.log("You don't have a spell named " + name);
    }
};

Mobile.prototype.cast_spell = function(spell) {
    ZIL.log(this.get_name() + " intones: " + spell.name.toUpperCase() + "!", "console_special");
    var key = "spell_" + spell.name;
    var c = this.cooldowns[key];
    if(c == null) {
        this.cooldowns[key] = true;
        ZilCal.schedule("cooldown-" + key, spell.cooldown, ZIL_UTIL.bind(this, function() {
            delete this.cooldowns[key];
        }));
        this.casting_spell = spell;
        this.casting_spell_move = 0;
        this.init_casting_particles();
        spell.play_music();
        spell.start_fx(this.parent, this.target || this.parent);
    } else {
        ZIL.log("...and nothing happens.");
    }
};

Mobile.prototype.init_casting_particles = function() {
    // spell casting particles
    if(this.cast_particles == null) {
        this.cast_geometry = new THREE.Geometry();

        for(var i = 0; i < 4000; i++) this.cast_geometry.vertices.push(new THREE.Vector3());

        this.cast_material = new THREE.PointCloudMaterial({
            size: 30,
            map: ZIL_UTIL.particle_sprite1,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true,
            fog: false
        });

        this.cast_particles = new THREE.PointCloud(this.cast_geometry, this.cast_material);
    }
    for(var i = 0; i < 4000; i++) {
        var vertex = this.cast_geometry.vertices[i];
        vertex.x = Math.random() * 4 - 2;
        vertex.y = Math.random() * 4 - 2;
        vertex.z = Math.random() * 3;
    }

    // re-init the spell casting particles
    this.cast_material.color.setRGB(0.1, 0.5, 0.95);
    this.cast_material.opacity = 1;
    this.cast_geometry.colorsNeedUpdate = true;
    this.cast_geometry.verticesNeedUpdate = true;
    this.shape_obj.add(this.cast_particles);
};
