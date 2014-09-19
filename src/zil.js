var ZIL = {

	geometry: null,
	material: null,
	cube: null,
	scene: null,
	camera: null,
	renderer: null,
	M: 1.3,
	DIR: 0.005,
	cubes: [],
	SIZE: 4,

	start_game: function() {
		ZIL.scene = new THREE.Scene();
		ZIL.renderer = new THREE.WebGLRenderer();
		ZIL.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

		ZIL.renderer.setSize( window.innerWidth, window.innerHeight );
		document.body.appendChild( ZIL.renderer.domElement );

		ZIL.geometry = new THREE.BoxGeometry(1,1,1);
		ZIL.material = new THREE.MeshLambertMaterial( { color: 0x00ff00, wireframe: false } );
		ZIL.cube = new THREE.Object3D();

		for(var x = 0; x < ZIL.SIZE; x++) {
			for(var y = 0; y < ZIL.SIZE; y++) {
				for(var z = 0; z < ZIL.SIZE; z++) {
					var c = new THREE.Mesh( ZIL.geometry, ZIL.material );
					c.position.x = (ZIL.SIZE/2.0 - x) * ZIL.M;
					c.position.y = (ZIL.SIZE/2.0 - y) * ZIL.M;
					c.position.z = (ZIL.SIZE/2.0 - z) * ZIL.M;
					ZIL.cubes[x + y * ZIL.SIZE + z * ZIL.SIZE * ZIL.SIZE] = c;
					ZIL.cube.add(c);
				}
			}
		}
		ZIL.cube.rotation.x = 0.5;
		ZIL.scene.add( ZIL.cube );		
		

		ZIL.camera.position.z = ZIL.SIZE * 2;

		var light = new THREE.HemisphereLight( 0xffffff, 0x000000, 0.5 );
		ZIL.scene.add( light );
		var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
		directionalLight.position.set( -1, 1, 1 );
		ZIL.scene.add( directionalLight );
		
		ZIL.render();
	},

	render: function() {
		ZIL.M += ZIL.DIR;
		if((ZIL.DIR > 0 && ZIL.M >= 2) || (ZIL.DIR < 0 && ZIL.M <= 1)) {
			ZIL.DIR *= -1;
		}
		for(var x = 0; x < ZIL.SIZE; x++) {
			for(var y = 0; y < ZIL.SIZE; y++) {
				for(var z = 0; z < ZIL.SIZE; z++) {
					var c = ZIL.cubes[x + y * ZIL.SIZE + z * ZIL.SIZE * ZIL.SIZE];
					c.position.x = (ZIL.SIZE/2.0 - x) * ZIL.M;
					c.position.y = (ZIL.SIZE/2.0 - y) * ZIL.M;
					c.position.z = (ZIL.SIZE/2.0 - z) * ZIL.M;
				}
			}
		}
		ZIL.cube.rotation.y += 0.01;
		requestAnimationFrame(ZIL.render);
		ZIL.renderer.render(ZIL.scene, ZIL.camera);
	}	
}