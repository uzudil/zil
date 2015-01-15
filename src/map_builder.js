function MazeHelper(maze, use_walls, extras) {
    this.maze = maze;
    this.use_walls = use_walls;
    this.extras = extras;

    this.rock_floor = ZilShape.load_shape("floor", "stone");
    this.long_wall = ZilShape.load_shape("walls", "stone");
    this.short_wall = ZilShape.load_shape("walls", "stone2");
    this.long_wall_ns = ZilShape.load_shape("walls", "stone", 1);
    if(use_walls) {
        this.long_walls = [ this.long_wall ];
        this.long_walls_ns = [ this.long_wall_ns ];
        this.short_walls = [ this.short_wall ];
    } else {
        this.long_walls = [ ZilShape.load_shape("rocks", "long"), ZilShape.load_shape("rocks", "long2"), ZilShape.load_shape("rocks", "long3") ];
        this.long_walls_ns = _.map(this.long_walls, function(e) {
            return ZilShape.load_shape(e.category, e.name, e.rotation + 1);
        });
        this.short_walls = [ ZilShape.load_shape("rocks", "short") ];
    }
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

MazeHelper.prototype.random_long_wall = function() {
    return ZIL_UTIL.random_pick(this.long_walls);
};

MazeHelper.prototype.random_long_wall_ns = function() {
    return ZIL_UTIL.random_pick(this.long_walls_ns);
};

MazeHelper.prototype.random_short_wall = function() {
    return ZIL_UTIL.random_pick(this.short_walls);
};

MazeHelper.prototype.get_pos = function(width, height) {
    var pos = [];
    for (var x = 0; x < width; x++) {
        for (var y = 0; y < height; y++) {
            pos.push([x, y]);
        }
    }
    return pos;
};

MazeHelper.prototype.draw_pos = function(x, y, shape, map, width, height) {
    if(map[x] && map[x][y] == 0) {
        var n = y <= 0 || map[x][y - 1];
        var s = y >= height - 1 || map[x][y + 1];
        var w = x <= 0 || map[x - 1][y];
        var e = x >= width - 1 || map[x + 1][y];
        var nw = (x <= 0 || y <= 0) || map[x - 1][y - 1];
        var ne = (x >= width - 1 || y <= 0) || map[x + 1][y - 1];
        var sw = (x <= 0 || y >= height - 1) || map[x - 1][y + 1];
        var se = (x >= width - 1 || y >= height - 1) || map[x + 1][y + 1];

        this.draw_map_pos(shape, x, y, n, s, e, w, nw, ne, sw, se);
    }
};

MazeHelper.prototype.post_draw_map = function(shape, map, width, height) {
    // compress
//    shape.remove_unseen();
};

MazeHelper.prototype.draw_map_pos = function(shape, map_x, map_y, n, s, e, w, nw, ne, sw, se) {
    // nw
    var x = (map_x * 2 + 0) * ZIL_UTIL.CHUNK_SIZE;
    var y = (map_y * 2 + 0) * ZIL_UTIL.CHUNK_SIZE;
    this.draw_floor(shape, x, y);
    if(n && w) this.draw_wall(shape, x, y, true, false, false, true);
    else if(n) this.draw_wall(shape, x, y, true, false, false, false);
    else if(w) this.draw_wall(shape, x, y, false, false, false, true);
    if(nw && !n && !w) this.draw_corner(shape, x, y, true, false, false, true);

    // ne
    x = (map_x * 2 + 1) * ZIL_UTIL.CHUNK_SIZE;
    y = (map_y * 2 + 0) * ZIL_UTIL.CHUNK_SIZE;
    this.draw_floor(shape, x, y);
    if(n && e) this.draw_wall(shape, x, y, true, false, true, false);
    else if(n) this.draw_wall(shape, x, y, true, false, false, false);
    else if(e) this.draw_wall(shape, x, y, false, false, true, false);
    if(ne && !n && !e) this.draw_corner(shape, x, y, true, false, true, false);

    // sw
    x = (map_x * 2 + 0) * ZIL_UTIL.CHUNK_SIZE;
    y = (map_y * 2 + 1) * ZIL_UTIL.CHUNK_SIZE;
    this.draw_floor(shape, x, y);
    if(s && w) this.draw_wall(shape, x, y, false, true, false, true);
    else if(s) this.draw_wall(shape, x, y, false, true, false, false);
    else if(w) this.draw_wall(shape, x, y, false, false, false, true);
    if(sw && !s && !w) this.draw_corner(shape, x, y, false, true, false, true);

    // se
    x = (map_x * 2 + 1) * ZIL_UTIL.CHUNK_SIZE;
    y = (map_y * 2 + 1) * ZIL_UTIL.CHUNK_SIZE;
    this.draw_floor(shape, x, y);
    if(s && e) this.draw_wall(shape, x, y, false, true, true, false);
    else if(s) this.draw_wall(shape, x, y, false, true, false, false);
    else if(e) this.draw_wall(shape, x, y, false, false, true, false);
    if(se && !s && !e) this.draw_corner(shape, x, y, false, true, true, false);

    // doors
    if(n && s && !w && !e && ZIL_UTIL.on_chance(85)) {
        x = (map_x * 2 + 0) * ZIL_UTIL.CHUNK_SIZE;
        y = (map_y * 2 + 0) * ZIL_UTIL.CHUNK_SIZE;
        this.draw_door(shape, x, y, true, true, false, false);
    } else if (w && e && !n && !s && ZIL_UTIL.on_chance(85)) {
        x = (map_x * 2 + 0) * ZIL_UTIL.CHUNK_SIZE;
        y = (map_y * 2 + 0) * ZIL_UTIL.CHUNK_SIZE;
        this.draw_door(shape, x, y, false, false, true, true);
    } else {
        // decoration
        if (n) {
            x = (map_x * 2 + 0) * ZIL_UTIL.CHUNK_SIZE;
            y = (map_y * 2 + 0) * ZIL_UTIL.CHUNK_SIZE;
            if (ZIL_UTIL.on_chance(65)) {
                this.draw_decoration(shape, x, y, true, false, false, false);

            }
        }
        if (s) {
            x = (map_x * 2 + 0) * ZIL_UTIL.CHUNK_SIZE;
            y = (map_y * 2 + 1) * ZIL_UTIL.CHUNK_SIZE;
            if (ZIL_UTIL.on_chance(65)) {
                this.draw_decoration(shape, x, y, false, true, false, false);
            }
        }
        if (w) {
            x = (map_x * 2 + 0) * ZIL_UTIL.CHUNK_SIZE;
            y = (map_y * 2 + 0) * ZIL_UTIL.CHUNK_SIZE;
            if (ZIL_UTIL.on_chance(65)) {
                this.draw_decoration(shape, x, y, false, false, false, true);

            }
        }
        if (e) {
            x = (map_x * 2 + 1) * ZIL_UTIL.CHUNK_SIZE;
            y = (map_y * 2 + 0) * ZIL_UTIL.CHUNK_SIZE;
            if (ZIL_UTIL.on_chance(65)) {
                this.draw_decoration(shape, x, y, false, false, true, false);
            }
        }
    }
};


MazeHelper.prototype.draw_wall = function(shape, x, y, n, s, e, w) {
    if(n) {
        shape.set_shape(x, y, 1, this.random_long_wall_ns());
        shape.set_shape(x + 8, y, 1, this.random_long_wall_ns());
    }
    if(s) {
        shape.set_shape(x, y + ZIL_UTIL.CHUNK_SIZE - 4, 1, this.random_long_wall_ns());
        shape.set_shape(x + 8, y + ZIL_UTIL.CHUNK_SIZE - 4, 1, this.random_long_wall_ns());
    }
    if(w) {
        if(n) {
            shape.set_shape(x, y + 4, 1, this.random_short_wall());
        } else {
            shape.set_shape(x, y, 1, this.random_long_wall());
        }
        if(s) {
            shape.set_shape(x, y + 8, 1, this.random_short_wall());
        } else {
            shape.set_shape(x, y + 8, 1, this.random_long_wall());
        }
    }
    if(e) {
        if(n) {
            shape.set_shape(x + ZIL_UTIL.CHUNK_SIZE - 4, y + 4, 1, this.random_short_wall());
        } else {
            shape.set_shape(x + ZIL_UTIL.CHUNK_SIZE - 4, y, 1, this.random_long_wall());
        }
        if(s) {
            shape.set_shape(x + ZIL_UTIL.CHUNK_SIZE - 4, y + 8, 1, this.random_short_wall());
        } else {
            shape.set_shape(x + ZIL_UTIL.CHUNK_SIZE - 4, y + 8, 1, this.random_long_wall());
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
    if(n && w) shape.set_shape(x, y, 1, this.random_short_wall());
    else if(n && e) shape.set_shape(x + 12, y, 1, this.random_short_wall());
    else if(s && w) shape.set_shape(x, y + 12, 1, this.random_short_wall());
    else if(s && e) shape.set_shape(x + 12, y + 12, 1, this.random_short_wall());
};

function CaveHelper() {
    var color1 = $("#color option:selected").index() || ZIL_BUILD.add_color(0x888888);
    if(!ZIL_UTIL.shape_exists("rocks", "cave0-" + color1)) {
        var c = ZIL_UTIL.palette[color1];
        var c2 = ZIL_UTIL.shade_color(c, 0.9);
        var color2 = ZIL_BUILD.add_color(c2);
        for (var i = 0; i < 10; i++) {
            var shape = new Rocks(color1, color2, 24, 24, 20, { erode_count: 5 }).shape_obj;
            shape.category = "rocks";
            shape.name = "cave" + i + "-" + color1;
            shape.remove_unseen();
            shape.save_shape()
        }
    }
    this.rocks = [];
    for (var i = 0; i < 10; i++) this.rocks.push(ZilShape.load_shape("rocks", "cave" + i + "-" + color1));
    this.rock_floor = ZilShape.load_shape("floor", "stone");
}

CaveHelper.RES = 16;

CaveHelper.prototype.generate = function(w, h, callback) {
    var map = new ROT.Map.Cellular(w, h, { connected: true });
    map.randomize(0.5);
    for(var i = 0; i < 3; i++) map.create();
    map.create(callback);
};

CaveHelper.prototype.get_pos = function(width, height) {
    var pos = [];
    for (var x = 0; x < width + 2; x++) {
        for (var y = 0; y < height + 2; y++) {
            pos.push([x, y]);
        }
    }
    return pos;
};

CaveHelper.prototype.draw_pos = function(x, y, shape, map, width, height) {
    if (x == 0 || y == 0 || x == width + 2 - 1 || y == height + 2 - 1) {
        // border
        shape.include_shape(x * CaveHelper.RES, y * CaveHelper.RES, 0, ZIL_UTIL.random_pick(this.rocks));
    } else {
        // the maze
        var rx = x - 1;
        var ry = y - 1;
        if (map[rx] && map[rx][ry] == 1) {
            shape.set_shape(x * CaveHelper.RES, y * CaveHelper.RES, 0, ZIL_UTIL.random_pick(this.rocks));
        } else {
            shape.set_shape(x * CaveHelper.RES, y * CaveHelper.RES, 0, this.rock_floor);
        }
    }
};

CaveHelper.prototype.post_draw_map = function(shape, map, width, height) {
    // compress
//    shape.remove_unseen();
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

    // debug
    for (var y = 0; y < this.h; y++) {
        s = "";
        for(var x = 0; x < this.w; x++) {
            s += map[x][y] ? "*" : ".";
        }
        console.log(s);
    }

    // fix the map so it's not moved
    shape.set_position(0, 0, 0, 0);

    var pos = this.map_helper.get_pos(this.w, this.h);
    ZIL_UTIL.update_progress(0);
    setTimeout(ZIL_UTIL.bind(this, function() {
        this.draw_map(pos, 0, shape, map, this.w, this.h);
    }), 100);
};

MapBuilder.prototype.draw_map = function(pos, pos_index, shape, map, width, height) {
    ZIL_UTIL.update_progress(pos_index / pos.length);

    var n = Math.min(pos_index + (pos.length / 10)|0, pos.length);
    for(var i = pos_index; i < n; i++) {
        var p = pos[i];
        this.map_helper.draw_pos(p[0], p[1], shape, map, width, height);
    }

    if(n < pos.length) {
        setTimeout(ZIL_UTIL.bind(this, function() {
            this.draw_map(pos, n, shape, map, width, height);
        }), 100);
    } else {
        ZIL_UTIL.update_progress(1);
        this.map_helper.post_draw_map(shape, map, width, height);
    }
};


