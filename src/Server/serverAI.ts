import { Chance } from "chance";

export type AiPersonality = "aggressive" | "defensive" | "balance" | "random";
export type AiMoveType = "block" | "attack" | "counter";
export type spotData = {
  index: number;
  player: "player1" | "player2" | null;
};
export type aiPlayerDesignator = "player1" | "player2";

interface iAIInterface {
  designator: aiPlayerDesignator;
  personality: AiPersonality;
}

export interface iBoardLayout {
  spots: spotData[];
}

const nextSpotLookup = [4, 0, 1, 2, 8, 9, 5, 3, 12, 10, 6, 7, 13, 14, 15, 11];

export class AI {
  chance = new Chance(performance.now());
  personality: AiPersonality = "balance";
  playerDesignator: aiPlayerDesignator;
  winningConditions: Array<Array<number>> = [];

  constructor(input: iAIInterface) {
    if (this.personality == "random") this.personality = this.chance.pickone(["aggressive", "defensive", "balance"]);
    else this.personality = input.personality;
    this.playerDesignator = input.designator;

    //***************************** */
    //setup winning conditions
    //***************************** */

    //across
    this.winningConditions.push([0, 1, 2, 3]);
    this.winningConditions.push([4, 5, 6, 7]);
    this.winningConditions.push([8, 9, 10, 11]);
    this.winningConditions.push([12, 13, 14, 15]);
    //vertical
    this.winningConditions.push([0, 4, 8, 12]);
    this.winningConditions.push([1, 5, 9, 13]);
    this.winningConditions.push([2, 6, 10, 14]);
    this.winningConditions.push([3, 7, 11, 15]);
    //Diagnal
    this.winningConditions.push([0, 5, 10, 15]);
    this.winningConditions.push([12, 9, 6, 3]);
  }

  static create(designator: aiPlayerDesignator, personality: AiPersonality) {
    return new AI({ personality, designator });
  }

  getNextMove(layout: iBoardLayout): Array<{ player: "player1" | "player2"; token?: number; index: number }> {
    //guard for no moremoves...

    const fullcheck = layout.spots.some(spot => spot.player == null);
    if (!fullcheck) throw new Error("NO MORE MOVES TO MAKE");

    switch (this.personality) {
      case "aggressive":
        return this.getAggressivePlay(layout);
      case "defensive":
        return this.getDefensivePlay(layout);
      case "balance":
        return this.getBalancedPlay(layout);
      case "random": //this shouldn't happen
        return this.getBalancedPlay(layout);
    }
  }

  getPersonality() {
    return this.personality;
  }
  setPersonality(newPersonality: AiPersonality) {
    if (newPersonality == "random") this.personality = this.chance.pickone(["aggressive", "defensive", "balance"]);
    else this.personality = newPersonality;

    return this.personality;
  }

  setDesignator(newDesignator: aiPlayerDesignator) {
    this.playerDesignator = newDesignator;
    return this.playerDesignator;
  }
  getDesignator() {
    return this.playerDesignator;
  }

  private previewRotatedBoard(layout: iBoardLayout): iBoardLayout {
    const boardPreview: iBoardLayout = {
      spots: [
        { index: 0, player: null },
        { index: 1, player: null },
        { index: 2, player: null },
        { index: 3, player: null },
        { index: 4, player: null },
        { index: 5, player: null },
        { index: 6, player: null },
        { index: 7, player: null },
        { index: 8, player: null },
        { index: 9, player: null },
        { index: 10, player: null },
        { index: 11, player: null },
        { index: 12, player: null },
        { index: 13, player: null },
        { index: 14, player: null },
        { index: 15, player: null },
      ],
    };

    layout.spots.forEach((spot, index) => {
      let nextSpotIndex = nextSpotLookup[index];
      boardPreview.spots[nextSpotIndex].player = spot.player;
    });

    return boardPreview;
  }

  private gradeWinningAttackConditions(layout: iBoardLayout): Array<{ score: number; winningConditionIndex: number }> {
    let enemyPlayerDesignator: aiPlayerDesignator;
    this.playerDesignator == "player1" ? (enemyPlayerDesignator = "player2") : (enemyPlayerDesignator = "player1");
    let resultArray: Array<{ score: number; winningConditionIndex: number }> = [];

    let viableWinningConditions: number[] = [];
    this.winningConditions.forEach((wcond, windex) => {
      let indexsThatAreEmpty = 0;
      for (const winIndex of wcond) {
        if (layout.spots[winIndex].player == null) {
          indexsThatAreEmpty++;
        }
      }
      if (indexsThatAreEmpty > 0) viableWinningConditions.push(windex);
    });

    //loop through all winning conditions and assign a score 0-2 (2 is highest)
    let score = 0;
    this.winningConditions.forEach((indexes, winningConditionIndex) => {
      //add gaurd condition for a full instance
      const isViable = viableWinningConditions.find(cond => cond == winningConditionIndex);
      if (isViable == undefined) return;

      score = 0;
      indexes.forEach((spot, index) => {
        //if there are enemy tokens, -1
        if (layout.spots[spot].player == enemyPlayerDesignator) {
          //this block is for enemy tokens
          score--;
        } else if (layout.spots[spot].player == this.playerDesignator) {
          //this block is for counting up winning tokens
          score++;
        }
      });
      resultArray.push({ score, winningConditionIndex });
    });
    return resultArray;

    /*
    return list needs to include the index of winning conditions that's viable && graded value
    */
  }

  gradeWinningDefensiveCondition(layout: iBoardLayout): Array<{ score: number; winningConditionIndex: number }> {
    let enemyPlayerDesignator: aiPlayerDesignator;
    this.playerDesignator == "player1" ? (enemyPlayerDesignator = "player2") : (enemyPlayerDesignator = "player1");
    let resultArray: Array<{ score: number; winningConditionIndex: number }> = [];

    let viableWinningConditions: number[] = [];

    this.winningConditions.forEach((wcond, windex) => {
      let indexsThatAreEmpty = 0;
      for (const winIndex of wcond) {
        if (layout.spots[winIndex].player == null) {
          //test here for enemyplayer having a move
          indexsThatAreEmpty++;
        }
      }
      if (indexsThatAreEmpty > 0) viableWinningConditions.push(windex);
    });

    //loop through all winning conditions and assign a score 0-2 (2 is highest)
    let score = 0;
    this.winningConditions.forEach((indexes, winningConditionIndex) => {
      //add gaurd condition for a full instance
      const isViable = viableWinningConditions.find(cond => cond == winningConditionIndex);
      if (isViable == undefined) return;

      score = 0;
      indexes.forEach((spot, index) => {
        //if there are enemy tokens, -1
        if (layout.spots[spot].player == enemyPlayerDesignator) {
          //this block is for enemy tokens
          score--;
        } else if (layout.spots[spot].player == this.playerDesignator) {
          //this block is for counting up winning tokens
          score++;
        }
      });
      resultArray.push({ score, winningConditionIndex });
    });
    return resultArray;
  }

  private gradeWinningCounterConditions(layout: iBoardLayout): Array<{ score: number; winningConditionIndex: number }> {
    let enemyPlayerDesignator: aiPlayerDesignator;
    this.playerDesignator == "player1" ? (enemyPlayerDesignator = "player2") : (enemyPlayerDesignator = "player1");
    let resultArray: Array<{ score: number; winningConditionIndex: number }> = [];

    let viableWinningConditions: number[] = [];

    this.winningConditions.forEach((wcond, windex) => {
      let indexsThatHaveEnemy = 0;
      for (const winIndex of wcond) {
        if (layout.spots[winIndex].player == enemyPlayerDesignator) {
          //test here for enemyplayer having a move
          indexsThatHaveEnemy++;
        }
      }
      if (indexsThatHaveEnemy > 0) viableWinningConditions.push(windex);
    });

    //loop through all winning conditions and assign a score 0-2 (2 is highest)
    let score = 0;
    this.winningConditions.forEach((indexes, winningConditionIndex) => {
      //add gaurd condition for a full instance
      const isViable = viableWinningConditions.find(cond => cond == winningConditionIndex);
      if (isViable == undefined) return;

      score = 0;
      indexes.forEach((spot, index) => {
        //if there are enemy tokens, -1
        if (layout.spots[spot].player == enemyPlayerDesignator) {
          //this block is for enemy tokens
          score--;
        } else if (layout.spots[spot].player == this.playerDesignator) {
          //this block is for counting up winning tokens
          score++;
        }
      });
      resultArray.push({ score, winningConditionIndex });
    });
    return resultArray;
  }

  private randomlySelectHighWinningScore(scores: Array<{ score: number; winningConditionIndex: number }>): number {
    //filter highest value
    //const highestValue = Math.max(...scores);
    const highestValue = getHighestScore(scores);

    //use reducer to create array of indices of that match highest value
    const sortedScores: number[] = scores.reduce((indices: number[], value, index) => {
      if (value.score === highestValue) {
        indices.push(value.winningConditionIndex);
      }
      return indices;
    }, []);

    //pick one of the indices
    return this.chance.pickone(sortedScores);
  }

  private randomlySelectLowWinningScore(scores: Array<{ score: number; winningConditionIndex: number }>): number {
    //filter highest value
    //const lowestValue = Math.min(...scores);
    const lowestValue = getLowestScore(scores);

    //use reducer to create array of indices of that match highest value
    const sortedScores: number[] = scores.reduce((indices: number[], value, index) => {
      if (value.score === lowestValue) {
        indices.push(value.winningConditionIndex);
      }
      return indices;
    }, []);

    //pick one of the indices
    return this.chance.pickone(sortedScores);
  }

  private getAggressivePlay(layout: iBoardLayout): Array<{ player: "player1" | "player2"; index: number }> {
    //get list of oppenent positions
    //get list of ai positions
    //get list of open spots

    let enemyPlayerDesignator: aiPlayerDesignator;
    this.playerDesignator == "player1" ? (enemyPlayerDesignator = "player2") : (enemyPlayerDesignator = "player1");
    let selectedIndex; //returned results

    const enemyPositions = layout.spots.filter(spot => spot.player != this.playerDesignator && spot.player != null);
    const aiPositions = layout.spots.filter(spot => spot.player == this.playerDesignator);
    const openPositions = layout.spots.filter(spot => spot.player == null);

    //define aggressive play as high probability of just playing to win
    //not paying too much attention to opponent's position
    //primarily attacking

    //if board isn't very full, randomly select available spots
    //empty'ish board
    if (enemyPositions.length <= 2 && aiPositions.length <= 2) {
      //choose anywhere

      selectedIndex = this.chance.pickone(openPositions);
      return [{ player: this.playerDesignator, index: selectedIndex.index }];
    }

    let roll = this.chance.integer({ min: 0, max: 100 });
    if (roll <= 40) return [this.attackPlay(layout)]; // primary 40% chance of just attacking
    else if (roll <= 70) {
      let cntrPlay = this.counterPlay(layout);
      if (cntrPlay) {
        let newlayout = cntrPlay.newlayout;
        return [cntrPlay, this.attackPlay(newlayout)];
      } else return [this.attackPlay(layout)];
    } else if (roll <= 90) {
      let cntrPlay = this.counterPlay(layout);
      if (cntrPlay) {
        let newlayout = cntrPlay.newlayout;
        return [cntrPlay, this.blockPlay(newlayout)];
      }
      return [this.blockPlay(layout)];
    } // 10% chance of counter, then defend
    else return [this.blockPlay(layout)]; // 10% chance of defending
  }

  private getBalancedPlay(layout: iBoardLayout): Array<{ player: "player1" | "player2"; index: number }> {
    //get list of oppenent positions
    //get list of ai positions
    //get list of open spots

    let enemyPlayerDesignator: aiPlayerDesignator;
    this.playerDesignator == "player1" ? (enemyPlayerDesignator = "player2") : (enemyPlayerDesignator = "player1");
    let selectedIndex; //returned results

    const enemyPositions = layout.spots.filter(spot => spot.player != this.playerDesignator);
    const aiPositions = layout.spots.filter(spot => spot.player == this.playerDesignator);
    const openPositions = layout.spots.filter(spot => spot.player == null);

    //define balanced play as equal probability of playing to win and not losing

    //if board isn't very full, randomly select available spots
    //empty'ish board
    if (enemyPositions.length <= 2 && aiPositions.length <= 2) {
      //choose anywhere
      selectedIndex = this.chance.pickone(openPositions);
      return [{ player: this.playerDesignator, index: selectedIndex.index }];
    }

    let roll = this.chance.integer({ min: 0, max: 100 });

    if (roll <= 25) return [this.attackPlay(layout)]; // primary 40% chance of just attacking
    else if (roll <= 50) {
      let cntrPlay = this.counterPlay(layout);
      if (cntrPlay) {
        let newlayout = cntrPlay.newlayout;
        return [cntrPlay, this.attackPlay(newlayout)];
      } else return [this.attackPlay(layout)];
    } else if (roll <= 75) {
      let cntrPlay = this.counterPlay(layout);
      if (cntrPlay) {
        let newlayout = cntrPlay.newlayout;
        return [cntrPlay, this.blockPlay(newlayout)];
      }
      return [this.blockPlay(layout)];
    } // 10% chance of counter, then defend
    else return [this.blockPlay(layout)]; // 10% chance of defending
  }

  private getDefensivePlay(layout: iBoardLayout): Array<{ player: "player1" | "player2"; index: number }> {
    //get list of oppenent positions
    //get list of ai positions
    //get list of open spots

    let enemyPlayerDesignator: aiPlayerDesignator;
    this.playerDesignator == "player1" ? (enemyPlayerDesignator = "player2") : (enemyPlayerDesignator = "player1");
    let selectedIndex; //returned results

    const enemyPositions = layout.spots.filter(spot => spot.player != this.playerDesignator);
    const aiPositions = layout.spots.filter(spot => spot.player == this.playerDesignator);
    const openPositions = layout.spots.filter(spot => spot.player == null);

    //define balanced play as equal probability of playing to win and not losing

    //if board isn't very full, randomly select available spots
    //empty'ish board
    if (enemyPositions.length <= 2 && aiPositions.length <= 2) {
      //choose anywhere
      selectedIndex = this.chance.pickone(openPositions);
      return [{ player: this.playerDesignator, index: selectedIndex.index }];
    }

    let roll = this.chance.integer({ min: 0, max: 100 });

    if (roll <= 15) return [this.attackPlay(layout)]; // primary 40% chance of just attacking
    else if (roll <= 30) {
      let cntrPlay = this.counterPlay(layout);
      if (cntrPlay) {
        let newlayout = cntrPlay.newlayout;
        return [cntrPlay, this.attackPlay(newlayout)];
      } else return [this.attackPlay(layout)];
    } else if (roll <= 60) {
      let cntrPlay = this.counterPlay(layout);
      if (cntrPlay) {
        let newlayout = cntrPlay.newlayout;
        return [cntrPlay, this.blockPlay(newlayout)];
      }
      return [this.blockPlay(layout)];
    } // 10% chance of counter, then defend
    else return [this.blockPlay(layout)]; // 10% chance of defending
  }

  getPreview(layout: iBoardLayout): iBoardLayout {
    return this.previewRotatedBoard(layout);
  }

  //returns void if no possible moves of opponent piece exists
  private counterPlay(
    layout: iBoardLayout
  ): { player: "player1" | "player2"; token: number; index: number; newlayout: iBoardLayout } | void {
    let enemyPlayerDesignator: aiPlayerDesignator;
    this.playerDesignator == "player1" ? (enemyPlayerDesignator = "player2") : (enemyPlayerDesignator = "player1");

    //checking winning conditions
    //now winnable games - get preview of rotated board
    let nextLayout = this.previewRotatedBoard(layout);

    //score each winning position
    let gradeArray = this.gradeWinningCounterConditions(nextLayout);
    //randomly select the least favorable winning scenario of equally weighted methods
    let winningIndexSelected: number = this.randomlySelectLowWinningScore(gradeArray);

    //using this winning condition selected
    let currentWinningCondition = this.winningConditions[winningIndexSelected];

    //figure out which play makes sense next
    //1) pick avaialble spot that has largest risk of enemy winning
    //iterate over winning condition and 'pick' first available spot

    let playedPositionIndex: any = undefined;
    let futureTokenIndex: number = 0;
    let presetTokenIndex: number = 0;

    for (const winningspot of currentWinningCondition) {
      // change layout to newlayout
      if (layout.spots[winningspot].player == enemyPlayerDesignator) {
        //found enemy, check neighbors
        presetTokenIndex = winningspot;

        const listOfNeighborIndices = getNeighborIndices(presetTokenIndex);

        let arryOfNeighbors = [];
        for (const nindx of listOfNeighborIndices) {
          if (layout.spots[nindx].player == null) {
            arryOfNeighbors.push(layout.spots[nindx]);
          }
        }

        if (arryOfNeighbors.length) {
          playedPositionIndex = this.chance.pickone(arryOfNeighbors).index;
        }

        if (playedPositionIndex != undefined) break;
      }
    }

    if (playedPositionIndex == undefined) return;

    //selecting a enemy unit and moving to another spot
    let newlayout: iBoardLayout = { spots: [] };
    newlayout.spots = [...layout.spots];
    newlayout.spots[presetTokenIndex].player = null;
    newlayout.spots[playedPositionIndex].player = enemyPlayerDesignator;
    return { player: enemyPlayerDesignator, token: presetTokenIndex, index: playedPositionIndex, newlayout };
  }

  private blockPlay(layout: iBoardLayout): { player: "player1" | "player2"; index: number } {
    let enemyPlayerDesignator: aiPlayerDesignator;
    this.playerDesignator == "player1" ? (enemyPlayerDesignator = "player2") : (enemyPlayerDesignator = "player1");
    let tokenIndex: number = 0;

    //checking winning conditions
    //now winnable games - get preview of rotated board
    let nextLayout = this.previewRotatedBoard(layout);

    //score each winning position
    let gradeArray = this.gradeWinningDefensiveCondition(nextLayout);

    //randomly select the least favorable winning scenario of equally weighted methods
    let winningIndexSelected: number = this.randomlySelectLowWinningScore(gradeArray);

    //using this winning condition selected
    let currentWinningCondition = this.winningConditions[winningIndexSelected];

    //figure out which play makes sense next
    //1) pick avaialble spot that has largest risk of enemy winning
    //iterate over winning condition and 'pick' first available spot
    let playedPositionIndex: any = undefined;
    for (const winningspot of currentWinningCondition) {
      //find first available spot to place your token
      if (nextLayout.spots[winningspot].player == null) {
        //first available spot

        playedPositionIndex = layout.spots[winningspot].index;
      }
    }
    //2) work backwards from preview, and set spot value

    let reverseLookupIndex = 0;
    for (const reverseIndex of nextSpotLookup) {
      if (reverseIndex == playedPositionIndex) {
        break;
      }
      reverseLookupIndex++;
    }

    if (reverseLookupIndex == 16) throw Error("invalid position selected");
    return { player: this.playerDesignator, index: reverseLookupIndex };
  }

  private attackPlay(layout: iBoardLayout): { player: "player1" | "player2"; index: number } {
    //get list of oppenent positions
    //get list of ai positions
    //get list of open spots
    let enemyPlayerDesignator: aiPlayerDesignator;
    this.playerDesignator == "player1" ? (enemyPlayerDesignator = "player2") : (enemyPlayerDesignator = "player1");
    let listOfViableWinningConditionsAndGrades: Array<{ score: number; winningConditionIndex: number }> = [];

    //now winnable games - get preview of rotated board
    let nextLayout = this.previewRotatedBoard(layout);

    //score each winning position
    listOfViableWinningConditionsAndGrades = this.gradeWinningAttackConditions(nextLayout);

    let winningIndexSelected: number = this.randomlySelectHighWinningScore(listOfViableWinningConditionsAndGrades);
    let currentWinningCondition;

    //using this winning condition selected
    currentWinningCondition = this.winningConditions[winningIndexSelected];

    //figure out which play makes sense next
    //1) pick avaialble spot that improves winning
    //iterate over winning condition and 'pick' first available spot
    let playedPositionIndex: number | null = null;

    for (const winningspot of currentWinningCondition) {
      if (nextLayout.spots[winningspot].player == null) {
        //first available spot
        playedPositionIndex = nextLayout.spots[winningspot].index;

        break;
      }
    }
    //2) work backwards from preview, and set spot value

    let reverseLookupIndex = 0;
    for (const reverseIndex of nextSpotLookup) {
      if (reverseIndex == playedPositionIndex) {
        break;
      }
      reverseLookupIndex++;
    }

    if (reverseLookupIndex == 16) throw Error("invalid position selected");
    return { player: this.playerDesignator, index: reverseLookupIndex };
  }
}

function getNeighborIndices(index: number): number[] {
  if (index < 0 || index > 15) throw new Error("Neighbor Check failed, invalid value passed!");

  const numRows = 4;
  const numCols = 4;

  // Calculate row and column of the given index
  const row = Math.floor(index / numCols);
  const col = index % numCols;

  // Define the relative positions of neighbors (up, down, left, right)
  const neighborsRelativePositions = [
    { row: -1, col: 0 }, // Up
    { row: 1, col: 0 }, // Down
    { row: 0, col: -1 }, // Left
    { row: 0, col: 1 }, // Right
  ];

  const neighborIndices: number[] = [];

  // Check each relative position
  for (const relativePos of neighborsRelativePositions) {
    const newRow = row + relativePos.row;
    const newCol = col + relativePos.col;

    // Check if the new position is within bounds
    if (newRow >= 0 && newRow < numRows && newCol >= 0 && newCol < numCols) {
      // Convert row and column back to the flat array index
      const neighborIndex = newRow * numCols + newCol;
      neighborIndices.push(neighborIndex);
    }
  }

  return neighborIndices;
}

function getHighestScore(myList: Array<{ score: number; winningConditionIndex: number }>) {
  return myList.reduce((prev, current) => (prev.score > current.score ? prev : current)).score;
}

function getLowestScore(myList: Array<{ score: number; winningConditionIndex: number }>) {
  return myList.reduce((prev, current) => (prev.score < current.score ? prev : current)).score;
}
