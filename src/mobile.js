// a thing that can move
function Mobile(x, y, z, category, shape, parent) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.parent = parent;
    this.shapes = [];
    for(var i = 0; i < 4; i++) {
        this.shapes.push(ZilShape.load_shape(category, shape, i));
    }
    this.placed = false;
    this.last_x = x;
    this.last_y = y;
    this.last_z = z;
    this.shape_index = 2;
    this.shape = this.shapes[this.shape_index];
    this._set_chunk_pos(true);
}

Mobile.CHUNK_MAP = {};

Mobile.prototype._set_chunk_pos = function(force) {
    if(this.parent) {
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

Mobile.get_for_chunk = function(chunk_x, chunk_y) {
    return Mobile.CHUNK_MAP["" + chunk_x + "," + chunk_y];
};

Mobile.prototype.move_to = function(map_shape, nx, ny, nz) {
    this.set_active(map_shape, false);
    this.x = nx;
    this.y = ny;
    this.z = nz;
    this._set_chunk_pos();

    // todo: add smooth rotation here...
    if(this.x > this.last_x) this.set_shape(ZIL_UTIL.W);
    else if(this.x < this.last_x) this.set_shape(ZIL_UTIL.E);
    else if(this.y > this.last_y) this.set_shape(ZIL_UTIL.N);
    else if(this.y < this.last_y) this.set_shape(ZIL_UTIL.S);
    this.move(map_shape);
    this.last_x = this.x;
    this.last_y = this.y;
    this.last_z = this.z;
};

Mobile.prototype.set_shape = function(index) {
    this.shape_index = index;
    this.shape = this.shapes[this.shape_index];
};

Mobile.prototype.remove = function(map_shape) {
    map_shape.set_active(this.x, this.y, this.z, this.shape, false);
};

Mobile.prototype.move = function(map_shape) {
    if(this.z == null) this.z = map_shape.get_highest_empty_space(this.x, this.y, this.shape);
    if(this.placed) {
        map_shape.move_to(this.x, this.y, this.z, this.shape);
    } else {
        map_shape.set_shape(this.x, this.y, this.z, this.shape);
        this.placed = true;
    }
};

Mobile.prototype.random_move = function(map_shape) {
    // in 5 tries,
    for(var attempt = 0; attempt < 5; attempt++) {

        var nx = this.x;
        var ny = this.y;

        // pick a direction
        var d = (Math.random() * 4)|0;
        switch(d) {
            case 0: nx--; break;
            case 1: nx++; break;
            case 2: ny--; break;
            case 3: ny++; break;
        }

        // can we step there?
        this.set_active(map_shape, false);
        var nz = map_shape.get_highest_empty_space(nx, ny, this.shape);
        this.set_active(map_shape, true);

        // if possible go there
        if(Math.abs(nz - this.z) <= 1) {
            this.move_to(map_shape, nx, ny, nz);
            break;
        }
    }
};

Mobile.prototype.set_active = function(map_shape, active) {
    map_shape.set_active(this.x, this.y, this.z, this.shape, active);
};
