function Chunk(name) {
	this.name = name;
    this.shape = null;
}

Chunk.prototype.set_pos = function(x, y, z, blocks) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.blocks = blocks;
    this.shape = null;
};

Chunk.prototype.get_block = function(x, y, z) {
    var k = ZilShape._key(x + this.x, y + this.y, z + this.z);
    return this.blocks[k];
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


Chunk.get_box_geometry = function() {
    var geometry = new THREE.BoxGeometry(1, 1, 1);
    for(var i = 0; i < geometry.faces.length; i++) {
        geometry.faces[i].materialIndex = 0;
    }
    return geometry;
};
Chunk.BOX = Chunk.get_box_geometry();

Chunk.COLORS = {};
Chunk.get_material = function(color) {
	var material = Chunk.COLORS[color];
	if(material == null) {
		material = new THREE.MeshLambertMaterial( {color: ZIL_UTIL.palette[color] } );
		Chunk.COLORS[color] = material;
	}
	return material;
};

Chunk.prototype.render = function(use_boxes) {
//	console.log("* Rendering chunk " + this.name);

    if(this.geo) this.geo.dispose();
    this.geo = new THREE.Geometry();

    var empty = true;
    var materials = [];
    var material_index_map = {};
	for(var x = 0; x < ZIL_UTIL.CHUNK_SIZE; x++) {
		for(var y = 0; y < ZIL_UTIL.CHUNK_SIZE; y++) {
			for(var z = 0; z < ZIL_UTIL.CHUNK_SIZE; z++) {

				var block = this.get_block(x, y, z);
				if(block) {
					var material = Chunk.get_material(block.value);
                    // keep the minimum number of materials
                    var material_index = material_index_map[block.value];
                    if(material_index == null) {
                        material_index = materials.length;
                        materials.push(material);
                        material_index_map[block.value] = material_index;
                    }

                    if(use_boxes) {

                        var child_shape = new THREE.Mesh(Chunk.BOX, material);
                        child_shape.position.x = x;
                        child_shape.position.y = y;
                        child_shape.position.z = z;

                        // build a single geometry for fast rendering
                        empty = false;
                        child_shape.updateMatrix();
                        this.geo.merge(child_shape.geometry, child_shape.matrix, material_index);
                        this.geo.mergeVertices();

                    } else {

                        // south
                        var faces = [];
                        if (y == ZIL_UTIL.CHUNK_SIZE - 1 || !this.get_block(x, y + 1, z)) {
                            var child_shape = new THREE.Mesh(Chunk.FACE, material);
                            child_shape.position.x = x;
                            child_shape.position.y = y + 0.5;
                            child_shape.position.z = z;
                            child_shape.rotation.x = PI / 2;
                            faces.push(child_shape);
                        }

                        // east
                        if (x == ZIL_UTIL.CHUNK_SIZE - 1 || !this.get_block(x + 1, y, z)) {
                            var child_shape = new THREE.Mesh(Chunk.FACE, material);
                            child_shape.position.x = x + 0.5;
                            child_shape.position.y = y;
                            child_shape.position.z = z;
                            child_shape.rotation.y = -PI / 2;
                            faces.push(child_shape);
                        }

                        // top
                        if (!this.get_block(x, y, z + 1)) {
                            var child_shape = new THREE.Mesh(Chunk.FACE, material);
                            child_shape.position.x = x;
                            child_shape.position.y = y;
                            child_shape.position.z = z + 0.5;
                            child_shape.rotation.x = -PI;
                            faces.push(child_shape);
                        }

                        // build a single geometry for fast rendering
                        if (faces.length > 0) {
                            empty = false;
                            for (var i = 0; i < faces.length; i++) {
                                faces[i].updateMatrix();
                                this.geo.merge(faces[i].geometry, faces[i].matrix, material_index);
//                                this.geo.mergeVertices(); // too slow
                            }
                        }
                    }
				}
			}
		}
	}
    this.materials = new THREE.MeshFaceMaterial(materials);
    this.shape = new THREE.Mesh(this.geo, this.materials);
};

