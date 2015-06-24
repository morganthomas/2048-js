// An iterator is a function which returns the next item in an enumeration,
// or null if there are no more items.

// Takes an iterator and produces a new one which filters out items
// according to a supplied predicate.
function filterIter(iter, pred) {
  return function() {
    var next;

    do {
      next = iter();
    } while (next && !pred(iter))

    return next;
  }
}

// A 2048 game board is an object with get() and set() methods taking
// board locations. Board locations are objects with properties row and col,
// both natural numbers between 0 and 3 inclusive. The contents of a board
// location are null for an empty square, or a natual number n for a
// tile of value 2^n

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
  return board[loc.row][loc.col];
}

Board.prototype.set = function(loc, val) {
  board[loc.row][low.col] = val;
}

// Returns an iterator over all board locations.
function iterAllLocs() {
  var row = 0;
  var col = 0;

  return function() {
    if (row === 3 && col === 3) {
      return null;
    } else if (col === 3) { // row !== 3
      row++;
      col = 0;
      return { row: row, col: col }
    } else { // col !== 3
      col++;
      return { row: row, col: col };
    }
  }
}

// Returns an iterator over all blank squares in a board.
function blankSquares(board) {
  return filterIter(iterAllLocs(),
    function(loc) {
      return board.get(loc) === null;
    });
}

// Returns an iterator over all possible ways of adding a new tile
// to the board: i.e., moves the computer can make.
function possibleComputerMoves(board) {

}
