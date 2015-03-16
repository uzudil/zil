var ZilShape = function(category, name, shape, width, height, depth, rotation, loading_delegate, use_boxes, progress_update, on_load) {
	this.category = category;
	this.name = name;
    this.use_boxes = use_boxes;
    var _shape = {};
    for(var key in shape) {
        var value = shape[key];
        if(!isNaN(key)) {
            // old type key
            var k = key;
            var x = (k / (512 * 512)) | 0;
            k -= x * 512 * 512;
            var y = (k / 512) | 0;
            k -= y * 512;
            var z = k;
            key = ZilShape._key(x, y, z);
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

	this.invalidate();
    this.calculate_bounds();

    this.loaded_shapes = {};
    this.shape_index = [];

    if(progress_update) {

        // part 1: load shapes
        var tasks = [];
        this.shape_keys = Object.keys(this.shape);
        for(var i = 0; i < this.shape_keys.length; i++) {
            tasks.push(ZIL_UTIL.bind(this, function(index) {
                var key = this.shape_keys[index];
                this.loaded_shapes[key] = this._get_shape_value(key);
            }));
        }

        this.run_tasks(tasks, 0, progress_update, "Loading map: " + this.name + "...", ZIL_UTIL.bind(this, function() {
            for(var i = 0; i < this.rotation; i++) this.rotate(1);

            // part 2: index shapes
            var tasks = [];
            this.shape_keys = Object.keys(this.loaded_shapes);
            for(var i = 0; i < this.shape_keys.length; i++) {
                tasks.push(ZIL_UTIL.bind(this, function(index) {
                    var key = this.shape_keys[index];
                    this._index_shape(key);
                }));
            }

            // done!
            this.run_tasks(tasks, 0, progress_update, "Indexing map: " + this.name + "...", ZIL_UTIL.bind(this, on_load));
        }));
    } else {
        this.load_all_shapes(); // load included shapes
        for(var i = 0; i < this.rotation; i++) this.rotate(1);
        this._index_shapes();
    }
};

ZilShape.LOAD_STEPS = 5;
ZilShape.t = 0;

ZilShape.prototype.run_tasks = function(tasks, task_index, progress_update, progress_title, on_complete) {
    progress_update(task_index / tasks.length, progress_title);
    setTimeout(ZIL_UTIL.bind(this, function() {
        var next_index = Math.min(task_index + ((tasks.length / ZilShape.LOAD_STEPS)|0), tasks.length);

//        var n = Date.now();
//        console.log("---" + task_index + "-" + next_index + " millis:" + (ZilShape.t == 0 ? 0 : (n - ZilShape.t)));
//        ZilShape.t = n;

        for(var i = task_index; i < next_index; i++) {
            tasks[i](i);
        }
        if(next_index >= tasks.length) {
            progress_update(1, progress_title);
            on_complete();
        } else {
            this.run_tasks(tasks, next_index, progress_update, progress_title, on_complete);
        }
    }), 100);
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
        this.load_all_shapes();
		this._index_shapes();
        this.all_chunks_updated = true;
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

ZilShape.load_shape_async = function(category_name, shape_name, rotation, loading_delegate, use_boxes, progress_update, on_load) {
	var name = category_name + "." + shape_name;
    if(rotation == null) rotation = 0;
    var cache_name = name + "." + rotation;
	var shape_obj = ZilShape.SHAPE_CACHE[cache_name];
    if(shape_obj) {
        shape_obj.invalidate();
        on_load(shape_obj);
    } else {
		var js = ZIL_UTIL.get_shape(category_name, shape_name);
		var shape = js ? js : { width: ZIL_UTIL.WIDTH, height: ZIL_UTIL.HEIGHT, depth: ZIL_UTIL.DEPTH, shape: {} };
		shape_obj = new ZilShape(category_name, shape_name, shape.shape, shape.width, shape.height, shape.depth, rotation, loading_delegate, use_boxes, progress_update, function() {
            ZilShape.SHAPE_CACHE[cache_name] = shape_obj;
            shape_obj.invalidate();
        	on_load(shape_obj);
        });
	}
};

ZilShape.prototype.remove_unseen = function() {
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
    var index_node = this.find_index_node(x, y, z);
    if(index_node) {
        if(index_node.is_final) {
            return true;
        } else {
            return index_node.value.options == null || index_node.options.monster == null;
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
    return "" + x + "," + y + "," + z;
};

ZilShape._pos = function(key) {
    return _.map(key.split(","), function(s) { return parseInt(s, 10); });

};

ZilShape.prototype.check_shape_fits = function(x, y, z, child_shape, check_fx) {
    var w = child_shape.width - 1;
    var h = child_shape.height - 1;
    var d = child_shape.depth - 1;

    if(this.find_index_node(x, y, z) || (check_fx && check_fx(x, y, z))) return false;
    if(this.find_index_node(x + w, y, z) || (check_fx && check_fx(x + w, y, z))) return false;
    if(this.find_index_node(x + w, y + h, z) || (check_fx && check_fx(x + w, y + h, z))) return false;
    if(this.find_index_node(x, y + h, z) || (check_fx && check_fx(x, y + h, z))) return false;

    if(this.find_index_node(x, y, z + d) || (check_fx && check_fx(x, y, z + d))) return false;
    if(this.find_index_node(x + w, y, z + d) || (check_fx && check_fx(x + w, y, z + d))) return false;
    if(this.find_index_node(x + w, y + h, z + d) || (check_fx && check_fx(x + w, y + h, z + d))) return false;
    if(this.find_index_node(x, y + h, z + d) || (check_fx && check_fx(x, y + h, z + d))) return false;

    return true;
};

ZilShape.prototype.set_shape = function(x, y, z, child_shape, options) {
	var key = ZilShape._key(x, y, z);
	this.shape[key] = { name: child_shape.category + "." + child_shape.name, rot: child_shape.rotation, options: options ? options : null };
    this.loaded_shapes[key] = this._get_shape_value(key);
    this._index_shape(key);
};

ZilShape.prototype.del_shape = function(x, y, z, child_shape) {
    var key = ZilShape._key(x, y, z);
    delete this.shape[key];
    this.del_shape_index(x, y, z);
    this.mark_chunk_updated(key);
};

ZilShape.prototype.del_position = function(x, y, z) {
    var index_node = this.find_index_node(x, y, z);
    var child_shape = null;
    if(index_node) {
        if(!index_node.is_final) child_shape = index_node.value;
        this.del_shape(index_node.origin[0], index_node.origin[1], index_node.origin[2]);
    }
    return child_shape;
};

ZilShape.prototype.set_position = function(x, y, z, value) {
	var key = ZilShape._key(x, y, z);
	this.shape[key] = value;
    this.loaded_shapes[key] = this._get_shape_value(key);
    this._index_shape(key);
};

/* copy as voxels, instead of reference shape, like set_shape() does. */
ZilShape.prototype.include_shape = function(x, y, z, child_shape) {
    for(var key in child_shape.shape) {
        var pos = ZilShape._pos(key);
        var value = child_shape.shape[key];
        var shape_name_and_pos = this.get_shape_at(x + pos[0], y + pos[1], z + pos[2]);
        // don't erase linked shapes
        if(shape_name_and_pos == null) {
            if(isNaN(value)) {
                this.set_shape(x + pos[0], y + pos[1], z + pos[2], value);
            } else {
                this.set_position(x + pos[0], y + pos[1], z + pos[2], value);
            }
        }
    }
};

ZilShape.prototype.get_position = function(x, y, z) {
    return this.find_color_at(x, y, z);
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
    this.loaded_shapes = {};
    this.shape_index = [];
    for(var _chunk_key in this.chunks_in_memory) {
        var _chunk = this.chunks_in_memory[_chunk_key];
        if(_chunk.shape) {
            parent_shape.remove(_chunk.shape);
        }
    }
    this.invalidate();
};

ZilShape.prototype.render_shape_simple = function() {
    var parent_shape = new THREE.Object3D();
    var chunk_key = [0, 0, 0].join(",");
    var chunk = new Chunk(chunk_key);
    this.render_chunk(0, 0, 0, chunk);
    parent_shape.add(chunk.shape);
    return parent_shape;
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

ZilShape.INDEX_RES = 4;

function IndexNode(x, y, z, value) {
    this.is_final = !isNaN(value);
    this.origin = [x, y, z];
    this.dimensions = this.is_final ? [1, 1, 1] : [value.width, value.height, value.depth];
    this.value = value;
}

IndexNode.prototype.same_as = function(other_node) {
    return this.origin[0] == other_node.origin[0] && this.origin[1] == other_node.origin[1] && this.origin[2]  == other_node.origin[2];
};

ZilShape.prototype.del_shape_index = function(x, y, z) {
    var key = ZilShape._key(x, y, z);
    var shape = this.loaded_shapes[key];
    if(!shape) return;

    // delete the index
    this._shape_index_points(x, y, z, shape, ZIL_UTIL.bind(this, function(px, py, index_node) {
        this._del_shape_at_point(px, py, index_node);
        this.mark_chunk_updated(ZilShape._key(px, py, 0));
    }));

    // delete the loaded shape
    var key = ZilShape._key(x, y, z);
    delete this.loaded_shapes[key];
};

ZilShape.prototype._del_shape_at_point = function(x, y, index_node) {
    var cx = (x / ZilShape.INDEX_RES)|0;
    var cy = (y / ZilShape.INDEX_RES)|0;
    if(this.shape_index.length <= cx || this.shape_index[cx].length <= cy) return;

    for(var i = 0; i < this.shape_index[cx][cy].length; i++) {
        var n = this.shape_index[cx][cy][i];
        if(n.same_as(index_node)) {
            this.shape_index[cx][cy].splice(i, 1);
            return;
        }
    }
};

IndexNode.prototype.contains_point = function(x, y, z) {
    if(this.is_final) {
        return x == this.origin[0] && y == this.origin[1] && z == this.origin[2];
    } else {
        return ZIL_UTIL.contains_box([x, y, z], this.origin, this.dimensions);
    }
};

ZilShape.prototype._index_shape_at_point = function(x, y, index_node) {
    var cx = (x / ZilShape.INDEX_RES)|0;
    var cy = (y / ZilShape.INDEX_RES)|0;
    while(this.shape_index.length <= cx) this.shape_index.push([]);
    while(this.shape_index[cx].length <= cy) this.shape_index[cx].push([]);
    var a = this.shape_index[cx][cy];

    // check if already stored
    if(_.any(a, function(n) { return n.same_as(index_node); })) return;

    a.push(index_node);
};

ZilShape.prototype._index_shape = function(key) {
    var value = this.loaded_shapes[key];
    var pos = ZilShape._pos(key);

    // index a point in each chunk for this shape
    this._shape_index_points(pos[0], pos[1], pos[2], value, ZIL_UTIL.bind(this, function(px, py, index_node) {
        this._index_shape_at_point(px, py, index_node);
        this.mark_chunk_updated(ZilShape._key(px, py, 0));
    }));
};

ZilShape.prototype._shape_index_points = function(x, y, z, value, fx) {
    var node = new IndexNode(x, y, z, value);

    var px = -1;
    for(var cx = 0; cx < node.dimensions[0]; cx++) {
        var ppx = ((cx + x) / ZilShape.INDEX_RES)|0;
        if(ppx > px) {
            px = ppx;

            var py = -1;
            for(var cy = 0; cy < node.dimensions[1]; cy++) {
                var ppy = ((cy + y) / ZilShape.INDEX_RES)|0;
                if(ppy > py) {
                    py = ppy;
                    fx(px * ZilShape.INDEX_RES, py * ZilShape.INDEX_RES, node);
                }
            }
        }
    }
};

ZilShape.prototype._index_shapes = function() {
    var t = Date.now();
    this.shape_index = [];
    for(var key in this.loaded_shapes) {
        this._index_shape(key);
    }
    console.log("* " + this.category + "." + this.name + "." + this.rotation + ": Indexed " + Object.keys(this.shape).length + " shapes in " + (Date.now() - t) + " millis.");
};

ZilShape.prototype.load_all_shapes = function() {
    var t = Date.now();
    this.loaded_shapes = {};
    for(var key in this.shape) {
        this.loaded_shapes[key] = this._get_shape_value(key);
    }
    console.log("* " + this.category + "." + this.name + "." + this.rotation + ": Loaded " + Object.keys(this.shape).length + " shapes in " + (Date.now() - t) + " millis.");
};

ZilShape.prototype._get_shape_value = function(key) {
	var value = this.shape[key];
    var pos = ZilShape._pos(key);
	if(isNaN(value)) {
        if(pos[0] > this.width) this.width = pos[0];
        if(pos[1] > this.height) this.height = pos[1];
        if(pos[2] > this.depth) this.depth = pos[2];

        var child_shape = null;
        if(this.loading_delegate) {
            if(value.options && value.options.monster) {
                child_shape = this.loading_delegate.load_monster(value.options.monster, pos);
                // don't include mobile shapes
                if(child_shape == null) return null;
            }
        }

        if(child_shape == null) {
            var s = value.name.split(".");
            child_shape = ZilShape.load_shape(s[0], s[1], value.rot);
        }

        child_shape.origin = [pos[0], pos[1], pos[2]];

        return child_shape;
	} else {
        return value;
	}
};

ZilShape.prototype.find_color_at = function(x, y, z) {
    var index_node = this.find_index_node(x, y, z);
    if(index_node) {
        if(index_node.is_final) {
            return index_node.value;
        } else {
            return index_node.value.find_color_at(
                    x - index_node.origin[0],
                    y - index_node.origin[1],
                    z - index_node.origin[2]);
        }
    } else {
        return null;
    }
};

ZilShape.prototype.find_index_node = function(x, y, z) {
    var cx = (x / ZilShape.INDEX_RES)|0;
    var cy = (y / ZilShape.INDEX_RES)|0;
    if(this.shape_index[cx] && this.shape_index[cx][cy]) {
        for(var i = 0; i < this.shape_index[cx][cy].length; i++) {
            var index_node = this.shape_index[cx][cy][i];
            if(index_node.contains_point(x, y, z)) return index_node;
        }
    }
    return null;
};

ZilShape.prototype.render_chunk = function(cx, cy, cz, chunk) {
    chunk.set_pos(cx * ZIL_UTIL.CHUNK_SIZE, cy * ZIL_UTIL.CHUNK_SIZE, cz * ZIL_UTIL.CHUNK_SIZE, this);
	chunk.render(this.use_boxes); // force refresh

    // debug info
    chunk.shape.userData.name = this.category + "." + this.name;
    for(var t = 0; t < chunk.shape.children.length; t++) {
        chunk.shape.children[t].userData.name = this.category + "." + this.name;
    }
};

ZilShape.prototype.rotate = function(dir) {
    var tmp = this.bounds.w;
    this.bounds.w = this.bounds.h;
    this.bounds.h = tmp;

    tmp = this.width;
    this.width = this.height;
    this.height = tmp;

    var new_shape = {};
    for(var key in this.loaded_shapes) {
        var value = this.loaded_shapes[key];

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
        if(isNaN(value)) {
            value.origin = [nx, ny, nz];
            new_shape[new_key] = value;
            value.rotate(dir);
        } else {
            new_shape[new_key] = value;
        }
    }
    this.loaded_shapes = new_shape;
    this.invalidate();
};

ZilShape.prototype.get_shape_at = function(x, y, z) {
    var index_node = this.find_index_node(x, y, z);
    if(index_node && !index_node.is_final) {
        return [index_node.value.category + "." + index_node.value.name,
            index_node.origin[0],
            index_node.origin[1],
            index_node.origin[2]];
    } else {
        return null;
    }
};


function PathNode(x, y, z, is_empty) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.is_empty = is_empty;
}

PathNode.prototype.getCost = function(other_node) {
    var dz = Math.abs(this.z - other_node.z);
    return dz <= 1 ? 1 : 100000;
};

PathNode.prototype.clone = function() {
    return new PathNode(this.x, this.y, this.z, this.is_empty);
};

PathNode.prototype.next_to = function(pos) {
    return Math.abs(this.x - pos[0]) <= 1 &&
        Math.abs(this.y - pos[1]) &&
        Math.abs(this.z - pos[2]);
};


// how many steps per node?
ZilShape.PATH_RES = 4;

// Build a lower resolution map for pathfinding
ZilShape.prototype.build_nodes = function(x, y, z) {
    var start_time = Date.now();
    this.nodes = [];
    for(var xx = 0; xx < (this.width / ZilShape.PATH_RES)|0; xx++) {
        var col = [];
        this.nodes[xx] = col;
        for(var yy = 0; yy < (this.height / ZilShape.PATH_RES)|0; yy++) {
            col[yy] = new PathNode(xx * ZilShape.PATH_RES, yy * ZilShape.PATH_RES, null, true);
        }
    }
    this._find_nodes_iterative( ((x / ZilShape.PATH_RES)|0), ((y / ZilShape.PATH_RES)|0), {} );
    console.log("Built " + (this.nodes.length * this.nodes[0].length) + " nodes in " + (Date.now() - start_time) + " millis.");
};

// this should be recursive but the browser has issues with that
ZilShape.prototype._find_nodes_iterative = function(start_nx, start_ny, seen_nodes) {
    var stack = [{
        nx: start_nx,
        ny: start_ny,
        from_node: null,
        dir: null
    }];

    while(stack.length > 0) {
        var p = stack.pop();
        var nx = p.nx;
        var ny = p.ny;
        var from_node = p.from_node;
        var dir = p.dir;

        // bad node?
        if(nx < 0 || nx >= this.nodes.length || ny < 0 || ny >= this.nodes[0].length) continue;

        var key = nx + "." + ny;
        if(seen_nodes[key]) {
            if(seen_nodes[key][dir]) continue; // seen it from this direction
        } else {
            seen_nodes[key] = {}
        }

        // what is the height of this position?
        var node = this.nodes[nx][ny];
        if(node.z == null) {
            var pos = this._get_map_point_for_node(nx, ny);
            node.z = pos.z;
            node._tmp_is_empty = pos.z <= -1;
        }

        // can't step here from this neighbor
        if(from_node && Math.abs(from_node.z - node.z) > 1) {
            // can try from other directions
            seen_nodes[key][dir] = true;
            continue;
        } else {
            // mark all directions seen
            seen_nodes[key][ZIL_UTIL.N] = seen_nodes[key][ZIL_UTIL.E] = seen_nodes[key][ZIL_UTIL.S] = seen_nodes[key][ZIL_UTIL.W] = true;
        }

        // is there a place here?
        if(node.z <= -1) continue;

        // store the real node (voxel) at this node position
        node.is_empty = node._tmp_is_empty;

        // evaluate the neighboring nodes
        if(nx - 1 >= 0)
            stack.push({
                nx: nx - 1,
                ny: ny,
                from_node: node,
                dir: ZIL_UTIL.W
            });

        if(ny - 1 >= 0)
            stack.push({
                nx: nx,
                ny: ny - 1,
                from_node: node,
                dir: ZIL_UTIL.N
            });

        if(nx < this.nodes.length - 1)
            stack.push({
                nx: nx + 1,
                ny: ny,
                from_node: node,
                dir: ZIL_UTIL.E
            });

        if(ny < this.nodes[0].length - 1)
            stack.push({
                nx: nx,
                ny: ny + 1,
                from_node: node,
                dir: ZIL_UTIL.S
            });
    }
};

ZilShape.prototype._get_map_point_for_node = function(nx, ny) {
    // get the highest location at this place
    var max_z = 0;
    var ex, ey;
    for(var x = 0; x < ZilShape.PATH_RES; x++) {
        for(var y = 0; y < ZilShape.PATH_RES; y++) {
            var rx = nx * ZilShape.PATH_RES + x;
            var ry = ny * ZilShape.PATH_RES + y;
            var z = this.get_highest_empty_space_at_point(rx, ry);
            if(z >= max_z) {
                max_z = z;
                ex = rx;
                ey = ry;
            }
        }
    }
    return {
        value: max_z == 0 ? null : this.find_color_at(ex, ey, max_z - 1),
        x: nx,
        y: ny,
        z: max_z - 1
    };
};

