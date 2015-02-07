function Missile(src_x, src_y, src_z, to_x, to_y, to_z, options, on_hit, map_shape, gx, gy, gz, color) {
    this.src_x = src_x;
    this.src_y = src_y;
    this.src_z = src_z;
    this.to_x = to_x;
    this.to_y = to_y;
    this.to_z = to_z;
    this.options = options;
    this.on_hit = on_hit;
    this.is_live = true;
    this.target_point = new THREE.Vector3();
    this.color = color ? new THREE.Color(parseInt(color.substr(1), 16)) : new THREE.Color("rgb(255,0,0)");
    
    // spell casting particles
    this.init_particles();

    this.reset_particles(map_shape, gx, gy, gz);
}

Missile.particles = null;
Missile.PARTICLE_COUNT = 1000;
Missile.SPEED = 0.05;

Missile.prototype.init_particles = function() {
    if(Missile.particles == null) {
        Missile.geometry = new THREE.Geometry();

        for(var i = 0; i < Missile.PARTICLE_COUNT; i++) Missile.geometry.vertices.push(new THREE.Vector3());

        Missile.material = new THREE.PointCloudMaterial({
            size: 10,
            map: ZIL_UTIL.particle_sprite1,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true,
            fog: false
        });

        Missile.particles = new THREE.PointCloud(Missile.geometry, Missile.material);
        Missile.particles.up = new THREE.Vector3( 0, 0, 1 );
    }
};

Missile.prototype.reset_particles = function(map_shape, gx, gy, gz) {
    Missile.particles.position.set(this.src_x - gx, this.src_y - gy, this.src_z - gz);
    map_shape.add(Missile.particles);

    for(var i = 0; i < Missile.PARTICLE_COUNT; i++) {
        var vertex = Missile.geometry.vertices[i];
        var n = i / Missile.PARTICLE_COUNT * 10;
        vertex.z = Math.random() * n/2 + n/2;
        n = (1 - i / Missile.PARTICLE_COUNT) * 3;
        vertex.x = Math.random() * n - n/2;
        vertex.y = Math.random() * n - n/2;
    }

    // re-init the spell casting particles
    Missile.material.color.set(this.color);
    Missile.material.opacity = 1;
    Missile.geometry.colorsNeedUpdate = true;
    Missile.geometry.verticesNeedUpdate = true;
};

Missile.prototype.step = function(delta_time, gx, gy, gz) {
    if(this.to_x == null) {
        this.end_missile(false);
    } else {
        var d = ZIL_UTIL.get_distance(this.src_x, this.src_y, this.to_x, this.to_y);
//        console.log("src=" + this.src_x.toFixed(2) + "," + this.src_y.toFixed(2) + "," + this.src_z.toFixed(2) +
//            " to=" + this.to_x.toFixed(2) + "," + this.to_y.toFixed(2) + "," + this.to_z.toFixed(2) +
//            " distance=" + d.toFixed(2));
        if (Math.abs(d) > 2) {
            // step with vector to target
            var dx = this.to_x - this.src_x;
            var dy = this.to_y - this.src_y;
            var dz = this.to_z - this.src_z;
            var v = new THREE.Vector3(dx, dy, dz);
            v.setLength(delta_time * Missile.SPEED);
            this.src_x += v.x;
            this.src_y += v.y;
            this.src_z += v.z;
            Missile.particles.position.set(this.src_x - gx, this.src_y - gy, this.src_z - gz);
            this.target_point.set(this.to_x - gx, this.to_y - gy, this.to_z - gz);
            Missile.particles.lookAt(this.target_point);
        } else {
            this.end_missile(true);
        }
    }
    return this.is_live;
};

Missile.prototype.end_missile = function(success) {
    Missile.particles.parent.remove(Missile.particles);
    this.is_live = false;
    if(success) this.on_hit();
    else ZIL.log("A small group of sparks fizzles pathetically.")
};
