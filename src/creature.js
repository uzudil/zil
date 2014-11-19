function Creature(monster, pos, id) {
    this.id = id;
    this.ai_move = true;
    this.speed = 40;
    this.monster = monster;
    this.mobile = new Mobile(pos[0], pos[1], pos[2], monster.category, monster.shape, this);
}
