function Rocks(color1, color2, width, height, depth) {
    this.recreate_shape(color1, color2, width, height, depth);
}

Rocks.prototype.recreate_shape = function(color1, color2, width, height, depth) {
    this.width = width ? width : ZIL_UTIL.CHUNK_SIZE;
    this.height = height ? height : ZIL_UTIL.CHUNK_SIZE;
    this.depth = depth ? depth : ZIL_UTIL.CHUNK_SIZE;
    this.color1 = color1;
    this.color2 = color2;
    this.regen();
};

Rocks.prototype.regen = function() {
    this.shape = {};
    for(var x = 0; x < this.width; x++) {
        for(var y = 0; y < this.height; y++) {
            for(var z = 0; z < this.depth; z++) {
                if(Math.random() * 10 >= 2) {
                    var color = Math.random() * 10 < 7 ? this.color1 : this.color2;
                    this.shape[ZilShape._key(x, y, z)] = color;
                }
            }
        }
    }
    for(var i = 0; i < 5; i++) {
        this.erode_shape();
    }
    this.apply_gravity();
    this.implode();
    this.ensure_wall();
    this.shape_obj = new ZilShape("rocks", "rock", this.shape, this.width, this.height, this.depth);
};

// make sure around the base of the rock is high enough so pathfinding avoids climbing onto the wall.
Rocks.MIN_WALL_HEIGHT = 2;
Rocks.prototype.ensure_wall = function() {
    if(this.depth < 8) return;

    while(true) {
        var found = false;
        for(var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                for (var z = this.depth; z >= 0; z--) {
                    if (this.shape[ZilShape._key(x, y, z)]) {

                        if (z >= Rocks.MIN_WALL_HEIGHT ||
                            !(this.shape[ZilShape._key(x - 1, y, z)] == null ||
                                this.shape[ZilShape._key(x + 1, y, z)] == null ||
                                this.shape[ZilShape._key(x, y - 1, z)] == null ||
                                this.shape[ZilShape._key(x, y + 1, z)] == null)
                            ) {
                            break;
                        }

                        for (var zz = z + 1; zz <= Rocks.MIN_WALL_HEIGHT; zz++) {
                            var color = Math.random() * 10 < 7 ? this.color1 : this.color2;
                            this.shape[ZilShape._key(x, y, zz)] = color;
                        }
                        found = true;
                        break;
                    }
                }
            }
        }

        if(!found) break;
    }
};

Rocks.prototype.erode_shape = function() {
    for(var x = 0; x < this.width; x++) {
        for(var y = 0; y < this.height; y++) {
            for(var z = 0; z < this.depth; z++) {
                // max 18 neighbors
                var neighbors = this.get_neighbor_count(x, y, z);
                if(neighbors < 9) {
                    delete this.shape[ZilShape._key(x, y, z)];
                }
            }
        }
    }
};

Rocks.prototype.get_neighbor_count = function(x, y, z) {
    var neighbors = 0;
    for(var dx = -1; dx <= 1; dx++) {
        for(var dy = -1; dy <= 1; dy++) {
            for(var dz = 0; dz <= 1; dz++) {
                if(this.shape[ZilShape._key(x + dx, y + dy, z + dz)] != null) {
                    neighbors++;
                }
            }
        }
    }
    return neighbors;
};

// push floating bits down
Rocks.prototype.apply_gravity = function() {
    for (var x = 0; x < this.width; x++) {
        for (var y = 0; y < this.height; y++) {
            for (var z = 1; z < this.depth; z++) {
                if (this.shape[ZilShape._key(x, y, z)] != null) {
                    var nz = z - 1;
                    while (nz > -1 && this.shape[ZilShape._key(x, y, nz)] == null) nz--;
                    if (nz < z - 1) {
                        this.shape[ZilShape._key(x, y, nz + 1)] = this.shape[ZilShape._key(x, y, z)];
                        delete this.shape[ZilShape._key(x, y, z)];
                    }
                }
            }
        }
    }
};

Rocks.prototype.implode = function() {
    // move toward center
    for(var z = 0; z < this.depth; z++) {

        // spiral out from the middle
        var x = (this.width / 2) | 0;
        var y = (this.height / 2) | 0;
        var r = 0;
        while(r <= (Math.max(this.width, this.height) / 2)|0) {
            var sx = x;
            var sy = y;
            var steps_count = r * 2 + 1;
            for (var dir = ZIL_UTIL.N; dir <= ZIL_UTIL.W; dir++) {
                for(var steps = 0; steps < steps_count; steps++) {

                    this.move_to_center(x, y, z);

                    switch(dir) {
                        case ZIL_UTIL.N: y--; break;
                        case ZIL_UTIL.S: y++; break;
                        case ZIL_UTIL.W: x--; break;
                        case ZIL_UTIL.E: x++; break;
                    }
                }
            }
            x = sx - 1;
            y = sy + 1;
            r++;
        }
    }
};

Rocks.prototype.move_to_center = function(x, y, z) {
    if(this.shape[ZilShape._key(x, y, z)]) {
        var moved = true;
        var xx = x;
        var yy = y;

        while (moved) {
            moved = false;
            var hx = ((this.width / 2)|0);
            var hy = ((this.height / 2)|0);

            // can it go towards the middle on x and y?
            var dirx = xx < hx ? 1 : -1;
            var diry = yy < hy ? 1 : -1;
            if (xx != hx && yy != hy) {
                if (this.shape[ZilShape._key(xx + dirx, yy + diry, z)] == null) {
                    this.shape[ZilShape._key(xx + dirx, yy + diry, z)] = this.shape[ZilShape._key(xx, yy, z)];
                    delete this.shape[ZilShape._key(xx, yy, z)];
                    moved = true;
                    xx += dirx;
                    yy += diry;
                    continue;
                }
            }


            // can it go towards the middle on x?
            if (xx != hx) {
                if (this.shape[ZilShape._key(xx + dirx, yy, z)] == null) {
                    this.shape[ZilShape._key(xx + dirx, yy, z)] = this.shape[ZilShape._key(xx, yy, z)];
                    delete this.shape[ZilShape._key(xx, yy, z)];
                    moved = true;
                    xx += dirx;
                }
            }

            // can it go towards the middle on y?
            if (yy != hy) {
                if (this.shape[ZilShape._key(xx, yy + diry, z)] == null) {
                    this.shape[ZilShape._key(xx, yy + diry, z)] = this.shape[ZilShape._key(xx, yy, z)];
                    delete this.shape[ZilShape._key(xx, yy, z)];
                    moved = true;
                    yy += diry;
                }
            }
        }
    }
};
