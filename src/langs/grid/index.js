'use strict';

const O = require('omikron');
const esolangs = require('../..');
const TilesGrid = require('./tiles-grid');
const Vector = require('./vector');

const run = (src, input) => {
  src = src.toString();

  const io = new O.IO(input, 0, 1);

  let w = 3;
  let h = 3;
  let cur = new Vector(1, 1);

  const tileParams = [
    'dir',
    'circ',
    'wall',
    'void',
  ];

  const grid = new TilesGrid();
  let blackCirc = null;

  const fragments = [];
  let activeFragment = null;

  const createGrid = () => {
    grid.create(() => {
      return [0, 0, 0, 0];
    });

    grid.get(1, 1).cur = 1;

    resetGrid();
  };

  const resetGrid = () => {
    blackCirc = null;

    iterate(1, (x, y, d) => {
      d.dir = 0;
      d.circ = 0;
      d.wall = 0;
      d.void = 0;

      d.internal = 0;
    });

    crop(1);
  };

  const closeGrid = () => {
    for(var x = 0; x < w; x++){
      sdir(x, 0, 0);
      sdir(x, h - 1, 2);
    }

    for(var y = 0; y < h; y++){
      sdir(0, y, 1);
      sdir(w - 1, y, 3);
    }
  };

  const divideGrid = () => {
    for(var y = 0; y < h; y++){
      for(var x = 0; x < w; x++){
        sdirs(x, y);
      }
    }
  };

  const updateInternals = () => {
    findFragments();

    fragments.forEach(frag => {
      activeFragment = frag;
      findInternalCells();
    });
  };

  const expandUp = () => {
    h++;
    cur.y++;
    grid.expandUp();
    for(let x = 0; x !== w; x++)
      if(gdir(x, 1, 0, 1)) sdir(x, 0, 2);
  };

  const expandLeft = () => {
    w++;
    cur.x++;
    grid.expandLeft();
    for(let y = 0; y !== h; y++)
      if(gdir(1, y, 1, 1)) sdir(0, y, 3);
  };

  const expandDown = () => {
    h++;
    grid.expandDown();
    for(let x = 0; x !== w; x++)
      if(gdir(x, h - 2, 2, 1)) sdir(x, h - 1, 0);
  };

  const expandRight = () => {
    w++;
    grid.expandRight();
    for(let y = 0; y !== h; y++)
      if(gdir(w - 2, y, 3, 1)) sdir(w - 1, y, 1);
  };

  const collapseUp = () => {
    if(h === 1) return;
    h--;
    cur.y--;
    grid.collapseUp();
  };

  const collapseLeft = () => {
    if(w === 1) return;
    w--;
    cur.x--;
    grid.collapseLeft();
  };

  const collapseDown = () => {
    if(h === 1) return;
    h--;
    grid.collapseDown();
  };

  const collapseRight = () => {
    if(w === 1) return;
    w--;
    grid.collapseRight();
  };

  const expandAll = () => {
    expandUp();
    expandLeft();
    expandDown();
    expandRight();
  };

  const crop = (leaveSpace=0) => {
    if(leaveSpace) expandAll();

    up: while(h !== 1){
      for(let x = 0; x !== w; x++){
        const d = grid.get(x, 0);
        if(d.dir || d.circ || d.wall || d.void || d.cur) break up;
      }
      collapseUp();
    }

    left: while(w !== 1){
      for(let y = 0; y !== h; y++){
        const d = grid.get(0, y);
        if(d.dir || d.circ || d.wall || d.void || d.cur) break left;
      }
      collapseLeft();
    }

    down: while(h !== 1){
      for(let x = 0; x !== w; x++){
        const d = grid.get(x, h - 1);
        if(d.dir || d.circ || d.wall || d.void || d.cur) break down;
      }
      collapseDown();
    }

    right: while(w !== 1){
      for(let y = 0; y !== h; y++){
        const d = grid.get(w - 1, y);
        if(d.dir || d.circ || d.wall || d.void || d.cur) break right;
      }
      collapseRight();
    }

    if(leaveSpace) expandAll();
  };

  /*
    Iterating functions
  */

  const iterateExternalShape = (x, y, func) => {
    var id = getId();
    var queue = [{x, y, d: get(x, y)}];

    while(queue.length){
      var {x, y, d} = queue.shift();
      if(d.id === id) continue;
      d.id = id;

      func(x, y, d);

      iterateDirs(dir => {
        var obj = ndir(x, y, dir);
        var d = obj.d;

        if(d === null || d.wall)
          return;

        if(d.internal && d.id !== id)
          queue.push(obj);
      });
    }
  };

  const iterateInternalShape = (x, y, func) => {
    var id = getId();
    var queue = [x, y, get(x, y), 0];

    while(queue.length){
      var x = queue.shift();
      var y = queue.shift();
      var d = queue.shift();
      var dist = queue.shift();

      if(d.id === id) continue;
      d.id = id;

      func(x, y, d, dist);

      iterateDirs(dir => {
        if(gdir(x, y, dir)) return;

        var obj = ndir(x, y, dir);
        if(obj.d.id === id) return;

        queue.push(obj.x, obj.y, obj.d, dist + 1);
      });
    }
  };

  const traverseShape = (x, y, func) => {
    var id = getId();
    var d = get(x, y);
    var dir1 = null;
    var dir2;

    var xp, yp, dp;

    do{
      xp = x;
      yp = y;
      dp = d;

      var foundDir = false;

      iterateDirs(dir => {
        if(foundDir) return;

        if(!gdir(xp, yp, dir) && ({x, y, d} = ndir(xp, yp, dir), d.id !== id)){
          foundDir = true;
          dir2 = dir;
        }
      });

      if(!foundDir){
        dir2 = null;
      }

      func(xp, yp, dp, dir1, dir2);

      if(dir2 !== null){
        dp.id = id;
        dp = d;
        dir1 = dir2 + 2 & 3;
      }
    }while(dir2 !== null);
  };

  const someAdjacent = (x, y, func) => {
    var found = false;

    iterateDirs(dir => {
      if(found) return;

      var obj = ndir(x, y, dir);

      if(func(obj.x, obj.y, obj.d, dir)){
        found = true;
      }
    });

    return found;
  };

  const iterateDirs = func => {
    func(0);
    func(1);
    func(3);
    func(2);
  };

  /*
    Grid functions
  */

  const findFragments = () => {
    var id = getId();

    fragments.length = 0;
    activeFragment = null;

    iterate(1, (x, y, d) => {
      if(d.void || d.id === id) return;

      var frag = new Fragment(fragments.length);
      var queue = [[x, y]];

      d.id = id;
      frag.addInternalTile(x, y);

      while(queue.length){
        [x, y] = queue.shift();

        adjacent(x, y, (x1, y1, d1) => {
          if(d1 !== null){
            if(d1.id === id) return;

            d1.id = id;
            frag.addInternalTile(x1, y1);
            queue.push([x1, y1]);
          }else{
            frag.addExternalTile(x1, y1);
          }
        });
      }

      frag.sort();
      fragments.push(frag);
    });
  };

  const iterate = (advanced, func=null) => {
    if(func === null){
      func = advanced;
      advanced = 0;
    }

    if(advanced) grid.iterate(func);
    else activeFragment.iterate(func);
  };

  const adjacent = (x, y, advanced, func=null) => {
    if(func === null){
      func = advanced;
      advanced = 0;
    }

    grid.adjacent(x, y, (x, y, d, dir) => {
      if(!advanced && d !== null && d.void) d = null;
      func(x, y, d, dir);
    });
  };

  const getFirstTile = () => {
    let tile = null;

    iterate((x, y, d) => {
      if(tile !== null) return;
      if(y === h - 1) return tile = [1, 1];
      if(get(x, 1) === null) tile = [x, y];
    });

    return tile;
  };

  const get = (x, y, advanced) => {
    if(!(advanced || activeFragment.includes(x, y)))
      return null;

    return grid.get(x, y);
  };

  class Fragment{
    constructor(index){
      this.index = index;

      this.externalTiles = [];
      this.internalTiles = [];

      this.tilesObj = new O.Map2D();
    }

    addExternalTile(x, y){
      this.externalTiles.push([x, y]);
    }

    addInternalTile(x, y){
      this.internalTiles.push([x, y, get(x, y, 1)]);
      this.tilesObj.set(x, y);
    }

    sort(){
      sortCoords(this.internalTiles);
    }

    iterate(func){
      this.internalTiles.forEach(tile => {
        func(...tile);
      });
    }

    includes(x, y){
      return this.tilesObj.has(x, y);
    }
  };

  /*
    Algorithms
  */

  const applyAlgorithms = () => {
    crop(1, 1);
    findFragments();

    fragments.forEach(frag => {
      activeFragment = frag;

      createSnapshot();
      transformGrid();
      checkSnapshot();
    });

    crop(1, 1);
  };

  const transformGrid = () => {
    findInternalCells();
    putExternalLines();
    
    findInternalCells();
    findShapes();

    putBlackCirc();
    connectShapes();
    fillShapes();

    connectDirShapes();
    putWhiteCircs();
  };

  const createSnapshot = () => {
    iterate((x, y, d) => {
      d.dirPrev = gdirs(x, y);
      d.circPrev = d.circ;
      d.wallPrev = d.wall;
    });
  };

  const findInternalCells = () => {
    var arr = [];
    var queue = activeFragment.externalTiles.slice();

    iterate((x, y, d) => {
      d.internal = 1;
    });

    while(queue.length){
      var [x, y] = queue.shift();
      var d = get(x, y);

      if(d !== null){
        if(!d.internal) continue;
        d.internal = 0;
      }

      iterateDirs(dir => {
        if(!gdir(x, y, dir)){
          var obj = ndir(x, y, dir);
          queue.push([obj.x, obj.y]);
        }
      });
    }
  };

  const putExternalLines = () => {
    var d1;

    const followDir = (x, y, dir, count, dirs=0) => {
      count--;

      var {x: x1, y: y1, d} = ndir(x, y, dir);
      var dir1 = dir;
      var d1;

      if(d === null) return 0;

      var found = 0;
      dirs |= 1 << dir;

      O.repeat(2, i => {
        if(found) return;
        dir1 ^= i + 1;

        if(((1 << dir1) & dirs) === 0){
          var goFurther = 0;

          if(gdir(x1, y1, dir1)){
            d1 = ndir(x1, y1, dir1).d;

            if(!d.internal){
              if(d1 === null || d1.wall || !d1.internal)
                found = 1;
            }else{
              if(d1 !== null && d1.wall) found = 1;
              else goFurther = 1;
            }
          }else if(!d.internal){
            goFurther = 1;
          }

          if(goFurther && count !== 0 && followDir(x1, y1, dir1, count, dirs))
            found = 1;
        }
      });

      return found;
    }

    iterate((x, y, d) => {
      d.ext = 0;
      d.extLines = 0;
    });

    iterate((x, y, d) => {
      if(d.internal || d.ext) return;

      if(d.circ){
        d.ext = 1;
        return;
      }

      d.ext = someAdjacent(x, y, (x1, y1, d1, dir) => {
        if(gdir(x, y, dir)){
          if(d1 === null || d1.wall || !d1.internal)
            return 1;
        }

        if(followDir(x, y, dir, 2))
          return 1;

        return 0;
      }) | 0;
    });

    iterate((x, y, d) => {
      if(!d.ext) return;

      iterateDirs(dir => {
        var ddir = 1 << dir;

        d1 = ndir(x, y, dir).d;

        if(d1 === null || !d1.ext){
          d.extLines |= ddir;
          return;
        }

        if(d.circ || (d1 !== null && d1.circ) || isLineTouching(x, y, dir))
          return;

        d.extLines |= ddir;
      });
    });

    iterate((x, y, d) => {
      if(d.ext){
        iterateDirs(dir => {
          if(d.extLines & (1 << dir))
            sdir(x, y, dir);
        });
      }
    });
  };

  const findShapes = () => {
    iterate((x, y, d) => d.containsCircs = 0);

    iterate((x, y, d) => {
      if(!d.internal || d.containsCircs) return;

      if(d.circ)
        iterateInternalShape(x, y, (x, y, d) => d.containsCircs = 1);
    });
  };

  const putBlackCirc = () => {
    var firstInternalCell = null;
    var firstBlackCirc = null;
    var d1;

    iterate((x, y, d) => {
      if(d.internal && !d.wall){
        if(firstInternalCell === null) firstInternalCell = new Vector(x, y);
        if(d.circ === 1 && firstBlackCirc === null) firstBlackCirc = new Vector(x, y);
      }

      if(d.circ === 1) d.circ = 0;
    });

    if(firstInternalCell === null){
      var [x, y] = getFirstTile();
      sdirs(x, y);
      get(x, y).internal = 1;
      setBlackCirc(x, y);
    }else if(firstBlackCirc === null){
      setBlackCirc(firstInternalCell.x, firstInternalCell.y);
    }else{
      setBlackCirc(firstBlackCirc.x, firstBlackCirc.y);
    }
  };

  const connectShapes = () => {
    var mode = 0;
    var internalsNumPrev = null;

    while(1){
      var internalsNum = 0;

      iterate((x, y, d) => {
        if(!d.internal || d.wall)
          return;
        internalsNum++;
      });

      var id = getId();
      var queue = [];

      iterateExternalShape(blackCirc.x, blackCirc.y, (x, y, d) => {
        internalsNum--;
        d.id2 = id;
        d.elem = null;

        adjacent(x, y, (x, y, d1, dir) => {
          if(d1 === null || d1.id2 === id)
            return;

          if(mode === 0 ? !d1.internal : d1.wall){
            d1.id2 = id;
            d1.elem = null;
            queue.push([x, y, d1, [dir]]);
          }
        });
      });

      if(internalsNum === 0)
        break;

      if(internalsNum === internalsNumPrev){
        mode ^= 1;
        internalsNumPrev = null;
        continue;
      }

      internalsNumPrev = internalsNum;
      sortCoords(queue);

      var pathLen = null;
      var elems = [];

      while(queue.length){
        var elem = queue.shift();
        var [x, y, d, path] = elem;

        if(mode === 0 ? d.internal : !d.wall){
          if(pathLen === null){
            pathLen = path.length;
          }else{
            if(path.length > pathLen)
              break;
          }

          elems.push(elem);
          continue;
        }

        iterateDirs(dir => {
          var obj = ndir(x, y, dir);
          var d = obj.d;

          if(d === null) return;
          if(mode === 0 && d.wall) return;
          if(mode === 1 && !d.internal) return;

          if(d.id2 !== id || (d.elem !== null && findMinPathElem([elem, d.elem]) === elem)){
            d.id2 = id;
            d.elem = elem;
            queue.push([obj.x, obj.y, d, [...path, dir]]);
          }
        });
      }

      if(pathLen !== null){
        var elem = findMinPathElem(elems);
        var [x, y, d, path] = elem;

        path = path.map(dir => dir + 2 & 3);
        path.push(path[path.length - 1]);

        path.reduceRight((dirPrev, dir) => {
          if(mode === 0){
            if(!d.internal){
              iterateDirs(ddir => {
                if(ddir !== dir && ddir !== dirPrev){
                  if(mode === 0) sdir(x, y, ddir);
                  else cdir(x, y, ddir);
                }
              });
            }
          }else{
            if(d.wall){
              cwall(x, y);
            }
          }

          ({x, y, d} = ndir(x, y, dir));

          return dir + 2 & 3;
        });
      }

      findInternalCells();
    }

    findInternalCells();

    iterate((x, y, d) => {
      d.elem = null;
    });
  };

  const fillShapes = () => {
    iterate((x, y, d) => d.visited = 0);

    iterate((x, y, d) => {
      if(d.visited || !d.internal || d.wall) return;

      if(!d.containsCircs){
        fillShapeWhichHasNoCircs(x, y);
      }else{
        fillShapeWhichHasCircs(x, y);
      }
    });
  };

  const fillShapeWhichHasNoCircs = (x, y) => {
    traverseShape(x, y, (x, y, d, dir1, dir2) => {
      iterateDirs(dir => {
        if(dir !== dir1 && dir !== dir2)
          sdir(x, y, dir);
      });

      d.visited = 1;
    });
  };

  const fillShapeWhichHasCircs = (xStart, yStart) => {
    do{
      var id = getId();

      var foundLoop = false;
      var queue = [xStart, yStart, -1];

      while(queue.length){
        var x = queue.shift();
        var y = queue.shift();
        var lastDir = queue.shift();

        var d = get(x, y);
        var reversedLastDir = lastDir !== -1 ? lastDir + 2 & 3 : -1;

        if(d.id !== id){
          d.id = id;
          d.dirToStart = reversedLastDir;
        }else{
          foundLoop = true;

          id = getId();
          d.id = id;

          var xLoop = x;
          var yLoop = y;

          do{
            ({x, y, d} = ndir(x, y, d.dirToStart));
            d.id = id;
          }while(d.dirToStart !== -1);

          var xMin = xLoop;
          var yMin = yLoop;

          O.repeat(2, stage => {
            var found = false;

            x = xLoop;
            y = yLoop;

            if(stage === 0) ({x, y, d} = ndir(x, y, reversedLastDir));
            else d = get(x, y);

            do{
              [xMin, yMin] = findMinCoords(xMin, yMin, x, y);

              if(found) break;

              ({x, y, d} = ndir(x, y, d.dirToStart));

              if(stage === 0){
                if(d.id === id){
                  found = true;
                  id = getId();
                  d.firstCommonTile = id;
                }
              }else{
                if(d.firstCommonTile === id){
                  found = true;
                }
              }
            }while(1);
          });

          sdir(xMin, yMin, 3);

          break;
        }

        iterateDirs(dir => {
          if(gdir(x, y, dir)) return;

          var obj = ndir(x, y, dir);
          if(obj.d === null || obj.d.id === id) return;

          queue.push(obj.x, obj.y, dir);
        });
      }
    }while(foundLoop);

    iterateInternalShape(xStart, yStart, (x, y, d) => {
      d.visited = 1;
    });
  };

  const connectDirShapes = () => {
    do{
      var found = false;

      var shapeId = getId();
      var {x, y} = blackCirc;

      iterateInternalShape(x, y, (x, y, d) => {
        d.shapeId = shapeId;
      });

      var xMin, yMin;
      var dirMin = -1;

      iterateInternalShape(x, y, (x, y, d) => {
        iterateDirs(dir => {
          if(!gdir(x, y, dir))
            return;

          var d1 = ndir(x, y, dir).d;
          if(d1 === null || d1.wall || !d1.internal || d1.shapeId === shapeId)
            return;

          if(dirMin === -1){
            xMin = x;
            yMin = y;
            dirMin = dir;
          }else{
            if(compareCoordsAndDir(xMin, yMin, dirMin, x, y, dir)){
              xMin = x;
              yMin = y;
              dirMin = dir;
            }
          }
        });
      });

      if(dirMin !== -1){
        found = true;
        cdir(xMin, yMin, dirMin);
      }
    }while(found);
  };

  const putWhiteCircs = () => {
    iterate((x, y, d) => {
      if(!(d.circ === 1 || d.wall)){
        if(d.internal && dirsNum(x, y) === 3) d.circ = 2;
        else d.circ = 0;
      }
    });
  };

  const checkSnapshot = () => {
    var needsChange = 1;
    var freeTile = null;

    iterate((x, y, d) => {
      if(!needsChange) return;

      var dirs = gdirs(x, y);

      if(dirs !== d.dirPrev || d.circ !== d.circPrev || d.wall !== d.wallPrev){
        needsChange = 0;
        return;
      }

      if(freeTile === null && !d.internal && dirs !== 0)
        freeTile = new Vector(x, y);
    });

    if(needsChange && freeTile !== null){
      sdirs(freeTile.x, freeTile.y);
      transformGrid();
    }
  };

  /*
    Other functions
  */

  const getId = () => {
    return Object.create(null);
  };

  const setBlackCirc = (x, y) => {
    var d = get(x, y);
    if(d.wall) cwall(x, y);
    blackCirc = new Vector(x, y);
    d.circ = 1;
  };

  const isLineTouching = (x, y, dir) => {
    if(gdire(x, y, dir, 1) || gdire(x, y, dir - 1 & 3, 1) || gdire(x, y, dir + 1 & 3, 1))
      return true;

    var xx = x, yy = y;
    var d;

    ({x, y, d} = ndir(xx, yy, dir, 1));
    if(d && (gdire(x, y, dir - 1 & 3, 1) || gdire(x, y, dir + 1 & 3, 1))) return true;

    ({x, y, d} = ndir(xx, yy, dir - 1 & 3, 1));
    if(d && gdire(x, y, dir, 1)) return true;

    ({x, y, d} = ndir(xx, yy, dir + 1 & 3, 1));
    if(d && gdire(x, y, dir, 1)) return true;

    return false;
  };

  const findMinCoords = (xMin, yMin, x, y) => {
    if(y < yMin){
      xMin = x;
      yMin = y;
    }else if(y === yMin && x < xMin){
      xMin = x;
    }

    return [xMin, yMin];
  };

  const compareCoordsAndDir = (xMin, yMin, dirMin, x, y, dir) => {
    if(dirMin === 2){
      dirMin = 0;
      yMin++;
    }else if(dirMin === 3){
      dirMin = 1;
      xMin++;
    }

    if(dir === 2){
      dir = 0;
      y++;
    }else if(dir === 3){
      dir = 1;
      x++;
    }

    if(y < yMin) return true;
    if(y > yMin) return false;
    if(dir === dirMin) return x < xMin;
    return dir === 0;
  };

  const sortCoords = coords => {
    coords.sort(([x1, y1], [x2, y2]) => {
      if(y1 < y2) return -1;
      if(y1 > y2) return 1;
      if(x1 < x2) return -1;
      return 1;
    });

    return coords;
  };

  const findMinPathElem = elems => {
    if(elems.length === 1)
      return elems[0];

    var len = elems[0][3].length - 1;

    var coords = elems.map(([x, y, d, path], index) => {
      var coords = [];
      coords.index = index;

      for(var i = len; i >= 1; i--){
        ({x, y} = ndir(x, y, path[i] + 2 & 3));
        coords.push([x, y]);
      }

      return sortCoords(coords);
    });

    for(var i = 0; i < len; i++){
      var [xMin, yMin] = coords[0][i];

      coords.forEach(coords => {
        var [x, y] = coords[i];

        if(y < yMin || (y === yMin && x < xMin)){
          xMin = x;
          yMin = y;
        }
      });

      coords = coords.filter(coords => {
        var [x, y] = coords[i];

        return x === xMin && y === yMin;
      });

      if(coords.length === 1)
        break;
    }

    return elems[coords[0].index];
  };

  const dirGt = (dir1, dir2) => {
    return dirIndex(dir1) > dirIndex(dir2);
  };

  const dirLt = (dir1, dir2) => {
    return dirIndex(dir1) < dirIndex(dir2);
  };

  const dirGe = (dir1, dir2) => {
    return dirIndex(dir1) >= dirIndex(dir2);
  };

  const dirLe = (dir1, dir2) => {
    return dirIndex(dir1) <= dirIndex(dir2);
  };

  const dirIndex = dir => {
    return dir ^ (dir >> 1);
  };

  const dirsNum = (x, y) => {
    return gdir(x, y, 0) + gdir(x, y, 1) + gdir(x, y, 2) + gdir(x, y, 3);
  };

  const isVoid = (x, y) => {
    var d = get(x, y, 1);
    return d === null || d.void;
  };

  const gdir = (x, y, dir, advanced) => {
    var d = get(x, y, advanced);

    if(d === null){
      var obj = ndir(x, y, dir, advanced);
      if((d = obj.d) === null) return 1;

      x = obj.x;
      y = obj.y;

      dir = dir + 2 & 3;
    }

    if(d.wall || (d.dir & (1 << dir))) return 1;
    if((d = ndir(x, y, dir, advanced).d) && d.wall) return 1;
    return 0;
  };

  const sdir = (x, y, dir) => {
    var advanced = 1;
    var d = get(x, y, advanced);
    var d1 = ndir(x, y, dir, advanced).d;

    if((d === null || d.void) && (d1 === null || d1.void))
      return;

    if(d !== null) d.dir |= 1 << dir;
    if(d1 !== null) d1.dir |= 1 << (dir + 2 & 3);
  };

  const cdir = (x, y, dir) => {
    var advanced = 1;
    var d = get(x, y, advanced);

    if(d !== null) d.dir &= ~(1 << dir);
    if((d = ndir(x, y, dir, advanced).d) !== null) d.dir &= ~(1 << (dir + 2 & 3));
  };

  const gdirs = (x, y, advanced) => {
    return gdir(x, y, 0, advanced) | (gdir(x, y, 1, advanced) << 1) | (gdir(x, y, 2, advanced) << 2) | (gdir(x, y, 3, advanced) << 3);
  };

  const gdire = (x, y, dir, advanced) => {
    var d = ndir(x, y, dir, advanced).d;

    if(d === null || d.wall || d.void || d.ext)
      return gdir(x, y, dir, advanced);

    return false;
  };

  const sdirs = (x, y, advanced) => {
    iterateDirs(dir => sdir(x, y, dir, advanced));
  };

  const cdirs = (x, y, advanced) => {
    iterateDirs(dir => cdir(x, y, dir, advanced));
  };

  const ndir = (x, y, dir, advanced) => {
    x += (dir === 3) - (dir === 1) | 0;
    y += (dir === 2) - (dir === 0) | 0;

    return {
      x, y,
      d: get(x, y, advanced),
    };
  };

  const scirc = (x, y, type) => {
    var d = get(x, y, 1);
    if(d === null || d.circ === type) return;

    if(d.void) cvoid(x, y);
    else if(d.wall) cwall(x, y, 1);

    d.circ = type;
  };

  const ccirc = (x, y, type) => {
    var d = get(x, y, 1);
    if(d === null || d.void || d.circ !== type) return;

    d.circ = 0;
  };

  const swall = (x, y) => {
    var d = get(x, y, 1);
    if(d === null || d.wall) return;

    if(d.void) cvoid(x, y);
    else if(d.circ) d.circ = 0;

    d.wall = 1;
    sdirs(x, y);
  };

  const cwall = (x, y) => {
    var d = get(x, y, 1);
    if(d === null || !d.wall) return;

    d.wall = 0;
    sdirs(x, y);
  };

  const svoid = (x, y) => {
    var d = get(x, y, 1);
    if(d === null || d.void) return;

    d.internal = 0;
    if(d.circ) d.circ = 0;
    else if(d.wall) cwall(x, y);

    adjacent(x, y, (x1, y1, d1, dir) => {
      if(d1 === null) cdir(x, y, dir);
    });

    d.void = 1;
  };

  const cvoid = (x, y) => {
    var d = get(x, y, 1);
    if(d === null || !d.void) return;

    d.void = 0;
  };

  const move = dir => {
    grid.get(cur.x, cur.y).cur = 0;

    if(dir === 0){
      grid.get(cur.x, --cur.y).cur = 1;
      if(cur.y === 0) expandUp(1);
    }else if(dir === 1){
      grid.get(--cur.x, cur.y).cur = 1;
      if(cur.x === 0) expandLeft(1);
    }else if(dir === 2){
      grid.get(cur.x, ++cur.y).cur = 1;
      if(cur.y === h - 1) expandDown(1);
    }else if(dir === 3){
      grid.get(++cur.x, cur.y).cur = 1;
      if(cur.x === w - 1) expandRight(1);
    }
  };

  const parse = src => {
    src = src.toString().replace(/\s+/g, '').toLowerCase();

    const stack = [[1]];

    const needsBlock = (inst=null) => {
      if(inst === null){
        const block = O.last(stack);
        if(block.length === 1) return 0;
        inst = O.last(block);
      }

      return inst[0] === 2 && (
        inst[2] === 0 && inst.length !== 5 ||
        inst[2] !== 0 && inst.length !== 4
      );
    };

    const push = inst => {
      const block = O.last(stack);

      while(!needsBlock(inst) && needsBlock()){
        O.last(block).push([1, inst]);
        inst = block.pop();
      }

      block.push(inst);
    };

    const pop = () => {
      const block = stack.pop();
      const prev = O.last(stack);

      if(needsBlock()){
        const inst = prev.pop();
        inst.push(block);
        return push(inst);
      }

      const len = block.length;
      for(let i = 1; i !== len; i++) prev.push(block[i]);
    };

    O.tokenize(src, [
      /[\^>v<]/, (str, gs) => {
        push([0, '^>v<'.indexOf(str)]);
      },

      /[urdlbwxi\.][\?\*\:]/, (str, gs) => {
        const type = 'urdlbwxi.'.indexOf(str[0]);
        const stat = '?*:'.indexOf(str[1]);

        push([2, type, stat]);
      },

      /[urdlbwxi][\+\-\~]?/, (str, gs) => {
        if(str.length === 1) str += '~';

        const type = 'urdlbwxi'.indexOf(str[0]);
        const action = '+-~'.indexOf(str[1]);

        push([1, type, action]);
      },

      /\.([01]+)/, (str, gs) => {
        const inst = [3];
        for(const bit of gs[0]) inst.push(bit | 0);
        push(inst);
      },

      /a/, (str, gs) => {
        push([4]);
      },

      /\(/, (str, gs) => {
        stack.push([1]);
      },

      /\)/, (str, gs) => {
        pop();
      },

      /,/, (str, gs) => {
        stack.push([1]);
        pop();
      },
    ], 1, 1);

    return stack[0];
  };

  grid.setWH(w, h);
  grid.setTileParams(tileParams);

  createGrid();

  const stack = [parse(src)];

  while(stack.length !== 0){
    const block = O.last(stack);
    const index = block[0]++;

    if(index === block.length){
      stack.pop();
      continue;
    }

    const inst = block[index];
    const {x, y} = cur;
    const d = grid.get(x, y);

    switch(inst[0]){
      case 0: {
        move(-inst[1] & 3);
        break;
      }

      case 1: {
        const type = inst[1];
        const action = inst[2];

        if(type <= 3){
          const dir = -type & 3;
          (action === 2 ? gdir(x, y, dir, 1) : action) ?
            cdir(x, y, dir) : sdir(x, y, dir);
        }else if(type <= 5){
          const circ = type - 3;
          (action === 2 ? d.circ === circ : action) ?
            ccirc(x, y, circ) : scirc(x, y, circ);
        }else if(type === 6){
          (action === 2 ? d.wall : action) ?
            cwall(x, y) : swall(x, y);
        }else{
          (action === 2 ? d.void : action) ?
            cvoid(x, y) : svoid(x, y);
        }
        break;
      }

      case 2: {
        const type = inst[1];
        const stat = inst[2];

        const bool = type <= 3 ? gdir(x, y, -type & 3, 1) :
          type <= 5 ? d.circ === type - 3 :
          type === 6 ? d.wall :
          type === 7 ? d.void : io.read();

        if(stat === 0){
          const newBlock = bool ? inst[3] : inst[4];
          newBlock[0] = 1;
          stack.push(newBlock);
        }else if(stat === 2 ^ bool){
          const newBlock = inst[3];
          newBlock[0] = 1;
          block[0]--;
          stack.push(newBlock);
        }
        break;
      }

      case 3: {
        const len = inst.length;
        for(let i = 1; i !== len; i++) io.write(inst[i]);
        break;
      }

      case 4: {
        applyAlgorithms();
        break;
      }
    }
  }

  return io.getOutput();
};

module.exports = run;