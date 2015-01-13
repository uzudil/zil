function MazeHelper(maze, use_walls, extras) {
    this.maze = maze;
    this.use_walls = use_walls;
    this.extras = extras;

    this.rock_floor = ZilShape.load_shape("floor", "stone");
    this.long_wall = ZilShape.load_shape("walls", "stone");
    this.short_wall = ZilShape.load_shape("walls", "stone2");
    this.long_wall_ns = ZilShape.load_shape("walls", "stone", 1);
    this.door = ZilShape.load_shape("doors", "simple");
    this.door_ns = ZilShape.load_shape("doors", "simple", 1);

    this.decorations = [
        this.short_wall,
        ZilShape.load_shape("objects", "bookshelf", 1),
        ZilShape.load_shape("objects", "candelabra"),
        ZilShape.load_shape("objects", "chair", 1),
        ZilShape.load_shape("objects", "column"),
        ZilShape.load_shape("objects", "column-wood"),
        ZilShape.load_shape("objects", "urn"),
    ];
    this.decorations_ns = _.map(this.decorations, function(shape) {
        return shape.width == shape.height ? shape : ZilShape.load_shape(shape.category, shape.name, shape.rotation + 1);
    });
}

MazeHelper.prototype.generate = function(w, h, callback) {
    var g = new this.maze(w, h, this.extras);
    g.create(callback);
};

MazeHelper.prototype.draw_floor = function(shape, x, y) {
    shape.set_shape(x, y, 0, this.rock_floor);
};

MazeHelper.prototype.draw_wall = function(shape, x, y, n, s, e, w) {
    if(n) {
        shape.set_shape(x, y, 1, this.long_wall_ns);
        shape.set_shape(x + 8, y, 1, this.long_wall_ns);
    }
    if(s) {
        shape.set_shape(x, y + ZIL_UTIL.CHUNK_SIZE - 4, 1, this.long_wall_ns);
        shape.set_shape(x + 8, y + ZIL_UTIL.CHUNK_SIZE - 4, 1, this.long_wall_ns);
    }
    if(w) {
        if(n) {
            shape.set_shape(x, y + 4, 1, this.short_wall);
        } else {
            shape.set_shape(x, y, 1, this.long_wall);
        }
        if(s) {
            shape.set_shape(x, y + 8, 1, this.short_wall);
        } else {
            shape.set_shape(x, y + 8, 1, this.long_wall);
        }
    }
    if(e) {
        if(n) {
            shape.set_shape(x + ZIL_UTIL.CHUNK_SIZE - 4, y + 4, 1, this.short_wall);
        } else {
            shape.set_shape(x + ZIL_UTIL.CHUNK_SIZE - 4, y, 1, this.long_wall);
        }
        if(s) {
            shape.set_shape(x + ZIL_UTIL.CHUNK_SIZE - 4, y + 8, 1, this.short_wall);
        } else {
            shape.set_shape(x + ZIL_UTIL.CHUNK_SIZE - 4, y + 8, 1, this.long_wall);
        }
    }
};

MazeHelper.prototype.draw_decoration = function(shape, x, y, n, s, e, w) {
    var index = (Math.random() * this.decorations.length)|0;
    var d =  n || s ? this.decorations_ns[index] : this.decorations[index];
    var width = d.width;
    var height = d.height;
    if(n) {
        shape.set_shape(x + ZIL_UTIL.CHUNK_SIZE - ((width/ 2)|0), y + 4, 1, d);
    }
    if(s) {
        shape.set_shape(x + ZIL_UTIL.CHUNK_SIZE - ((width / 2)|0), y + ZIL_UTIL.CHUNK_SIZE - 4 - height, 1, d);
    }
    if(w) {
        shape.set_shape(x + 4, y + ZIL_UTIL.CHUNK_SIZE - ((height / 2)|0), 1, d);
    }
    if(e) {
        shape.set_shape(x + ZIL_UTIL.CHUNK_SIZE - 4 - width, y + ZIL_UTIL.CHUNK_SIZE - ((height / 2)|0), 1, d);
    }
};

MazeHelper.prototype.draw_door = function(shape, x, y, n, s, e, w) {
    if(n && s) {
        shape.set_shape(x + ZIL_UTIL.CHUNK_SIZE, y + ZIL_UTIL.CHUNK_SIZE - 4, 1, this.door);
        shape.set_shape(x + ZIL_UTIL.CHUNK_SIZE - 2, y + 4, 1, this.long_wall);
        shape.set_shape(x + ZIL_UTIL.CHUNK_SIZE - 2, y + ZIL_UTIL.CHUNK_SIZE + 4, 1, this.long_wall);

    } else {
        shape.set_shape(x + ZIL_UTIL.CHUNK_SIZE - 4, y + ZIL_UTIL.CHUNK_SIZE, 1, this.door_ns);
        shape.set_shape(x + 4, y + ZIL_UTIL.CHUNK_SIZE - 2, 1, this.long_wall_ns);
        shape.set_shape(x + ZIL_UTIL.CHUNK_SIZE + 4, y + ZIL_UTIL.CHUNK_SIZE - 2, 1, this.long_wall_ns);
    }
};

MazeHelper.prototype.draw_corner = function(shape, x, y, n, s, e, w) {
    if(n && w) shape.set_shape(x, y, 1, this.short_wall);
    else if(n && e) shape.set_shape(x + 12, y, 1, this.short_wall);
    else if(s && w) shape.set_shape(x, y + 12, 1, this.short_wall);
    else if(s && e) shape.set_shape(x + 12, y + 12, 1, this.short_wall);
};

function CaveHelper() {
}

CaveHelper.prototype.generate = function(w, h, callback) {
};

function MapBuilder(w, h, map_helper) {
    this.w = w;
    this.h = h;
    this.map_helper = map_helper;
}

MapBuilder.create = function(w, h, type) {
    var map_helper = null;

    if(type == "dungeon_digger_walls") {
        map_helper = new MazeHelper(ROT.Map.Digger, true, { roomWidth: [2, 4], roomHeight: [2, 4] });
    } else if(type == "dungeon_digger_rock") {
        map_helper = new MazeHelper(ROT.Map.Digger, false, { roomWidth: [2, 4], roomHeight: [2, 4] });
    } else if(type == "dungeon_uniform_walls") {
        map_helper = new MazeHelper(ROT.Map.Uniform, true, { roomWidth: [2, 4], roomHeight: [2, 4] });
    } else if(type == "dungeon_uniform_rock") {
        map_helper = new MazeHelper(ROT.Map.Uniform, false, { roomWidth: [2, 4], roomHeight: [2, 4] });
    } else if(type == "dungeon_rogue_walls") {
        map_helper = new MazeHelper(ROT.Map.Rogue, true);
    } else if(type == "dungeon_rogue_rock") {
        map_helper = new MazeHelper(ROT.Map.Rogue, false);
    } else if(type == "maze_divide_walls") {
        map_helper = new MazeHelper(ROT.Map.DividedMaze, true);
    } else if(type == "maze_divide_rock") {
        map_helper = new MazeHelper(ROT.Map.DividedMaze, false);
    } else if(type == "maze_icey_walls") {
        map_helper = new MazeHelper(ROT.Map.IceyMaze, true);
    } else if(type == "maze_icey_rock") {
        map_helper = new MazeHelper(ROT.Map.IceyMaze, false);
    } else if(type == "maze_eller_walls") {
        map_helper = new MazeHelper(ROT.Map.EllerMaze, true);
    } else if(type == "maze_eller_rock") {
        map_helper = new MazeHelper(ROT.Map.EllerMaze, false);
    } else if(type == "cave") {
        map_helper = new CaveHelper();
    }
    if(map_helper == null) throw "Unknown map type: " + type;
    return new MapBuilder(w, h, map_helper);
};

MapBuilder.prototype.build = function(shape) {
    // generate
    var map = [];
    for(var x = 0; x < this.w; x++) {
        var col = [];
        map.push(col);
        for(var y = 0; y < this.h; y++) {
            col.push(0);
        }
    }
    this.map_helper.generate(this.w, this.h, function(x, y, is_wall) {
        map[x][y] = is_wall;
    });

    // fix the map so it's not moved
    shape.set_position(0, 0, 0, 0);

    // draw
    for(var x = 0; x < this.w; x++) {
        for (var y = 0; y < this.h; y++) {
            if(map[x][y] == 0) {
                var n = y < 0 || map[x][y - 1];
                var s = y >= this.h || map[x][y + 1];
                var w = x < 0 || map[x - 1][y];
                var e = x >= this.w || map[x + 1][y];
                var nw = (x < 0 && y < 0) || map[x - 1][y - 1];
                var ne = (x >= this.w && y < 0) || map[x + 1][y - 1];
                var sw = (x < 0 && y >= this.h) || map[x - 1][y + 1];
                var se = (x >= this.w && y >= this.h) || map[x + 1][y + 1];

                this.draw_map_pos(shape, x, y, n, s, e, w, nw, ne, sw, se);
            }
        }
    }
};

MapBuilder.prototype.draw_map_pos = function(shape, map_x, map_y, n, s, e, w, nw, ne, sw, se) {
    // nw
    var x = (map_x * 2 + 0) * ZIL_UTIL.CHUNK_SIZE;
    var y = (map_y * 2 + 0) * ZIL_UTIL.CHUNK_SIZE;
    this.map_helper.draw_floor(shape, x, y);
    if(n && w) this.map_helper.draw_wall(shape, x, y, true, false, false, true);
    else if(n) this.map_helper.draw_wall(shape, x, y, true, false, false, false);
    else if(w) this.map_helper.draw_wall(shape, x, y, false, false, false, true);
    if(nw && !n && !w) this.map_helper.draw_corner(shape, x, y, true, false, false, true);

    // ne
    x = (map_x * 2 + 1) * ZIL_UTIL.CHUNK_SIZE;
    y = (map_y * 2 + 0) * ZIL_UTIL.CHUNK_SIZE;
    this.map_helper.draw_floor(shape, x, y);
    if(n && e) this.map_helper.draw_wall(shape, x, y, true, false, true, false);
    else if(n) this.map_helper.draw_wall(shape, x, y, true, false, false, false);
    else if(e) this.map_helper.draw_wall(shape, x, y, false, false, true, false);
    if(ne && !n && !e) this.map_helper.draw_corner(shape, x, y, true, false, true, false);

    // sw
    x = (map_x * 2 + 0) * ZIL_UTIL.CHUNK_SIZE;
    y = (map_y * 2 + 1) * ZIL_UTIL.CHUNK_SIZE;
    this.map_helper.draw_floor(shape, x, y);
    if(s && w) this.map_helper.draw_wall(shape, x, y, false, true, false, true);
    else if(s) this.map_helper.draw_wall(shape, x, y, false, true, false, false);
    else if(w) this.map_helper.draw_wall(shape, x, y, false, false, false, true);
    if(sw && !s && !w) this.map_helper.draw_corner(shape, x, y, false, true, false, true);

    // se
    x = (map_x * 2 + 1) * ZIL_UTIL.CHUNK_SIZE;
    y = (map_y * 2 + 1) * ZIL_UTIL.CHUNK_SIZE;
    this.map_helper.draw_floor(shape, x, y);
    if(s && e) this.map_helper.draw_wall(shape, x, y, false, true, true, false);
    else if(s) this.map_helper.draw_wall(shape, x, y, false, true, false, false);
    else if(e) this.map_helper.draw_wall(shape, x, y, false, false, true, false);
    if(se && !s && !e) this.map_helper.draw_corner(shape, x, y, false, true, true, false);

    // doors
    if(n && s && !w && !e && ZIL_UTIL.on_chance(85)) {
        x = (map_x * 2 + 0) * ZIL_UTIL.CHUNK_SIZE;
        y = (map_y * 2 + 0) * ZIL_UTIL.CHUNK_SIZE;
        this.map_helper.draw_door(shape, x, y, true, true, false, false);
    } else if (w && e && !n && !s && ZIL_UTIL.on_chance(85)) {
        x = (map_x * 2 + 0) * ZIL_UTIL.CHUNK_SIZE;
        y = (map_y * 2 + 0) * ZIL_UTIL.CHUNK_SIZE;
        this.map_helper.draw_door(shape, x, y, false, false, true, true);
    } else {
        // decoration
        if (n) {
            x = (map_x * 2 + 0) * ZIL_UTIL.CHUNK_SIZE;
            y = (map_y * 2 + 0) * ZIL_UTIL.CHUNK_SIZE;
            if (ZIL_UTIL.on_chance(65)) {
                this.map_helper.draw_decoration(shape, x, y, true, false, false, false);

            }
        }
        if (s) {
            x = (map_x * 2 + 0) * ZIL_UTIL.CHUNK_SIZE;
            y = (map_y * 2 + 1) * ZIL_UTIL.CHUNK_SIZE;
            if (ZIL_UTIL.on_chance(65)) {
                this.map_helper.draw_decoration(shape, x, y, false, true, false, false);
            }
        }
        if (w) {
            x = (map_x * 2 + 0) * ZIL_UTIL.CHUNK_SIZE;
            y = (map_y * 2 + 0) * ZIL_UTIL.CHUNK_SIZE;
            if (ZIL_UTIL.on_chance(65)) {
                this.map_helper.draw_decoration(shape, x, y, false, false, false, true);

            }
        }
        if (e) {
            x = (map_x * 2 + 1) * ZIL_UTIL.CHUNK_SIZE;
            y = (map_y * 2 + 0) * ZIL_UTIL.CHUNK_SIZE;
            if (ZIL_UTIL.on_chance(65)) {
                this.map_helper.draw_decoration(shape, x, y, false, false, true, false);
            }
        }
    }
};
