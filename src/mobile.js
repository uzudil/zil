// a thing that can move
function Mobile(x, y, z, category, shape, parent) {
    this.x = x;
    this.y = y;
    this.z = z;
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

Mobile.prototype.random_move = function(map_shape, gx, gy, gz) {
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
        var nz = map_shape.get_highest_empty_space(nx, ny, this.shape);

        // if possible go there
        if(Math.abs(nz - this.z) <= 1) {
            this.move_to(nx, ny, nz, gx, gy, gz);
            break;
        }
    }
};
