zil
===

Zil aims to be a voxel-based rpg with an emphasis on the story over the visuals.

The game engine:
- three.js-based, webgl-rendered, voxel engine
- will add decal textures for a few things: explosion marks, blood, magic circles
- creatures will be rendered via buildboard textures, images from roguelike tiles
- translucent blocks will be used for water, lava, wall-o-force, etc
- FOV lighting will work on voxels; should be interesting...

The editor:
- the editor composes an object graph that is expanded into blocks on load
- preset number keys speed up map editing
- map/shape storage is currently in localStorage, will have to address this soon (maybe firebase?)

Gameplay:
- story: TBD
- combat will be turn-based
