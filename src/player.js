function Player() {
    this.id = "player";
    this.mobile = new Mobile(0, 0, null, "creatures", "player2", this, false, AnimatedModel.HUMAN);
    this.mobile.ai_move = false;
    this.mobile.speed = 20;
    if(this.mobile.animated_model) this.mobile.animated_model.animation_speed = 100;
    this.mobile.alignment = "good";
    this.mobile.initiative = 1;
    this.mobile.ap = 0;
    this.mobile.max_ap = 10;
    this.mobile.level = 5;
    this.mobile.exp = Math.pow(2, this.mobile.level) * 100;
    this.mobile.hp = this.mobile.max_hp = 80;

    // todo: only if inside
    this.lights = new THREE.Object3D();
    this.light = new THREE.PointLight( 0xffaa00, 1, 80 );
    this.light.position.set( 5.5, 5.5, 5.5 );
    this.lights.add(this.light);
    this.light2 = new THREE.PointLight( 0xfffef3, 1, 170 );
    this.light2.position.set( 16, 16, 24 );
    this.lights.add(this.light2);
    this.mobile.shape_obj.add(this.lights);
}

Player.prototype.set_lights = function(enabled) {
    if(enabled) {
        this.light.intensity = 1;
        this.light2.intensity = 1;
    } else {
        this.light.intensity = 0;
        this.light2.intensity = 0;
    }
};

Player.prototype.get_atk = function() {
    return ZIL_UTIL.rand_int(0, this.mobile.level * 6);
};

Player.prototype.get_def = function() {
    return ZIL_UTIL.rand_int(0, this.mobile.level * 6);
};

Player.prototype.set_level_from_exp = function() {
    this.mobile.level = Math.max(1, Math.round(Math.log2(this.mobile.exp / 100)));
};

Player.prototype.get_range = function() {
    return 4;
};

Player.prototype.get_stats = function() {
    return {
        "hp": this.mobile.hp,
        "exp": this.mobile.exp,
        "level": this.mobile.level,
        "spells": _.map(this.mobile.spells, function(spell) { return spell.name; })
    }
};

Player.prototype.set_stats = function(stats) {
    this.mobile.hp = stats["hp"] || this.mobile.hp;
    this.mobile.exp = stats["exp"] || this.mobile.exp;
    this.mobile.level = stats["level"] || this.mobile.level;
    var spell_names = stats["spells"] || [];
    for(var i = 0; i < spell_names.length; i++) {
        this.mobile.add_spell(Spell.SPELLS_BY_NAME[spell_names[i]]);
    }
};

Player.prototype.save_stats = function() {
    ZIL_UTIL.player_stats = this.get_stats();
    ZIL_UTIL.save_config();
};
