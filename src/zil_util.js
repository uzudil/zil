var PI = 3.14159;

var ZIL_UTIL = {
};

ZIL_UTIL.CHUNK_SIZE = 16;
ZIL_UTIL.WIDTH = 100 * ZIL_UTIL.CHUNK_SIZE;
ZIL_UTIL.HEIGHT = 100 * ZIL_UTIL.CHUNK_SIZE;
ZIL_UTIL.DEPTH = 2 * ZIL_UTIL.CHUNK_SIZE;
ZIL_UTIL.VIEW_WIDTH = 4 * ZIL_UTIL.CHUNK_SIZE;
ZIL_UTIL.VIEW_HEIGHT = 4 * ZIL_UTIL.CHUNK_SIZE;
ZIL_UTIL.VIEW_DEPTH = 2 * ZIL_UTIL.CHUNK_SIZE;
ZIL_UTIL.CAM_ZOOM = 1.4;

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

ZIL_UTIL.clear_node = function(node) {
	while(node.children && node.children.length != 0) {
		node.remove(node.children[0]);
	}
};
