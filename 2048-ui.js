// Accesses the DOM element for a given square on the board.
function getSquareDOM(row, col) {
  return $(("#cell-" + row) + col);
}

// Quick and dirty display for a game board.
function displayBoard(board) {
  for (var row = 0; row < 4; row++) {
    for (var col = 0; col < 4; col++) {
      var squareContents = board[row][col];
      var squareDOM = getSquareDOM(row, col);
      squareDOM.removeClass(); // XXX: hack!

      if (squareContents === null) {
        squareDOM.addClass("cell-type-empty");
      } else {
        // XXX: more fine-grained styling
        squareDOM.addClass("cell-type-occupied");
        squareDOM.text(Math.pow(2,squareContents));
      }
    }
  }
}

$(document).ready(function() {
  var board = makeEmptyBoard();
  board[0][0] = 1;

  displayBoard(board);
});
