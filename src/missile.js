function Missile(src_x, src_y, src_z, to_x, to_y, to_z, options, on_hit, map_shape) {
    this.src_x = src_x;
    this.src_y = src_y;
    this.src_z = src_z;
    this.to_x = to_x;
    this.to_y = to_y;
    this.to_z = to_z;
    this.options = options;
    this.on_hit = on_hit;
    this.is_live = true;
    
    // spell casting particles
    Missile.init_particles(map_shape);

    Missile.reset_particles();
}

Missile.particles = null;

Missile.init_particles = function(map_shape) {
    if(Missile.particles == null) {
        Missile.geometry = new THREE.Geometry();

        for(var i = 0; i < 4000; i++) Missile.geometry.vertices.push(new THREE.Vector3());

        Missile.material = new THREE.PointCloudMaterial({
            size: 30,
            map: ZIL_UTIL.particle_sprite1,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true,
            fog: false
        });

        Missile.particles = new THREE.PointCloud(Missile.geometry, Missile.material);
        Missile.shape_obj.add(map_shape.particles);
    }
};

Missile.reset_particles = function() {
    for(var i = 0; i < 4000; i++) {
        var vertex = Missile.geometry.vertices[i];
        vertex.x = Math.random() * 4 - 2;
        vertex.y = Math.random() * 4 - 2;
        vertex.z = Math.random() * 3;
    }

    // re-init the spell casting particles
    Missile.material.color.setRGB(0.1, 0.5, 0.95);
    Missile.material.opacity = 1;
    Missile.geometry.colorsNeedUpdate = true;
    Missile.geometry.verticesNeedUpdate = true;
};

Missile.prototype.step = function(delta_time) {

};
