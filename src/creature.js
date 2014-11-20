function Creature(monster, pos, id) {
    this.id = id;
    this.ai_move = true;
    this.speed = 40;
    this.monster = monster;
    this.alignment = "evil";
    this.initiative = 2;
    this.ap = 0;
    this.max_ap = 10;
    this.hp = 10;
    this.mobile = new Mobile(pos[0], pos[1], pos[2], monster.category, monster.shape, this);
}

Creature.prototype.to_string = function() {
    return this.monster.name + " id=" + this.id + " ap=" + this.ap + " hp=" + this.hp;
};
