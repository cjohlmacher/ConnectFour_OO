/** Connect Four
 *
 * Player 1 and 2 alternate turns. On each turn, a piece is dropped down a
 * column until a player gets four-in-a-row (horiz, vert, or diag) or until
 * board fills (tie)
 */
class Game {
  constructor(width,height) {
    this.width = width;
    this.height = height;
    this.currPlayer = 1;  // active player: 1 or 2
    this.board = [];  // array of rows, each row is array of cells  (board[y][x])
    this.winner = false; //sets whether there is a winner declared for the current game
    this.makeBoard();
    this.makeHtmlBoard();
    this.makeStartButton();
  };
  /** makeBoard: create in-JS board structure:
  board = array of rows, each row is array of cells  (board[y][x])
  */
  makeBoard() {
    for (let y = 0; y < this.height; y++) {
      this.board.push(Array.from({ length: this.width }));
    }
  };

  /** makeHtmlBoard: make HTML table and row of column tops. */
  makeHtmlBoard() {
    const htmlBoard = document.getElementById('board');

    // make column tops (clickable area for adding a piece to that column)
    const top = document.createElement('tr');
    top.setAttribute('id', 'column-top');
    top.addEventListener('click', this.handleClick.bind(this));

    for (let x = 0; x < this.width; x++) {
      const headCell = document.createElement('td');
      headCell.setAttribute('id', x);
      const previewPiece = document.createElement("div");
      previewPiece.setAttribute("id",x);
      previewPiece.classList.add("preview");
      headCell.append(previewPiece);
      top.append(headCell);
    }

    htmlBoard.append(top);

    // make main part of board
    for (let y = 0; y < this.height; y++) {
      const row = document.createElement('tr');

      for (let x = 0; x < this.width; x++) {
        const cell = document.createElement('td');
        cell.setAttribute('id', `${y}-${x}`);
        if (x === 0) {cell.classList.add("leftmost");}  //for css styling: leftmost cells need added thickness to border
        row.append(cell);
      }

      htmlBoard.append(row);
    }
  };

  // make a start button
  makeStartButton() {
    const startButton = document.createElement("button");
    startButton.innerText = "Start New Game";
    startButton.classList.add("start");
    startButton.addEventListener('click',this.endGameCollapse.bind(this));
    document.body.append(startButton);
  };

  /** findSpotForCol: given column x, return top empty y (null if filled) */
  findSpotForCol(x) {
    for (let y = this.height - 1; y >= 0; y--) {
      if (!this.board[y][x]) {
        return y;
      }
    }
    return null;
  };

  /** placeInTable: update DOM to place piece into HTML table of board */
  placeInTable(y, x) {
    const piece = document.createElement('div');
    piece.classList.add('piece');
    piece.classList.add(`p${this.currPlayer}`);
    piece.style.top = -50 * (y + 2);
    piece.style.setProperty('--fallDistance',`-${30+y*54}px`); //calculate animation distance
    piece.style.setProperty('--fallTime',`${0.5+y/2.0}s`); //calculate animation duration
    const spot = document.getElementById(`${y}-${x}`);
    spot.append(piece);
  };

  /** endGame: announce game end */
  endGame(msg) {
    this.winner = true;
    setTimeout( function() {
      alert(msg);
    },100);
  };

  /** handleClick: handle click of column top to play piece */
  handleClick(evt) {
    //check if the game has already declared a winner
    if (this.winner) {
      return;
    };
    
    // get x from ID of clicked cell
    const x = +evt.target.id;

    // get next spot in column (if none, ignore click)
    const y = this.findSpotForCol(x);
    if (y === null) {
      return;
    }

    // place piece in board and add to HTML table
    this.board[y][x] = this.currPlayer;
    this.placeInTable(y, x);
    
    // check for win
    if (this.checkForWin()) {
      return this.endGame(`Player ${this.currPlayer} won!`);
    }
    
    // check for tie
    if (this.board.every(row => row.every(cell => cell))) {
      return this.endGame('Tie!');
    }

    // switch players
    const previewPieces = document.querySelectorAll(".preview");
    previewPieces.forEach( (previewPiece) => {
      previewPiece.style.backgroundColor = previewPiece.style.backgroundColor === "rgb(254, 93, 159)" ? 'rgb(0,48,143)' : 'rgb(254,93,159)';
    });
    this.currPlayer = this.currPlayer === 1 ? 2 : 1;
  };

  /** checkForWin: check board cell-by-cell for "does a win start here?" */
  checkForWin() {
    const _win = (cells) => {
      // Check four cells to see if they're all color of current player
      //  - cells: list of four (y, x) cells
      //  - returns true if all are legal coordinates & all match currPlayer

      return cells.every(
        ([y, x]) =>
          y >= 0 &&
          y < this.height &&
          x >= 0 &&
          x < this.width &&
          this.board[y][x] === this.currPlayer
      );
    }

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        // get "check list" of 4 cells (starting here) for each of the different
        // ways to win
        const horiz = [[y, x], [y, x + 1], [y, x + 2], [y, x + 3]];
        const vert = [[y, x], [y + 1, x], [y + 2, x], [y + 3, x]];
        const diagDR = [[y, x], [y + 1, x + 1], [y + 2, x + 2], [y + 3, x + 3]];
        const diagDL = [[y, x], [y + 1, x - 1], [y + 2, x - 2], [y + 3, x - 3]];

        // find winner (only checking each win-possibility as needed)
        if (_win(horiz) || _win(vert) || _win(diagDR) || _win(diagDL)) {
          return true;
        }
      }
    }
  };

  endGameCollapse() {
    const gameboard = document.querySelector("#game");
    gameboard.classList.toggle('winner');
    this.board.length = 0;
    this.makeBoard();
    const pieces = document.querySelectorAll(".piece");
      for (let piece of pieces) {
        piece.classList.toggle('winner');
        setTimeout(this.removePieces.bind(this),2000); //removes pieces after animation is finished
      };
    setTimeout(() => {
      gameboard.classList.toggle('winner');
      this.winner = false;
    },2000); //resets animation trigger after animation is finished
  };

  removePieces() {
    const pieces = document.querySelectorAll(".piece");
    for (let piece of pieces) {
      piece.remove();
    };
  };
};

const ConnectFour = new Game(7,6);
