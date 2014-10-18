function Chunk(name) {
	this.name = name;
	this._init();
}

Chunk.prototype._init = function() {
	// create the blocks array just once
	this.blocks = [];
	for(var x = 0; x < ZIL_UTIL.CHUNK_SIZE; x++) {
		var xa = [];
		this.blocks.push(xa);
		for(var y = 0; y < ZIL_UTIL.CHUNK_SIZE; y++) {
			var ya = [];
			xa.push(ya);
			for(var z = 0; z < ZIL_UTIL.CHUNK_SIZE; z++) {
				var block = new Block();
				block.active = false;
				ya.push(block);
			}
		}
	}

	this.shape = new THREE.Object3D();
	this._shape_changed = true;
	// this.render();
};

Chunk.get_face_geometry = function() {
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
Chunk.FACE = Chunk.get_face_geometry();

Chunk.COLORS = {};
Chunk.get_material = function(color) {
	var material = Chunk.COLORS[color];
	if(material == null) {
		material = new THREE.MeshLambertMaterial( {color: ZIL_UTIL.palette[color] } );
		Chunk.COLORS[color] = material;
	}
	return material;
};

Chunk.prototype.render = function(force) {
	if(!(this._shape_changed || force)) return;

//	console.log("* Rendering chunk " + this.name);

	ZIL_UTIL.clear_node(this.shape);

	for(var x = 0; x < ZIL_UTIL.CHUNK_SIZE; x++) {
		for(var y = 0; y < ZIL_UTIL.CHUNK_SIZE; y++) {
			for(var z = 0; z < ZIL_UTIL.CHUNK_SIZE; z++) {

				var block = this.blocks[x][y][z];
				if(block.active) {
					var material = Chunk.get_material(block.color);

					// south
					if(y == ZIL_UTIL.CHUNK_SIZE - 1 || !this.blocks[x][y + 1][z].active) {
						var child_shape = new THREE.Mesh( Chunk.FACE, material );
						child_shape.position.x = x;
						child_shape.position.y = y + 0.5;
						child_shape.position.z = z;
						child_shape.rotation.x = PI / 2;
						this.shape.add(child_shape);
					}

					// east
					if(x == ZIL_UTIL.CHUNK_SIZE - 1 || !this.blocks[x + 1][y][z].active) {
						var child_shape = new THREE.Mesh( Chunk.FACE, material );
						child_shape.position.x = x + 0.5;
						child_shape.position.y = y;
						child_shape.position.z = z;
						child_shape.rotation.y = -PI / 2;
						this.shape.add(child_shape);
					}

					// top
					if(!this.blocks[x][y][z + 1].active) {
						var child_shape = new THREE.Mesh( Chunk.FACE, material );
						child_shape.position.x = x;
						child_shape.position.y = y;
						child_shape.position.z = z + 0.5;
						child_shape.rotation.x = -PI;
						this.shape.add(child_shape);
					}
				}
			}
		}
	}

	this._shape_changed = true;
};

