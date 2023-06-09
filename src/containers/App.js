import React, { Component } from "react";
import axios from "axios";
import "./App.css";

import Graybar from "../components/GrayBar/Graybar";
import OutSideBar from "../components/OutSideBar/OutSideBar";
import Board from "../components/Board/Board";
import Status from "../components/Status/Status";
import Menu from "../components/Menu/Menu";
import dice from "../components/DiceArea/Dice/Dice";

class App extends Component {
  //Initial state
  state = {
    showComputerDice: false,
    gameStatus: 80, //not started
    history: [],
    currentPosition: 0,
    p1IsNext: true,
    dice: [0],
    points: Array(24).fill({ player: false, checkers: 0 }),
    grayBar: { checkersP1: 0, checkersP2: 0 },
    outSideBar: { checkersP1: 15, checkersP2: 15 },
    movingChecker: false,
    players: { p1: "Player 1", p2: "Player 2" },
    showMenu: true,
  };

  calculateScore = () => {
    let scoreP1 = 0;
    let scoreP2 = 0;

    this.state.points.map((point, index) => {
      if (point.player) {
        //Check if the point belongs to a player

        if (point.player === 1) {
          //if player 1
          scoreP1 += (24 - index) * point.checkers;
        } else {
          //If player 2
          scoreP2 += (index + 1) * point.checkers;
        }
      }
      return false;
    });

    //Score from grayBar
    if (this.state.grayBar.checkersP1) {
      scoreP1 += 25 * this.state.grayBar.checkersP1;
    }
    if (this.state.grayBar.checkersP2) {
      scoreP2 += 25 * this.state.grayBar.checkersP2;
    }

    return { P1: scoreP1, P2: scoreP2 };
  };
  //Toggle menu
  toggleMenuHandler = () => {
    this.setState({
      showMenu: !this.state.showMenu,
    });
  };

  //set up new game
  setupNewGameHandler = (playerNames, playerStarts) => {
    const gameStatus = 11; //New game
    const history = [];
    const currentPosition = 0;
    const p1IsNext = playerStarts === 1 ? true : false;
    const dice = [0];
    const points = Array(24).fill({ player: false, checkers: 0 });
    const grayBar = { checkersP1: 0, checkersP2: 0 };
    const outSideBar = { checkersP1: 0, checkersP2: 0 };
    const movingChecker = false;
    const showMenu = false;
    const players = { p1: playerNames.p1, p2: playerNames.p2 };

    history.push(this.setHistory(p1IsNext, dice, points, grayBar, outSideBar));

    //set points
    points[0] = { player: 1, checkers: 2 };
    points[11] = { player: 1, checkers: 5 };
    points[16] = { player: 1, checkers: 3 };
    points[18] = { player: 1, checkers: 5 };

    points[23] = { player: 2, checkers: 2 };
    points[12] = { player: 2, checkers: 5 };
    points[7] = { player: 2, checkers: 3 };
    points[5] = { player: 2, checkers: 5 };

    this.setState({
      gameStatus: gameStatus,
      history: history,
      currentPosition: currentPosition,
      p1IsNext: p1IsNext,
      dice: dice,
      points: points,
      grayBar: grayBar,
      outSideBar: outSideBar,
      movingChecker: movingChecker,
      showMenu: showMenu,
      players: players,
    });
  };

  //Set new history
  setHistory = (p1IsNext, dice, points, grayBar, outSideBar, gameStatus) => {
    const history = {
      p1IsNext: p1IsNext,
      dice: [...dice],
      points: [...points],
      grayBar: { ...grayBar },
      outSideBar: { ...outSideBar },
      gameStatus: gameStatus,
    };
    return history;
  };

  //Roll dices
  rollDiceHandler = () => {
    //if gameStatus is 50, that means there is no moves available for the current player
    const p1IsNext =
      this.state.gameStatus === 50 ? !this.state.p1IsNext : this.state.p1IsNext;
    //new dice
    const dice = [];
    //Get two random numbers
    dice.push(Math.floor(Math.random() * 6) + 1);
    dice.push(Math.floor(Math.random() * 6) + 1);
    //duplicate numbers if the same
    if (dice[0] === dice[1]) {
      dice[2] = dice[3] = dice[0];
    }

    console.log("Rolled dice: " + dice);

    //Get moves and status
    const moves = this.calculateCanMove(
      this.getPointsWithoutActions(this.state.points),
      dice,
      p1IsNext,
      this.state.grayBar
    );

    //get points and status
    const points = moves.points;
    const gameStatus = moves.gameStatus;

    //reset history
    const currentPosition = 0;
    const history = [];
    //Save current state into history
    history.push(
      this.setHistory(
        p1IsNext,
        dice,
        points,
        this.state.grayBar,
        this.state.outSideBar,
        gameStatus
      )
    );

    //Set new state
    this.setState({
      gameStatus: gameStatus,
      history: history,
      currentPosition: currentPosition,
      points: points,
      dice: dice,
      p1IsNext: p1IsNext,
    });
    if (gameStatus == 50) {
      this.handlePlayerNoMoves();
    }
  };

  //Calculate possible moves return an object with points and game status
  calculateCanMove = (points, dice, p1IsNext, grayBar) => {
    console.log("calculating possible moves");

    let newPoints = [...points];
    let gameStatus = 50; //No moves available

    if (!dice[0]) {
      gameStatus = 40; // No dice to play
    } else {
      //check if there is checker on gray Bar
      if (
        (p1IsNext && grayBar.checkersP1) ||
        (!p1IsNext && grayBar.checkersP2)
      ) {
        for (let die of dice) {
          const destination = p1IsNext ? die - 1 : 24 - die;
          if (
            points[destination].player === this.getPlayer(p1IsNext) || //point belongs to user
            points[destination].checkers < 2
          ) {
            //point is empty or belongs to other user but with only one checker
            newPoints[destination].canReceive = this.receiveCheckerHandler.bind(
              this,
              die
            );
            gameStatus = 31; //Playing from graybar
          }
        }
      } else {
        const inHomeBoard = this.checkHomeBoard(newPoints, p1IsNext);

        //get points with actions
        for (let index = 0; index < points.length; index++) {
          let canMove = false;

          //Check if checker can move
          if (points[index].player === this.getPlayer(p1IsNext)) {
            for (let die of dice) {
              const destination = p1IsNext ? index + die : index - die;
              if (!canMove && destination < 24 && destination >= 0) {
                if (
                  points[destination].player === this.getPlayer(p1IsNext) ||
                  points[destination].checkers < 2
                ) {
                  canMove = true;
                  gameStatus = 30; //Playing
                }
              }
            }
          }

          if (
            inHomeBoard &&
            ((p1IsNext && index >= 18) || (!p1IsNext && index <= 5))
          ) {
            if (this.checkCanBearOff(points, index, p1IsNext, dice)) {
              canMove = true;
              gameStatus = 32; //Bearing off
            }
          }

          if (canMove) {
            newPoints[index].canMove = this.moveCheckerHandler.bind(
              this,
              index
            );
          }
        }
      }
    }
    return { points: newPoints, gameStatus: gameStatus };
  };

  //Check if player has all the checkers in the home board
  checkHomeBoard = (points, p1IsNext) => {
    //Checkers in homeboard. If true it's good to go outside
    let homeBoard = true;

    //get points with actions
    points.map((point, index) => {
      //Check homeboard
      //Player 1
      if (p1IsNext && index <= 17 && point.player === 1) {
        homeBoard = false;
      }
      //Player 2
      else if (!p1IsNext && index >= 6 && point.player === 2) {
        homeBoard = false;
      }

      return null;
    });

    return homeBoard;
  };

  //Check if checker can bear off
  checkCanBearOff = (points, checker, p1IsNext, dice) => {
    let canBearOff = false;

    //Check if it is a player checker
    if (
      checker >= 0 &&
      checker < 24 &&
      points[checker].player === this.getPlayer(p1IsNext)
    ) {
      for (let die of dice) {
        //check if the dice have the right number to bear off
        if (
          (p1IsNext && checker + die === 24) ||
          (!p1IsNext && checker - die === -1)
        ) {
          canBearOff = die;
        }
      }

      if (!canBearOff) {
        const highDie = [...dice].sort().reverse()[0]; //Get the highest die
        let checkerBehind = false; //Check if there is checker behind the moving checker

        //die is more than necessary to bear off
        if (
          (p1IsNext && checker + highDie > 24) ||
          (!p1IsNext && checker - highDie < -1)
        ) {
          if (p1IsNext) {
            for (let i = 18; i < checker; i++) {
              if (
                points[i].player &&
                points[i].player === this.getPlayer(p1IsNext)
              ) {
                checkerBehind = true;
              }
            }
          } else {
            for (let i = 5; i > checker; i--) {
              if (
                points[i].player &&
                points[i].player === this.getPlayer(p1IsNext)
              ) {
                checkerBehind = true;
              }
            }
          }

          //If there is no checker behind, it can bear off
          if (!checkerBehind) {
            canBearOff = highDie;
          }
        }
      }
    }
    return canBearOff;
  };

  //Set moving checker
  moveCheckerHandler = (checker) => {
    let gameStatus = 30; //playing
    const p1IsNext = this.state.p1IsNext;
    //Get outSideBar without actions
    const outSideBar = this.getOutSideBarWithoutActions(this.state.outSideBar);
    //get points without actions
    let points = this.getPointsWithoutActions(this.state.points);

    //set or unset the moving checker
    const movingChecker =
      checker !== this.state.movingChecker ? checker : false;

    if (movingChecker !== false) {
      //add action to the moving checker. This uncheck the moving checker
      points[movingChecker].canMove = this.moveCheckerHandler.bind(
        this,
        movingChecker
      );

      for (let die of this.state.dice) {
        const destination = p1IsNext
          ? movingChecker + die
          : movingChecker - die;
        if (destination < 24 && destination >= 0) {
          //Check if destnation can receive the checker
          if (
            points[destination].player === this.getPlayer(p1IsNext) ||
            points[destination].checkers < 2
          ) {
            points[destination].canReceive = this.receiveCheckerHandler.bind(
              this,
              die
            ); //Add can Receive to point
          }
        }
      }

      //Bearing off
      if (
        this.checkHomeBoard(points, p1IsNext) &&
        ((p1IsNext && movingChecker >= 18) || (!p1IsNext && movingChecker <= 5))
      ) {
        //Get the dice to move
        let die = this.checkCanBearOff(
          points,
          movingChecker,
          p1IsNext,
          this.state.dice
        );
        if (die) {
          if (p1IsNext) {
            outSideBar.p1CanReceive = this.receiveCheckerHandler.bind(
              this,
              die
            );
          } else {
            outSideBar.p2CanReceive = this.receiveCheckerHandler.bind(
              this,
              die
            );
          }
          gameStatus = 32; //Bearing off
        }
      }

      console.log(
        "moving checker from point " +
          (p1IsNext ? movingChecker + 1 : 24 - movingChecker)
      );
    } else {
      const moves = this.calculateCanMove(
        points,
        this.state.dice,
        this.state.p1IsNext,
        this.state.grayBar
      );
      points = moves.points;
      gameStatus = moves.gameStatus;
    }

    this.setState({
      gameStatus: gameStatus,
      points: points,
      movingChecker: movingChecker,
      outSideBar: outSideBar,
    });
  };

  //Receive checker into the point
  receiveCheckerHandler = async (die) => {
    const grayBar = { ...this.state.grayBar };
    const outSideBar = this.getOutSideBarWithoutActions(this.state.outSideBar);
    const dice = [...this.state.dice];
    let p1IsNext = this.state.p1IsNext;
    let gameStatus = 30; //playing
    let showMenu = this.state.showMenu;

    //get points without actions
    let points = this.getPointsWithoutActions(this.state.points);

    //get the moving checker or graybar (-1 or 24)
    let movingChecker = this.getMovingChecker(p1IsNext);

    //get destination
    const destination = p1IsNext ? movingChecker + die : movingChecker - die;

    //Logging
    if (destination > 23 || destination < 0) {
      console.log("Bearing off Checker");
    } else {
      console.log(
        "Moving checker to point " +
          (p1IsNext ? destination + 1 : 24 - destination)
      );
    }

    //Remove the checker from orign and clean point if it has no checker
    if (movingChecker >= 0 && movingChecker <= 23) {
      points[movingChecker].checkers--;

      if (points[movingChecker].checkers === 0) {
        points[movingChecker].player = false; //unassign point if there is no checker
      }
    } else {
      //remove from graybar
      if (movingChecker === -1) {
        //remove p1 from gray bar
        grayBar.checkersP1--;
      } else if (movingChecker === 24) {
        //remove p2 from gray bar
        grayBar.checkersP2--;
      }
    }

    //Moving checker inside the board
    if (destination <= 23 && destination >= 0) {
      if (
        points[destination].player === this.getPlayer(p1IsNext) ||
        points[destination].player === false
      ) {
        //Point either belongs to player or to nobody

        //Add checker to destination
        points[destination].checkers++;
      } else {
        //Destination has different player.
        //Send to gray bar
        if (p1IsNext) {
          grayBar.checkersP2++;
        } else {
          grayBar.checkersP1++;
        }
      }
      //Assign destination point to player. In this case destination has only one checker
      points[destination].player = this.getPlayer(p1IsNext);
    } else {
      //Bearing off
      if (p1IsNext) {
        outSideBar.checkersP1++;
      } else {
        outSideBar.checkersP2++;
      }
    }

    //Moving checker now is false
    movingChecker = false;

    //remove die from dice
    const diceIndex = dice.findIndex((dieNumber) => dieNumber === die);
    dice.splice(diceIndex, 1);
    console.log("Played die " + die);

    //Change player if no die
    if (dice.length === 0) {
      dice[0] = 0;
      if (grayBar.checkersP2 > 0 && this.isAgentClosed(points)) {
        gameStatus = 777;
        p1IsNext = !p1IsNext;
      }
      p1IsNext = !p1IsNext;
      // p1IsNext = this.computerPlay(p1IsNext);
    } else {
      //Get new moves
      const moves = this.calculateCanMove(points, dice, p1IsNext, grayBar);
      points = moves.points;
      gameStatus = moves.gameStatus;
    }

    const currentPosition = this.state.currentPosition + 1;
    const history = [...this.state.history];
    history.push(this.setHistory(p1IsNext, dice, points, grayBar, outSideBar));

    //Check if all checkers are in the outside bar
    if (outSideBar.checkersP1 === 15) {
      gameStatus = 60; //Player one wins
      showMenu = true;
    } else if (outSideBar.checkersP2 === 15) {
      gameStatus = 70; //Player two wins
      showMenu = true;
    }

    await this.setState({
      gameStatus: gameStatus,
      history: history,
      currentPosition: currentPosition,
      p1IsNext: p1IsNext,
      dice: dice,
      points: points,
      grayBar: grayBar,
      outSideBar: outSideBar,
      movingChecker: movingChecker,
      showMenu: showMenu,
    });
    if (gameStatus == 50) {
      this.handlePlayerNoMoves();
    } else if (gameStatus !== 777) this.computerPlay(this.state.p1IsNext);
  };

  isAgentClosed = (points) => {
    for (let i = 23; i >= 18; i--) {
      if (!(points[i].checkers >= 2 && points[i].player == 1)) return false;
    }
    return true;
  };

  computerPlay = (p1IsNext) => {
    if (p1IsNext === false) {
      // Showing computer dice on the board
      const dice = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ];
      this.setState({
        showComputerDice: true,
        dice,
      });

      let board = {};
      let Cells = this.state.points.map((point, index) => {
        return {
          Color: point.player === 1 ? "W" : point.player === 2 ? "B" : "0",
          Count: point.checkers,
          Position: index,
        };
      });
      let WhitePlayerBank = {
        Count: this.state.outSideBar.checkersP1,
        Color: "W",
        Position: 26,
      };
      let BlackPlayerBank = {
        Count: this.state.outSideBar.checkersP2,
        Color: "B",
        Position: 27,
      };
      let WhitePlayerPrison = {
        Count: this.state.grayBar.checkersP1,
        Color: "W",
        Position: 24,
      };
      let BlackPlayerPrison = {
        Count: this.state.grayBar.checkersP2,
        Color: "B",
        Position: 25,
      };

      board.Cells = Cells;
      board.WhitePlayerBank = WhitePlayerBank;
      board.BlackPlayerBank = BlackPlayerBank;
      board.WhitePlayerPrison = WhitePlayerPrison;
      board.BlackPlayerPrison = BlackPlayerPrison;
      const score = this.calculateScore();
      board.AgentDestination = score.P2;
      board.UserDestination = score.P1;

      let requestModel = { board, dice };

      axios
        .post(`https://localhost:7231/api/Boards`, requestModel)
        .then((response) => {
          if (response.data == "") {
            this.handleComputerNoMoves(p1IsNext);
          } else {
            setTimeout(() => {
              this.iterateMoves(0, response.data, p1IsNext);
            }, 1700);
          }
        });
    }
  };

  handleComputerNoMoves = () => {
    this.setState({
      gameStatus: 50,
      p1IsNext: false,
    });
    setTimeout(() => {
      this.setState({
        gameStatus: 30,
        p1IsNext: true,
        dice: [0],
        showComputerDice: false,
      });
    }, 2500);
  };

  iterateMoves = (index, data, p1IsNext) => {
    console.log(data.checkerMoves);
    let newOutSideBar = {
      checkersP1: data.whitePlayerBank.count,
      checkersP2: data.blackPlayerBank.count,
    };
    let newGrayBar = {
      checkersP1: data.whitePlayerPrison.count,
      checkersP2: data.blackPlayerPrison.count,
    };
    let newPoints = this.state.points;

    if (data.checkerMoves[index].from != 25) {
      // CASE AGENT ARE NOT EATEN
      newPoints[data.checkerMoves[index].from].checkers--;

      if (newPoints[data.checkerMoves[index].from].checkers == 0)
        newPoints[data.checkerMoves[index].from].player = false;

      if (data.checkerMoves[index].to != 27) {
        if (newPoints[data.checkerMoves[index].to].player == 1) {
          newPoints[data.checkerMoves[index].to].player = 2;
          newPoints[data.checkerMoves[index].to].checkers = 1;
        } else {
          newPoints[data.checkerMoves[index].to].checkers++;
          newPoints[data.checkerMoves[index].to].player = 2;
        }

        this.setState({
          points: newPoints,
        });
      }

      if (index < data.checkerMoves.length - 1) {
        setTimeout(() => {
          this.iterateMoves(index + 1, data, p1IsNext);
        }, 2000);
      } else {
        const score = this.calculateScore();
        if (score.P2 === 0)
          this.setState({
            grayBar: newGrayBar,
            outSideBar: newOutSideBar,
            p1IsNext: !p1IsNext,
            showMenu: true,
            gameStatus: 70,
            dice: [0],
            showComputerDice: false,
          });
          else
          this.setState({
            grayBar: newGrayBar,
            outSideBar: newOutSideBar,
            p1IsNext: !p1IsNext,
            dice: [0],
            showComputerDice: false,
          });
      }
    } else {
      // MEANS THAT WE ARE EATEN
      if (newPoints[data.checkerMoves[index].to].player == 1) {
        newPoints[data.checkerMoves[index].to].player = 2;
        newPoints[data.checkerMoves[index].to].checkers = 1;
      } else {
        newPoints[data.checkerMoves[index].to].checkers++;
        newPoints[data.checkerMoves[index].to].player = 2;
      }
      this.setState({
        points: newPoints,
      });
      if (index < data.checkerMoves.length - 1) {
        setTimeout(() => {
          this.iterateMoves(index + 1, data);
        }, 2000);
      } else {
        const score = this.calculateScore();
        if (score.P2 === 0)
          this.setState({
            grayBar: newGrayBar,
            outSideBar: newOutSideBar,
            p1IsNext: !p1IsNext,
            gameStatus: 70,
            showMenu: true,
            dice: [0],
            showComputerDice: false,
          });
          else
          this.setState({
            grayBar: newGrayBar,
            outSideBar: newOutSideBar,
            p1IsNext: !p1IsNext,
            dice: [0],
            showComputerDice: false,
          });
      }
    }
  };

  //Return the player number 1 or 2.
  getPlayer = (p1IsNext) => (p1IsNext ? 1 : 2);

  //Get points without actions. It creates a new object
  getPointsWithoutActions = (points) =>
    points.map((point) => {
      return { player: point.player, checkers: point.checkers };
    });

  getOutSideBarWithoutActions = (outSideBar) => {
    return {
      checkersP1: outSideBar.checkersP1,
      checkersP2: outSideBar.checkersP2,
    };
  };

  getMovingChecker = (p1IsNext) => {
    let movingChecker;
    if (this.state.movingChecker !== false) {
      //Moving checker is assigned
      movingChecker = this.state.movingChecker;
    } else {
      //Checker coming from grayBar
      if (p1IsNext) {
        movingChecker = -1;
      } else {
        movingChecker = 24;
      }
    }
    return movingChecker;
  };

  handlePlayerNoMoves = async () => {
    setTimeout(() => {
      this.setState({
        gameStatus: 30,
        p1IsNext: false,
      });
    }, 2500);
    setTimeout(() => {
      this.computerPlay(false);
    }, 2500);
  };

  undoHandler = () => {
    const history = [...this.state.history];
    const newPosition = this.state.currentPosition - 1;
    const p1IsNext = history[newPosition].p1IsNext;
    const dice = [...history[newPosition].dice];
    const grayBar = { ...history[newPosition].grayBar };
    const outSideBar = { ...history[newPosition].outSideBar };
    const movingChecker = false;

    console.log("Undo last move");

    const moves = this.calculateCanMove(
      this.state.history[newPosition].points,
      dice,
      p1IsNext,
      grayBar
    );
    const points = moves.points;
    const gameStatus = moves.gameStatus;
    //remove last element from history
    history.pop();

    this.setState({
      gameStatus: gameStatus,
      history: history,
      currentPosition: newPosition,
      p1IsNext: p1IsNext,
      dice: dice,
      points: points,
      grayBar: grayBar,
      outSideBar: outSideBar,
      movingChecker: movingChecker,
    });
  };

  //Get the game status
  getGameStatus = () => {
    switch (this.state.gameStatus) {
      case 11:
        return "New game";
      case 20:
        return "Roll dice";
      case 30:
        return "Playing";
      case 31:
        return "Playing from graybar";
      case 32:
        return "Bearing off";
      case 40:
        return "No die to play";
      case 50:
        return "No moves available";
      case 60:
        return "Player 1 wins";
      case 70:
        return "Player 2 wins";
      case 80:
        return "Not started";
      default:
        return this.state.gameStatus;
    }
  };

  getMenu = () => {
    if (this.state.showMenu) {
      return (
        <Menu
          newGameHandler={this.setupNewGameHandler}
          toggleMenuHandler={this.toggleMenuHandler}
          gameStatus={this.state.gameStatus}
          players={this.state.players}
        />
      );
    }
  };

  render() {
    console.log("Game status is " + this.getGameStatus());

    return (
      <div id="App">
        <Status
          toggleMenuHandler={this.toggleMenuHandler}
          points={this.state.points}
          grayBar={this.state.grayBar}
          players={this.state.players}
          calculateScore={this.calculateScore}
        />
        <div id="game">
          <Board
            showComputerDice={this.state.showComputerDice}
            rollDice={this.rollDiceHandler}
            dice={this.state.dice}
            points={this.state.points}
            p1IsNext={this.state.p1IsNext}
            gameStatus={this.state.gameStatus}
          >
            <Graybar checkers={this.state.grayBar} />
            <OutSideBar
              checkers={this.state.outSideBar}
              currentPosition={this.state.currentPosition}
              undoHandler={this.undoHandler}
            />
          </Board>
        </div>
        {this.getMenu()}
      </div>
    );
  }
}

export default App;
