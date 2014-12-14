var ZilNode = function(x, y, z, value, origin_x, origin_y, origin_z) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.set_value(value, origin_x, origin_y, origin_z);
};

ZilNode.prototype.set_value = function(value, origin_x, origin_y, origin_z) {
    this.value = value;
    this.origin_x = origin_x;
    this.origin_y = origin_y;
    this.origin_z = origin_z;
};

ZilNode.prototype.toString = function() {
    return "[" + this.x + " " + this.y + " " + this.z + "]";
};

ZilNode.prototype.getCost = function(other_node) {
    var dz = Math.abs(this.z - other_node.z);
    return dz <= 1 ? 1 : 100000;
};


var ZilShape = function(category, name, shape, width, height, depth, rotation, loading_delegate, use_boxes) {
	this.category = category;
	this.name = name;
    this.use_boxes = use_boxes;
    var _shape = {};
    for(var key in shape) {
        var value = shape[key];
        if(isNaN(key)) {
            // old type key
            var pos = $.map(key.split(","), function(x) { return parseInt(x, 10); });
            key = ZilShape._key(pos[0], pos[1], pos[2]);
        }
        _shape[key] = value;
    }
	this.shape = _shape; // what to persist
	this.width = width;
	this.height = height;
	this.depth = depth;
	this.bounds = { w: 0, h: 0, d: 0 };
	this.undo_shape = null;
    this.rotation = rotation ? rotation : 0;
    this.loading_delegate = loading_delegate;
    this.expanded_shape = {}; // what to draw
	this.reset_shape();
    for(var i = 0; i < this.rotation; i++) this.rotate(1);
};

ZilShape.prototype.get_rotation = function() {
    return this.rotation * PI/2;
};

ZilShape.SHAPE_CACHE = {};

ZilShape.reset_cache = function() {
    ZilShape.SHAPE_CACHE = {};
};

ZilShape.prototype.invalidate = function() {
    this.chunks_in_memory = {};
	this.chunks_on_screen = {};
	this.all_chunks_updated = true;
	this.chunks_updated = {};
};

ZilShape.prototype.reset_shape = function() {
    this.invalidate();
    this.calculate_bounds();
    // do this last
    this.expand_all();
};

ZilShape.prototype.set_undo_shape = function() {
	this.undo_shape = {};
	for(var k in this.shape) {
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
        var pos = ZilShape._pos(key);
        if(pos[0] > this.width) this.width = pos[0];
        if(pos[1] > this.height) this.height = pos[1];
        if(pos[2] > this.depth) this.depth = pos[2];

        var child_shape = null;
        if(this.loading_delegate) {
            if(value.options && value.options.monster) {
                child_shape = this.loading_delegate.load_monster(value.options.monster, pos);
                // don't include mobile shapes
                if(child_shape == null) return;
            }
        }

        if(child_shape == null) {
            var s = value.name.split(".");
            child_shape = ZilShape.load_shape(s[0], s[1], value.rot);
        }

        this.move_to(pos[0], pos[1], pos[2], child_shape);

	} else {
		this.mark_chunk_updated(key);
        var pos = ZilShape._pos(key);
        this.expanded_shape[key] = new ZilNode(pos[0], pos[1], pos[2], value, pos[0], pos[1], pos[2]);
	}
};

ZilShape.prototype.move_to = function(x, y, z, child_shape) {
    for(var child_key in child_shape.expanded_shape) {
        var child_value = child_shape.expanded_shape[child_key];
        var child_pos = ZilShape._pos(child_key);
        var nx = x + child_pos[0];
        var ny = y + child_pos[1];
        var nz = z + child_pos[2];
        var new_key = ZilShape._key(nx, ny, nz);
        this.mark_chunk_updated(new_key);
        this.expanded_shape[new_key] = new ZilNode(nx, ny, nz, child_value.value, x, y, z);
    }
};

ZilShape.prototype.expand_all = function() {
	this.all_chunks_updated = true;
	this.expanded_shape = {};
	for(var key in this.shape) {
		this.expand_shape(key);
	}
};
	
ZilShape.load_shape = function(category_name, shape_name, rotation, loading_delegate, use_boxes) {
	var name = category_name + "." + shape_name;
    if(rotation == null) rotation = 0;
    var cache_name = name + "." + rotation;
	var shape_obj = ZilShape.SHAPE_CACHE[cache_name];
	if(!shape_obj) { // load from scratch when skip_bounds is true (so we update changed child shapes)
//		console.log("* Loading shape: " + cache_name);
		var js = ZIL_UTIL.get_shape(category_name, shape_name);
		var shape = js ? js : { width: ZIL_UTIL.WIDTH, height: ZIL_UTIL.HEIGHT, depth: ZIL_UTIL.DEPTH, shape: {} };
		shape_obj = new ZilShape(category_name, shape_name, shape.shape, shape.width, shape.height, shape.depth, rotation, loading_delegate, use_boxes);
		ZilShape.SHAPE_CACHE[cache_name] = shape_obj;
	}
    shape_obj.invalidate();
	return shape_obj;
};

ZilShape.prototype.remove_unseen = function(parent_shape) {
    // remove shapes not visible to the user
    var remove = [];
    for(var k in this.shape) {
        var pos = ZilShape._pos(k);
        if(typeof this.shape[k] == "number") {
            if (this.has_static_shape(pos[0] + 1, pos[1], pos[2]) &&
                this.has_static_shape(pos[0], pos[1] + 1, pos[2]) &&
                this.has_static_shape(pos[0], pos[1], pos[2] + 1)) {
                remove.push(pos);
            }
        }
    }
    for(var i = 0; i < remove.length; i++) {
        var pos = remove[i];
        this.del_position(pos[0], pos[1], pos[2]);
    }
};

ZilShape.prototype.has_static_shape = function(x, y, z) {
    var node = this.expanded_shape[ZilShape._key(x, y, z)];
    if(node) {
        var orig = this.shape[ZilShape._key(node.origin_x, node.origin_y, node.origin_z)];
        if(orig && isNaN(orig)) {
            return orig.options == null || orig.options.monster == null;
        } else {
            return true;
        }
    }
    return false;
};

ZilShape.prototype.save_shape = function() {
	var obj = {
		width: this.width,
		height: this.height,
		depth: this.depth,
		shape: this.shape
	};
    ZIL_UTIL.set_shape(this.category, this.name, obj);
	ZilShape.SHAPE_CACHE[this.category + "." + this.name + this.rotation] = this;
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

    // todo: fix duplication
	this.bounds = {
		w: max_x - min_x + 1,
		h: max_y - min_y + 1,
		d: max_z - min_z + 1
	};
    this.width = this.bounds.w;
    this.height = this.bounds.h;
    this.depth = this.bounds.d;

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
	return x * 512 * 512 + y * 512 + z;
};

ZilShape._pos = function(key) {
    var k = key;
    var x = (k / (512 * 512)) | 0;
    k -= x * 512 * 512;
    var y = (k / 512) | 0;
    k -= y * 512;
    return [x, y, k];
};

ZilShape.prototype.set_shape = function(x, y, z, child_shape, options) {
	var key = ZilShape._key(x, y, z);
	this.shape[key] = { name: child_shape.category + "." + child_shape.name, rot: child_shape.rotation, options: options ? options : null };
	this.expand_shape(key);
};

ZilShape.prototype.del_shape = function(x, y, z, child_shape) {
    // remove all child shape points
    for(var child_key in child_shape.expanded_shape) {
        var child_pos = ZilShape._pos(child_key);
        var new_key = ZilShape._key(
            x + child_pos[0],
            y + child_pos[1],
            z + child_pos[2]);
        this.mark_chunk_updated(new_key);
        delete this.expanded_shape[new_key];
    }
    var key = ZilShape._key(x, y, z);
    delete this.shape[key];
};

ZilShape.prototype.del_position = function(x, y, z) {
	var key = ZilShape._key(x, y, z);
    var p = this.expanded_shape[key];
    if(p) {
        var origin_key = ZilShape._key(p.origin_x, p.origin_y, p.origin_z);
        var s_val = this.shape[origin_key];
        if (isNaN(s_val)) {
            var s = s_val.name.split(".");
            var child_shape = ZilShape.load_shape(s[0], s[1], s_val.rot);
            this.del_shape(p.origin_x, p.origin_y, p.origin_z, child_shape);
        } else {
            delete this.shape[key];
            delete this.expanded_shape[key];
            this.mark_chunk_updated(key);
        }
    }
};

ZilShape.prototype.set_position = function(x, y, z, value) {
	var key = ZilShape._key(x, y, z);
	this.shape[key] = value;
	this.expand_shape(key);
};

/* copy as voxels, instead of reference shape, like set_shape() does. */
ZilShape.prototype.include_shape = function(x, y, z, child_shape) {
    for(var key in child_shape.expanded_shape) {
        var pos = ZilShape._pos(key);
        var shape_name_and_pos = this.get_shape_at(x + pos[0], y + pos[1], z + pos[2]);
        // don't erase linked shapes
        if(shape_name_and_pos == null) {
            this.set_position(x + pos[0], y + pos[1], z + pos[2], child_shape.expanded_shape[key].value);
        }
    }
};

ZilShape.prototype.get_position = function(x, y, z) {
    var v = this.expanded_shape[ZilShape._key(x, y, z)];
	return v ? v.value : null;
};

ZilShape.prototype.get_node = function(x, y, z) {
    return this.expanded_shape[ZilShape._key(x, y, z)];
};

ZilShape.prototype.get_shape = function(x, y, z) {
    return this.shape[ZilShape._key(x, y, z)];
};

ZilShape.prototype.get_highest_empty_space = function(x, y, shape) {
    var w = 1;
    var h = 1;
    if (shape) {
        w = shape.bounds.w;
        h = shape.bounds.h;
    }
    return this.get_highest_empty_space_for_rect(x, y, w, h);
};

ZilShape.prototype.get_highest_empty_space_for_rect = function(x, y, w, h) {
    var max_z = 0;
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

ZilShape.prototype.clear_shape = function(parent_shape, position_offset) {
	this.shape = {};
	this.expanded_shape = {};
    for(var _chunk_key in this.chunks_in_memory) {
        var _chunk = this.chunks_in_memory[_chunk_key];
        if(_chunk.shape) {
            parent_shape.remove(_chunk.shape);
        }
    }
    this.invalidate();
};

ZilShape.prototype._build_shape = function(x, y, z, progress_fx, complete_fx) {
    var percent = (x * this.height * this.depth + y * this.depth + z) / (this.width * this.height * this.depth);
    progress_fx(percent);
    var cx = (x / ZIL_UTIL.CHUNK_SIZE)|0;
    var cy = (y / ZIL_UTIL.CHUNK_SIZE)|0;
    var cz = (z / ZIL_UTIL.CHUNK_SIZE)|0;
    var chunk_key = [cx, cy, cz].join(",");

    // create the chunk
    var chunk = new Chunk(chunk_key);
    this.chunks_in_memory[chunk_key] = chunk;

    // render the chunk
    this.render_chunk(cx, cy, cz, chunk);

    var done = false;
    var will_yield = false;
    z+=ZIL_UTIL.CHUNK_SIZE;
    if(z >= this.depth + ZIL_UTIL.CHUNK_SIZE) {
        z = 0;
        y+=ZIL_UTIL.CHUNK_SIZE;
        if(y >= this.height + ZIL_UTIL.CHUNK_SIZE) {
            y = 0;
            x+=ZIL_UTIL.CHUNK_SIZE;
            if(x >= this.width + ZIL_UTIL.CHUNK_SIZE) {
                done = true;
            }
            will_yield = (x % (ZIL_UTIL.CHUNK_SIZE * 4) == 0);
        }
    }

    if(done) {
        progress_fx(1.0);
    }

    var never_yield = this.bounds.w < ZIL_UTIL.CHUNK_SIZE * 2 && this.bounds.h < ZIL_UTIL.CHUNK_SIZE * 2;

    var _continue_build_shape = ZIL_UTIL.bind(this, function() {
        if (done) {
            this._build_shape_done(complete_fx);
        } else {
            this._build_shape(x, y, z, progress_fx, complete_fx);
        }
    });

    if(!never_yield && (done || will_yield || percent == 0)) {
        setTimeout(_continue_build_shape, 0);
    } else {
        _continue_build_shape();
    }
};

ZilShape.prototype._build_shape_done = function(complete_fx) {
//    console.log("Built " + Object.keys(this.chunks_in_memory).length + " chunks. Map size=" + this.width + "x" + this.height + "x" + this.depth);
    this.all_chunks_updated = false;
    this.chunks_updated = {};
    complete_fx();
};

ZilShape.prototype.build_shape = function(progress_fx, complete_fx) {
    this._build_shape(0, 0, 0, progress_fx, complete_fx);
};

ZilShape.prototype.build_shape_inline = function() {
    this._build_shape(0, 0, 0, function(percent) {}, function() {});
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

				// re-render the chunk if needed
				chunk = this.chunks_in_memory[chunk_key];
                if(!chunk) {
                    // create the chunk now: this should not happen during game runtime - only in the editor when we modify chunks
                    chunk = new Chunk(chunk_key);
                    this.chunks_in_memory[chunk_key] = chunk;
                    this.chunks_updated[chunk_key] = true;
                }
				if(this.all_chunks_updated || this.chunks_updated[chunk_key]) {
                    if(chunk.shape && this.chunks_on_screen[chunk_key]) {
                        // remove the shape, since we're recreating it
                        parent_shape.remove(chunk.shape);
                        delete this.chunks_on_screen[chunk_key];
                    }
					this.render_chunk(cx, cy, cz, chunk);
					this.chunks_updated[chunk_key] = false;
				}

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
	this.all_chunks_updated = false;
	for(var _chunk_key in this.chunks_on_screen) {
		if(_chunk_key && drawn_chunks[_chunk_key] == null) {
			var _chunk = this.chunks_in_memory[_chunk_key];
			// remove from screen
			parent_shape.remove(_chunk.shape);
			delete this.chunks_on_screen[_chunk_key];
		}
	}
	return parent_shape;
};

ZilShape.prototype.render_chunk = function(cx, cy, cz, chunk) {
    chunk.set_pos(cx * ZIL_UTIL.CHUNK_SIZE, cy * ZIL_UTIL.CHUNK_SIZE, cz * ZIL_UTIL.CHUNK_SIZE, this.expanded_shape);
	chunk.render(this.use_boxes); // force refresh
};

ZilShape.prototype.rotate = function(dir) {
    var tmp = this.bounds.w;
    this.bounds.w = this.bounds.h;
    this.bounds.h = tmp;
    var new_shape = {};
    for(var key in this.expanded_shape) {
        var value = this.expanded_shape[key];
        var pos = ZilShape._pos(key);
        var nx, ny, nz;
        if (dir > 0) {
            nx = this.bounds.w - 1 - pos[1];
            ny = pos[0];
            nz = pos[2];
        } else {
            nx = pos[1];
            ny = this.bounds.h - 1 - pos[0];
            nz = pos[2];
        }
        var new_key = ZilShape._key(nx, ny, nz);
        new_shape[new_key] = new ZilNode(nx, ny, nz, value.value);
    }
    this.expanded_shape = new_shape;
    this.invalidate();
};

ZilShape.prototype.get_shape_at = function(x, y, z) {
    var node = this.get_node(x, y, z);
    if(node) {
        var orig = this.shape[ZilShape._key(node.origin_x, node.origin_y, node.origin_z)];
        if(orig && orig.name) {
            return [orig.name, node.origin_x, node.origin_y, node.origin_z];
        }
    }
    return null;
};
