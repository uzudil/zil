function ZilEvent(name, millis, fx) {
    this.name = name;
    this.millis = millis;
    this.fx = fx;
    this.dob = Date.now();
}

ZilEvent.prototype.run = function() {
    if(Date.now() >= this.dob + this.millis) {
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
ZilCal.time = 0;

ZilCal.schedule = function(name, millis, fx) {
    console.log("* Adding event: " + name);
    ZilCal.PENDING_EVENTS.push(new ZilEvent(name, millis, fx));
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

ZilCal.run = function(delta_time) {
    ZilCal.time += delta_time;
    if(ZilCal.time > 500) {
        for (var i = 0; i < ZilCal.PENDING_EVENTS.length; i++) {
            if (ZilCal.PENDING_EVENTS[i].run()) {
                ZilCal.PENDING_EVENTS.splice(i, 1);
                i--;
            }
        }
        ZilCal.time = 0;
    }
};