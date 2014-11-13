// a thing that can move
function Mobile(x, y, z, category, shape) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.shapes = [];
    for(var i = 0; i < 4; i++) {
        this.shapes.push(ZilShape.load_shape(category, shape, i));
    }
    this.last_x = x;
    this.last_y = y;
    this.shape_index = 2;
    this.shape = this.shapes[this.shape_index];
}

Mobile.prototype.move_to = function(map_shape, nx, ny, nz) {
    this.remove(map_shape);
    this.x = nx;
    this.y = ny;
    this.z = nz;

    // todo: add smooth rotation here...
    if(this.x > this.last_x) this.set_shape(ZIL_UTIL.W);
    else if(this.x < this.last_x) this.set_shape(ZIL_UTIL.E);
    else if(this.y > this.last_y) this.set_shape(ZIL_UTIL.N);
    else if(this.y < this.last_y) this.set_shape(ZIL_UTIL.S);
    this.last_x = this.x;
    this.last_y = this.y;
    this.move(map_shape);
};

Mobile.prototype.set_shape = function(index) {
    this.shape_index = index;
    this.shape = this.shapes[this.shape_index];
};

Mobile.prototype.remove = function(map_shape) {
    map_shape.del_shape(this.x, this.y, this.z, this.shape);
};

Mobile.prototype.move = function(map_shape) {
    if(this.z == null) this.z = map_shape.get_highest_empty_space(this.x, this.y, this.shape);
    map_shape.set_shape(this.x, this.y, this.z, this.shape);
};
