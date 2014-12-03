zil
===

Zil aims to be a voxel-based rpg with an emphasis on the story over the visuals.

How to run the game:
- download and install node-webkit from: https://github.com/rogerwang/node-webkit
- cd apps/zil
- nw .
- For more info on running apps, see: https://github.com/rogerwang/node-webkit/wiki/How-to-run-apps

The game engine:
- three.js-based, webgl-rendered, voxel engine
- will add decal textures for a few things: explosion marks, blood, magic circles
- translucent blocks will be used for water, lava, wall-o-force, etc
- FOV lighting will work on voxels; should be interesting...

The editor:
- the editor composes an object graph that is expanded into blocks on load
- preset number keys speed up map editing

Gameplay:
- story: TBD
- combat will be turn-based
