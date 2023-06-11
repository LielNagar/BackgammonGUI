import React from 'react';
import Checker from '../Checker/Checker';

import './Status.css';

const Status = (props) => {

    //Calculate score
    

    const score = props.calculateScore();

    return (
        <div id="status">
            <div id="gameLogo">
                <p className="status-title" >Backgammon</p>
            </div>
            <div id="game-score">
                <div className="player-score-container">
                    <div className="player-score-name">
                        <p>{props.players.p1}</p>
                    </div>
                    <div className="player-score-checker">
                        <Checker player={1} count={1} />
                    </div>
                    <div className="player-score">
                        <p>{score.P1}</p>
                    </div>
                </div>
                <div className="player-score-container">
                    <div className="player-score-name">
                        <p>Backgammon Agent</p>
                    </div>
                    <div className="player-score-checker">
                        <Checker player={2} count={1} />
                    </div>
                    <div className="player-score">
                        <p>{score.P2}</p>
                    </div>
                </div>
            </div>
            <div id="game-menu">
                <button
                    className="btn btn-success"
                    onClick={props.toggleMenuHandler}>Menu</button>
            </div>

        </div>
    );

}

export default Status;
