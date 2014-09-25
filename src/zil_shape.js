var ZilShape = function(category, name, shape, width, height, depth) {
	this.category = category;
	this.name = name;
	this.shape = shape; // what to persist
	this.expand_all();
	this.width = width;
	this.height = height;
	this.depth = depth;
	this.bounds = { w: 0, h: 0, d: 0 };
}

ZilShape.SHAPE_CACHE = {};

ZilShape.prototype.expand_shape = function(key) {
	var value = this.shape[key];
	if(isNaN(value)) {
		var s = value.name.split(".");
		child_shape = ZilShape.load_shape(s[0], s[1]);

		var pos = ZilShape._pos(key);
		for(var child_key in child_shape.expanded_shape) {
			var child_value = child_shape.expanded_shape[child_key];
			var child_pos = ZilShape._pos(child_key);
			var new_key = ZilShape._key(pos[0] + child_pos[0], pos[1] + child_pos[1], pos[2] + child_pos[2]);
			this.expanded_shape[new_key] = child_value;
			this.shape_pos[new_key] = key;
		}
	} else {
		this.expanded_shape[key] = value;
	}
};

ZilShape.prototype.expand_all = function() {
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
	// todo: remove it from the expanded shape
	// todo: any point inside a child shape should remove it	
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
			delete this.expanded_shape[new_key];
			delete this.shape_pos[new_key];
		}
		delete this.shape[origin_key];
	} else {
		delete this.shape[key];
		delete this.expanded_shape[key];
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

ZilShape.prototype.set_shape = function(x, y, z, child_shape) {
	// todo: add rotation
	var key = ZilShape._key(x, y, z);
	this.shape[key] = { name: child_shape.category + "." + child_shape.name };
	this.expand_shape(key);
};

ZilShape.prototype.clear_shape = function() {
	this.shape = {};
};

ZilShape.get_face_geometry = function() {
	var geometry = new THREE.Geometry();

	geometry.vertices.push( new THREE.Vector3( -0.5, -0.5, 0 ) );
	geometry.vertices.push( new THREE.Vector3( -0.5,  0.5, 0 ) );
	geometry.vertices.push( new THREE.Vector3(  0.5,  0.5, 0 ) );
	geometry.vertices.push( new THREE.Vector3(  0.5, -0.5, 0 ) );

	geometry.faces.push( new THREE.Face3( 0, 1, 2 ) ); // counter-clockwise winding order
	geometry.faces.push( new THREE.Face3( 0, 2, 3 ) );

	// geometry.computeCentroids();
	geometry.computeFaceNormals();
	geometry.computeVertexNormals();

	return geometry;
};

ZilShape.ORIGIN = [0, 0, 0];
ZilShape.FACE = ZilShape.get_face_geometry();

ZilShape.prototype.render_shape = function(parent_shape, position_offset) {
	if(position_offset == null) position_offset = ZilShape.ORIGIN;
	if(parent_shape == null) parent_shape = new THREE.Object3D();

	ZIL_UTIL.clear_node(parent_shape);

	for(var x = 0; x < ZIL_UTIL.VIEW_WIDTH; x++) {
		var gx = position_offset[0] + x;
		for(var y = 0; y < ZIL_UTIL.VIEW_HEIGHT; y++) {
			var gy = position_offset[1] + y;
			for(var z = 0; z < ZIL_UTIL.VIEW_DEPTH; z++) {
				var gz = position_offset[2] + z;

				var value = this.get_position(gx, gy, gz);
				if(value != null) {
					var material = new THREE.MeshLambertMaterial( {color: ZIL_UTIL.palette[value], side: THREE.DoubleSide } );

					// todo: only draw visible faces

					// south
					if(y == ZIL_UTIL.VIEW_HEIGHT - 1 || this.get_position(gx, gy + 1, gz) == null) {
						var child_shape = new THREE.Mesh( ZilShape.FACE, material );
						child_shape.position.x = x;
						child_shape.position.y = y + 0.5;
						child_shape.position.z = z;
						child_shape.rotation.x = PI / 2;
						parent_shape.add(child_shape);
					}

					// east
					if(x == ZIL_UTIL.VIEW_WIDTH - 1 || this.get_position(gx + 1, gy, gz) == null) {
						var child_shape = new THREE.Mesh( ZilShape.FACE, material );
						child_shape.position.x = x + 0.5;
						child_shape.position.y = y;
						child_shape.position.z = z;
						child_shape.rotation.y = PI / 2;
						parent_shape.add(child_shape);
					}

					// top
					if(this.get_position(gx, gy, gz + 1) == null) {
						var child_shape = new THREE.Mesh( ZilShape.FACE, material );
						child_shape.position.x = x;
						child_shape.position.y = y;
						child_shape.position.z = z + 0.5;
						parent_shape.add(child_shape);
					}
				}
			}
		}
	}
	console.log("added " + parent_shape.children.length + " shapes");
	return parent_shape;
};

