//
// Parameters controlling the AI.
//

var SEARCH_DEPTH = 4;
var VALUE_OF_LOSS = -Math.pow(2,24);
var VALUE_OF_EMPTY_SQUARE_ON_ROW_2 = 32;
var VALUE_OF_EMPTY_SQUARE_ON_ROW_3 = 128;

//
// To avoid memory allocation, we use a stack of boards, and when we need
// a new board, we use one from the top of the stack.
//

var boardStack = [];
var boardStackPtr = 0; // Points at the first unused point in the stack.

function newBoardFromStack() {
  if (boardStack.length <= boardStackPtr) {
    boardStack.push(new Board());
  }

  return boardStack[boardStackPtr++];
}

//
// A 2048 game board is a two-dimensional array, where the outer dimension
// is rows and the inner dimensions is columns. The contents of a board
// location are 0 for an empty square, or a positive number n for a
// tile of value 2^n.
//

function Board() {
  this.array = new Array(4);

  for (var row = 0; row < 4; row++) {
    this.array[row] = new Array(4);

    for (var col = 0; col < 4; col++) {
      this.array[row][col] = 0;
    }
  }
}

// Copies the contents of this board to another board.
Board.prototype.copy = function(newBoard) {
  for (var row = 0; row < 4; row++) {
    for (var col = 0; col < 4; col++) {
      newBoard[row][col] = this[row][col];
    }
  }
}

// Compares two boards for equality.
Board.prototype.eq = function(that) {
  // This function was a performance bottleneck when it used all and map, and
  // it is also a bottleneck using allBoardLocs.forEach. Hence it is written
  // using a simple for loop.
  var areEqual = true;

  for (var row = 0; row < 4; row++) {
    for (var col = 0; col < 4; col++) {
      if (this[row][col] !== that[row][col]) {
        areEqual = false;
      }
    }
  }

  return areEqual;
}
