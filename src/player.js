function Player(x, y) {
    this.id = "player";
    this.ai_move = false;
    this.speed = 20;
    this.alignment = "good";
    this.initiative = 1;
    this.ap = 0;
    this.max_ap = 10;
    this.hp = 25;
    this.mobile = new Mobile(x, y, null, "creatures", "player2", this);
}

Player.prototype.to_string = function() {
    return "PLAYER ap=" + this.ap + " hp=" + this.hp;
};
