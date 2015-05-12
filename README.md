zil
===

Casual game developer hits writer's block, sells soul to the devil for inspiration, gets trapped in own game, and must find way back into the real world. Along the way mysterious revelations and many twists of the plot keep the action fresh. A mix of multi-dimensional roguelike and interactive mystery, liberally sprinkled with all manner of nerdcraft.

![In the sewers of Skrit](/screens/lighting.png?raw=true "In the sewers of Skrit")

The game engine:
- three.js-based, webgl-rendered, voxel engine
- will add decal textures for a few things: explosion marks, blood, magic circles
- translucent blocks will be used for water, lava, wall-o-force, etc
- FOV lighting will work on voxels; should be interesting...

The editor:
- the editor composes an object graph that is expanded into blocks on load
- preset number keys speed up map editing

How to run the game:
Zil uses node-webkit to become a desktop app. To run it you must first install node-webkit:
- download and install from: https://github.com/rogerwang/node-webkit
- cd apps/zil
- nw .
- For more info on running apps, see: https://github.com/rogerwang/node-webkit/wiki/How-to-run-apps
- to run the game again from the beginning, do: nw . --force_new
