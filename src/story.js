function ZilStory() {
}

ZilStory.schedule_intro = function() {
    ZilCal.schedule("intro", 500, function () {
        ZIL_UTIL.seen_intro = true;
        ZIL_UTIL.save_config();
        ZIL.say(ZIL.player, "What... <b>is...</b> <i>happening?...</i>", function () {
            ZIL.say(ZIL.player, "I've seen this land before...<br>It's <b>Grove</b>, the world I built!", function () {
                ZIL.say(ZIL.player, "Trapped in my own game?!<br>How is this possible?", function () {
                    ZIL.say(ZIL.player, "I must find a <b>way back into reality.</b>", function () {
                        Mobile.hide_convos();
                        // return true means: unpause game
                        return true;
                    });
                });
            });
        });
    });
};
