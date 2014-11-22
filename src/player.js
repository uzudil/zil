function Player(x, y) {
    this.id = "player";
    this.mobile = new Mobile(x, y, null, "creatures", "player2", this);
    this.mobile.ai_move = false;
    this.mobile.speed = 20;
    this.mobile.alignment = "good";
    this.mobile.initiative = 1;
    this.mobile.ap = 0;
    this.mobile.max_ap = 10;
    this.mobile.hp = 25;
}
