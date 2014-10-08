var PI = 3.14159;

var ZIL_UTIL = {

	WIDTH: 100,
	HEIGHT: 100,
	DEPTH: 20,
	VIEW_WIDTH: 60,
	VIEW_HEIGHT: 60,
	VIEW_DEPTH: 24,

	// colors from: http://timtrott.co.uk/web-20-color-palette/
	palette: [
		0xB02B2C, 
		0xD15600, 
		0xC79810, 
		0x73880A, 
		0x6BBA70, 
		0x3F4C6B, 
		0x356AA0, 
		0xD01F3C
	],

	clear_node: function(node) {
		while(node.children && node.children.length != 0) {
			node.remove(node.children[0]);
		}
	},
}