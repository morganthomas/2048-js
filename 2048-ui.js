// Accesses the DOM element for a given board location.
function getSquareDOM(loc) {
  return $(("#cell-" + loc.row) + loc.col);
}

function displayBoard(board) {
  allBoardLocs.forEach(function(loc) {
    var squareContents = board.get(loc);
    var squareDOM = getSquareDOM(loc);
    squareDOM.removeClass();

    if (squareContents === 0) {
      squareDOM.addClass("cell-type-empty");
      squareDOM.text("");
    } else {
      squareDOM.addClass("cell-type-occupied");

      if (squareContents > 9) {
        squareDOM.addClass("cell-type-bignum");
      }

      squareDOM.text(Math.pow(2,squareContents));
    }
  });

  $("#score").text(scoreBoard(board));
}

$(document).ready(function() {
  var board = new Board();
  displayBoard(board);
  var gameTimer = null;
  var gameIsRunning = false;
  var gameIsPaused = false;
  var isPlayersTurn = false;

  var runMove = function() {
    if (gameIsRunning && !gameIsPaused) {
      if (isPlayersTurn) {
        board = bestPlayerMove(board);

        // Player is out of moves, so game is over.
        if (board === null) {
            gameIsRunning = false;
            clearInterval(gameTimer);
            gameTimer = null;
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
  };

  var startGame = function() {
    gameIsPaused = false;

    if (gameIsRunning) {
      return;
    }

    gameIsRunning = true;
    isPlayersTurn = false;

    setGameTimer();
  };

  var unsetGameTimer = function() {
    if (gameTimer !== null) {
      clearInterval(gameTimer);
      gameTimer = null;
    }
  }

  var setGameTimer = function() {
    unsetGameTimer();
    var speed = Math.pow(10, (8 - parseInt($('#game-speed').val()) + 4) / 4);
    gameTimer = setInterval(runMove, speed);
  }

  var resetGame = function() {
    gameIsRunning = false;
    unsetGameTimer();
    board = new Board();
    displayBoard(board);
  };

  var pauseGame = function() {
    gameIsPaused = true;
  }

  $('#game-start').on('click', startGame);
  $('#game-reset').on('click', resetGame);
  $('#game-pause').on('click', pauseGame);
  $('#game-speed').on('change', setGameTimer);
});
