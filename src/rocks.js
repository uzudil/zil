function Rocks(color1, color2) {
    this.recreate_shape(color1, color2);
}

Rocks.prototype.recreate_shape = function(color1, color2, width, height, depth) {
    this.width = width ? width : ZIL_UTIL.CHUNK_SIZE;
    this.height = height ? height : ZIL_UTIL.CHUNK_SIZE;
    this.depth = depth ? depth : 8;
    this.shape = {};
    for(var x = 0; x < this.width; x++) {
        for(var y = 0; y < this.height; y++) {
            for(var z = 0; z < this.depth; z++) {
                var color = Math.random() * 10 < 7 ? color1 : color2;
                this.shape[ZilShape._key(x, y, z)] = color;
            }
        }
    }
    this.shape_obj = new ZilShape("rocks", "rock", this.shape, this.width, this.height, this.depth);
    this.shape_obj.save_shape();
};
