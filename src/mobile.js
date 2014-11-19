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
    this.shapes = [];
    this.shape_objects = [];
    for(var i = 0; i < 4; i++) {
        var s = ZilShape.load_shape(category, shape, i);
        s.build_shape_inline();
        this.shapes.push(s);
        this.shape_objects.push(s.render_shape());
    }
    this.last_x = x;
    this.last_y = y;
    this.last_z = z;
    this.shape_index = 2;
    this.shape = this.shapes[this.shape_index];
    this.shape_obj = this.shape_objects[this.shape_index];
    this._set_chunk_pos(true);
}

Mobile.prototype.to_string = function() {
    return this.x + "," + this.y + "," + this.z;
};

Mobile.CHUNK_MAP = {};

Mobile.prototype._set_chunk_pos = function(force) {
    if(this.parent.ai_move) {
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
    }
};

Mobile.EMPTY_LIST = [];
Mobile.get_for_chunk = function(chunk_x, chunk_y) {
    return Mobile.CHUNK_MAP["" + chunk_x + "," + chunk_y] || Mobile.EMPTY_LIST;
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
};

Mobile.prototype.set_shape = function(index) {
    this.shape_index = index;
    this.shape = this.shapes[this.shape_index];

    var parent = this.shape_obj.parent;
    if(parent) parent.remove(this.shape_obj);
    this.shape_obj = this.shape_objects[this.shape_index];
    if(parent) parent.add(this.shape_obj);
};

Mobile.prototype.move = function(gx, gy, gz) {
    this.shape_obj.position.set(this.x - gx, this.y - gy, this.z - gz);
};

Mobile.prototype.creature_move = function(map_shape, gx, gy, gz, delta_time) {
    // plan the move
    if(this.move_path == null && this.sleep_turns == null) {
        var dir = (Math.random() * 5)|0;
        var dx = this.x;
        var dy = this.y;
        var dz = this.z;
        var dist = (Math.random() * 48)|0;

        if(dir > ZIL_UTIL.W) {
            this.move_path = null;
            this.move_path_index = 0;
            this.sleep_turns = dist;
        } else {
            this.move_path = [];
            this.move_path_index = 0;
            this.sleep_turns = null;
            for (var i = 0; i < dist; i++) {
                switch(dir) {
                    case ZIL_UTIL.N: dy--; break;
                    case ZIL_UTIL.E: dx++; break;
                    case ZIL_UTIL.S: dy++; break;
                    case ZIL_UTIL.W: dx--; break;
                }
                var pz = dz;
                dz = map_shape.get_highest_empty_space(dx, dy, this.shape) - 1;
                var node = map_shape.get_node(dx, dy, dz);
                if(node == null || Math.abs(dz - pz) > 1) break;
                this.move_path.push(node);
            }
            if(this.move_path.length == 0) this.move_path = null;
        }
//        console.log(">>> creature " + this.parent.id + " sleep_turns=" + this.sleep_turns  + " move_path=", this.move_path);
    }

    // step on path
    this.move_step(gx, gy, gz, delta_time);
};

Mobile.prototype.plan_move_to = function(map_shape, x, y, z) {
    var start_point = [this.x, this.y, this.z - 1];
    if(z == null) z = map_shape.get_highest_empty_space(x, y, this.shape) - 1;
    var end_point = [x, y, z];

    var p = map_shape.astar_search(start_point, end_point, this.shape);

    if(p && p.length) {
        this.move_path_index = 0;
        this.move_path = p;
        this.sleep_turns = null;
    }
};

/**
 * Move this mobile one step on the path.
 * @param gx global x
 * @param gy global y
 * @param gz global z
 * @param delta_time time since last frame (millis)
 * @returns {boolean}
 */
Mobile.prototype.move_step = function(gx, gy, gz, delta_time) {
    if(this.move_path || this.sleep_turns != null) {
        this.move_time += delta_time;
        if(this.move_time > this.parent.speed) {
            this.move_time = 0;

            // sleep
            if(this.sleep_turns != null) {
                this.move_to(this.x, this.y, this.z, gx, gy, gz);
                if(this.sleep_turns-- <= 0) this.sleep_turns = null;
                return;
            }

            var node = this.move_path[this.move_path_index];
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
