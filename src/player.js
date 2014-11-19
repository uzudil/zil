function Player(x, y) {
    this.id = "player";
    this.ai_move = false;
    this.speed = 20;
    this.mobile = new Mobile(x, y, null, "creatures", "player2", this);
}
