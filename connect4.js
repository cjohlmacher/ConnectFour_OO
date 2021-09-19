/** Connect Four
 *
 * Player 1 and 2 alternate turns. On each turn, a piece is dropped down a
 * column until a player gets four-in-a-row (horiz, vert, or diag) or until
 * board fills (tie)
 */
class Activity {
  constructor(maxPlayers) {
    this.maxPlayers = maxPlayers; 
    this.activeGame = null; // The current instance of Game
    this.settingUp = false; // Prevents action during game set up
    this.defaults = new Map(
      [[1, "#FE5D9F"],[2, "#01308F"], [3, "#FFFFFF"], [4, "#000000"]]
    ); // Default colors for color selection
    this.createPlayerSelection();
    this.createColorSelection();
    this.makeStartButton();
  }

  //create div for selecting number of players
  createPlayerSelection() {
    const playerSelect = document.querySelector(".player-select");
    for (let i=1; i<this.maxPlayers; i++) {
      const playerButton = document.createElement("button");
      playerButton.classList.add("player-button");
      playerButton.innerText = i+1;
      playerButton.addEventListener('click', this.handlePlayerSelect.bind(this));
      playerSelect.append(playerButton);
    };
  };

  // Create div for selecting player colors
  createColorSelection() {
    const colorSelect = document.querySelector(".color-select");
    const form = document.createElement("form");
    for (let i=0;i<2;i++){
      this.updateColorInputs(i,form);
    };
    colorSelect.append(form);
  };

  // Handle new player selection
  handlePlayerSelect(evt){
    const playerCount = +evt.target.innerText;
    const colorDivs = document.querySelectorAll(".color-div");
    const colorDivArray = [...colorDivs];
    while (colorDivArray.length > playerCount) {
      colorDivArray.pop().remove();
    }
    const form = document.querySelector("form");
    for (let i=colorDivs.length; i < playerCount; i++){
      this.updateColorInputs(i,form);
    };
  };

  // Update the color inputs based on number of players
  updateColorInputs(playerNumber,container){
    const colorSelectDiv = document.createElement("div");
    colorSelectDiv.classList.add("color-div");
    const colorInput = document.createElement("input");
    const colorLabel = document.createElement("label");
    colorInput.type = "color";
    colorLabel.setAttribute("for",`Player ${playerNumber+1}`);
    colorLabel.innerText = `Player ${playerNumber+1}:`;
    colorInput.setAttribute("name",`Player ${playerNumber+1}`);
    colorInput.value = this.defaults.get(playerNumber+1);
    colorInput.classList.add("color-input");
    colorSelectDiv.append(colorLabel);
    colorSelectDiv.append(colorInput);
    container.append(colorSelectDiv); 
  };

  // Make a start button
  makeStartButton() {
    const startButton = document.createElement("button");
    startButton.innerText = "Start New Game";
    startButton.classList.add("start");
    startButton.addEventListener('click',this.startGame.bind(this));
    document.body.append(startButton);
  };

  // Functionality when start button is clicked
  startGame(){
    //disable button if already setting up new game
    if (this.settingUp) {
      return;
    };
    let delay = 0;
    this.settingUp = true;
    // tear down existing game
    if (this.activeGame) {
      this.activeGame.endGameCollapse();
      delay = 1500;
    };
    // use inputs to create new game
    const colorInputs = document.querySelectorAll("form input");
    const players = [];
    for (let i=0; i < colorInputs.length; i++){
      players.push(new Player(colorInputs[i].value,i+1));
    };
    setTimeout( ()=>{
      this.activeGame = new Game(7,6,...players);
      this.settingUp = false;
    },delay);
  };
};

class Player {
  constructor(color,id) {
    this.color = color;
    this.id = id;
  }
};

class Game {
  constructor(width,height,...players) {
    this.width = width;
    this.height = height;
    this.players = players;
    this.currPlayer = players[0];  // active player
    this.turnOrder = this.createTurnOrder();
    this.board = [];  // array of rows, each row is array of cells  (board[y][x])
    this.winner = false; //sets whether there is a winner declared for the current game
    this.makeBoard();
    this.makeHtmlBoard();
  };
  /** makeBoard: create in-JS board structure:
  board = array of rows, each row is array of cells  (board[y][x])
  */
  createTurnOrder() {
    const order = new Map;
    for (let i=0; i<this.players.length; i++) {
      order.set(this.players[i],this.players[i+1]);
    };
    order.set(this.players[this.players.length-1],this.players[0]);
    return order;
  };

  nextPlayer() {
    this.currPlayer = this.turnOrder.get(this.currPlayer);
  }

  makeBoard() {
    for (let y = 0; y < this.height; y++) {
      this.board.push(Array.from({ length: this.width }));
    }
  };
  // make a start button
  // makeStartButton() {
  //   const startButton = document.createElement("button");
  //   startButton.innerText = "Start New Game";
  //   startButton.classList.add("start");
  //   startButton.addEventListener('click',this.endGameCollapse.bind(this));
  //   document.body.append(startButton);
  // };
  /** makeHtmlBoard: make HTML table and row of column tops. */
  makeHtmlBoard() {
    const game = document.getElementById("game");
    const htmlBoard = document.createElement("table");
    htmlBoard.setAttribute("id","board");

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
      previewPiece.style.backgroundColor = this.currPlayer.color;
      headCell.append(previewPiece);
      top.append(headCell);
    }

    htmlBoard.append(top);
    game.append(htmlBoard);

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
    piece.style.backgroundColor = this.currPlayer.color;
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
      return this.endGame(`Player ${this.currPlayer.id} won!`);
    }
    
    // check for tie
    if (this.board.every(row => row.every(cell => cell))) {
      return this.endGame('Tie!');
    }

    // move on to next player
    this.nextPlayer();
    const previewPieces = document.querySelectorAll(".preview");
    previewPieces.forEach( (previewPiece) => {
      previewPiece.style.backgroundColor = this.currPlayer.color;
    });
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
    this.winner = true;
    const gameboard = document.querySelector("#game");
    gameboard.classList.toggle('winner');
    const pieces = document.querySelectorAll(".piece");
      for (let piece of pieces) {
        piece.classList.toggle('winner');
      };
    setTimeout(() => {
      const game = document.querySelector("#board");
      gameboard.classList.toggle('winner');
      game.remove();
    },1500); //deletes game after 2 seconds
  };

  removePieces() {
    const pieces = document.querySelectorAll(".piece");
    for (let piece of pieces) {
      piece.remove();
    };
  };
};

const ConnectFour = new Activity(4);
