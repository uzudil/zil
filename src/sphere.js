function Sphere(color1, color2, depth, options) {
    this.recreate_shape(color1, color2, depth, options);
}

Sphere.prototype.recreate_shape = function(color1, color2, depth, options) {
    this.width = depth ? depth : ZIL_UTIL.CHUNK_SIZE;
    this.height = depth ? depth : ZIL_UTIL.CHUNK_SIZE;
    this.depth = depth ? depth : ZIL_UTIL.CHUNK_SIZE;
    this.color1 = color1;
    this.color2 = color2;
    this.options = options;
    this.regen();
};

Sphere.prototype.regen = function() {
    this.shape = {};
    var v = new THREE.Vector3();
    var r = this.depth/2;
    for(var x = -r; x < r; x++) {
        for(var y = -r; y < r; y++) {
            for(var z = -r; z < r; z++) {
                v.set(x, y, z);
                if(v.length() <= r) {
                    var color = Math.random() * 10 < 7 ? this.color1 : this.color2;
                    this.shape[ZilShape._key(x + r, y + r, z + r)] = color;
                }
            }
        }
    }
    this.shape_obj = new ZilShape("shapes", "sphere", this.shape, this.width, this.height, this.depth);
    this.shape_obj.make_hollow();
};

function Box(color1, color2, width, height, depth, options) {
    this.recreate_shape(color1, color2, width, height, depth, options);
}

Box.prototype.recreate_shape = function(color1, color2, width, height, depth, options) {
    this.width = width ? width : ZIL_UTIL.CHUNK_SIZE;
    this.height = height ? height : ZIL_UTIL.CHUNK_SIZE;
    this.depth = depth ? depth : ZIL_UTIL.CHUNK_SIZE;
    this.color1 = color1;
    this.color2 = color2;
    this.options = options;
    this.regen();
};

Box.prototype.regen = function() {
    this.shape = {};
    for(var x = 0; x < this.width; x++) {
        for(var y = 0; y < this.height; y++) {
            for(var z = 0; z < this.depth; z++) {
                var color = Math.random() * 10 < 7 ? this.color1 : this.color2;
                this.shape[ZilShape._key(x, y, z)] = color;
            }
        }
    }
    this.shape_obj = new ZilShape("shapes", "box", this.shape, this.width, this.height, this.depth);
    this.shape_obj.make_hollow();
};
