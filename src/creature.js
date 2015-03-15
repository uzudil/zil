function Creature(monster, pos, id) {
    this.id = id;
    this.mobile = new Mobile(pos[0], pos[1], pos[2], monster.category, monster.shape, this);
    this.mobile.ai_move = true;
    this.mobile.speed = 100;
    this.mobile.monster = monster;
    this.mobile.alignment = monster.level > 0 ? "evil" : "good";
    this.mobile.initiative = 2;
    this.mobile.ap = 0;
    this.mobile.max_ap = 10;
    this.mobile.hp = 10;
    this.mobile.level = monster.level;
    this.mobile.exp = 0;
}

Creature.prototype.get_atk = function() {
    return ZIL_UTIL.rand_int(0, this.mobile.level * 4);
};

Creature.prototype.get_def = function() {
    return ZIL_UTIL.rand_int(0, this.mobile.level * 4);
};

Creature.prototype.set_level_from_exp = function() {
    this.mobile.level = this.mobile.monster.level;
};

Creature.prototype.get_range = function() {
    return 4;
};

Creature.prototype.is_peaceful = function() {
    return this.mobile.monster.level == 0;
};
