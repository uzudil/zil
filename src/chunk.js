function Chunk(name) {
	this.name = name;
    this.shape = null;
}

Chunk.prototype.set_pos = function(x, y, z, zil_shape) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.zil_shape = zil_shape;
    this.shape = null;
};

Chunk.prototype.get_block = function(x, y, z) {
    return this.zil_shape.find_color_at(x + this.x, y + this.y, z + this.z);
};

Chunk.FACE = ZIL_UTIL.make_square_face(1);


Chunk.get_box_geometry = function() {
    var geometry = new THREE.BoxGeometry(1, 1, 1);
    for(var i = 0; i < geometry.faces.length; i++) {
        geometry.faces[i].materialIndex = 0;
    }
    return geometry;
};
Chunk.BOX = Chunk.get_box_geometry();

Chunk.COLORS = {};
Chunk.TRANSPARENT_COLORS = {};
Chunk.get_material = function(color, is_transparent) {
    var material;
    if(is_transparent) {
        material = Chunk.TRANSPARENT_COLORS[color];
        if (material == null) {
            material = new THREE.MeshLambertMaterial({color: ZIL_UTIL.palette[color], transparent: true, opacity: 0.5 });
            Chunk.TRANSPARENT_COLORS[color] = material;
        }
    } else {
        material = Chunk.COLORS[color];
        if (material == null) {
            material = new THREE.MeshLambertMaterial({color: ZIL_UTIL.palette[color] });
            Chunk.COLORS[color] = material;
        }
    }
	return material;
};

Chunk.prototype.render = function(use_boxes, is_transparent) {
//	console.log("* Rendering chunk " + this.name);

    if(this.geo) this.geo.dispose();
    this.geo = new THREE.Geometry();

    var materials = [];
    var material_index_map = {};
	for(var x = 0; x < ZIL_UTIL.CHUNK_SIZE; x++) {
		for(var y = 0; y < ZIL_UTIL.CHUNK_SIZE; y++) {
			for(var z = 0; z < ZIL_UTIL.CHUNK_SIZE; z++) {

				var block = this.get_block(x, y, z);
				if(block != null) {
                    this.render_block(x, y, z, block, materials, material_index_map, use_boxes, is_transparent);
				}
			}
		}
	}
    this.materials = new THREE.MeshFaceMaterial(materials);
    this.shape = new THREE.Mesh(this.geo, this.materials);
};

Chunk.prototype.render_block = function(x, y, z, value, materials, material_index_map, use_boxes, is_transparent) {
    var material = Chunk.get_material(value, is_transparent);
    // keep the minimum number of materials
    var material_index = material_index_map[value];
    if(material_index == null) {
        material_index = materials.length;
        materials.push(material);
        material_index_map[value] = material_index;
    }

    // south
    var faces = [];
    if (!this.get_block(x, y + 1, z)) {
        var child_shape = new THREE.Mesh(Chunk.FACE, material);
        child_shape.position.x = x;
        child_shape.position.y = y + 0.5;
        child_shape.position.z = z;
        child_shape.rotation.x = PI / 2;
        faces.push(child_shape);
    }

    // east
    if (!this.get_block(x + 1, y, z)) {
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

    if(use_boxes) {
        // north
        if (!this.get_block(x, y - 1, z)) {
            var child_shape = new THREE.Mesh(Chunk.FACE, material);
            child_shape.position.x = x;
            child_shape.position.y = y - 0.5;
            child_shape.position.z = z;
            child_shape.rotation.x = -PI / 2;
            faces.push(child_shape);
        }

        // west
        if (!this.get_block(x - 1, y, z)) {
            var child_shape = new THREE.Mesh(Chunk.FACE, material);
            child_shape.position.x = x - 0.5;
            child_shape.position.y = y;
            child_shape.position.z = z;
            child_shape.rotation.y = PI / 2;
            faces.push(child_shape);
        }
    }

    // build a single geometry for fast rendering
    if (faces.length > 0) {
        for (var i = 0; i < faces.length; i++) {
            faces[i].updateMatrix();
            this.geo.merge(faces[i].geometry, faces[i].matrix, material_index);
            //                                this.geo.mergeVertices(); // too slow
        }
    }
};

