function Player() {
    this.id = "player";
    this.mobile = new Mobile(0, 0, null, "creatures", "player2", this);
    this.mobile.ai_move = false;
    this.mobile.speed = 20;
    this.mobile.alignment = "good";
    this.mobile.initiative = 1;
    this.mobile.ap = 0;
    this.mobile.max_ap = 10;
    this.mobile.level = 5;
    this.mobile.exp = Math.pow(2, this.mobile.level) * 100;
    this.mobile.hp = 80;
}

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
        "level": this.mobile.level
    }
};

Player.prototype.set_stats = function(stats) {
    this.mobile.hp = stats["hp"] || this.mobile.hp;
    this.mobile.exp = stats["exp"] || this.mobile.exp;
    this.mobile.level = stats["level"] || this.mobile.level;
};
