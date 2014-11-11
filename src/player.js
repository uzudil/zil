function Player(x, y) {
    this.x = x;
    this.y = y;
    this.z = null;
    this.shape = ZilShape.load_shape("creatures", "player");
}

Player.prototype.move_to = function(map_shape, nx, ny, nz) {
    map_shape.del_shape(this.x, this.y, this.z, this.shape);
    this.x = nx;
    this.y = ny;
    this.z = nz;
    this.move(map_shape);
};

Player.prototype.move = function(map_shape) {
    if(this.z == null) this.z = map_shape.get_highest_empty_space(this.x, this.y, this.shape);
    map_shape.set_shape(this.x, this.y, this.z, this.shape);
};
