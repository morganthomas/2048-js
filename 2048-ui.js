// Accesses the DOM element for a given board location.
function getSquareDOM(loc) {
  return $(("#cell-" + loc.row) + loc.col);
}

// Quick and dirty display for a game board.
function displayBoard(board) {
  allBoardLocs.forEach(function(loc) {
    var squareContents = board.get(loc);
    var squareDOM = getSquareDOM(loc);
    squareDOM.removeClass(); // XXX: hack!

    if (squareContents === null) {
      squareDOM.addClass("cell-type-empty");
      squareDOM.text("");
    } else {
      // XXX: more fine-grained styling
      squareDOM.addClass("cell-type-occupied");
      squareDOM.text(Math.pow(2,squareContents));
    }
  });

  $("#score").text(scoreBoard(board));
  $("#board-utility").text(boardTerminalUtility(board));
}

$(document).ready(function() {
  var board = new Board();
  displayBoard(board);
  // board.set({ row: 0, col: 0 }, 1);

  // User controlled dummy interface
  $(window).on('keypress', function(event) {
    // w: 119, a: 97, s: 115, d: 100
    var wasRelevant = false;
    var direction;

    if (event.which === 119) {
      wasRelevant = true;
      direction = { row: -1, col: 0 };
    } else if (event.which === 97) {
      wasRelevant = true;
      direction = { row: 0, col: -1 };
    } else if (event.which === 115) {
      wasRelevant = true;
      direction = { row: 1, col: 0 };
    } else if (event.which === 100) {
      wasRelevant = true;
      direction = { row: 0, col: 1 };
    }

    if (wasRelevant) {
      console.log("keypress", event.which);

      board = executePlayerMoveUnconditionally(board, direction);
      displayBoard(board);

      setTimeout(function() {
        var moveDist = possibleComputerMoves(board);
        var moveIndex = randomComputerMove(moveDist);
        board = applyComputerMove(board, moveDist[moveIndex]);
        displayBoard(board);
      }, 500);
    }
  });

  $('#game-start').on('click', function() {
    var isPlayersTurn = false;
    var gameIsOver = false;

    setInterval(function() {
      if (!gameIsOver) {
        if (isPlayersTurn) {
          board = bestPlayerMove(board);

          if (board === null) {
              gameIsOver = true;
              return;
          }
        } else {
          var moveDist = possibleComputerMoves(board);
          var moveIndex = randomComputerMove(moveDist);
          board = applyComputerMove(board, moveDist[moveIndex]);
        }

        isPlayersTurn = !isPlayersTurn;

        displayBoard(board);
      }
    }, 20);
  });
});
