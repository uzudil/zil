var ZilShape = function(category, name, shape, width, height, depth) {
	this.category = category;
	this.name = name;
	this.shape = shape; // what to persist
	this.width = width;
	this.height = height;
	this.depth = depth;
	this.bounds = { w: 0, h: 0, d: 0 };
	this.undo_shape = null;
    this.rotation = 0;
	this.reset_shape();
};

ZilShape.SHAPE_CACHE = {};

ZilShape.prototype.reset_shape = function(skip_expand) {
    this.chunks_in_memory = {};
	this.chunks_on_screen = {};
	this.all_chunks_updated = true;
	this.chunks_updated = {};

    // do this last
    if(!skip_expand) this.expand_all();
};

ZilShape.prototype.set_undo_shape = function() {
	this.undo_shape = {};
	for(k in this.shape) {
		this.undo_shape[k] = this.shape[k];
	}
};

ZilShape.prototype.undo = function() {
	if(this.undo_shape != null) {
		this.shape = {};
		for(var k in this.undo_shape) {
			this.shape[k] = this.undo_shape[k];
		}
		this.expand_all();
	}
};

ZilShape.prototype.mark_chunk_updated = function(key) {
	var pos = ZilShape._pos(key);
	var cx = (pos[0] / ZIL_UTIL.CHUNK_SIZE)|0;
	var cy = (pos[1] / ZIL_UTIL.CHUNK_SIZE)|0;
	var cz = (pos[2] / ZIL_UTIL.CHUNK_SIZE)|0;
	var chunk_key = [cx, cy, cz].join(",");
	this.chunks_updated[chunk_key] = true;
};

ZilShape.prototype.expand_shape = function(key) {
	var value = this.shape[key];
	if(isNaN(value)) {
		var s = value.name.split(".");
		child_shape = ZilShape.load_shape(s[0], s[1]);
        if(value.rot) {
            for (var i = 0; i < value.rot; i++) {
                child_shape.rotate(1);
            }
        }

		var pos = ZilShape._pos(key);
		for(var child_key in child_shape.expanded_shape) {
			var child_value = child_shape.expanded_shape[child_key];
			var child_pos = ZilShape._pos(child_key);
			var new_key = ZilShape._key(pos[0] + child_pos[0], pos[1] + child_pos[1], pos[2] + child_pos[2]);
			this.mark_chunk_updated(new_key);
			this.expanded_shape[new_key] = child_value;
			this.shape_pos[new_key] = key;
		}

	} else {
		this.mark_chunk_updated(key);
		this.expanded_shape[key] = value;
	}
};

ZilShape.prototype.expand_all = function() {
	this.all_chunks_updated = true;
	this.expanded_shape = {}; // what to draw
	this.shape_pos = {}; // where are the child shapes
	for(var key in this.shape) {
		this.expand_shape(key);
	}
};
	
ZilShape.load_shape = function(category_name, shape_name, skip_bounds) {
	var name = category_name + "." + shape_name;
	var shape_obj = ZilShape.SHAPE_CACHE[name];
	if(!shape_obj || skip_bounds) { // load from scratch when skip_bounds is true (so we update changed child shapes)
		console.log("* Loading shape: " + name);
		var js = window.localStorage[name];
		var shape = js ? JSON.parse(js) : { width: ZIL_UTIL.WIDTH, height: ZIL_UTIL.HEIGHT, depth: ZIL_UTIL.DEPTH, shape: {} };
		var shape_obj = new ZilShape(category_name, shape_name, shape.shape, shape.width, shape.height, shape.depth);
		if(!skip_bounds) {
			shape_obj.calculate_bounds();
		}
		ZilShape.SHAPE_CACHE[name] = shape_obj;
	}
	return shape_obj;
};

ZilShape.prototype.save_shape = function() {
	var obj = {
		width: this.width,
		height: this.height,
		depth: this.depth,
		shape: this.shape
	}
	var name = this.category + "." + this.name;
	window.localStorage[name] = JSON.stringify(obj);
	ZilShape.SHAPE_CACHE[name] = this;
};

ZilShape.prototype.calculate_bounds = function() {
	// find the bounds
	var min_x = null, max_x = null, min_y = null, max_y = null, min_z = null, max_z = null;
	for(var key in this.shape) {
		var pos = ZilShape._pos(key);
		if(min_x == null || pos[0] < min_x) min_x = pos[0];
		if(min_y == null || pos[1] < min_y) min_y = pos[1];
		if(min_z == null || pos[2] < min_z) min_z = pos[2];
		if(max_x == null || pos[0] > max_x) max_x = pos[0];
		if(max_y == null || pos[1] > max_y) max_y = pos[1];
		if(max_z == null || pos[2] > max_z) max_z = pos[2];
	}
	this.bounds = {
		w: max_x - min_x + 1,
		h: max_y - min_y + 1,
		d: max_z - min_z + 1
	};

	// reposition the shape to the origin
	var new_shape = {};
	for(var key in this.shape) {
		var pos = ZilShape._pos(key);
		var new_key = ZilShape._key(pos[0] - min_x, pos[1] - min_y, pos[2] - min_z);
		new_shape[new_key] = this.shape[key];
	}
	this.shape = new_shape;
};

ZilShape._key = function(x, y, z) {
	return [x, y, z].join(",");
};

ZilShape._pos = function(key) {
	return $.map(key.split(","), function(x) { return parseInt(x, 10); });
};

ZilShape.prototype.del_position = function(x, y, z) {
	var key = ZilShape._key(x, y, z);
	if(key in this.shape_pos) {
		// where the child shape was placed
		var origin_key = this.shape_pos[key]; 
		var origin_pos = ZilShape._pos(origin_key);
		
		// remove all child shape points
		console.log("* removing shape ", this.shape[origin_key].name);
		var s = this.shape[origin_key].name.split(".");
		var child_shape = ZilShape.load_shape(s[0], s[1]);
		for(var child_key in child_shape.expanded_shape) {
			var child_pos = ZilShape._pos(child_key);
			var new_key = ZilShape._key(
				origin_pos[0] + child_pos[0], 
				origin_pos[1] + child_pos[1], 
				origin_pos[2] + child_pos[2]);
			this.mark_chunk_updated(new_key);
			delete this.expanded_shape[new_key];
			delete this.shape_pos[new_key];
		}
		delete this.shape[origin_key];
	} else {
		delete this.shape[key];
		delete this.expanded_shape[key];
		this.mark_chunk_updated(key);
	}
};

ZilShape.prototype.set_position = function(x, y, z, value) {
	var key = ZilShape._key(x, y, z);
	this.shape[key] = value;
	this.expand_shape(key);
};

ZilShape.prototype.get_position = function(x, y, z) {
	return this.expanded_shape[ZilShape._key(x, y, z)];
};

ZilShape.prototype.get_highest_empty_space = function(x, y, shape) {
    var max_z = 0;
    var w = 1;
    var h = 1;
    if(shape) {
        w = shape.bounds.w;
        h = shape.bounds.h;
    }
    for(var xx = 0; xx < w; xx++) {
        for (var yy = 0; yy < h; yy++) {
            var z = this.get_highest_empty_space_at_point(x + xx, y + yy);
            if(z > max_z) max_z = z;
        }
    }
    return max_z;
};

ZilShape.prototype.get_highest_empty_space_at_point = function(x, y) {
    for (var z = ZIL_UTIL.DEPTH - 2; z >= 0; z--) {
        if (this.get_position(x, y, z) != null) return z + 1;
    }
    return 0; // all free
};

ZilShape.prototype.set_shape = function(x, y, z, child_shape) {
	// todo: add rotation
	var key = ZilShape._key(x, y, z);
	this.shape[key] = { name: child_shape.category + "." + child_shape.name, rot: child_shape.rotation };
	this.expand_shape(key);
};

ZilShape.prototype.clear_shape = function() {
	this.shape = {};
	this.expanded_shape = {};
	this.all_chunks_updated = true;
};


ZilShape.prototype.render_shape = function(parent_shape, position_offset) {
	if(position_offset == null) position_offset = ZIL_UTIL.ORIGIN;
	if(parent_shape == null) parent_shape = new THREE.Object3D();

	var drawn_chunks = {};
	var cx, cy, cz, gx, gy, gz, chunk_key, chunk;
	for(var x = 0; x < ZIL_UTIL.VIEW_WIDTH; x+=ZIL_UTIL.CHUNK_SIZE) {
		gx = position_offset[0] + x;
		for(var y = 0; y < ZIL_UTIL.VIEW_HEIGHT; y+=ZIL_UTIL.CHUNK_SIZE) {
			gy = position_offset[1] + y;
			for(var z = 0; z < ZIL_UTIL.VIEW_DEPTH; z+=ZIL_UTIL.CHUNK_SIZE) {
				gz = position_offset[2] + z;

				cx = (gx / ZIL_UTIL.CHUNK_SIZE)|0;
				cy = (gy / ZIL_UTIL.CHUNK_SIZE)|0;
				cz = (gz / ZIL_UTIL.CHUNK_SIZE)|0;
				chunk_key = [cx, cy, cz].join(",");				
				
				// create the chunk
				if(this.chunks_in_memory[chunk_key] == null) {
					chunk = new Chunk(chunk_key);
					this.chunks_in_memory[chunk_key] = chunk;
				}

				// render the chunk if needed
				chunk = this.chunks_in_memory[chunk_key];
				if(this.all_chunks_updated || this.chunks_updated[chunk_key]) {
                    if(chunk.shape && this.chunks_on_screen[chunk_key]) {
                        // remove the shape, since we're recreating it
                        parent_shape.remove(chunk.shape);
                        delete this.chunks_on_screen[chunk_key];
                    }
					this.render_chunk(cx, cy, cz, chunk);
					this.chunks_updated[chunk_key] = false;
				}

                // here chunk.shape can be null if it's a blank chunk
                if(chunk.shape) {
                    // if not visible, add it
                    if (this.chunks_on_screen[chunk_key] == null) {
                        parent_shape.add(chunk.shape);
                        this.chunks_on_screen[chunk_key] = true;
                    }

                    // position the chunk
                    chunk.shape.position.set(cx * ZIL_UTIL.CHUNK_SIZE - position_offset[0], cy * ZIL_UTIL.CHUNK_SIZE - position_offset[1], cz * ZIL_UTIL.CHUNK_SIZE - position_offset[2]);

                    // remember we drew it
                    drawn_chunks[chunk_key] = true;
                }
			}
		}
	}
	this.all_chunks_updated = false;
	for(var _chunk_key in this.chunks_on_screen) {
		if(_chunk_key && drawn_chunks[_chunk_key] == null) {
			var _chunk = this.chunks_in_memory[_chunk_key];
			// remove from screen
			parent_shape.remove(_chunk.shape);
			delete this.chunks_on_screen[_chunk_key];
            // todo: remove from memory also eventually... (maybe when far from player)
//			delete this.chunks_in_memory[_chunk_key];

		}
	}
	// console.log("added " + parent_shape.children.length + " shapes");
	return parent_shape;
};

ZilShape.prototype.render_chunk = function(cx, cy, cz, chunk) {
	for(var xx = 0; xx < ZIL_UTIL.CHUNK_SIZE; xx++) {
		for(var yy = 0; yy < ZIL_UTIL.CHUNK_SIZE; yy++) {
			for(var zz = 0; zz < ZIL_UTIL.CHUNK_SIZE; zz++) {
				var block = chunk.blocks[xx][yy][zz];
				var color = this.get_position(cx * ZIL_UTIL.CHUNK_SIZE + xx, cy * ZIL_UTIL.CHUNK_SIZE + yy, cz * ZIL_UTIL.CHUNK_SIZE + zz);
				if(color == null) {
					block.active = false;
				} else {
					block.active = true;
					block.color = color;
				}
			}
		}
	}
	chunk.render(true); // force refresh
};

ZilShape.prototype.rotate = function(dir) {
    this.rotation += dir;
    if (this.rotation >= 4) this.rotation -= 4;
    if (this.rotation < 0) this.rotation += 4;

    var tmp = this.bounds.w;
    this.bounds.w = this.bounds.h;
    this.bounds.h = tmp;
    var new_shape = {};
    for(var key in this.expanded_shape) {
        var value = this.expanded_shape[key];
        var pos = ZilShape._pos(key);
        var new_key = dir > 0 ?
            ZilShape._key(this.bounds.w - 1 - pos[1], pos[0], pos[2]) :
            ZilShape._key(pos[1], this.bounds.h - 1 - pos[0], pos[2]);
        new_shape[new_key] = value;
    }
    this.expanded_shape = new_shape;

    this.reset_shape(true);
};