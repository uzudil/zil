function ZilEvent(name, turns, fx, birth_turn) {
    this.name = name;
    this.turns = turns;
    this.fx = fx;
    this.birth_turn = birth_turn;
}

ZilEvent.prototype.run = function(current_turn) {
    if(current_turn - this.birth_turn >= this.turns) {
        try {
            console.log("* Running event: " + this.name);
            this.fx();
        } catch(exc) {
            console.log("* Error running event: " + exc);
        }
        return true;
    }
    return false;
};


function ZilCal() {
}

ZilCal.PENDING_EVENTS = [];
ZilCal.turn = 0;

ZilCal.schedule = function(name, turns, fx) {
    console.log("* Adding event: " + name + " will run in " + turns + " turns.");
    ZilCal.PENDING_EVENTS.push(new ZilEvent(name, turns, fx, ZilCal.turn));
};

ZilCal.unschedule = function(name) {
    console.log("* Removing event: " + name);
    for(var i = 0; i < ZilCal.PENDING_EVENTS.length; i++) {
        if(ZilCal.PENDING_EVENTS[i].name == name) {
            ZilCal.PENDING_EVENTS.splice(i, 1);
            return true;
        }
    }
    return false;
};

ZilCal.run = function() {
    ZilCal.turn++;
    for (var i = 0; i < ZilCal.PENDING_EVENTS.length; i++) {
        if (ZilCal.PENDING_EVENTS[i].run(ZilCal.turn)) {
            ZilCal.PENDING_EVENTS.splice(i, 1);
            i--;
        }
    }
};
