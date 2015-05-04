var PI = 3.14159;

var ZIL_UTIL = {
};

ZIL_UTIL.lightPos = new THREE.Vector3(0, 0, 0);

ZIL_UTIL.N = 0; // y smaller
ZIL_UTIL.E = 1; // x smaller
ZIL_UTIL.S = 2; // y bigger
ZIL_UTIL.W = 3; // x bigger

ZIL_UTIL.CHUNK_SIZE = 16;
ZIL_UTIL.WIDTH = 100 * ZIL_UTIL.CHUNK_SIZE;
ZIL_UTIL.HEIGHT = 100 * ZIL_UTIL.CHUNK_SIZE;
ZIL_UTIL.DEPTH = 2 * ZIL_UTIL.CHUNK_SIZE;
ZIL_UTIL.VIEW_WIDTH = 16 * ZIL_UTIL.CHUNK_SIZE;
ZIL_UTIL.VIEW_HEIGHT = 16 * ZIL_UTIL.CHUNK_SIZE;
ZIL_UTIL.VIEW_DEPTH = 2 * ZIL_UTIL.CHUNK_SIZE;
ZIL_UTIL.CAM_ZOOM = 1.4 * 2.25;
ZIL_UTIL.ORIGIN = [0, 0, 0];
ZIL_UTIL.DAMAGE_LIFE = 2300;
ZIL_UTIL.DAMAGE_SPEED = 20;
ZIL_UTIL.god_mode = false;
ZIL_UTIL.is_indoors = false;

// colors from: http://timtrott.co.uk/web-20-color-palette/
ZIL_UTIL.palette = [
	0xB02B2C, 
	0xD15600, 
	0xC79810, 
	0x73880A, 
	0x6BBA70, 
	0x3F4C6B, 
	0x356AA0, 
	0xD01F3C
];
ZIL_UTIL.last_shape_name = "default.default";
ZIL_UTIL.shortcuts = null;
ZIL_UTIL.game_events = {};
ZIL_UTIL.game_state = {};
ZIL_UTIL.game_state = {};
ZIL_UTIL.first_render = null;

ZIL_UTIL.particle_sprite1 = THREE.ImageUtils.loadTexture("../../img/p3.png");

ZIL_UTIL.visit_objects = function(object, visit_fx) {
    visit_fx(object);
    for(var i = 0; i < object.children.length; i++) {
        ZIL_UTIL.visit_objects(object.children[i], visit_fx);
    }
};

ZIL_UTIL.make_square_face = function(size) {
    var n = size / 2;

    var geometry = new THREE.Geometry();
    geometry.vertices.push( new THREE.Vector3( -n, -n, 0 ) );
    geometry.vertices.push( new THREE.Vector3( -n,  n, 0 ) );
    geometry.vertices.push( new THREE.Vector3(  n,  n, 0 ) );
    geometry.vertices.push( new THREE.Vector3(  n, -n, 0 ) );

    geometry.faces.push( new THREE.Face3( 0, 1, 2 ) ); // counter-clockwise winding order
    geometry.faces.push( new THREE.Face3( 0, 2, 3 ) );

    // geometry.computeCentroids();
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();

    return geometry;
};

ZIL_UTIL.angle_to_radians = function(angle) {
    return angle / 180.0 * PI;
};

ZIL_UTIL.radians_to_angle = function(radians) {
    return radians / PI * 180.0;
};

ZIL_UTIL.get_angle = function(x, y) {
    var angle = ZIL_UTIL.radians_to_angle(Math.atan(y / x));
    // the "arctan problem"
    if(x < 0) angle += 180;
    else if (y < 0) angle += 360;
    angle = ZIL_UTIL.angle_to_radians(angle);
    return angle;
};

ZIL_UTIL.grow_vector = function(vertex, delta) {
    var angle = ZIL_UTIL.get_angle(vertex.x, vertex.y);
    var h = vertex.y / Math.sin(angle);
    h += delta;
    vertex.x = h * Math.cos(angle);
    vertex.y = h * Math.sin(angle);
};

ZIL_UTIL.get_distance = function(ax, ay, bx, by) {
    return Math.sqrt(((ax - bx) * (ax - bx)) + ((ay - by) * (ay - by)));
};

/**
 * Distance between creatures a and b.
 * @param creature_a
 * @param creature_b
 * @param x optional position for creature a. If omitted, a's current position is used.
 * @param y optional position for creature a. If omitted, a's current position is used.
 * @returns {number}
 */
ZIL_UTIL.get_shape_distance = function(creature_a, creature_b, x, y) {
    if(x == null || y == null) {
        x = creature_a.mobile.x;
        y = creature_a.mobile.y;
    }
    var asize = (Math.max(creature_a.mobile.shape.width, creature_a.mobile.shape.height) / 2)|0;
    var bsize = (Math.max(creature_b.mobile.shape.width, creature_b.mobile.shape.height) / 2)|0;
    var ax = x + asize;
    var ay = y + asize;
    var bx = creature_b.mobile.x + bsize;
    var by = creature_b.mobile.y + bsize;
    return ZIL_UTIL.get_distance(ax, ay, bx, by) - (asize + bsize);
};

ZIL_UTIL.contains = function(x, a, b) {
    return x >= a && x < b;
};

/**
 * Is point a in the box b?
 * @param a - test point
 * @param b - start of box
 * @param size - dimensions of box
 * @returns {*}
 */
ZIL_UTIL.contains_box = function(a, b, size) {
    return ZIL_UTIL.contains(a[0], b[0], b[0] + size[0]) &&
            ZIL_UTIL.contains(a[1], b[1], b[1] + size[1]) &&
            ZIL_UTIL.contains(a[2], b[2], b[2] + size[2]);
};

ZIL_UTIL.clear_node = function(node) {
	while(node.children && node.children.length != 0) {
		node.remove(node.children[0]);
	}
};

ZIL_UTIL.apply_to_shape = function(shape, fx) {
    fx(shape);
    for(var i = 0; shape.children && i < shape.children.length; i++) {
        ZIL_UTIL.apply_to_shape(shape.children[i], fx);
    }
};

ZIL_UTIL.update_progress = function(percent, title) {
    if(percent >= 1) {
        $("#progress").hide();
        $("#progress_overlay").hide();
        $("body").css("cursor", "default");
    } else {
        $("body").css("cursor", "progress");
        if ($("#progress").length == 0) {
            $("body").append("" +
                "<div id='progress'>" +
                "   <div id='progress_title'></div>" +
                "   <div id='progress_bar_container'>" +
                "      <div id='progress_bar'></div>" +
                "   </div>" +
                "</div>" +
                "<div id='progress_overlay'></div>");
        }
        var w = 320;
        var h = 50;
        $("#progress").css({
            "display": "block",
            "position": "absolute",
            "width": w + "px",
            "height": h + "px",
            "z-index": "1000",
            "left": ($(document).width() - w)/2 + "px",
            "top": ($(document).height() - h)/2 + "px",
            "color": "#000"
        });
        $("#progress_bar_container").css({
            "border": "1px solid #111",
            "padding": "0"
        });
        $("#progress_bar").css({
            "background": "#388",
            "height": "3px",
            "width": (percent * 100) + "%"
        });
        $("#progress_overlay").css({
            "display": "block",
            "position": "fixed",
            "width": "100%",
            "height": "100%",
            "background": "#000",
            "opacity": "0.75",
            "z-index": "100"
        });
        $("#progress_title").css({
            color: "#ccc",
            "padding-bottom": "5px"
        });
        $("#progress_title").text(title ? title : "");
    }
};

ZIL_UTIL.bind = function(callerObj, method) {
	if (callerObj == null || method == null)
		console.error("neither caller nor method may be null");

	var f = function() {
		return method.apply(callerObj, arguments);
	};
	// Store the caller as a property on the function so that we can retrieve it later if needed
	f['_caller'] = callerObj;
	return f;
};

ZIL_UTIL.random_pick = function(list) {
    return list[(Math.random() * list.length)|0];
};

ZIL_UTIL.on_chance = function(x) {
    return ZIL_UTIL.rand_int(0, 100) >= x;
};

ZIL_UTIL.rand_int = function(a, b) {
    return Math.round(a + Math.random() * (b - a));
};

var fs = require('fs');
var gui = require('nw.gui');

ZIL_UTIL.exit = function() {
    gui.App.quit();
};

ZIL_UTIL.is_mini_mode = function() {
    return gui.App.argv && gui.App.argv.indexOf("--mini") >= 0;
};

ZIL_UTIL.is_continue_game_mode = function() {
    return gui.App.argv && gui.App.argv.indexOf("-c") >= 0;
};

ZIL_UTIL.is_god_mode = function() {
    return gui.App.argv && gui.App.argv.indexOf("--god") >= 0;
};

ZIL_UTIL.load_config = function(mini_x, mini_y) {

    // mini mode
    if (ZIL_UTIL.is_mini_mode()) {
        var win = gui.Window.get();
        if (win.width > mini_x) {
            win.resizeTo(mini_x, mini_y);
            location.reload();
        }
    }

    ZIL_UTIL.god_mode = ZIL_UTIL.is_god_mode();

    var config = JSON.parse(fs.readFileSync("../../data/zil.json"));

    // set the global palette
    var colors = config["colors"];
    if(colors == null) colors = ZIL_UTIL.palette;
    ZIL_UTIL.palette = colors;
    ZIL_UTIL.last_shape_name = config["shape_name"] || "default.default";
    ZIL_UTIL.shortcuts = config["shortcuts"];
    ZIL_UTIL.game_events = config["game_events"] || {};
    ZIL_UTIL.game_state = config["game_state"] || {};
    ZIL_UTIL.player_stats = config["player_stats"] || {};

    if(gui.App.argv.indexOf("--force_new") >= 0) {
        ZIL_UTIL.new_game();
    }
};

ZIL_UTIL.new_game = function() {
    ZIL_UTIL.game_state = {};
    ZIL_UTIL.game_events = {};
};

ZIL_UTIL.save_config = function() {
    var config = {
        colors: ZIL_UTIL.palette,
        shape_name: ZIL_UTIL.last_shape_name,
        shortcuts: ZIL_UTIL.shortcuts,
        game_events: ZIL_UTIL.game_events,
        game_state: ZIL_UTIL.game_state,
        player_stats: ZIL_UTIL.player_stats
    };
    fs.writeFileSync("../../data/zil.json", JSON.stringify(config, undefined, 2));
};

ZIL_UTIL.get_categories = function() {
    var file_names = fs.readdirSync("../../data/shapes");
    return file_names == null || file_names.length == 0 ? ["default"] : file_names;
};

ZIL_UTIL.get_shapes = function(category_name) {
    var file_names = fs.readdirSync("../../data/shapes/" + category_name);
    return file_names == null || file_names.length == 0 ? ["default"] : file_names;
};

ZIL_UTIL.get_shape = function(category_name, shape_name) {
    var path = "../../data/shapes/" + category_name + "/" + shape_name;
    if(fs.existsSync(path)) {
        return JSON.parse(fs.readFileSync(path));
    } else {
        return null;
    }
};

ZIL_UTIL.set_shape = function(category_name, shape_name, shape_obj) {
    var dir = "../../data/shapes/" + category_name;
    if(!fs.existsSync(dir)) fs.mkdirSync(dir);
    var path = dir + "/" + shape_name;
    fs.writeFileSync(path, JSON.stringify(shape_obj));
};

ZIL_UTIL.shape_exists = function(category_name, shape_name) {
    var dir = "../../data/shapes/" + category_name + "/" + shape_name;
    return fs.existsSync(dir);
};

ZIL_UTIL.delete_shape = function(name) {
    throw "Implement me: delete shape " + name;
};

ZIL_UTIL.shaders = null;
ZIL_UTIL.get_shaders = function() {
    if(ZIL_UTIL.shaders == null) {
        var path = "../../data/shaders/vertexshader.glsl";
        var vertex_shader = fs.readFileSync(path);
        path = "../../data/shaders/fragmentshader.glsl";
        var frag_shader = fs.readFileSync(path);
        ZIL_UTIL.shaders = [vertex_shader, frag_shader];
    }
    return ZIL_UTIL.shaders;
};
// credit: http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
ZIL_UTIL.shade_color = function(color, percent) {
    var R = (color & 0xff0000) >> 16;
    var G = (color & 0x00ff00) >> 8;
    var B = color & 0x0000ff;

    R = (R * percent)|0;
    G = (G * percent)|0;
    B = (B * percent)|0;

    R = (R<255)?R:255;
    G = (G<255)?G:255;
    B = (B<255)?B:255;

    return (R << 16) + (G << 8) + B;
};

ZIL_UTIL.generate_sprite = function(color, percent) {

    if($("#sprite_canvas").length == 0) {
        $("body").append("<canvas id='sprite_canvas' width='128' height='128'></canvas>");
    }

    var canvas = $("#sprite_canvas")[0];
    var context = canvas.getContext( '2d' );
    context.clearRect(0, 0, canvas.width, canvas.height);

    var x = canvas.width / 2;
    var y = canvas.height / 2;
    var line_width = 15;
    var radius = canvas.width / 2 - line_width;
    var startAngle = 0.5 * Math.PI * percent;
    var endAngle = 2 * Math.PI * percent;
    var counterClockwise = false;

    context.beginPath();
    context.arc(x, y, radius, startAngle, endAngle, counterClockwise);
    context.lineWidth = line_width;
    context.fillStyle = color;
    context.strokeStyle = color;
    context.fill();
    context.stroke();
    context.closePath();

    context.beginPath();
    context.arc(x, y, radius, 0, 2 * Math.PI, counterClockwise);
    context.lineWidth = line_width;
    context.strokeStyle = color;
    context.stroke();
    context.closePath();

    context.restore();

    return canvas.toDataURL();
};

ZIL_UTIL.show_fps = function(fps) {
//    $("#fps").html(fps);
    var win = gui.Window.get();
    win.title = "ZIL - " + fps;
};
