// customized 3d astar, from:
//
// javascript-astar 0.3.0
// http://github.com/bgrins/javascript-astar
// Freely distributable under the MIT License.
// Implements the astar search algorithm in javascript using a Binary Heap.
// Includes Binary Heap (with modifications) from Marijn Haverbeke.
// http://eloquentjavascript.net/appendix2.html

ASTAR_TIMEOUT = 1000; // give up after this many millis

(function(definition) {
    /* global module, define */
    if(typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = definition();
    } else if(typeof define === 'function' && define.amd) {
        define([], definition);
    } else {
        var exports = definition();
        window.astar = exports.astar;
        window.Graph = exports.Graph;
    }
})(function() {

function pathTo(node){
    var curr = node,
        path = [];
    while(curr.parent) {
        path.push(curr);
        curr = curr.parent;
    }
    return path.reverse();
}

function getHeap() {
    return new BinaryHeap(function(node) {
        return node.f;
    });
}

var astar = {

    /**
    * Perform an A* Search on a graph given a start and end node.
    * @param {ZilShape} the 'map' shape
    * @param {GridNode} start
    * @param {GridNode} end
    * @param {ZilShape} creature moving
    * @param {Object} [options]
    * @param {bool} [options.closest] Specifies whether to return the
               path to the closest node if the target is unreachable.
    * @param {Function} [options.heuristic] Heuristic function (see
    *          astar.heuristics).
    */
    search: function(graph, start, end, creature, options) {
        graph.astar_init();

        options = options || {};
        var heuristic = options.heuristic || astar.heuristics.manhattan,
            closest = options.closest || false;

        var openHeap = getHeap(),
            closestNode = start; // set the start node to be the closest if required

        start.h = heuristic(start, end);

        openHeap.push(start);

        var start_time = Date.now();
        while(openHeap.size() > 0) {
            // timeout?
            if(Date.now() - start_time > ASTAR_TIMEOUT) return [];

            // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
            var currentNode = openHeap.pop();

            // End case -- result has been found, return the traced path.
            if(currentNode === end) {
                return pathTo(currentNode);
            }

            // Normal case -- move currentNode from open to closed, process each of its neighbors.
            currentNode.closed = true;

            // Find all neighbors for the current node.
            var neighbors = graph.neighbors(currentNode, creature);
            for (var i = 0, il = neighbors.length; i < il; ++i) {
                var neighbor = neighbors[i];

                if (neighbor.closed || graph.isWall(neighbor, creature, options["ignore_creatures"])) {
                    // Not a valid node to process, skip to next neighbor.
                    continue;
                }

                // The g score is the shortest distance from start to current node.
                // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
                var gScore = currentNode.g + neighbor.getCost(currentNode),
                    beenVisited = neighbor.visited;

                if (!beenVisited || gScore < neighbor.g) {

                    // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
//                    var pp = pathTo(currentNode);
//                    console.log("path: " + _.map(pp, function(n) { return n.x + "," + n.y + "," + n.z + "|"; }));
                    neighbor.visited = true;
                    neighbor.parent = currentNode;
                    neighbor.h = neighbor.h || heuristic(neighbor, end);
                    neighbor.g = gScore;
                    neighbor.f = neighbor.g + neighbor.h;

                    if (closest) {
                        // If the neighbour is closer than the current closestNode or if it's equally close but has
                        // a cheaper path than the current closest node then it becomes the closest node
                        if (neighbor.h < closestNode.h || (neighbor.h === closestNode.h && neighbor.g < closestNode.g)) {
                            closestNode = neighbor;
                        }
                    }

                    if (!beenVisited) {
                        // Pushing to heap will put it in proper place based on the 'f' value.
                        openHeap.push(neighbor);
                    }
                    else {
                        // Already seen the node, but since it has been rescored we need to reorder it in the heap
                        openHeap.rescoreElement(neighbor);
                    }
                }
            }
        }

        if (closest) {
            return pathTo(closestNode);
        }

        // No result was found - empty array signifies failure to find path.
        return [];
    },
    // See list of heuristics: http://theory.stanford.edu/~amitp/GameProgramming/Heuristics.html
    heuristics: {
        manhattan: function(pos0, pos1) {
            var d1 = Math.abs(pos1.x - pos0.x);
            var d2 = Math.abs(pos1.y - pos0.y);
            var d3 = Math.abs(pos1.z - pos0.z);
            return d1 + d2 + d3;
        },
        diagonal: function(pos0, pos1) {
            var D = 1;
            var D2 = Math.sqrt(2);
            var d1 = Math.abs(pos1.x - pos0.x);
            var d2 = Math.abs(pos1.y - pos0.y);
            return (D * (d1 + d2)) + ((D2 - (2 * D)) * Math.min(d1, d2));
        }
    }
};

ZilShape.prototype.isWall = function(node, creature, ignore_creatures) {
    if(node.is_empty) return true;

    if(!ignore_creatures) {
        for (var dx = 0; dx < ZilShape.PATH_RES; dx++) {
            for (var dy = 0; dy < ZilShape.PATH_RES; dy++) {
                if (creature.mobile.creature_blocked(node.x + dx, node.y + dy, node.z)) return true;
            }
        }
    }

    return false;
};

ZilShape.prototype.can_reach = function(max_steps, start_node, end_node, creature, ignore_creatures) {
    if(!(start_node && end_node)) return [];

    var path = astar.search(this, start_node, end_node, creature, { ignore_creatures: ignore_creatures } );

    var success = false;
    if(path && path.length > 0 && path.length <= max_steps) {
        var last_node = path[path.length - 1];
        // start_node, end_node have no z coord., so check all z values.
        // todo: maybe add a more specific check here for can_reach_creature?
        success = ZIL_UTIL.contains_box([end_node.x, end_node.y, 0],
            [last_node.x, last_node.y, 0],
            [ZilShape.PATH_RES, ZilShape.PATH_RES, ZIL_UTIL.DEPTH]);
    }
    return success;
};

ZilShape.prototype.astar_search = function(start, end, creature) {
    if(!start || !end) return [];
    var ex = (end[0]/ZilShape.PATH_RES)|0;
    var ey = (end[1]/ZilShape.PATH_RES)|0;
    if(ex < 0 || ex >= this.nodes.length || ey < 0 || ey >= this.nodes[0].length) return [];
    var start_node = this.nodes[(start[0]/ZilShape.PATH_RES)|0][(start[1]/ZilShape.PATH_RES)|0];
    var end_node = this.nodes[ex][ey];
//    console.log("==== start_node=" + start_node.x + "," + start_node.y + "," + start_node.z + " end_node=" + end_node.x + "," + end_node.y + "," + end_node.z);
    if(!(start_node && end_node)) return [];
    var path = astar.search(this, start_node, end_node, creature, { closest: true });

    // create a real path
    var p = [];
    for(var i = 0; i < path.length; i++) {
        var prev = i == 0 ? start_node : path[i - 1];
        var node = path[i];
        p.push([prev.x, prev.y, prev.z]);
        for(var t = 1; t < ZilShape.PATH_RES; t++) {
            var x = prev.x + ((node.x - prev.x) * t / ZilShape.PATH_RES)|0;
            var y = prev.y + ((node.y - prev.y) * t / ZilShape.PATH_RES)|0;
            var z = Math.max(node.z, prev.z);
            var n = this.find_color_at(x, y, z); // try higher first
            if(n == null && node.z != prev.z) {
                z = Math.min(node.z, prev.z);
                n = this.find_color_at(x, y, z);
            }
            if(n == null) break;
            p.push([x, y, z]);
        }
    }
    if(end_node && p.length > 0 && end_node.next_to(p[p.length - 1], p[p.length - 1], p[p.length - 1])) {
        p.push([end_node.x, end_node.y, end_node.z]);
    }
    return p;
};

ZilShape.prototype.astar_init = function() {
    var t = Date.now();
//    console.log(">>> Starting astar_init.");
    for(var x = 0; x < this.nodes.length; x++) {
        for(var y = 0; y < this.nodes[0].length; y++) {
            var node = this.nodes[x][y];
            node.f = 0;
            node.g = 0;
            node.h = 0;
            node.visited = false;
            node.closed = false;
            node.parent = null;
        }
    }
//    console.log(">>> finished astar_init in " + (Date.now() - t));
};

ZilShape.prototype.neighbors = function(node, creature) {
    var nx = (node.x / ZilShape.PATH_RES)|0;
    var ny = (node.y / ZilShape.PATH_RES)|0;

    var ret = [];
    if(nx > 0 && Math.abs(this.nodes[nx - 1][ny].z - node.z) <= 1) ret.push(this.nodes[nx - 1][ny]);
    if(ny > 0 && Math.abs(this.nodes[nx][ny - 1].z - node.z) <= 1) ret.push(this.nodes[nx][ny - 1]);
    if(nx < this.nodes.length - 1 && Math.abs(this.nodes[nx + 1][ny].z - node.z) <= 1) ret.push(this.nodes[nx + 1][ny]);
    if(ny < this.nodes[0].length - 1 && Math.abs(this.nodes[nx][ny + 1].z - node.z) <= 1) ret.push(this.nodes[nx][ny + 1]);

    if (this.diagonal) {
        throw "Not implemented.";
    }

    return ret;
};

function BinaryHeap(scoreFunction){
    this.content = [];
    this.scoreFunction = scoreFunction;
}

BinaryHeap.prototype = {
    push: function(element) {
        // Add the new element to the end of the array.
        this.content.push(element);

        // Allow it to sink down.
        this.sinkDown(this.content.length - 1);
    },
    pop: function() {
        // Store the first element so we can return it later.
        var result = this.content[0];
        // Get the element at the end of the array.
        var end = this.content.pop();
        // If there are any elements left, put the end element at the
        // start, and let it bubble up.
        if (this.content.length > 0) {
            this.content[0] = end;
            this.bubbleUp(0);
        }
        return result;
    },
    remove: function(node) {
        var i = this.content.indexOf(node);

        // When it is found, the process seen in 'pop' is repeated
        // to fill up the hole.
        var end = this.content.pop();

        if (i !== this.content.length - 1) {
            this.content[i] = end;

            if (this.scoreFunction(end) < this.scoreFunction(node)) {
                this.sinkDown(i);
            }
            else {
                this.bubbleUp(i);
            }
        }
    },
    size: function() {
        return this.content.length;
    },
    rescoreElement: function(node) {
        this.sinkDown(this.content.indexOf(node));
    },
    sinkDown: function(n) {
        // Fetch the element that has to be sunk.
        var element = this.content[n];

        // When at 0, an element can not sink any further.
        while (n > 0) {

            // Compute the parent element's index, and fetch it.
            var parentN = ((n + 1) >> 1) - 1,
                parent = this.content[parentN];
            // Swap the elements if the parent is greater.
            if (this.scoreFunction(element) < this.scoreFunction(parent)) {
                this.content[parentN] = element;
                this.content[n] = parent;
                // Update 'n' to continue at the new position.
                n = parentN;
            }
            // Found a parent that is less, no need to sink any further.
            else {
                break;
            }
        }
    },
    bubbleUp: function(n) {
        // Look up the target element and its score.
        var length = this.content.length,
            element = this.content[n],
            elemScore = this.scoreFunction(element);

        while(true) {
            // Compute the indices of the child elements.
            var child2N = (n + 1) << 1,
                child1N = child2N - 1;
            // This is used to store the new position of the element, if any.
            var swap = null,
                child1Score;
            // If the first child exists (is inside the array)...
            if (child1N < length) {
                // Look it up and compute its score.
                var child1 = this.content[child1N];
                child1Score = this.scoreFunction(child1);

                // If the score is less than our element's, we need to swap.
                if (child1Score < elemScore){
                    swap = child1N;
                }
            }

            // Do the same checks for the other child.
            if (child2N < length) {
                var child2 = this.content[child2N],
                    child2Score = this.scoreFunction(child2);
                if (child2Score < (swap === null ? elemScore : child1Score)) {
                    swap = child2N;
                }
            }

            // If the element needs to be moved, swap it, and continue.
            if (swap !== null) {
                this.content[n] = this.content[swap];
                this.content[swap] = element;
                n = swap;
            }
            // Otherwise, we are done.
            else {
                break;
            }
        }
    }
};

return {
    astar: astar
};

});
