function Spell(name, music, start_fx) {
    this.name = name;
    this.music = music;
    this.start_fx = start_fx;
    Spell.SPELLS_BY_NAME[name] = this;
}

Spell.SPELLS_BY_NAME = {};
Spell.MIDI_INIT = false;
Spell.MIDI_INSTRUMENT_ID = 11; // vibraphone

Spell.HEAL = new Spell("Zon-Bur", [
    ["Db5", 4], ["Eb5", 4], ["Gb5", 4], ["Eb5", 2], ["Eb5", 2], ["Gb5", 4], ["Db5", 1], ["Db5", 1]
], function(caster, target) {
    caster.mobile.heal((Math.random() * 5 + 5)|0);
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
        delay += 1 / this.music[i][1];
    }
};
