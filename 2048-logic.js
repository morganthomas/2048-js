//
// Parameters controlling the AI.
//

var SEARCH_DEPTH = 4;
var VALUE_OF_LOSS = -Math.pow(2,20);
var VALUE_OF_EMPTY_SQUARE_ON_ROW_2 = 32;
var VALUE_OF_EMPTY_SQUARE_ON_ROW_3 = 128;

//
// Utility
//

function add(a,b) {
  return a + b;
}

function and(a,b) {
  return a && b;
}

function or(a,b) {
  return a || b;
}

function sum(array) {
  return array.reduce(add, 0);
}

function all(array) {
  return array.reduce(and, true);
}

// Returns a maximal element of the given array according to the given metric.
// Assumes elements of the array are non-null.
function maxBy(metric, array) {
  var result = null;
  var resultMetric = 0;

  array.forEach(function(x) {
    var xMetric = metric(x);
    if (result === null || xMetric > resultMetric) {
      result = x;
      resultMetric = xMetric;
    }
  });

  return [result, resultMetric];
}

//
// A 2048 game board is an object with get() and set() methods taking
// board locations. Board locations are objects with properties row and col,
// both natural numbers between 0 and 3 inclusive. The contents of a board
// location are null for an empty square, or a natual number n for a
// tile of value 2^n.
//

// XXX: use 0 for empty squares to make functions monomorphic.

function Board() {
  this.array = new Array(4);

  for (var row = 0; row < 4; row++) {
    this.array[row] = new Array(4);

    for (var col = 0; col < 4; col++) {
      this.array[row][col] = null;
    }
  }
}

Board.prototype.get = function(loc) {
  return this.array[loc.row][loc.col];
}

Board.prototype.set = function(loc, val) {
  this.array[loc.row][loc.col] = val;
}

Board.prototype.copy = function() {
  // This was a performance bottleneck when it was written using
  // allBoardLocs.forEach. It's still a bottleneck. Figure out what to do
  // about it. (Probably better memory management.)
  var oldBoard = this;
  var newBoard = new Board();

  for (var row = 0; row < 4; row++) {
    for (var col = 0; col < 4; col++) {
      newBoard.array[row][col] = oldBoard.array[row][col];
    }
  }

  return newBoard;
}

// Compares two boards for equality.
Board.prototype.eq = function(board2) {
  // This function was a performance bottleneck when it used all and map, and
  // it is also a bottleneck using allBoardLocs.forEach. Hence it is written
  // using a simple for loop.
  var board1 = this;
  var areEqual = true;

  for (var row = 0; row < 4; row++) {
    for (var col = 0; col < 4; col++) {
      if (board1.array[row][col] !== board2.array[row][col]) {
        areEqual = false;
      }
    }
  }

  return areEqual;
}

// An empty board.
var emptyBoard = new Board();

// An array of all board locations.
var allBoardLocs = function() {
  var locs = [];

  for (var row = 0; row < 4; row++) {
    for (var col = 0; col < 4; col++) {
      locs.push({row: row, col: col});
    }
  }

  return locs;
}();

// Returns an array of all blank locations on the given board.
function blankSquares(board) {
  return allBoardLocs.filter(function(loc) {
    return board.get(loc) === null;
  });
}

// Returns the number of occupied squares in a given row on a given board.
function rowPopulation(board, rowNum) {
  var count = 0;

  for (var col = 0; col < 4; col++) {
    if (board.get({ row: rowNum, col: col }) !== null) {
      count++;
    }
  }

  return count;
}

// Returns the value of the smallest tile in the given row.
function minValueInRow(board, rowNum) {
  var min = null;

  for (var col = 0; col < 4; col++) {
    var val = board.get({ row: rowNum, col: col });
    if (val !== null && (min === null || val < min)) {
      min = val;
    }
  }

  return min;
}

//
// A computer move is simply an object with properties loc and val, saying
// a location the computer added a tile, and the value of that tile.
//
// A computer move probability distribution is an array a of computer moves,
// calculated for a given board where the computer is to move next,
// where each move has in addition a property prob, such that:
//  if i <= j then a[i].prob <= a[j].prob
//  a[a.length - 1].prob === 1
//  the probability of move a[i] being the move which the computer performs
//    is equal to a[i].prob - a[i-1].prob for i > 0, or a[0].prob for i === 0.
//

// There will always be at least one possible computer move when it's the
// computer's turn. This is because player moves do not increase the number
// of occupied squares. If it was possible for the player to play, then there
// was a free square when they played, and so there is a free square after
// they played, and so there is a possible computer move.

// Returns a computer move probability distribution for the given board.
function possibleComputerMoves(board) {
  var locs = blankSquares(board);
  var moves = new Array(locs.length * 2);

  var probIncrement = 1 / locs.length;

  for (var i = 0; i < locs.length; i++) {
    moves[i*2] = {
      loc: locs[i],
      val: 1,
      prob: (probIncrement * i) + (probIncrement * 0.9)
    };

    moves[i*2+1] = {
      loc: locs[i],
      val: 2,
      prob: probIncrement * (i+1)
    };
  }

  return moves;
}

// Given a move probability distribution and an index into it, returns
// the probability of that move.
function moveProbability(moveDist, i) {
  return moveDist[i].prob - (i === 0 ? 0 : moveDist[i-1].prob);
}

// Applies a computer move to a board to produce a new board.
function applyComputerMove(board, move) {
  var newBoard = board.copy();
  newBoard.set(move.loc, move.val);
  return newBoard;
}

// Selects a random move from a move probability distribution, returning
// its index.
function randomComputerMove(moveDist) {
  var rand = Math.random();
  var i = 0;
  while (rand > moveDist[i].prob && i < moveDist.length) {
    i++;
  }
  return i;
}

//
// A movement direction is an object with properties row and col,
// each 0, 1, or -1, with the sum of their absolute values equal to 1.
//

var directions = [
  { row: 0, col: 1 },
  { row: 0, col: -1 },
  { row: 1, col: 0 },
  { row: -1, col: 0 }
];

// A transformed board is an object with get() and set() methods like a board.
// It is produced from a board and a transformation specification. A
// transformation specification is an object with boolean properties
// rotate and reverse. If rotate is true, the transformed board swaps
// the roles of rows and columns. If reverse is true, the transformed
// board reverses the rows (if rotate is false) or the columns
// (if rotate is true). Modifications to the transformed board
// modify the original board.

function TransformedBoard(board, transformSpec) {
  this.board = board;
  this.transformSpec = transformSpec;
}

TransformedBoard.prototype.get = function(loc) {
  return this.board.get(transformLoc(loc, this.transformSpec));
}

TransformedBoard.prototype.set = function(loc,val) {
  this.board.set(transformLoc(loc, this.transformSpec), val);
}

// Transforms the given location according to the given transformation spec.
function transformLoc(loc, transformSpec) {
  var result = loc;

  if (transformSpec.reverse) {
    result.col = 3 - result.col;
  }

  if (transformSpec.rotate) {
    var temp = result.row;
    result.row = result.col;
    result.col = temp;
  }

  return result;
}

// Executes a player move in the given direction, producing a new board where
// the move has been executed. Does not care whether the move changes
// the board.
function executePlayerMoveUnconditionally(board, direction) {
  // We will write the code for a move to the right, using a transformed
  // board to execute the move in the actual desired direction. To get
  // the transformation spec, we assume the direction satisfies the
  // assumptions on movement directions.
  var transformSpec = {
    reverse: direction.row + direction.col === -1,
    rotate: direction.row !== 0
  };

  var newBoard = board.copy();
  var tboard = new TransformedBoard(newBoard, transformSpec);

  // We work a row at a time; the effects on each row are independent
  // of each other.
  for (var row = 0; row < 4; row++) {
    var firstFreeCol = 3;

    for (var col = 3; col >= 0; col--) {
      var value = tboard.get({ row: row, col: col });

      if (value !== null) {
        // Remove this tile
        tboard.set({ row: row, col: col }, null );

        // See if it matches the tile to the right (if any)
        if (firstFreeCol + 1 < 4 &&
            tboard.get({ row: row, col: firstFreeCol + 1 }) === value) {
          // If so, merge them
          tboard.set({ row: row, col: firstFreeCol + 1 }, value + 1);
        } else {
          // Put the tile back in the first free location
          tboard.set( { row: row, col: firstFreeCol }, value );

          // Mark the first free location as occupied.
          firstFreeCol--;
        }
      }
    }
  }

  return newBoard;
}

//
// Scoring boards
//

function scoreBoard(board) {
  return sum(allBoardLocs.map(function(loc) {
    var value = board.get(loc);

    if (value === null) {
      return 0;
    } else {
      return Math.pow(2,value);
    }
  }));
}

//
// Evaluating terminal positions
//

function boardTerminalUtility(board) {
  var utility = 0;

  allBoardLocs.forEach(function(loc) {
    utility += squareUtility(board, loc);
  });

  return utility;
}

// Takes a board and a location and returns the utility of that square
// on that board.
function squareUtility(board, loc) {
  var value = board.get(loc);

  if (loc.row <= 1) {
    if (value === null) {
      return 0;
    } else {
      return Math.pow(2, value) *
        Math.pow(2, 8 - highSquareOrdinalPos(loc))
         + fineGrainedUtility(board, loc);
    }
  } else {
    if (value === null) {
      if (loc.row === 2) {
        return VALUE_OF_EMPTY_SQUARE_ON_ROW_2;
      } else {
        return VALUE_OF_EMPTY_SQUARE_ON_ROW_3;
      }
    } else {
      var ycoef;

      if (loc.row === 2) {
        ycoef = 1;
      } else if (loc.row === 3) {
        ycoef = Math.pow(2, value);
      }

      return -Math.pow(2, value) * ycoef;
    }
  }
}

// Takes a square in the top half of the board and returns its ordinal
// position in the canonical ordering of top half squares.
function highSquareOrdinalPos(loc) {
  if (loc.row === 0) {
    return 1 + loc.col;
  } else if (loc.row === 1) {
    return 4 + (4 - loc.col);
  }
}

// Fine grained utility tweaks for tiles on the first two rows.
function fineGrainedUtility(board, loc) {
  var value = board.get(loc);
  var row0Pop = rowPopulation(board,0);
  var row1Pop = rowPopulation(board, 1);

  // Negative utility for a lower piece on the first row surrounded by
  // higher pieces.
  if (value !== null && loc.row === 0 && row0Pop === 4 &&
      row1Pop >= 3) {
    var parentValue = board.get({ row: 1, col: loc.col });

    if (parentValue !== null && value < parentValue) {
      return -Math.pow(2, 4 * (parentValue - value));
    }
  }

  // if (value !== null && loc.row === 1 && loc.col === 3 && row0Pop === 4 &&
  //     row1Pop >= 3) {
  //   var nextValue = board.get({ row: 1, col: 2 });
  //
  //   if (nextValue > value); {
  //     return -Math.pow(2, nextValue - value);
  //   }
  // }

  return 0;
}

//
// Evaluating positions
//

// Returns the utility of the current position on the computer's turn,
// by taking a weighted average of the utilities of the possible boards
// resulting from a computer move, applying the given utility function.
function evaluateOnComputersTurnBy(utility, board) {
  var moves = possibleComputerMoves(board);

  return sum(moves.map(function(move, index) {
    return utility(applyComputerMove(board, move)) * moveProbability(moves, index);
  }));
}

// Returns a maximally good move for the player, if there is a move available,
// together with its utility, in the form [newBoard, utility].
// Returns null if there is no possible move. Uses the given utility function to
// determine goodness of moves.
function bestPlayerMoveBy(utility, board) {
  // All of the possible moves, represented as an array of resulting boards.
  var possibleMoves = directions.map(function(dir) {
    return executePlayerMoveUnconditionally(board, dir);
  }).filter(function (newBoard) {
    return !board.eq(newBoard);
  });

  if (possibleMoves.length === 0) {
    return null;
  } else {
    return maxBy(utility, possibleMoves);
  }
}

// Produces a utility function which evaluates a board to a given search
// depth on the computer's turn.
function evaluateOnComputersTurn(searchDepth) {
  if (searchDepth === 0) {
    return boardTerminalUtility;
  } else {
    return function(board) {
      return evaluateOnComputersTurnBy(
        evaluateOnPlayersTurn(searchDepth - 1),
        board);
    };
  }
}

// Produces a utility function which evaluates a board to a given search
// depth on the player's turn.
function evaluateOnPlayersTurn(searchDepth) {
  if (searchDepth === 0) {
    return boardTerminalUtility;
  } else {
    return function(board) {
      var bestMove = bestPlayerMoveBy(
        evaluateOnComputersTurn(searchDepth - 1),
        board);

      if (bestMove === null) {
        return VALUE_OF_LOSS;
      } else {
        return bestMove[1];
      }
    };
  }
}

// Returns a maximally good move for a player, or null if they have no move.
// The move is represented as a new board.
function bestPlayerMove(board) {
  var bestMove = bestPlayerMoveBy(evaluateOnComputersTurn(SEARCH_DEPTH), board);

  if (bestMove === null) {
    return null;
  } else {
    return bestMove[0];
  }
}
