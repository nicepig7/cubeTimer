/**
 * 3x3x3 Scrambler Engine for qqTimer
 * Highly optimized, clean module for WCA Random State, PLL, LL, F2L, 2-Gen, Roux, and subsets.
 */

(function (window) {
  'use strict';

  const cubesuff = ["", "2", "'"];

  function rndEl(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function megascramble(turns, suffixes, len) {
    len = len || 25;
    let donemoves = [];
    let lastaxis = -1;
    let s = "";

    for (let j = 0; j < len; j++) {
      let done = 0;
      do {
        const first = Math.floor(Math.random() * turns.length);
        const second = Math.floor(Math.random() * turns[first].length);

        if (first !== lastaxis) {
          for (let k = 0; k < turns[first].length; k++) {
            donemoves[k] = 0;
          }
          lastaxis = first;
        }

        if (donemoves[second] === 0) {
          donemoves[second] = 1;
          if (Array.isArray(turns[first][second])) {
            s += rndEl(turns[first][second]) + rndEl(suffixes) + " ";
          } else {
            s += turns[first][second] + rndEl(suffixes) + " ";
          }
          done = 1;
        }
      } while (done === 0);
    }
    return s;
  }

  function randomCubeOrientation() {
    return rndEl(["", "z", "z'", "x", "x'", "x2"]) + rndEl(["", " y", " y'", " y2"]);
  }

  function ensure333Initialized() {
    if (window.scramblers && window.scramblers['333'] && typeof window.scramblers['333'].initialize === 'function') {
      try {
        window.scramblers['333'].initialize(null, Math);
        if (typeof window.scramblers['333'].setRandomSource === 'function') {
          window.scramblers['333'].setRandomSource(Math);
        }
      } catch (e) {
        console.warn("scrambler 333 init warning:", e);
      }
    }
  }

  function generateScramble(type, len) {
    type = type || '333';
    len = len || 25;
    ensure333Initialized();
    const solver = window.scramblers ? window.scramblers['333'] : null;

    switch (type) {
      case '333': // WCA Random State
        return solver ? solver.getRandomScramble() : megascramble([["U", "D"], ["R", "L"], ["F", "B"]], cubesuff, 25);
      
      case '333ori': // Random State + Orientation
        return (solver ? solver.getRandomScramble() : megascramble([["U", "D"], ["R", "L"], ["F", "B"]], cubesuff, 25)) + randomCubeOrientation();

      case 'pll': // PLL Practice
        return solver ? solver.getPLLScramble() : "";

      case 'll': // Last Layer
        return solver ? solver.getLLScramble() : "";

      case 'f2l': // F2L Practice
        return solver ? solver.getF2LScramble() : "";

      case 'zbll': // ZBLL Practice
        return solver ? solver.getZBLLScramble() : "";

      case 'cmll': // CMLL Practice (Roux)
        return rndEl(["", "M ", "M2 ", "M' "]) + (solver ? solver.getCMLLScramble() : "");

      case '2gen': // 2-Generator <R, U>
        return megascramble([["U"], ["R"]], cubesuff, len || 25);

      case '2genl': // 2-Generator <L, U>
        return megascramble([["U"], ["L"]], cubesuff, len || 25);

      case 'roux': // Roux Generator <M, U>
        return megascramble([["U"], ["M"]], cubesuff, len || 25);

      case '333o': // Old style 25-move random turns
        return megascramble([["U", "D"], ["R", "L"], ["F", "B"]], cubesuff, len || 25);

      case 'edges': // Edges only
        return solver ? solver.getEdgeScramble() : "";

      case 'corners': // Corners only
        return solver ? solver.getCornerScramble() : "";

      default:
        return solver ? solver.getRandomScramble() : megascramble([["U", "D"], ["R", "L"], ["F", "B"]], cubesuff, 25);
    }
  }

  // Export
  window.generateScramble = generateScramble;
  window.ensure333Initialized = ensure333Initialized;

  // Auto initialize on load
  ensure333Initialized();

})(typeof window !== 'undefined' ? window : global);
