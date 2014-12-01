var PI = 3.14159;

var ZIL_UTIL = {
};

ZIL_UTIL.N = 0; // y smaller
ZIL_UTIL.E = 1; // x smaller
ZIL_UTIL.S = 2; // y bigger
ZIL_UTIL.W = 3; // x bigger

ZIL_UTIL.CHUNK_SIZE = 16;
ZIL_UTIL.WIDTH = 100 * ZIL_UTIL.CHUNK_SIZE;
ZIL_UTIL.HEIGHT = 100 * ZIL_UTIL.CHUNK_SIZE;
ZIL_UTIL.DEPTH = 2 * ZIL_UTIL.CHUNK_SIZE;
ZIL_UTIL.VIEW_WIDTH = 4 * ZIL_UTIL.CHUNK_SIZE;
ZIL_UTIL.VIEW_HEIGHT = 4 * ZIL_UTIL.CHUNK_SIZE;
ZIL_UTIL.VIEW_DEPTH = 2 * ZIL_UTIL.CHUNK_SIZE;
ZIL_UTIL.CAM_ZOOM = 1.4;
ZIL_UTIL.ORIGIN = [0, 0, 0];
ZIL_UTIL.DAMAGE_LIFE = 2300;
ZIL_UTIL.DAMAGE_SPEED = 20;

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

ZIL_UTIL.clear_node = function(node) {
	while(node.children && node.children.length != 0) {
		node.remove(node.children[0]);
	}
};

ZIL_UTIL.update_progress = function(percent) {
    if(percent >= 1) {
        $("#progress").hide();
        $("#progress_overlay").hide();
    } else {
        if ($("#progress").length == 0) {
            $("body").append("" +
                "<div id='progress'>" +
                "   <div>Loading...</div>" +
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
            "background": "#666",
            "padding": "20px",
            "border": "3px solid #333",
            "border-radius": "5px",
            "left": ($(document).width() - w)/2 + "px",
            "top": ($(document).height() - h)/2 + "px",
            "color": "#000"
        });
        $("#progress_bar_container").css({
            "border": "1px solid #333",
            "padding": "5px",
            "margin-top": "10px",
        });
        $("#progress_bar").css({
            "background": "#66c",
            "border": "1px solid #448",
            "height": "5px",
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

ZIL_UTIL.rand_int = function(a, b) {
    return Math.round(a + Math.random() * (b - a));
};
