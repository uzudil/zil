function Creature(monster, pos, id) {
    this.id = id;
    this.mobile = new Mobile(pos[0], pos[1], pos[2], monster.category, monster.shape, this);
    this.mobile.ai_move = true;
    this.mobile.speed = 40;
    this.mobile.monster = monster;
    this.mobile.alignment = "evil";
    this.mobile.initiative = 2;
    this.mobile.ap = 0;
    this.mobile.max_ap = 10;
    this.mobile.hp = 10;
}

