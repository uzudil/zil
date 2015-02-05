function Spell(name, music, page, intent, affects_many, start_fx, ai_can_use_fx) {
    this.name = name;
    this.music = music;
    this.page = page;
    this.intent = intent;
    this.affects_many = affects_many;
    this.start_fx = start_fx;
    this.ai_can_use_fx = ai_can_use_fx;
    Spell.SPELLS_BY_NAME[name] = this;

    var p = page - 1;
    if(p >= Spell.SPELLS_BY_PAGE.length) {
        Spell.SPELLS_BY_PAGE[p] = [ this ];
    } else {
        Spell.SPELLS_BY_PAGE[p].push(this);
    }
}

Spell.SPEED = 1/2;
Spell.SPELLS_BY_NAME = {};
Spell.SPELLS_BY_PAGE = [];
Spell.MIDI_INIT = false;
Spell.MIDI_INSTRUMENT_ID = 11; // vibraphone

Spell.target_low_hp = function(target) {
    return target.mobile.hp / target.mobile.max_hp <= 0.25;
};

Spell.target_has_status = function(target, statuses) {
    return _.any(statuses, function(s) { return target.has_status(s); });
};

// page 1
Spell.HEAL = new Spell("Zon-Bur", [
    ["Db5", 4], ["Eb5", 4], ["Gb5", 4], ["Eb5", 2], ["Eb5", 2], ["Gb5", 4], ["Db5", 1], ["Db5", 1]
], 1, "help", false, function(caster, target) {
    target.mobile.heal((Math.random() * 5 + 5)|0);
}, Spell.target_low_hp);

Spell.BLESS = new Spell("Nul-Bur", [
    ["Db5", 4], ["Db5", 4], ["Db5", 4]
], 1, "help", false, function(caster, target) {
    target.mobile.set_status(Mobile.STATUS_BLESSED, 10);
}, function(target) { return !Spell.target_has_status(target, [Mobile.STATUS_BLESSED]); });

Spell.FIRE = new Spell("Mor-Dil", [
    ["Db5", 4], ["Db5", 4], ["Db5", 4]
], 1, "attack", false, function(caster, target) {
    ZIL.launch_missile(caster, target, { spell: Spell.FIRE }, function() {
        target.mobile.cause_damage((Math.random() * 5 + 5)|0);
    });
});

Spell.CONFUSION = new Spell("Her-Mol", [
    ["Db5", 4], ["Db5", 4], ["Db5", 4]
], 1, "hinder", false, function(caster, target) {
    target.mobile.set_status(Mobile.STATUS_CONFUSED, 10);
}, function(target) { return !Spell.target_has_status(target, [Mobile.STATUS_CONFUSED]); });

Spell.SUMMON_1 = new Spell("Sum-Mag", [
    ["Db5", 4], ["Db5", 4], ["Db5", 4]
], 1, "attack", false, function(caster, target) {
});

Spell.ACID = new Spell("Mor-Shu", [
    ["Db5", 4], ["Db5", 4], ["Db5", 4]
], 1, "attack", false, function(caster, target) {
    ZIL.launch_missile(caster, target, { spell: Spell.ACID }, function() {
        target.mobile.cause_damage((Math.random() * 5 + 5)|0);
    });
});




// page 2
Spell.BIG_HEAL = new Spell("Zon-Bune", [
    ["Db5", 4], ["Eb5", 4], ["Gb5", 4], ["Eb5", 2], ["Eb5", 2], ["Gb5", 4], ["Db5", 1], ["Db5", 1]
], 2, "help", false, function(caster, target) {
    caster.mobile.heal((Math.random() * 30 + 15)|0);
}, Spell.target_low_hp);

Spell.ARMOR = new Spell("Tor-Nuin", [
    ["Db5", 4], ["Db5", 4], ["Db5", 4]
], 2, "help", false, function(caster, target) {
    target.mobile.set_status(Mobile.STATUS_ARMORED, 10);
}, function(target) { return !Spell.target_has_status(target, [Mobile.STATUS_ARMORED]); });

Spell.LIGHTNING = new Spell("Mor-Zap", [
    ["Db5", 4], ["Db5", 4], ["Db5", 4]
], 2, "attack", false, function(caster, target) {
    ZIL.launch_missile(caster, target, { spell: Spell.LIGHTNING }, function() {
        target.mobile.cause_damage((Math.random() * 5 + 5)|0);
    });
});

Spell.HOLD = new Spell("Her-Nuin", [
    ["Db5", 4], ["Db5", 4], ["Db5", 4]
], 2, "hinder", false, function(caster, target) {
    target.mobile.set_status(Mobile.STATUS_HELD, 10);
}, function(target) { return !Spell.target_has_status(target, [Mobile.STATUS_HELD]); });

Spell.HASTE = new Spell("Pel-Ton", [
    ["Db5", 4], ["Db5", 4], ["Db5", 4]
], 2, "help", false, function(caster, target) {
    target.mobile.set_status(Mobile.STATUS_HASTED, 10);
}, function(target) { return !Spell.target_has_status(target, [Mobile.STATUS_HASTED]); });

Spell.COLD = new Spell("Mor-Zin", [
    ["Db5", 4], ["Db5", 4], ["Db5", 4]
], 2, "attack", false, function(caster, target) {
    ZIL.launch_missile(caster, target, { spell: Spell.COLD }, function() {
        target.mobile.cause_damage((Math.random() * 5 + 5)|0);
    });
});




// page 3
Spell.HEAL_ALL = new Spell("Zon-Pan", [
    ["Db5", 4], ["Eb5", 4], ["Gb5", 4], ["Eb5", 2], ["Eb5", 2], ["Gb5", 4], ["Db5", 1], ["Db5", 1]
], 3, "help", true, function(caster, target) {
}, Spell.target_low_hp);

Spell.CURE = new Spell("Het-Lan", [
    ["Db5", 4], ["Db5", 4], ["Db5", 4]
], 3, "help", false, function(caster, target) {
    target.mobile.remove_status(Mobile.STATUS_POISONED);
    target.mobile.remove_status(Mobile.STATUS_DISEASED);
}, function(target) { return Spell.target_has_status(target, [Mobile.STATUS_POISONED, Mobile.STATUS_DISEASED]); });

Spell.BOMB = new Spell("Mor-Bam", [
    ["Db5", 4], ["Db5", 4], ["Db5", 4]
], 3, "attack", true, function(caster, target) {
    ZIL.launch_missile(caster, target, { spell: Spell.BOMB }, function() {
        target.mobile.cause_damage((Math.random() * 5 + 5)|0);
    });
});

Spell.SLOW = new Spell("Ton-Pel", [
    ["Db5", 4], ["Db5", 4], ["Db5", 4]
], 3, "hinder", false, function(caster, target) {
    target.mobile.set_status(Mobile.STATUS_SLOWED, 10);
}, function(target) { return !Spell.target_has_status(target, [Mobile.STATUS_SLOWED]); });

Spell.SUMMON_2 = new Spell("Sum-Rog", [
    ["Db5", 4], ["Db5", 4], ["Db5", 4]
], 3, "attack", false, function(caster, target) {
});

Spell.CIRCLE_BLADE = new Spell("Mor-Tel", [
    ["Db5", 4], ["Db5", 4], ["Db5", 4]
], 3, "attack", true, function(caster, target) {
});




// page 4
Spell.ARMOR_ALL = new Spell("Tor-Pan", [
    ["Db5", 4], ["Db5", 4], ["Db5", 4]
], 4, "help", true, function(caster, target) {
}, function(target) { return !Spell.target_has_status(target, [Mobile.STATUS_ARMORED]); });

Spell.LIGHTNING_FIELD = new Spell("Mor-Zarr", [
    ["Db5", 4], ["Db5", 4], ["Db5", 4]
], 4, "attack", true, function(caster, target) {
    ZIL.launch_missile(caster, target, { spell: Spell.LIGHTNING_FIELD }, function() {
        target.mobile.cause_damage((Math.random() * 5 + 5)|0);
    });
});

Spell.REMOVE_FORCE = new Spell("Ank-Gur", [
    ["Db5", 4], ["Db5", 4], ["Db5", 4]
], 4, "special", false, function(caster, target) {
});

Spell.TELEKINESIS = new Spell("Zen-Mir", [
    ["Db5", 4], ["Db5", 4], ["Db5", 4]
], 4, "special", false, function(caster, target) {
});

Spell.COLD_FIELD = new Spell("Mor-Zimm", [
    ["Db5", 4], ["Db5", 4], ["Db5", 4]
], 4, "attack", true, function(caster, target) {
    ZIL.launch_missile(caster, target, { spell: Spell.COLD_FIELD }, function() {
        target.mobile.cause_damage((Math.random() * 5 + 5)|0);
    });
});

Spell.POSSESS = new Spell("Ton-Mor", [
    ["Db5", 4], ["Db5", 4], ["Db5", 4]
], 4, "hinder", false, function(caster, target) {
    target.mobile.set_status(Mobile.STATUS_POSSESSED, 10);
}, function(target) { return !Spell.target_has_status(target, [Mobile.STATUS_POSSESSED]); });




// page 5
Spell.SUMMON_3 = new Spell("Sum-Bre", [
    ["Db5", 4], ["Db5", 4], ["Db5", 4]
], 5, "attack", false, function(caster, target) {
});

Spell.CONE_DEATH = new Spell("Mor-Vat", [
    ["Db5", 4], ["Db5", 4], ["Db5", 4]
], 5, "attack", true, function(caster, target) {
    ZIL.launch_missile(caster, target, { spell: Spell.CONE_DEATH }, function() {
        target.mobile.cause_damage((Math.random() * 5 + 5)|0);
    });
});

Spell.RESURRECT = new Spell("Het-Mor", [
    ["Db5", 4], ["Db5", 4], ["Db5", 4]
], 5, "help", false, function(caster, target) {
    target.mobile.remove_status(Mobile.STATUS_DEAD);
}, function(target) { return Spell.target_has_status(target, [Mobile.STATUS_DEAD]); });

Spell.QUAKE = new Spell("Mor-Var", [
    ["Db5", 4], ["Db5", 4], ["Db5", 4]
], 5, "attack", true, function(caster, target) {
});

Spell.BLOCK_SONG = new Spell("Tor-Zare", [
    ["Db5", 4], ["Db5", 4], ["Db5", 4]
], 5, "help", false, function(caster, target) {
    target.mobile.set_status(Mobile.STATUS_BLOCKED, 10);
}, function(target) { return !Spell.target_has_status(target, [Mobile.STATUS_BLOCKED]); });

Spell.HAMMER = new Spell("Tor-Zare", [
    ["Db5", 4], ["Db5", 4], ["Db5", 4]
], 5, "attack", false, function(caster, target) {
    ZIL.launch_missile(caster, target, { spell: Spell.HAMMER }, function() {
        target.mobile.cause_damage((Math.random() * 5 + 5)|0);
    });
});




Spell.prototype.play_music = function() {
    if(Spell.MIDI_INIT == false) {
        Spell.MIDI_INIT = true;
        MIDI.WebAudio.connect({ callback: ZIL_UTIL.bind(this, this._play_music)});
    } else {
        this._play_music();
    }
};

Spell.prototype._play_music = function() {
    var delay = 0;
    MIDI.programChange(0, Spell.MIDI_INSTRUMENT_ID);
    for(var i = 0; i < this.music.length; i++) {
        MIDI.noteOn(0, MIDI.keyToNote[this.music[i][0]], 127, delay);
        delay += 1 / this.music[i][1] * Spell.SPEED;
    }
};
