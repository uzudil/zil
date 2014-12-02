function Rocks(color1, color2) {
    this.recreate_shape(color1, color2);
}

Rocks.prototype.recreate_shape = function(color1, color2, width, height, depth) {
    this.width = width ? width : ZIL_UTIL.CHUNK_SIZE;
    this.height = height ? height : ZIL_UTIL.CHUNK_SIZE;
    this.depth = depth ? depth : 8;
    this.color1 = color1;
    this.color2 = color2;
    this.regen();
};

Rocks.prototype.regen = function() {
    this.shape = {};
    for(var x = 0; x < this.width; x++) {
        for(var y = 0; y < this.height; y++) {
            for(var z = 0; z < this.depth; z++) {
                var color = Math.random() * 10 < 7 ? this.color1 : this.color2;
                this.shape[ZilShape._key(x, y, z)] = color;
            }
        }
    }
    for(var i = 0; i < 5; i++) {
        this.erode_shape();
    }
    this.apply_gravity();
    this.shape_obj = new ZilShape("rocks", "rock", this.shape, this.width, this.height, this.depth);
    this.shape_obj.save_shape();
};

// push floating bits down
Rocks.prototype.apply_gravity = function() {
    for(var x = 0; x < this.width; x++) {
        for(var y = 0; y < this.height; y++) {
            for(var z = 2; z < this.depth; z++) {
                if(this.shape[ZilShape._key(x, y, z)] != null) {
                    var nz = z - 1;
                    while (nz > 1) {
                        if (this.shape[ZilShape._key(x, y, nz)] != null) break;
                        nz--;
                    }
                    if (z != nz + 1) {
                        this.shape[ZilShape._key(x, y, nz + 1)] = this.shape[ZilShape._key(x, y, z)];
                        delete this.shape[ZilShape._key(x, y, z)];
                    }
                }
            }
        }
    }
};

Rocks.prototype.erode_shape = function() {
    for(var x = 0; x < this.width; x++) {
        for(var y = 0; y < this.height; y++) {
            for(var z = 0; z < this.depth; z++) {
                var neighbors = this.get_neighbor_count(x, y, z);
                if(neighbors < 18 && Math.random() * 10 > 5) {
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
            for(var dz = -1; dz <= 1; dz++) {
                var zz = z + dz;
                if(zz <= 2 || this.shape[ZilShape._key(x + dx, y + dy, zz)] != null) {
                    neighbors++;
                }
            }
        }
    }
    return neighbors;
};
