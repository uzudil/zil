function Creature(monster, pos) {
    this.monster = monster;
    this.mobile = new Mobile(pos[0], pos[1], pos[2], monster.category, monster.shape, this);
}
