function Commands() {
}

Commands.command = "";
Commands.past_commands = [];
Commands.past_command_index = 0;

Commands.start = function() {
    Commands.command = "";
    ZIL.log(Commands.command, "console_command");
};

Commands.special_key = function(event) {
    //            console.log("keyup:" + event.which);
    if(event.which == 38) {
        if(Commands.past_command_index > -1) {
            if(Commands.past_commands[Commands.past_command_index] == Commands.command) Commands.past_command_index--;
            if(Commands.past_command_index > -1) {
                Commands.command = Commands.past_commands[Commands.past_command_index--];
                $(".console_command").text(Commands.command);
            }
        }
    } else if(event.which == 40) {
        if(Commands.past_command_index < Commands.past_commands.length - 1) {
            if(Commands.past_commands[Commands.past_command_index+1] == Commands.command) Commands.past_command_index++;
            if(Commands.past_command_index < Commands.past_commands.length - 1) {
                Commands.command = Commands.past_commands[++Commands.past_command_index];
                $(".console_command").text(Commands.command);
            }
        }
    } else if(event.which == 13) {
        // execute command
        $(".console_command").remove();
        ZIL.stop_command_mode();
        Commands.past_commands.push(Commands.command);
        Commands.past_command_index = Commands.past_commands.length - 1;
        ZIL.log(Commands.command);
        Commands.execute();
    } else if(event.which == 8) {
        // backspace
        if(Commands.command.length > 0) Commands.command = Commands.command.substr(0, Commands.command.length - 1);
        $(".console_command").text(Commands.command);
    } else if(event.which == 27) {
        // cancel command
        Commands.past_command_index = Commands.past_commands.length - 1;
        $(".console_command").remove();
        ZIL.stop_command_mode();
    }
};

// typing
Commands.typed_key = function(event) {
    Commands.past_command_index = Commands.past_commands.length - 1;
    Commands.command += String.fromCharCode(event.keyCode);
    $(".console_command").text(Commands.command);
};

Commands.execute = function() {
    if(Commands.command == null || Commands.command.trim().length == 0) return;

    var match = Commands.command.trim().match(/^cast\s+(.*?)$/);
    if(match && match[1]) {
        ZIL.player.mobile.cast_spell_by_name(match[1]);
    }
};

