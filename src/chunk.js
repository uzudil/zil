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
    return this.zil_shape.find_final_node_at(x + this.x, y + this.y, z + this.z);
};

Chunk.prototype.get_emitted_light = function(x, y, z) {
    return this.zil_shape.get_emitted_light(x + this.x, y + this.y, z + this.z);
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

Chunk.reset = function() {
    if(Chunk.material) {
        Chunk.material.dispose();
        Chunk.material = null;
    }
};

Chunk.COLORS = {};
Chunk.TRANSPARENT_COLORS = {};
Chunk.shaderMaterial = null;
Chunk._create_custom_attributes = function() {
    return {
        blockColor: {
            type: "v3",
            value: []
        },
        blockLightIntensity: {
            type: "f",
            value: []
        },
        blockLightColor: {
            type: "v3",
            value: []
        },
        vertexOpacity: {
            type: "f",
            value: []
        }
    };
};

Chunk.get_material = function(blockColor, is_transparent) {
    var material;
    if(Chunk.shaderMaterial == null) {
        var shaders = ZIL_UTIL.get_shaders();
        Chunk.shaderMaterial = new THREE.ShaderMaterial({
            attributes: Chunk._create_custom_attributes(),
            uniforms: {
                lightPos: {
                    type: "v3",
                    value: ZIL_UTIL.lightPos
                },
                isIndoors: {
                    type: "f",
                    value: 0.0
                },
                timeVec: {
                    type: "v3",
                    value: ZIL_UTIL.time
                }
            },
            vertexShader:   shaders[0],
            fragmentShader: shaders[1]
        });
        material = Chunk.shaderMaterial;
    } else {
        material = Chunk.shaderMaterial.clone();
    }

    // set the uniforms
    material.uniforms.isIndoors.value = ZIL_UTIL.is_indoors ? 1.0 : 0.0;
    material.uniforms.lightPos.value = ZIL_UTIL.lightPos;
    material.uniforms.timeVec.value = ZIL_UTIL.time;

    // material.clone doesn't clone the attributes, so do it here (make sure each attribute is empty at this point)
    material.attributes = Chunk._create_custom_attributes();

    material.transparent = true;

	return material;
};

Chunk.prototype.render = function(use_boxes) {
//	console.log("* Rendering chunk " + this.name);

    if(this.geo) this.geo.dispose();
    this.geo = new THREE.Geometry();

    // one material for the entire chunk
    if(this.material) this.material.dispose();
    this.material = Chunk.get_material(0);

	for(var x = 0; x < ZIL_UTIL.CHUNK_SIZE; x++) {
		for(var y = 0; y < ZIL_UTIL.CHUNK_SIZE; y++) {
			for(var z = 0; z < ZIL_UTIL.CHUNK_SIZE; z++) {

				var block = this.get_block(x, y, z);
				if(block != null) {
                    this.render_block(x, y, z, block, this.get_emitted_light(x, y, z), this.material, use_boxes);
				}
			}
		}
	}
    this.shape = new THREE.Mesh(this.geo, this.material);
};

Chunk.prototype.render_block = function(x, y, z, block, emitted_light, material, use_boxes) {

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
    var color = ZIL_UTIL.palette[block.value];
    var vColor = new THREE.Vector3(((color & 0xff0000) >> 16) / 255.0, ((color & 0xff00) >> 8) / 255.0, (color & 0xff) / 255.0);
    if (faces.length > 0) {
        for (var i = 0; i < faces.length; i++) {
            faces[i].updateMatrix();
            for(var t = 0; t < faces[i].geometry.vertices.length; t++) {
                material.attributes.blockColor.value.push(vColor);
                material.attributes.blockLightIntensity.value.push(emitted_light.intensity);
                material.attributes.blockLightColor.value.push(emitted_light.color);
                material.attributes.vertexOpacity.value.push(block.is_transparent ? 0.5 : 1.0);
            }
            this.geo.merge(faces[i].geometry, faces[i].matrix, 0);
            //                                this.geo.mergeVertices(); // too slow
        }
    }
};

